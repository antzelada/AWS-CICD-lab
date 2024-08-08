import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';


export class PipelineCdkStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();
    const unitTestOutput = new codepipeline.Artifact();
    const githubSecret = secretsmanager.Secret.fromSecretNameV2(this, 'GitHubToken', 'github/personal_access_token');


const pipeline = new codepipeline.Pipeline(this,'Pipeline',{
pipelineName: 'MyPupeline',
crossAccountKeys: false,
});

const sourceAction = new codepipelineActions.GitHubSourceAction({
    actionName: 'GitHubSource',
    owner: 'antzelada', 
    repo: 'AWS-CICD-lab',  
    oauthToken: githubSecret.secretValueFromJson('token-github'), //arn:aws:secretsmanager:us-east-1:623915490714:secret:github-token-AyAWpg
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



  }
}
