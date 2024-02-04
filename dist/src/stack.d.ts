import type { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
type Props = cdk.StackProps & {
    environment: string;
    domain?: string;
    path?: string;
    project?: string;
    priceClass?: cloudfront.PriceClass;
    identity?: string;
    zoneID?: string;
};
export declare class Stack extends cdk.Stack {
    constructor(scope: Construct, id: string, { environment, path, domain, project, priceClass, identity, zoneID, ...props }: Props);
    private getOriginAccessIdentity;
    private getBucket;
    private getZone;
    private getCertificate;
    private getOrigin;
    private getDistribution;
    private createEnvSpecificOrigin;
    private createSubdomainRecords;
    private createOutput;
}
export {};
