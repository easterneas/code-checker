const fs = require('fs')

const IGNORED_NODES = [ 'node_modules', 'package.json', 'package-lock.json' ]
const IGNORED_EXTENSIONS = [ '.md', '.jpg', '.jpeg', '.png', '.json', '.test.js', '.gif' ]

const clearWhitespaces = (content) => {
	const regex = /\/\/.*?$|((?:[^\w\s]|^)\s*\/(?![*\/])(?:\\.|\[(?:\\.|.)\]|.)*?\/(?=[gmiy]{0,4}\s*(?![*\/])(?:\W|$)))|\/\*[\s\S]*?\*\//gm
	return content.replace(regex, '\n')
}

const recursiveCombine = (currentDir, appendedContent = '') => {
	try {
		let fsFiles = fs.readdirSync(currentDir, 'utf8').filter(node => {
			if(currentDir.split('/').includes('models')) {
				if(node === 'index.js') {
					return false
				}
			}
			if(node === 'node_modules') console.log(`-- [WARN] node_modules is detected at ${currentDir}`)
			return !IGNORED_NODES.includes(node) && node[0] !== '.'
		})
		.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))

		fsFiles.forEach(path => {
			let rootPath = `${currentDir}/${path}`
			const pathProps = fs.lstatSync(rootPath)
			let valid = true
			
			if(pathProps.isDirectory()) {
				appendedContent = recursiveCombine(rootPath, appendedContent)
			} else {
				IGNORED_EXTENSIONS.forEach(ext => {
					if(rootPath.includes(ext)) valid = false
				})

				if(valid) try {
					let stringsInFile = fs.readFileSync(rootPath, 'utf8')
					stringsInFile = clearWhitespaces(stringsInFile)

					while(stringsInFile.includes('\n\n')){
						stringsInFile = stringsInFile.replace(/(\n\n)/gm,'\n')
					}

					appendedContent += `// File: ${rootPath.split('/').slice(1).join('/')}\n`
					appendedContent += '\n'
					// appendedContent += '// =========================================\n'
					// appendedContent += stringsInFile.replace(/(\n\n)|((?:[^\w\s]|^)\s*\/(?![*\/])(?:\\.|\[(?:\\.|.)\]|.)*?\/(?=[gmiy]{0,4}\s*(?![*\/])(?:\W|$)))|\/\/.*?$|\/\*[\s\S]*?\*\//gm, '\n')
					appendedContent += stringsInFile
					appendedContent += '\n'
					appendedContent += '\n'
				} catch (error) {
					console.log(error)
					console.log({
						rootPath,
						pathProps,
						msgs: pathProps.isFile(),
						currentDir
					})
				}
			}
		})

		return appendedContent
	} catch (e) {
		console.log(e)
	}
}

module.exports = {
	recursiveCombine
}