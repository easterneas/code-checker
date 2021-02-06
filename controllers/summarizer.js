'use strict'
const fsSync = require('fs')

const GithubRepo = require('../models/githubrepo.js')

class SummarizerController {
  /**
   * Merges and summarizes the result.
   * @param { repository, debug } params 
   * 
   * @return void
   */
  static summarize(params){
    console.time('Completed! Time needed for completion was')
    let conf = {
      debug: params.debug,
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
    .then(repo => {
      return this.checkAndMerge(repo, conf)
    })
    .then(console.log)
    .then(() => {
      console.timeEnd('Completed! Time needed for completion was')
    })
    .catch(console.error)
  }

  /**
   * Checks for any Moss results, and merges the results if found.
   * @param { name } repo 
   * @param { debug, repo, batch_name, phase, base_ratio } config
   * 
   * @return Promise
   */
  static checkAndMerge(repo, config) {
    return new Promise((success, fail) => {
      try {
        config = {
          ...config,
          basePath: {
            moss: `results/${config.batch_name}/moss-${repo.name}.json`,
            cases: `results/${config.batch_name}/${repo.name}.json`,
          }
        }
  
        config.debug ? console.log(repo) : false
        config.debug ? console.log(config) : false
  
        if(fsSync.existsSync(config.basePath.moss)) {
          console.log(`Found Moss results!`)
          const mossResults = require(`../${config.basePath.moss}`)
          const caseResults = require(`../${config.basePath.cases}`)
          
          console.log(`Merging and writing to a new file...`)
          const mergedResults = mossResults.map((url, i) => {
            return {
              ...caseResults[i],
              mossURL: url
            }
          })
  
          if(!fsSync.existsSync('results/merged'))
            fsSync.mkdirSync('results/merged')
  
          fsSync.writeFileSync(`results/merged/${repo.name}.json`, JSON.stringify(mergedResults, null, 2))
          success(`Merge complete! Head onto results/merged/${repo.name}.json to view the results!`)
        } else {
          success(`There are no Moss results. Skipping...`)
        }
      } catch (e) {
        fail(e)
      }
    })
  }
}

module.exports = SummarizerController