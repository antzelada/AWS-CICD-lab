
import * as cdk from 'aws-cdk-lib';
import { PipelineCdkStack } from '../lib/pipeline-cdk-stack'

const app = new cdk.App();

const pipelineCdkStack = new PipelineCdkStack(app, 'pipeline-stack', {});
