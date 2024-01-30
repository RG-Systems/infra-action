import * as core from '@actions/core';
import * as github from '@actions/github';
import { execSync } from 'child_process';

import { deploy } from './deploy';

export async function run(): Promise<void> {
  try {
    const AWS_REGION = core.getInput('AWS_REGION', { required: true });
    const AWS_ACCOUNT = core.getInput('AWS_ACCOUNT', { required: true });
    const identity = core.getInput('IDENTITY');
    const optimized = core.getInput('OPTIMIZED') === 'true';
    const pr = github.context?.payload?.pull_request?.number;
    const folder = github.context?.sha.slice(0, 7);
    const variables = JSON.parse(core.getInput('VARIABLES') || '{}');
    const action = core.getInput('ACTION', { required: true });
    const environment = core.getInput('ENVIRONMENT') || 'tmp';
    const project = core.getInput('PROJECT_NAME', { required: true });
    const domain = variables?.DOMAIN;
    const vars = [];
    const stackName = pr
      ? `${pr}-${environment}-${project}`
      : `${environment}-${project}`;

    if (!domain) throw new Error('Missing DOMAIN variable');
    if (!project) throw new Error('Missing name input');
    if (!action) throw new Error('Missing action input');

    for (const [key, value] of Object.entries(variables)) {
      vars.push(`${key}=${value}`);
    }

    execSync(`echo "${vars.join('\n')}" > .env`);
    core.debug(`>>> .env:\n${execSync(`cat .env`).toString()}`);

    const result = await deploy({
      optimized,
      stackName,
      environment,
      project,
      identity,
      path: folder,
      domain,
      env: {
        account: AWS_ACCOUNT,
        region: AWS_REGION
      }
    });

    core.debug(`>>> result:\n${result}`);
    core.setOutput('folder', folder);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}
