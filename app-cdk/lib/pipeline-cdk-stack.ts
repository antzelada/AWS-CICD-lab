import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';


interface ConsumerProps extends StackProps {
  ecrRepository: ecr.Repository,
  s3Bucket: s3.Bucket,
}


export class PipelineCdkStack extends Stack {
  constructor(scope: Construct, id: string, props: ConsumerProps) {
    super(scope, id, props);
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();
    const unitTestOutput = new codepipeline.Artifact();
    const dockerBuildOutput = new codepipeline.Artifact();

    const githubSecret = secretsmanager.Secret.fromSecretNameV2(this, 'GitHubToken', 'github');

const pipeline = new codepipeline.Pipeline(this,'Pipeline',{
pipelineName: 'MyPupeline',
crossAccountKeys: false,
});

const sourceAction = new codepipelineActions.GitHubSourceAction({
    actionName: 'GitHubSource',
    owner: 'antzelada', 
    repo: 'AWS-CICD-lab',  
    oauthToken: githubSecret.secretValueFromJson('github'), 
    output: sourceOutput,
    branch: 'develop', 
  })


      const codeBuild = new codebuild.PipelineProject(this, 'CodeBuild', {
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          privileged: true,
          computeType: codebuild.ComputeType.LARGE,
        },
        buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec_test.yml'),
      });
  

      const buildAction = new codepipelineActions.CodeBuildAction({
        actionName: 'CodeBuild',
        project: codeBuild,
        input: sourceOutput,
        outputs: [buildOutput], 
      });

      const unitTest = new codepipelineActions.CodeBuildAction({
        actionName: 'Unit-Test',
        project: codeBuild,
        input: sourceOutput,
        outputs: [unitTestOutput],
      });

      const dockerBuild = new codebuild.PipelineProject(this, 'DockerBuild', {
        environmentVariables: {
          IMAGE_TAG: { value: 'latest' },
          IMAGE_REPO_URI: { value: props.ecrRepository.repositoryUri },
          S3_BUCKET_NAME: { value: props.s3Bucket.bucketName },
          AWS_DEFAULT_REGION: { value: process.env.CDK_DEFAULT_REGION },
        },
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          privileged: true,
          computeType: codebuild.ComputeType.LARGE,
        },
        buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec_docker.yml'),
      });

      const dockerBuildRolePolicy = new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:GetRepositoryPolicy',
          'ecr:DescribeRepositories',
          'ecr:ListImages',
          'ecr:DescribeImages',
          'ecr:BatchGetImage',
          'ecr:InitiateLayerUpload',
          'ecr:UploadLayerPart',
          'ecr:CompleteLayerUpload',
          'ecr:PutImage',
          's3:PutObject',
          's3:PutObjectAcl',
        ],
      });
  
      dockerBuild.addToRolePolicy(dockerBuildRolePolicy);
  
  

pipeline.addStage({
    stageName: 'Source',
    actions:[sourceAction]
}
);
pipeline.addStage({
    stageName: 'Build',
    actions:[buildAction]
}
);

pipeline.addStage({
  stageName: 'Code-Quality-Testing',
  actions: [unitTest],
});

pipeline.addStage({
  stageName: 'Docker-Push-ECR',
  actions: [
    new codepipelineActions.CodeBuildAction({
      actionName: 'Docker-Build',
      project: dockerBuild,
      input: sourceOutput,
      outputs: [dockerBuildOutput],
    }),
  ],
});




  }
}
