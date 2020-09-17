import React, { useMemo } from 'react';
import { ApiArgs, apiHooks } from '../../../shared/hooks/use-api-query';
import { renderUniversalRoutes } from '../../../shared/utility/server-utils';
import { UniversalComponent } from '../../../types';
import { createUniversalComponent } from '../../../shared/utility/create-universal-component';
import { CollectionFull } from '../../../../types/schemas/collection-full';
import { usePaginatedData } from '../../../shared/hooks/use-data';
import { BreadcrumbContext } from '../../../shared/components/Breadcrumbs';
import { ManifestFull } from '../../../../types/schemas/manifest-full';
import { useParams } from 'react-router-dom';

type ManifestLoaderType = {
  params: { id: string; collectionId?: string; slug?: string };
  query: { m: string; filter: string };
  variables: ApiArgs<'getSiteManifest'>;
  data: ManifestFull;
  context: { collection: CollectionFull['collection'] };
};

export const ManifestLoader: UniversalComponent<ManifestLoaderType> = createUniversalComponent<ManifestLoaderType>(
  ({ route, collection, ...props }) => {
    const { id, slug } = useParams();
    const { resolvedData: data, refetch: refetchManifest } = usePaginatedData(ManifestLoader, [], {
      cacheTime: 3600,
    });

    const { data: projectTasks, refetch: refetchManifestTasks } = apiHooks.getSiteProjectManifestTasks(
      () => (slug ? [slug, Number(id)] : undefined),
      {
        refetchOnMount: true,
      }
    );

    const ctx = useMemo(() => (data ? { id: data.manifest.id, name: data.manifest.label } : undefined), [data]);

    return (
      <BreadcrumbContext manifest={ctx}>
        {renderUniversalRoutes(route.routes, {
          ...props,
          manifest: data?.manifest,
          pagination: data?.pagination,
          collection,
          manifestSubjects: data?.subjects,
          manifestTask: projectTasks?.manifestTask,
          manifestUserTasks: projectTasks?.userTasks,
          canUserSubmit: projectTasks?.canUserSubmit,
          refetchManifestTasks,
          refetchManifest,
        })}
      </BreadcrumbContext>
    );
  },
  {
    getKey: (params, query) => {
      return [
        'getSiteManifest',
        [
          Number(params.id),
          {
            page: Number(query.m) || 0,
            project_id: params.slug,
            hide_status: query.filter,
          },
        ],
      ];
    },
    getData: async (key, vars, api) => {
      return api.getSiteManifest(...vars);
    },
  }
);
