// @ts-check

const EventEmitter = require('events')
const net = require('net')
const { generatePrelude } = require('./lib/prelude')
const { generateConfigure } = require('./lib/configure')

const CONFIGURE_PORT = 9991
const CONFIGURE_TIMEOUT = 5000

class VideohubServer extends EventEmitter {
	/**
	 * Listening server
	 * @type {net.Server}
	 */
	#server

	/**
	 * Connected clients
	 * @type {Record<string, net.Socket>}
	 */
	#clients = {}

	#isRunning = false

	constructor() {
		super()

		this.#server = net.createServer(this.#clientConnect.bind(this))
		//
	}

	/**
	 * Start listening for clients
	 * @param {string | undefined} host - default '0.0.0.0'
	 * @param {number | undefined} port - default 9990
	 */
	start(host, port) {
		if (this.#isRunning) return
		this.#isRunning = true

		this.#server.on('error', (err) => this.emit('error', err))

		this.#server.listen(port || 9990, host || '0.0.0.0')
	}

	destroy() {
		if (!this.#isRunning) return
		this.#isRunning = false

		// Stop the server from accepting new clients
		this.#server.close()

		// Close all open clients
		for (const socket of Object.values(this.#clients)) {
			socket.destroy()
		}

		this.#server.removeAllListeners()
	}

	/**
	 * @param {net.Socket} socket
	 */
	#clientConnect(socket) {
		const { remoteAddress, remotePort } = socket
		if (!remoteAddress || !remotePort) {
			// Socket looks already closed
			socket.destroy()
			return
		}

		const internalClientId = `${remoteAddress}:${remotePort}`
		let publicClientId = remoteAddress
		this.#clients[internalClientId] = socket

		const doCleanup = () => {
			socket.removeAllListeners('data')
			socket.removeAllListeners('close')

			this.emit('debug', 'lost client', internalClientId, publicClientId)
			delete this.#clients[internalClientId]
			this.emit('disconnect', publicClientId)
		}

		socket.setTimeout(20000)
		socket.on('timeout', () => {
			this.emit('debug', 'socket timeout', internalClientId, publicClientId)
			socket.end()
			doCleanup()
		})

		socket.on('close', doCleanup)

		socket.on('close', () => {})

		this.emit('debug', 'new client', internalClientId, publicClientId)

		let dataBuffer = ''
		socket.on('data', (data) => {
			dataBuffer += data.toString()

			const splitIndex = dataBuffer.indexOf('\n\n')
			if (splitIndex != -1) {
				const toProcess = dataBuffer.slice(0, splitIndex).split('\n')
				dataBuffer = dataBuffer.slice(splitIndex + 2)

				if (toProcess.length > 0) {
					this.#handleCommands(socket, publicClientId, toProcess)
				}
			}
		})

		// Send the prelude
		socket.write(generatePrelude())

		// Make sure the panel is configured as needed
		this.#runConfigure(remoteAddress, (deviceInfo) =>
			generateConfigure(deviceInfo.buttonsColumns, deviceInfo.buttonsRows),
		)
			.then((deviceInfo) => {
				publicClientId = deviceInfo.id || publicClientId

				// It is ready for use
				this.emit('connect', publicClientId, deviceInfo, remoteAddress)
			})
			.catch((err) => {
				// Something went wrong, kill it
				socket.destroy()
				this.emit('debug', 'configure failed', remoteAddress, err)
				// TODO - emit error?
			})
	}

	/**
	 * @param {string} remoteAddress
	 * @param {(deviceInfo) => string} generatePayload
	 */
	async #runConfigure(remoteAddress, generatePayload) {
		const socket = net.connect(CONFIGURE_PORT, remoteAddress)

		socket.on('error', (err) => {
			// 'handle' the error
			this.emit('debug', 'configure error', remoteAddress, err)
		})

		const timeout = setTimeout(() => {
			// Give the configuration a hard timeout, to avoid getting stuck
			this.emit('debug', 'configure timeout', remoteAddress)
			socket.destroy()
			socket.removeAllListeners()
		}, CONFIGURE_TIMEOUT)

		try {
			// Wait for the connection to open or fail
			await Promise.race([
				new Promise((resolve) => socket.once('connect', resolve)),
				new Promise((resolve) => socket.once('timeout', resolve)),
				new Promise((resolve) => socket.once('close', resolve)),
				new Promise((resolve) => socket.once('error', resolve)),
			])

			this.emit('debug', 'configure opened', remoteAddress)

			/** @type {string[]} */
			let deviceInfo = []
			// Receive the lines about the device
			await new Promise((resolve) => {
				let dataBuffer = ''
				const handler = (/** @type {Buffer} */ data) => {
					dataBuffer += data.toString()

					const splitIndex = dataBuffer.indexOf('\n\n')
					if (splitIndex != -1) {
						const toProcess = dataBuffer.slice(0, splitIndex).split('\n')
						dataBuffer = dataBuffer.slice(splitIndex + 2)

						// console.log('config', data, data.toString())
						if (toProcess.length > 0) {
							if (toProcess[0] === 'SMART DEVICE:') {
								deviceInfo = toProcess

								socket.off('data', handler)
								resolve(null)
							}
						}
					}
				}
				socket.on('data', handler)
			})

			// Parse the deviceInfo
			this.emit('debug', 'configure info', remoteAddress, deviceInfo)

			const processedInfo = {}
			for (let i = 1; i < deviceInfo.length; i++) {
				const element = deviceInfo[i]
				const splitIndex = element.indexOf(':')
				const key = element.slice(0, splitIndex)
				const value = element.slice(splitIndex + 1).trim()

				switch (key) {
					case 'Model':
						processedInfo.model = value
						break
					case 'Label':
						processedInfo.name = value
						break
					case 'Unique ID':
						processedInfo.id = value
						break
					case 'Input count':
						processedInfo.buttonsTotal = Number(value)
						break
					case 'Inputs across':
						processedInfo.buttonsColumns = Number(value)
						break
					case 'Inputs down':
						processedInfo.buttonsRows = Number(value)
						break
				}
			}

			this.emit('debug', 'configure ready', remoteAddress, processedInfo)

			// Configure the device
			socket.write(generatePayload(processedInfo))

			// Give the socket a chance to flush
			// TODO - this could be better
			await new Promise((resolve) => setTimeout(resolve, 500))

			// await new Promise((resolve) => {
			// 	let dataBuffer = ''
			// 	const handler = (/** @type {Buffer} */ data) => {
			// 		console.log('recv', data)
			// 	}
			// 	socket.on('data', handler)
			// })

			return processedInfo
		} finally {
			socket.destroy()
			socket.removeAllListeners()
			clearTimeout(timeout)
		}
	}

