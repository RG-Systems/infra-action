import * as core from '@actions/core';
import { execSync } from 'child_process';
import { getInputs } from './getInputs';
import { setOutputs } from './setOutputs';

export async function run(): Promise<void> {
  try {
    const { vars, stack, action, folder } = getInputs();

    execSync(`echo "${vars.join('\n')}" > .env`);
    core.debug(`.env: ${execSync(`cat .env`).toString()}`);

    execSync(
      `npx cdk ${action} ${stack} --require-approval never --outputs-file cdk-outputs.json`
    );

    setOutputs({ stack, folder });
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}
