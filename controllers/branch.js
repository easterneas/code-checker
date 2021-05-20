const { exec, execSync, spawnSync } = require('child_process')
const fs = require('fs').promises
const fsSync = require('fs')

const { gitClone, gitSSH } = require('../helpers/gitHelper')
const { recursiveCombine } = require('../helpers/checker')

class BranchController {
  static getBranches(name, config){
    return new Promise((success, fail) => {
      config.repo = { name }
      config.gitRepo = gitSSH({ batchName: config.batch_name, repoName: config.repo.name })
      config.paths = {
        testing: `tests/${config.repo.name}`,
        results: `tests/${config.repo.name}`,
        merged: `tests/${config.repo.name}`,
        metadata: ``,
      }

      console.log(`Checking repository ${config.repo.name} of ${config.batch_name} started`)
      console.log()
      
      const output = execSync(`git ls-remote ${config.gitRepo} "refs/heads/*"`, { encoding: 'utf8' })

      let branches = output.split('\n').map(line => line.split('\t')[1]).slice(0, -1).map(ref => ref.split('/').splice(-1)[0])

      branches = branches.filter(branch => !['master', 'main'].includes(branch)).sort((a, b) => {
        if(a > b) return 1
        if(a < b) return -1
        return 0
      })

      console.log(`Total branches: ${branches.length}`)

      success({ branches, config })
    })
  }

  static cloneFromBranches(branches, config) {
    console.log(`Cloning each branch from a repository...`)

    config.repoBranchOutputDir = `output/${config.repo.name}`

    return {
      ...config,
      gitMetadata: Promise.all(branches.map(async branch => {
        try {
          const branchPath = `${config.paths.testing}/${branch}`

          // do git clone
          await gitClone(config.gitRepo, branch, branchPath)

          // show git log from cloned branch
          return (new Promise((success, fail) => {
            exec(`git log`, { cwd: branchPath }, (err, out) => {
              if(err) throw fail(err)
              
              const metadata = {
                branch,
                author: out.split('\n').find(line => line.includes('Author:')).split(': ')[1].split(' <')[0],
                commitTimeline: out.split('\n').filter(line => line.includes('Date:'))
              }
          
              if(!fsSync.existsSync(`${config.repoBranchOutputDir}`))
                fsSync.mkdirSync(`${config.repoBranchOutputDir}`, { recursive: true })
              fsSync.writeFileSync(`${config.repoBranchOutputDir}/${branch}.js`, recursiveCombine(branchPath))
              // execSync(`rm ${branchPath} -rf`)

              success(metadata)
            })
          }))
        } catch (e) {
          console.error(e)
        }
      }))
    }
  }
  
  static writeMetadata(config) {
    console.log(`Branch cloning complete.`)
    console.log()
    
    console.log(`Writing git metadata to a file...`)

    config.gitMetadata = config.gitMetadata.sort((a, b) => {
      if(a.branch > b.branch) return 1
      if(a.branch < b.branch) return -1
      return 0
    })

    config.debug && console.log(config.gitMetadata)

    if(!fsSync.existsSync(config.repoBranchOutputDir))
      fsSync.mkdirSync(config.repoBranchOutputDir)

    fsSync.writeFileSync(`${config.repoBranchOutputDir}/metadata.json`, JSON.stringify(config.gitMetadata, null, 2))
    console.log(`Writing complete.`)
    console.log()

    console.log(`Filtering and generating results...`)
    return {
      config,
      files: fs.readdir(config.repoBranchOutputDir)
    }
  }
}

module.exports = BranchController