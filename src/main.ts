import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'

import fs from 'fs/promises'

import { isValidJSON } from './utils/isValidJSON'

export async function run(): Promise<void> {
  try {
    const project = core.getInput('name')
    const environment = core.getInput('environment') || 'tmp'
    const variables = JSON.parse(core.getInput('variables') || '{}')
    const action = core.getInput('action') as 'deploy' | 'destroy'
    const pr = github.context?.payload?.pull_request?.number
    const folder = github.context?.sha.slice(0, 7)
    const domain = variables?.DOMAIN
    const vars = []
    const stack = pr
      ? `${pr}-${environment}-${project}`
      : `${environment}-${project}`

    core.debug(`CURRENT FOLDER (PWD): ${exec.exec('pwd').toString()}`)

    if (!domain) throw new Error('Missing DOMAIN variable')
    if (!project) throw new Error('Missing name input')
    if (!action) throw new Error('Missing action input')

    for (const [key, value] of Object.entries(variables)) {
      vars.push(`${key}=${value}`)
    }

    await exec.getExecOutput('echo', [`"${vars.join('\n')}" > .env`])

    await exec.getExecOutput('cat', ['.env'])

    require('aws-cdk/bin/cdk').deploy()

    await exec.getExecOutput('cat', ['cdk-outputs.json'])
    const cdkOutputsFile = await fs.readFile('cdk-outputs.json', 'utf8')
    const outputs = isValidJSON(cdkOutputsFile)
      ? JSON.parse(cdkOutputsFile)
      : {
          [stack]: {
            BucketName: 'undefined',
            DistributionId: 'undefined',
            DeploymentUrl: 'undefined'
          }
        }

    // Set outputs for other workflow steps to use
    core.setOutput('folder', folder)
    core.setOutput('bucket', outputs?.[stack]?.BucketName)
    core.setOutput('id', outputs?.[stack]?.DistributionId)
    core.setOutput('url', outputs?.[stack]?.DeploymentUrl)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
