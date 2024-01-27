import * as core from '@actions/core';
import { execSync } from 'child_process';
import { getInputs } from './getInputs';
import { setOutputs } from './setOutputs';

const CDK_ARGS = `--require-approval never --outputs-file cdk-outputs.json`;

export async function run(): Promise<void> {
  try {
    const { vars, stack, action, folder } = getInputs();

    execSync(`echo "${vars.join('\n')}" > .env`);
    core.debug(`>>> .env:\n${execSync(`cat .env`).toString()}`);

    core.debug(`>>> List of files:\n${execSync(`ls -la`).toString()}`);

    execSync(`echo $CDK_CONFIG > ~/.cdk.json`);
    core.debug(`>>> cdk.json:\n${execSync(`cat cdk.json`).toString()}`);

    execSync(`npx cdk ${action} ${stack} ${CDK_ARGS}`);

    setOutputs({ stack, folder });
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}
