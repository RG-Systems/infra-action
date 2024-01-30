import { CreateStackOutput } from 'aws-sdk/clients/cloudformation';
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
export declare const deploy: ({ optimized, stackName, environment, project, identity, path, domain, env }: Params) => Promise<CreateStackOutput>;
export {};
