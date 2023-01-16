import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { CrowdsourcingReview } from '../../../../../gateway/tasks/crowdsourcing-review';
import { CrowdsourcingTask } from '../../../../../gateway/tasks/crowdsourcing-task';
import { NotFound } from '../../../../../utility/errors/not-found';
import { EditorSlots } from '../../../../shared/capture-models/new/components/EditorSlots';
import { RevisionProviderWithFeatures } from '../../../../shared/capture-models/new/components/RevisionProviderWithFeatures';
import { SimpleSaveButton } from '../../../../shared/capture-models/new/components/SimpleSaveButton';
import { EditorContentViewer } from '../../../../shared/capture-models/new/EditorContent';
import { useData } from '../../../../shared/hooks/use-data';
import { PreviewIcon } from '../../../../shared/icons/PreviewIcon';
import { ReadMoreIcon } from '../../../../shared/icons/ReadMoreIcon';
import { EmptyState } from '../../../../shared/layout/EmptyState';
import {
  EditorToolbarButton,
  EditorToolbarIcon,
  EditorToolbarLabel,
} from '../../../../shared/navigation/EditorToolbar';
import { serverRendererFor } from '../../../../shared/plugins/external/server-renderer-for';
import { HrefLink } from '../../../../shared/utility/href-link';
import { RefetchProvider, useRefetch } from '../../../../shared/utility/refetch-context';
import { useCrowdsourcingTaskDetails } from '../../../hooks/use-crowdsourcing-task-details';
import { ApproveSubmission } from '../actions/approve-submission';
import { RejectSubmission } from '../actions/reject-submission';
import { RequestChanges } from '../actions/request-changes';
import styled from 'styled-components';
import { LocaleString } from '../../../../shared/components/LocaleString';
import { useTaskMetadata } from '../../../hooks/use-task-metadata';
import { SubjectSnippet } from '../../../../../extensions/tasks/resolvers/subject-resolver';
import { SimpleStatus } from '../../../../shared/atoms/SimpleStatus';

const ReviewContainer = styled.div`
  position: relative;
  overflow-x: hidden;
  height: 80vh;
`;

const ReviewHeader = styled.div`
  height: 43px;
  background-color: #f7f7f7;
  display: flex;
  border-bottom: 1px solid #dddddd;
  line-height: 24px;
  position: sticky;
  top: 0;
  z-index: 4;
`;

const Label = styled.div`
  font-weight: 600;
  padding: 0.6em;
`;

const SubLabel = styled.div`
  color: #6b6b6b;
  padding: 0.6em;
  font-size: 14px;
`;
const ReviewActionBar = styled.div`
  border-bottom: 1px solid #dddddd;
  display: inline-flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 0.6em;
`;

const ReviewActions = styled.div`
  display: flex;

  button {
    border: none;
  }
`;
const ReviewPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  overflow-y: scroll;

  > div {
    padding: 0.6em;
    width: auto;
  }
`;

function ViewSingleReview({
  task,
  review,
}: {
  task: CrowdsourcingTask & { id: string };
  review: (CrowdsourcingReview & { id: string }) | null;
}) {
  const {
    captureModel,
    revisionId,
    wasRejected,
    canvas,
    project,
    canvasLink,
    manifestLink,
  } = useCrowdsourcingTaskDetails(task);
  const refetch = useRefetch();
  const metadata = useTaskMetadata<{ subject?: SubjectSnippet }>(task);

  if (!review) {
    return <EmptyState>This task is not yet ready for review.</EmptyState>;
  }

  return (
    <RevisionProviderWithFeatures
      revision={revisionId}
      captureModel={captureModel}
      slotConfig={{
        editor: { allowEditing: false },
        components: { SubmitButton: SimpleSaveButton },
      }}
    >
      <ReviewContainer>
        <ReviewHeader>
          <Label>
            {metadata && metadata.subject ? <LocaleString>{metadata.subject.label}</LocaleString> : task.name}
          </Label>

          <SubLabel>
            {metadata.subject && metadata.subject.parent && (
              <LocaleString style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {metadata.subject.parent.label}
              </LocaleString>
            )}
          </SubLabel>
        </ReviewHeader>
        <ReviewActionBar>
          <SimpleStatus status={task.status} status_text={task.status_text || ''} />
          <div>
            {review && !wasRejected ? (
              <ReviewActions>
                <RejectSubmission
                  userTaskId={task.id}
                  onReject={() => {
                    refetch();
                  }}
                />

                <RequestChanges
                  userTaskId={task.id}
                  changesRequested={task.state?.changesRequested}
                  onRequest={() => {
                    refetch();
                  }}
                />

                {/*<StartMerge*/}
                {/*  allTasks={props.allTasks as any}*/}
                {/*  reviewTaskId={data.review.id}*/}
                {/*  userTask={task}*/}
                {/*  // onStartMerge={(revId: string) => props.goBack({ refresh: true, revisionId: revId })}*/}
                {/*/>*/}

                <ApproveSubmission
                  project={project}
                  userTaskId={task.id}
                  onApprove={() => {
                    refetch();
                  }}
                  reviewTaskId={review.id}
                />
              </ReviewActions>
            ) : null}
          </div>
        </ReviewActionBar>

        <ReviewPreview>
          <div style={{ minWidth: '40%' }}>
            <EditorSlots.TopLevelEditor />
          </div>
          <div style={{ minWidth: '60%' }}>
            <ReviewActions>
              <>
                {canvasLink ? (
                  <EditorToolbarButton as={HrefLink} href={canvasLink}>
                    <EditorToolbarIcon>
                      <PreviewIcon />
                    </EditorToolbarIcon>
                    <EditorToolbarLabel>View resource</EditorToolbarLabel>
                  </EditorToolbarButton>
                ) : null}
                {manifestLink ? (
                  <EditorToolbarButton as={HrefLink} href={manifestLink}>
                    <EditorToolbarIcon>
                      <PreviewIcon />
                    </EditorToolbarIcon>
                    <EditorToolbarLabel>View manifest</EditorToolbarLabel>
                  </EditorToolbarButton>
                ) : null}
              </>
            </ReviewActions>
            {canvas ? <EditorContentViewer height={300} canvasId={canvas.id} /> : null}
          </div>
        </ReviewPreview>
      </ReviewContainer>
    </RevisionProviderWithFeatures>
  );
}

export function SingleReview() {
  const params = useParams<{ taskId: string }>();
  const { data, refetch } = useData(SingleReview);

  if (!data) {
    return <div>Loading...</div>;
  }

  if (!data.task) {
    return <Navigate to={`/tasks/${params.taskId}`} />;
  }

  return (
    <RefetchProvider refetch={refetch}>
      <ViewSingleReview task={data.task} review={data.review} />
    </RefetchProvider>
  );
}

serverRendererFor(SingleReview, {
  getKey: params => {
    return ['single-review', { id: params.taskId }];
  },
  async getData(key, vars, api) {
    const task = await api.getTask(vars.id);
    if (!task || !task.state || !task.state.reviewTask) {
      return {
        review: null,
        task,
      };
    }
    return {
      review: await api.getTask(task.state.reviewTask),
      task,
    };
  },
});
