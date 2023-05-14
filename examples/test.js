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
})
server.on('disconnect', (address) => {
	console.log('disconnect', address)
})
server.on('press', (address, button) => {
	console.log('press', address, button)
})

server.start()
