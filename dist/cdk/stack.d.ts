import type { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
type Props = cdk.StackProps & {
    domain?: string;
    path?: string;
    project?: string;
    priceClass?: cloudfront.PriceClass;
    variables?: Record<string, string | undefined>;
    identity?: string;
};
export declare class Stack extends cdk.Stack {
    constructor(scope: Construct, id: string, { path, variables, domain, project, priceClass, identity, ...props }: Props);
    private getOriginAccessIdentity;
    private getBucket;
    private getZone;
    private getCertificate;
    private getOrigin;
    private getDistribution;
    private createSubdomainRecords;
    private createOutput;
}
export {};
