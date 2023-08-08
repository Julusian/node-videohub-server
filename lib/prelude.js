function generatePrelude() {
	const modelName = 'Virtual Videohub'
	const inputCount = 41
	const outputCount = 10

	let prelude =
		'PROTOCOL PREAMBLE:\n' +
		'Version: 2.8\n' +
		'\n' +
		'VIDEOHUB DEVICE:\n' +
		'Device present: true\n' +
		`Model name: ${modelName}\n` +
		`Friendly name: ${modelName}\n` +
		'Unique ID: 000000000000\n' +
		`Video inputs: ${inputCount}` +
		'Video processing units: 0\n' +
		`Video outputs: ${outputCount}` +
		'Video monitoring outputs: 0\n' +
		'Serial ports: 0\n' +
		'\n'
	prelude += 'INPUT LABELS:\n'
	for (let i = 0; i < inputCount; i++) {
		prelude += `${i} no label\n`
	}
	prelude += '\n'

	prelude += 'OUTPUT LABELS:\n'
	for (let i = 0; i < outputCount; i++) {
		prelude += `${i} no label\n`
	}
	prelude += '\n'

	prelude += 'VIDEO OUTPUT LOCKS:\n'
	for (let i = 0; i < outputCount; i++) {
		prelude += `${i} U\n`
	}
	prelude += '\n'

	prelude += 'VIDEO OUTPUT ROUTING:\n'
	for (let i = 0; i < outputCount; i++) {
		prelude += `${i} ${inputCount - 1}\n`
	}
	prelude += '\n'

	prelude +=
		'CONFIGURATION:\n' + 'Take Mode: true\n' + '\n' + 'END PRELUDE:\n' + '\n'

	return prelude
}

module.exports = {
	generatePrelude,
}
