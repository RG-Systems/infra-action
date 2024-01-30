import type { CreateStackCommandOutput, DeleteStackCommandOutput } from '@aws-sdk/client-cloudformation';
type Params = {
    action: 'deploy' | 'destroy';
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
export declare const cdkAction: ({ action, optimized, stackName, environment, project, identity, path, domain, env }: Params) => Promise<CreateStackCommandOutput | DeleteStackCommandOutput>;
export {};
