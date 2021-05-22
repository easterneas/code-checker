'use strict'
const fs = require('fs').promises
const fsSync = require('fs')
const { execSync } = require('child_process')
const similarityCheck = require('string-similarity')

const MossController = require('./moss')
const BranchController = require('./branch')

const GithubRepo = require('../models/githubrepo')
const { writeSyncJSON, readSyncJSON } = require('../helpers/jsonHelper')
const { createDirIfNotExist } = require('../helpers/fileHelper')

class CheckerController {
  static check(params) {
    console.time('Completed! Time needed for completion was')
    let conf = {
      debug: params.debug,
      moss: {
        enabled: !params.ignoreMoss,
        basePath: ''
      },
      filterRatio: params.filterMinRatio || 0,
      repo: params.repository
    }

    GithubRepo.getConfig()
    .then(config => {
      conf = { ...conf, ...config }

      return GithubRepo.validateRepoName(conf)
    })
    .then(({ name }) => BranchController.getBranches(name, conf))
    .then(({ branches, config }) => {
      conf = { ...config }
      return branches
    })
    .then(branches => BranchController.cloneFromBranches(branches, conf))
    .then(async config => ({
      ...config,
      gitMetadata: await config.gitMetadata
    }))
    .then(conf => BranchController.writeMetadata(conf))
    .then(async ({ config, files }) => {
      conf = { ...config }

      return await files
    })
    .then(files => Promise.all(files.map(async (firstFile, i) => ({
      content: await fs.readFile(`${conf.path.outputPath}/${firstFile}.js`, 'utf8'),
        name: firstFile
    }))))
    .then(results => this.findSimilarities(results, conf))
    .then(results => this.generateResults(results, conf))
    .then(async results => {
      if(conf.moss.enabled) {
        return await MossController.generateMossResults(results, conf).then(({ results }) => MossController.saveResults(results, conf))
      }
      else return 'MOSS checking ignored. Skipping...'
    })
    .then(message => {
      console.log(message)
      
      !conf.debug && execSync(`rm ${conf.path.branchPath} -rf`)
      !conf.debug && execSync(`rm ${conf.path.testPath} -rf`)
    })
    .then(() => console.timeEnd('Completed! Time needed for completion was'))
    .catch(({ stack }) => console.error({ err: stack, conf }))
  }

  static generateResults = (ratioResults, conf) => {
    ratioResults = ratioResults.filter(result => result.length > 0).flat()

    console.log(`Generated and filtered results successfully.`)
    console.log()

    console.log(`Total cases found: ${ratioResults.length} case(s)`)
    console.log()

    console.log(`Sorting results and saving results to file...`)

    let id = 1
    ratioResults = ratioResults.map(result => {
      return { id: id++, ...result }
    })

    writeSyncJSON(`${conf.path.resultPath}`, ratioResults)

    console.log(`Results saved as ${conf.path.resultPath}! Head over there to see the details.`)
    console.log()

    return ratioResults
  }

  static findSimilarities = (results, conf) => {
    const { base_ratio: baseRatio, filterRatio, gitMetadata, debug } = conf
    const defaultRatio = filterRatio || 0

    return results.map((firstResult, i) => {
      const output = {
        student: gitMetadata[i],
        studentCases: []
      }

      results.forEach((secondResult, j) => {
        if(i > j){
          const ratioResult = similarityCheck.compareTwoStrings(firstResult.content, secondResult.content)
          const normalizedRatio = (ratioResult - baseRatio) / (1 - baseRatio) * 100 // will change to baseRatio

          // debug
          debug && console.log(firstResult.name, secondResult.name, ratioResult, normalizedRatio)

          if(normalizedRatio > defaultRatio) {
            const relatingStudent = gitMetadata.find(student => student.branch === secondResult.name.split('.js')[0])

            debug && console.log({ relatingStudent, result2: secondResult.name.split('.js')[0] })
                
            output.studentCases.push({
              with: relatingStudent,
              ratio: +normalizedRatio.toFixed(2)
            })
              }
            }
      })

      output.studentCases.sort((a, b) => sortDescending(a, b, 'ratio'))

      return output
      })
  }
}

module.exports = CheckerController