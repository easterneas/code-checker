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
      conf = {
        ...conf,
        ...config,
      }

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
    .then(files => Promise.all(files.filter(file => file !== 'metadata.json').map(async (firstFile, i) => {
      return {
        content: await fs.readFile(`${conf.repoBranchOutputDir}/${firstFile}`, 'utf8'),
        name: firstFile
      }
    })))
    .then(results => this.findSimilarities(results, conf))
    .then(results => this.generateResults(results, conf))
    .then(async results => {
      if(conf.moss.enabled) return MossController.generateMossResults(results, conf)
      else return 'MOSS checking ignored. Skipping...'
    })
    .then(message => {
      console.log(message)
      
      !conf.debug && execSync(`rm ${conf.repoBranchOutputDir} -rf`)
      !conf.debug && execSync(`rm ${conf.paths.testing} -rf`)
    })
    .then(() => console.timeEnd('Completed! Time needed for completion was'))
    .catch(console.error)
  }

  static generateResults = (ratioResults, conf) => {
    ratioResults = ratioResults.filter(result => result.length > 0).flat()

    console.log(`Generated and filtered results successfully.`)
    console.log()

    console.log(`Total cases found: ${ratioResults.length} case(s)`)
    console.log()

    console.log(`Sorting results and saving results to file...`)

    let id = 1
    ratioResults = ratioResults.sort((a, b) => {
      if(a.ratio > b.ratio) return -1
      else if(a.ratio < b.ratio) return 1
      return 0
    }).map(result => {
      return { id: id++, ...result }
    })

    createDirIfNotExist(`results/${conf.batch_name}`, true)

    writeSyncJSON(`results/${conf.batch_name}/${conf.repo.name}.json`, ratioResults)

    console.log(`Results saved as results/${conf.batch_name}/${conf.repo.name}.json! Head over there to see the details.`)
    console.log()

    return ratioResults
  }

  static findSimilarities = (results, conf) => Promise.all(results.map(async (firstResult, i) => {
    return await new Promise((resolve => {
      const fileResults = []

      results.forEach(async (secondResult, j) => {
        if(i > j){
          const baseRatio = conf.base_ratio
          const defaultRatio = conf.filterRatio || 0
          const ratioResult = similarityCheck.compareTwoStrings(firstResult.content, secondResult.content)
          const normalizedRatio = (similarityCheck.compareTwoStrings(firstResult.content, secondResult.content) - baseRatio) / (1 - baseRatio) * 100 // will change to baseRatio

          // debug
          conf.debug && console.log(firstResult.name, secondResult.name, ratioResult, normalizedRatio)

          if(normalizedRatio > defaultRatio) {
            let Student1, Student2, student1Flag = true, student2Flag = true
            for(let i = 0; i < conf.gitMetadata.length; i++){
              const meta = conf.gitMetadata[i]

              if(student1Flag && meta.branch === firstResult.name.split('.js')[0]){
                // debug
                conf.debug && console.log({ meta, result1: firstResult.name.split('.js')[0] })
                
                Student1 = meta
                student1Flag = false
              } else if(student2Flag && meta.branch === secondResult.name.split('.js')[0]){
                // debug
                conf.debug && console.log({ meta, result2: secondResult.name.split('.js')[0] })
                
                Student2 = meta
                student2Flag = false
              }
            }

            const result = { Student1, Student2, ratio: +normalizedRatio.toFixed(2) }

            fileResults.push(result)
          }
        }
      })
      resolve(fileResults)
    }))
  }))
}

module.exports = CheckerController