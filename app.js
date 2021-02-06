'use strict'
const CheckerController = require('./controllers/checker.js')
const CommandController = require('./controllers/command.js')
const SummarizerController = require('./controllers/summarizer.js')

const command = process.argv[2]
const args = process.argv.slice(3)
const params = {
  debug: args.includes('debug'),
  repository: args.includes('repo-name') && args[args.indexOf('repo-name') + 1],
}

console.clear()

params.debug && console.log({...params})

switch(command) {
  case 'setupConfig':
    return CheckerController.migrateConfig()
    return
  case 'check':
    params.filterMinRatio = args.includes('min-ratio') && +args[args.indexOf('min-ratio') + 1]
    params.ignoreMoss = args.includes('no-moss')
    if(params.repository) return CheckerController.check(params)
    else return console.log('You need to specify the repository name.')
    // return
  // case 'autoGenerateFiles':
  //   params.automate = args[0] !== 'false'
  //   return CheckerController.autoGenerateFiles(params)
  case 'resubmitNulls':
    return CheckerController.resubmitNulls()
  case 'filter':
    params.ratioThreshold = args.includes('ratio') && args[args.indexOf('ratio') + 1]
    if(params.ratioThreshold && !Number.isNaN(params.ratioThreshold))
      return CheckerController.filterRatioThreshold(params)
    else console.error('You need to set a ratio threshold. Exiting.')
  // case 'filterCase':
  //   return CheckerController.filterCase()
  // case 'addTime':
  //   return CheckerController.addTime()
  // case 'urlChecker':
  //   return CheckerController.urlChecker()
  // case 'daySummary':
  //   return CheckerController.daySummary()
  case 'summarize':
    if(params.repository) return SummarizerController.summarize(params)
    else return console.log('You need to specify the repository name.')
  case 'help':
  default:
    return CommandController.showHelp()
}