import React, { useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { CrowdsourcingReview } from '../../../../../gateway/tasks/crowdsourcing-review';
import { CrowdsourcingTask } from '../../../../../gateway/tasks/crowdsourcing-task';
import { EditorSlots } from '../../../../shared/capture-models/new/components/EditorSlots';
import { RevisionProviderWithFeatures } from '../../../../shared/capture-models/new/components/RevisionProviderWithFeatures';
import { EditorContentViewer } from '../../../../shared/capture-models/new/EditorContent';
import styled, { css } from 'styled-components';
import {
  CanvasViewerButton,
  CanvasViewerControls,
  CanvasViewerEditorStyleReset,
  CanvasViewerGrid,
} from '../../../features/CanvasViewerGrid';
import { useData } from '../../../../shared/hooks/use-data';
import { PreviewIcon } from '../../../../shared/icons/PreviewIcon';
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
import { LocaleString } from '../../../../shared/components/LocaleString';
import { useTaskMetadata } from '../../../hooks/use-task-metadata';
import { SubjectSnippet } from '../../../../../extensions/tasks/resolvers/subject-resolver';
import { SimpleStatus } from '../../../../shared/atoms/SimpleStatus';
import { Button } from '../../../../shared/navigation/Button';
import useDropdownMenu from 'react-accessible-dropdown-menu-hook';
import { EditIcon } from '../../../../shared/icons/EditIcon';
import { DirectEditButton } from '../../../../shared/capture-models/new/components/DirectEditButton';
import { MaximiseWindow } from '../../../../shared/layout/MaximiseWindow';
import { FullScreenExitIcon } from '../../../../shared/icons/FullScreenExitIcon';
import { FullScreenEnterIcon } from '../../../../shared/icons/FullScreenEnterIcon';
import { Runtime } from '@atlas-viewer/atlas';
import { HomeIcon } from '../../../../shared/icons/HomeIcon';
import { MinusIcon } from '../../../../shared/icons/MinusIcon';
import { PlusIcon } from '../../../../shared/icons/PlusIcon';
import { useTranslation } from 'react-i18next';
import { extractIdFromUrn } from '../../../../../utility/parse-urn';
import { useProjectAnnotationStyles } from '../../../hooks/use-project-annotation-styles';

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
  z-index: 12;
`;

const Label = styled.div`
  font-weight: 600;
  padding: 0.6em;
`;

const SubLabel = styled.div`
  color: #6b6b6b;
  padding: 0.6em;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 130px;
`;
const ReviewActionBar = styled.div`
  border-bottom: 1px solid #dddddd;
  display: inline-flex;
  justify-content: space-between;
  flex-wrap: wrap-reverse;
  width: 100%;
  padding: 0.6em;
  min-height: 42px;
`;

const ReviewActions = styled.div`
  display: flex;
  margin-left: auto;

  button {
    border: none;
  }
`;

const ReviewDropdownContainer = styled.div`
  position: relative;
  max-width: 150px;
  align-self: end;
  z-index: 11;
`;

const ReviewDropdownPopup = styled.div<{ $visible?: boolean }>`
  background: #ffffff;
  border: 1px solid #3498db;
  z-index: 11;
  border-radius: 4px;
  position: absolute;
  display: none;
  margin: 0.3em;
  top: 2.6em;
  right: 0;
  font-size: 0.9em;
  min-width: 10em;
  ${props =>
    props.$visible &&
    css`
      display: block;
    `}
`;

const ReviewPreview = styled.div`
  display: flex;
  overflow-y: scroll;

  > div {
    padding: 0.6em;
    width: auto;
  }
`;

const Assignee = styled.div`
  font-size: small;
  color: #575757;
  align-self: center;
  margin-left: 0.5em;
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

  const [isEditing, setIsEditing] = useState(false);
  // const isLocked = props.lockedTasks && props.lockedTasks.indexOf(props.task.id) !== -1;
  const isDone = task?.status === 3;
  const { buttonProps, isOpen: isDropdownOpen } = useDropdownMenu(1, {
    disableFocusFirstItemOnClick: true,
  });
  const { t } = useTranslation();
  const gridRef = useRef<any>();
  const runtime = useRef<Runtime>();
  const annotationTheme = useProjectAnnotationStyles();

  const goHome = () => {
    if (runtime.current) {
      runtime.current.world.goHome();
    }
  };

  const zoomIn = () => {
    if (runtime.current) {
      runtime.current.world.zoomIn();
    }
  };

  const zoomOut = () => {
    if (runtime.current) {
      runtime.current.world.zoomOut();
    }
  };

  if (!review) {
    return <EmptyState>This task is not yet ready for review.</EmptyState>;
  }
  return (
    <MaximiseWindow>
      {({ toggle, isOpen }) => {
        return (
          <RevisionProviderWithFeatures
            revision={revisionId}
            captureModel={captureModel}
            features={{
              autosave: false,
              autoSelectingRevision: true,
              revisionEditMode: false,
              directEdit: true,
            }}
            slotConfig={{
              editor: { allowEditing: isEditing, deselectRevisionAfterSaving: false, saveOnNavigate: false },
              components: { SubmitButton: DirectEditButton },
            }}
            annotationTheme={annotationTheme}
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
                <div style={{ display: 'flex' }}>
                  <SimpleStatus status={task.status} status_text={task.status_text || ''} />
                  {task.assignee && (
                    <Assignee>
                      {t('assigned to')}:{' '}
                      <HrefLink href={`/users/${extractIdFromUrn(task.assignee.id)}`}>{task.assignee.name}</HrefLink>
                    </Assignee>
                  )}
                </div>
                {review && !wasRejected ? (
                  <ReviewActions>
                    <RejectSubmission
                      userTaskId={task.id}
                      onReject={() => {
                        refetch();
                      }}
                    />

                    <EditorToolbarButton onClick={() => setIsEditing(r => !r)} disabled={isDone}>
                      <EditorToolbarIcon>{isEditing ? <PreviewIcon /> : <EditIcon />}</EditorToolbarIcon>
                      <EditorToolbarLabel>{isEditing ? 'Preview' : 'Edit'}</EditorToolbarLabel>
                    </EditorToolbarButton>

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
              </ReviewActionBar>
              <ReviewPreview>
                <div style={{ width: '40%' }}>
                  <CanvasViewerEditorStyleReset>
                    <EditorSlots.TopLevelEditor />
                  </CanvasViewerEditorStyleReset>
                  <EditorSlots.SubmitButton captureModel={captureModel} />
                </div>
                <div style={{ minWidth: '60%', display: 'flex', flexDirection: 'column' }}>
                  <ReviewDropdownContainer>
                    <Button $link {...buttonProps}>
                      View options
                    </Button>
                    <ReviewDropdownPopup $visible={isDropdownOpen} role="menu">
                      <>
                        <EditorToolbarButton onClick={toggle} style={{ width: '100%' }}>
                          <EditorToolbarIcon>
                            {isOpen ? <FullScreenExitIcon /> : <FullScreenEnterIcon />}
                          </EditorToolbarIcon>
                          <EditorToolbarLabel> Focus mode</EditorToolbarLabel>
                        </EditorToolbarButton>
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
                    </ReviewDropdownPopup>
                  </ReviewDropdownContainer>

                  <CanvasViewerGrid ref={gridRef}>
                    {canvas ? (
                      <EditorContentViewer
                        canvasId={canvas.id}
                        onCreated={rt => {
                          return ((runtime as any).current = rt.runtime);
                        }}
                      />
                    ) : null}
                    {isOpen && (
                      <CanvasViewerControls>
                        <CanvasViewerButton onClick={goHome}>
                          <HomeIcon title={t('atlas__zoom_home', { defaultValue: 'Home' })} />
                        </CanvasViewerButton>
                        <CanvasViewerButton onClick={zoomOut}>
                          <MinusIcon title={t('atlas__zoom_out', { defaultValue: 'Zoom out' })} />
                        </CanvasViewerButton>
                        <CanvasViewerButton onClick={zoomIn}>
                          <PlusIcon title={t('atlas__zoom_in', { defaultValue: 'Zoom in' })} />
                        </CanvasViewerButton>
                      </CanvasViewerControls>
                    )}
                  </CanvasViewerGrid>
                </div>
              </ReviewPreview>
            </ReviewContainer>
          </RevisionProviderWithFeatures>
        );
      }}
    </MaximiseWindow>
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
