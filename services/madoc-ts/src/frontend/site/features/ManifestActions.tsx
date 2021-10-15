import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { blockEditorFor } from '../../../extensions/page-blocks/block-editor-react';
import { Button, ButtonRow } from '../../shared/navigation/Button';
import { IIIFDragIcon } from '../../shared/components/IIIFDragIcon';
import { HrefLink } from '../../shared/utility/href-link';
import { useManifestPageConfiguration } from '../hooks/use-manifest-page-configuration';
import { useManifestTask } from '../hooks/use-manifest-task';
import { useProjectStatus } from '../hooks/use-project-status';
import { useRelativeLinks } from '../hooks/use-relative-links';
import { AssignManifestToUser } from './AssignManifestToUser';
import { GoToFirstCanvas } from './GoToFirstCanvas';
import { GoToRandomCanvas } from './GoToRandomCanvas';
import { ManifestItemFilter } from './ManifestItemFilter';
import { ManifestTaskProgress } from './ManifestTaskProgress';
import { usePreventCanvasNavigation } from './PreventUsersNavigatingCanvases';
import { useSiteConfiguration } from './SiteConfigurationContext';

export const ManifestActions: React.FC = () => {
  const { t } = useTranslation();
  const createLink = useRelativeLinks();
  const options = useManifestPageConfiguration();
  const { showNavigationContent } = usePreventCanvasNavigation();
  const { isActive, isPreparing } = useProjectStatus();
  const {
    project: { claimGranularity, manifestPageOptions },
  } = useSiteConfiguration();
  const {
    isManifestComplete,
    userManifestTask,
    canClaimManifest,
    filteredTasks,
    isManifestInProgress,
  } = useManifestTask();
  const { done, inReview } = filteredTasks;

  const showButton =
    isActive &&
    !options.hideStartContributing &&
    !isManifestComplete &&
    (userManifestTask || canClaimManifest) &&
    !inReview.length &&
    !isManifestInProgress;

  const showIIIFLogo = manifestPageOptions?.showIIIFLogo;

  if (!showNavigationContent) {
    return null;
  }

  return (
    <>
      {showButton ? (
        <ButtonRow>
          {claimGranularity === 'manifest' ? (
            <GoToFirstCanvas $primary $large navigateToModel>
              {userManifestTask && done.length ? t('View submission') : t('Start contributing')}
            </GoToFirstCanvas>
          ) : (
            <GoToRandomCanvas $primary $large label={{ none: [t('Start contributing')] }} navigateToModel />
          )}
        </ButtonRow>
      ) : null}
      <ButtonRow>
        {showIIIFLogo ? <IIIFDragIcon /> : null}
        {!options.hideOpenInMirador ? (
          <Button
            as={HrefLink}
            href={createLink({
              subRoute: 'mirador',
            })}
          >
            {t('Open in mirador')}
          </Button>
        ) : null}

        {!options.hideSearchButton ? (
          <Button as={Link} to={createLink({ subRoute: 'search' })}>
            {t('Search this manifest')}
          </Button>
        ) : null}
        {!options.hideRandomCanvas ? <GoToRandomCanvas /> : null}
        {(isActive || isPreparing) && !options.hideFilterImages ? <ManifestItemFilter /> : null}
        <ManifestTaskProgress />
        <AssignManifestToUser />
      </ButtonRow>
    </>
  );
};

blockEditorFor(ManifestActions, {
  type: 'default.ManifestActions',
  label: 'Manifest actions',
  anyContext: ['manifest'],
  requiredContext: ['manifest'],
  editor: {},
});
