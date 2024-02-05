#!/bin/bash
cd ./cdk

yarn install --frozen-lockfile

export STACK=$PROJECT_NAME-$ENVIRONMENT

if [ $ENVIRONMENT = "tmp" ]; then
  STACK=$PROJECT_NAME-$ENVIRONMENT-$GITHUB_REF_NAME
fi

echo "RESULT >>> STACK -> $STACK"

# Deploy the infrastructure
npx cdk deploy $STACK --require-approval never --outputs-file cdk-outputs.json
BUCKET=$(jq --arg key "$STACK" '.[$key].BucketName' cdk-outputs.json)
echo "bucket=$(echo $BUCKET | sed -e 's/"//g')" >> $GITHUB_OUTPUT
echo "id=$(jq --arg key "$STACK" '.[$key].DistributionId' cdk-outputs.json)" >> $GITHUB_OUTPUT
URL=$(jq --arg key "$STACK" '.[$key].DeploymentUrl' cdk-outputs.json)
echo "url=$(echo $URL | sed -e 's/"//g')" >> $GITHUB_OUTPUT
echo "RESULT >>>"
cat cdk-outputs.json
