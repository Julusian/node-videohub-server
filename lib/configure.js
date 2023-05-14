function generateConfigure(buttonCount) {
	let prelude = 'BUTTON KIND:\n'
	for (let i = 0; i < buttonCount; i++) {
		prelude += `${i} Source\n`
	}
	prelude += '\n'

	prelude += 'BUTTON SDI_A:\n' + `-1 0\n`
	for (let i = 0; i < buttonCount; i++) {
		prelude += `${i} ${i}\n`
	}
	prelude += '\n'

	prelude += 'BUTTON SDI_B:\n' + `-1 -1\n`
	for (let i = 0; i < buttonCount; i++) {
		prelude += `${i} -1\n`
	}
	prelude += '\n'

	prelude += 'BUTTON REMOTE:\n' + `-1 -1\n`
	for (let i = 0; i < buttonCount; i++) {
		prelude += `${i} -1\n`
	}
	prelude += '\n'

	return prelude
}

module.exports = {
	generateConfigure,
}
