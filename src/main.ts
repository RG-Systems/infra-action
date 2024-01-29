import * as core from '@actions/core';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { getInputs } from './getInputs';
import { setOutputs } from './setOutputs';

const CDK_CONFIG = fs.readFileSync(path.join(__dirname, 'cdk/cdk.json', 'utf8'));

const CDK_ARGS = `--require-approval never --outputs-file cdk-outputs.json`;

export async function run(): Promise<void> {
  try {
    core.debug(`>>> ENV:\n${JSON.stringify(process.env)}`);

    const { vars, stack, action, folder } = getInputs();

    execSync(`echo "${vars.join('\n')}" > .env`);
    core.debug(`>>> .env:\n${execSync(`cat .env`).toString()}`);

    execSync(`echo '${CDK_CONFIG}' > cdk.json`);
    core.debug(`>>> cdk.json:\n${execSync(`cat cdk.json`).toString()}`);

    execSync(`npx cdk ${action} ${stack} ${CDK_ARGS}`);

    setOutputs({ stack, folder });
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}
