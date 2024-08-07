import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

export class PipelineCdkStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

const pipeline = new codepipeline.Pipeline(this,'Pipeline',{
pipelineName: 'MyPupeline',
});

const sourceAction = new codepipelineActions.CodeStarConnectionsSourceAction({
    actionName: 'GitHubSource',
    owner: 'antzelada', 
    repo: 'AWS-CICD-lab',  
    connectionArn: 'arn:aws:secretsmanager:us-east-1:623915490714:secret:github-token-AyAWpg', 
    output: sourceOutput,
    branch: 'develop', 
  })

    // Crear un proyecto de CodeBuild
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
        buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'), // Especifica tu archivo buildspec.yml
      });

      const buildAction = new codepipelineActions.CodeBuildAction({
        actionName: 'CodeBuild',
        project: buildProject,
        input: sourceOutput,
        outputs: [buildOutput], 
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

  }
}
