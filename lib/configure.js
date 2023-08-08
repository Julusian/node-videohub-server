function generateConfigure(buttonColumns, buttonRows, destinationCount = 0) {
	const destinationCols = Math.floor(destinationCount / 2)
	const destinationFromCol = buttonColumns - destinationCols

	let prelude = 'BUTTON KIND:\n'
	for (let y = 0; y < buttonRows; y++) {
		for (let x = 0; x < buttonColumns; x++) {
			const i = x + y * buttonColumns
			const isDestination = x >= destinationFromCol
			prelude += `${i} ${isDestination ? 'Destination' : 'Source'}\n`
		}
	}
	prelude += '\n'

	prelude += 'BUTTON SDI_A:\n' + `-1 0\n`
	for (let y = 0; y < buttonRows; y++) {
		for (let x = 0; x < buttonColumns; x++) {
			const i = x + y * buttonColumns

			if (x >= destinationFromCol) {
				const destinationCol = x - destinationFromCol

				prelude += `${i} ${destinationCol * buttonRows + y}\n`
			} else {
				prelude += `${i} ${i}\n`
			}
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
