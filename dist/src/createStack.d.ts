import type { CloudFormationStackArtifact } from 'aws-cdk-lib/cx-api';
type Params = {
    optimized: boolean;
    stackName: string;
    environment: string;
    project: string;
    identity: string;
    path: string;
    domain: string;
    env: {
        account: string;
        region: string;
    };
};
export declare const createStack: ({ optimized, stackName, environment, project, identity, path, domain, env }: Params) => CloudFormationStackArtifact;
export {};