	/**
	 * @param {net.Socket} socket
	 * @param {string} remoteAddress
	 * @param {string[]} lines
	 */
	#handleCommands(socket, remoteAddress, lines) {
		this.emit('debug', remoteAddress, lines)

		// Always ACK the command
		socket.write('ACK\n\n')

		if (lines.length === 1 && lines[0] === 'PING:') {
			// Simply ack it
		} else if (lines.length > 1 && lines[0] === 'VIDEO OUTPUT ROUTING:') {
			let displayPress
			for (let i = 1; i < lines.length; i++) {
				const line = lines[i]
				const parts = line.split(' ')
				const value = Number(parts[1])
				if (parts[0] == '0' && !isNaN(value)) {
					displayPress = value
					this.emit('press', remoteAddress, value)
				}
			}

			// If only one thing was triggered, flash the button
			if (lines.length === 2 && displayPress !== undefined) {
				// TODO
			}
		} else {
			// Unknown command, ignore it
		}
	}

	/**
	 * Set the backlight level of a connected panel
	 * @param {string} publicClientId
	 * @param {number} backlight
	 */
	async setBacklight(publicClientId, backlight) {
		backlight = Math.floor(backlight)
		if (
			typeof backlight !== 'number' ||
			isNaN(backlight) ||
			backlight < 0 ||
			backlight > 10
		) {
			throw new Error(`Invalid backlight value: "${backlight}"`)
		}

		const socket = Object.values(this.#clients).find(
			(cl) => cl.remoteAddress === publicClientId,
		)
		if (!socket || !socket.remoteAddress)
			throw new Error(`Unknown client: ${publicClientId}`)

		let payload = 'SETTINGS:\n'
		payload += `Backlight: ${backlight}\n`
		payload += `Destination backlight: ${backlight}\n`
		payload += '\n'

		await this.#runConfigure(socket.remoteAddress, () => payload)
	}
}

module.exports = VideohubServer
