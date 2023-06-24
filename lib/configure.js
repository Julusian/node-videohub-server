function generateConfigure(buttonColumns, buttonRows, destinationCount = 0) {
	let prelude = 'BUTTON KIND:\n'
	for (let y = 0; y < buttonRows; y++) {
		for (let x = 0; x < buttonColumns; x++) {
			const i = x + y * buttonColumns
			prelude += `${i} Source\n`
		}
	}
	prelude += '\n'

	prelude += 'BUTTON SDI_A:\n' + `-1 0\n`
	for (let y = 0; y < buttonRows; y++) {
		for (let x = 0; x < buttonColumns; x++) {
			const i = x + y * buttonColumns
			prelude += `${i} ${i}\n`
		}
	}
	prelude += '\n'

	prelude += 'BUTTON SDI_B:\n' + `-1 -1\n`
	for (let y = 0; y < buttonRows; y++) {
		for (let x = 0; x < buttonColumns; x++) {
			const i = x + y * buttonColumns
			prelude += `${i} -1\n`
		}
	}
	prelude += '\n'

	prelude += 'BUTTON REMOTE:\n' + `-1 -1\n`
	for (let y = 0; y < buttonRows; y++) {
		for (let x = 0; x < buttonColumns; x++) {
			const i = x + y * buttonColumns
			prelude += `${i} -1\n`
		}
	}
	prelude += '\n'

	return prelude
}

module.exports = {
	generateConfigure,
}
