import { stringify } from 'query-string';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Redirect, useHistory, useLocation } from 'react-router-dom';
import ReactTimeago from 'react-timeago';
import { siteManagerHooks } from '../../../../extensions/site-manager/hooks';
import { SystemCallToAction } from '../../../shared/components/SystemCallToAction';
import { SystemOrderBy } from '../../../shared/components/SystemOrderBy';
import { useLocationQuery } from '../../../shared/hooks/use-location-query';
import { Button } from '../../../shared/navigation/Button';
import { Statistic, StatisticContainer, StatisticLabel, StatisticNumber } from '../../../shared/atoms/Statistics';
import { SystemListItem } from '../../../shared/atoms/SystemListItem';
import {
  SystemActions,
  SystemBackground,
  SystemDescription,
  SystemMetadata,
  SystemName,
  SystemVersion,
} from '../../../shared/atoms/SystemUI';
import { useSite, useUser } from '../../../shared/hooks/use-site';
import { AdminHeader } from '../../molecules/AdminHeader';

export const ListSites: React.FC = () => {
  const { t } = useTranslation();
  const user = useUser();
  const currentSite = useSite();
  const query = useLocationQuery();
  const { data } = siteManagerHooks.getAllSites(() => [{ desc: query.desc, order_by: query.order_by }], {
    keepPreviousData: true,
  });
  const { push } = useHistory();
  const location = useLocation();

  const search = (query?.search || '').toLowerCase();

  const filteredSites = useMemo(() => {
    if (!data?.sites) {
      return [];
    }
    if (!search) {
      return data.sites;
    }
    return data.sites.filter(site => {
      return (
        site.title.toLowerCase().indexOf(search) !== -1 ||
        (site.summary || '').toLowerCase().indexOf(search) !== -1 ||
        site.slug.toLowerCase().indexOf(search) !== -1
      );
    });
  }, [search, data]);

  if (user?.role !== 'global_admin') {
    return <Redirect to={'/'} />;
  }

  return (
    <>
      <AdminHeader
        title={t('Sites')}
        breadcrumbs={[
          { label: 'Site admin', link: '/' },
          { label: 'Sites', link: '/global/sites', active: true },
        ]}
        noMargin
      />
      <SystemBackground>
        <SystemCallToAction
          title={'Create a new site'}
          href={`/global/sites/create`}
          description="Create a new space"
          maxWidth
        />

        <SystemOrderBy
          liveSearch
          initialSearch={search}
          initialValue={query.order_by}
          initialDesc={query.desc}
          maxWidth
          items={['title', 'slug', 'modified', 'created']}
          onSearch={q => {
            push(
              `${location.pathname}${
                q || query.order_by
                  ? `?${stringify({ order_by: query.order_by, desc: query.desc ? 'true' : undefined, search: q })}`
                  : ''
              }`
            );
          }}
          onChange={opt => {
            push(
              `${location.pathname}${
                opt.value
                  ? `?${stringify({
                      order_by: opt.value,
                      desc: opt.desc ? 'true' : undefined,
                      search: search || undefined,
                    })}`
                  : ''
              }`
            );
          }}
        />

        {filteredSites.map(site => {
          const stats = {
            canvas: 0,
            projects: 0,
            manifest: 0,
            collection: 0,
            ...(data?.siteStats[site.id] || {}),
          };

          return (
            <SystemListItem key={site.id} $enabled={site.slug === currentSite.slug}>
              <SystemMetadata>
                <SystemName>{site.title}</SystemName>
                <SystemDescription>{site.summary}</SystemDescription>
                <SystemDescription>
                  <StatisticContainer style={{ fontSize: '0.75em' }}>
                    <Statistic style={{ padding: '4px' }}>
                      <StatisticNumber>{stats.collection}</StatisticNumber>
                      <StatisticLabel style={{ fontSize: '1.1em' }}>Collections</StatisticLabel>
                    </Statistic>
                    <Statistic style={{ padding: '4px' }}>
                      <StatisticNumber>{stats.manifest}</StatisticNumber>
                      <StatisticLabel style={{ fontSize: '1.1em' }}>Manifests</StatisticLabel>
                    </Statistic>
                    <Statistic style={{ padding: '4px' }}>
                      <StatisticNumber>{stats.canvas}</StatisticNumber>
                      <StatisticLabel style={{ fontSize: '1.1em' }}>Canvases</StatisticLabel>
                    </Statistic>
                    <Statistic style={{ padding: '4px' }}>
                      <StatisticNumber>{stats.projects}</StatisticNumber>
                      <StatisticLabel style={{ fontSize: '1.1em' }}>Projects</StatisticLabel>
                    </Statistic>
                  </StatisticContainer>
                </SystemDescription>
                <SystemVersion>
                  Created <ReactTimeago date={site.created} />
                </SystemVersion>
              </SystemMetadata>
              <SystemActions>
                <Button
                  as="a"
                  $disabled={site.slug === currentSite.slug}
                  $primary
                  href={`/s/${currentSite.slug}/login/refresh?redirect=/s/${site.slug}/admin`}
                >
                  {t('Go to site')}
                </Button>
              </SystemActions>
            </SystemListItem>
          );
        })}
      </SystemBackground>
    </>
  );
};
