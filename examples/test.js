const Server = require('../videohub')

const server = new Server()

// console.log(server)

server.on('debug', (...args) => {
	console.log(...args)
})
server.on('error', (address) => {
	console.log('error', address)
})
server.on('connect', (address, info) => {
	console.log('connect', address, info)

	// Setup two destinations
	server.setDestinationCount(address, 2)
})
server.on('disconnect', (address) => {
	console.log('disconnect', address)
})

let backlight = 0
server.on('press', (address, destination, button) => {
	console.log('press', address, destination, button)

	if (button == 0) {
		// cycle backlight on press
		backlight = (backlight + 1) % 11

		console.log('set backlight', backlight)
		server.setBacklight(address, backlight)
	}
})

server.start()
