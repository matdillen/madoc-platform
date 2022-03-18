import { i18n } from 'i18next';
import { makeQueryCache, ReactQueryCacheProvider, ReactQueryConfig, ReactQueryConfigProvider } from 'react-query';
import { dehydrate, Hydrate } from 'react-query/hydration';
import { ServerStyleSheet, ThemeProvider } from 'styled-components';
import { CurrentUserWithScope, SystemConfig, Site } from '../../../extensions/site-manager/types';
import { ApiClient } from '../../../gateway/api';
import { StaticRouterContext } from 'react-router';
import { parse } from 'query-string';
import { api } from '../../../gateway/api.server';
import { ListLocalisationsResponse } from '../../../routes/admin/localisation';
import { GetSlots } from '../../../types/get-slots';
import { BlockCollector } from '../../../types/block-collector';
import { SitePlugin } from '../../../types/schemas/plugins';
import { EditorialContext } from '../../../types/schemas/site-page';
import { ResolvedTheme } from '../../../types/themes';
import { ReactServerError } from '../../../utility/errors/react-server-error';
import { PageLoader } from '../../site/pages/loaders/page-loader';
import { defaultTheme } from '../capture-models/editor/themes';
import { PluginManager } from '../plugins/plugin-manager';
import { queryConfig } from './query-config';
import { matchUniversalRoutes } from './server-utils';
import { renderToString } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { StaticRouter } from 'react-router-dom';
import React from 'react';
import { CreateRouteType, UniversalRoute } from '../../types';
import { Helmet } from 'react-helmet';
import localeCodes from 'locale-codes';
import '../required-modules';

function makeRoutes(routeComponents: any) {
  return [
    {
      ...routeComponents.baseRoute,
      routes: [...routeComponents.routes, routeComponents.fallback],
    },
  ];
}

export function createServerRenderer(
  RootApplication: React.FC<{
    api: ApiClient;
    routes: UniversalRoute[];
    site: Site;
    user?: CurrentUserWithScope;
    systemConfig: SystemConfig;
    supportedLocales: Array<{ label: string; code: string }>;
    contentLanguages: Array<{ label: string; code: string }>;
    displayLanguages: Array<{ label: string; code: string }>;
    defaultLocale: string;
    navigationOptions?: any;
    theme?: ResolvedTheme | null;
    themeOverrides?: any;
    formResponse?: any;
  }>,
  createRoutes: ((c: any) => CreateRouteType) | UniversalRoute[],
  components: any,
  apiGateway: string,
  extraConfig: Partial<ReactQueryConfig> = {}
) {
  const defaultRoutes = Array.isArray(createRoutes) ? createRoutes : makeRoutes(createRoutes(components));

  return async function render({
    url,
    basename,
    jwt,
    i18next,
    siteSlug,
    site: sitePromise,
    siteLocales,
    user,
    navigationOptions,
    getSlots,
    pluginManager,
    plugins,
    theme,
    reactFormResponse,
    systemConfig,
  }: {
    url: string;
    basename: string;
    jwt: string;
    i18next: i18n;
    siteSlug?: string;
    site?: Site | Promise<Site | undefined>;
    user?: CurrentUserWithScope;
    siteLocales: ListLocalisationsResponse;
    theme?: ResolvedTheme | null;
    navigationOptions?: {
      enableProjects: boolean;
      enableCollections: boolean;
    };
    getSlots?: GetSlots;
    pluginManager?: PluginManager;
    plugins?: SitePlugin[];
    reactFormResponse?: any;
    systemConfig: SystemConfig;
  }) {
    const prefetchCache = makeQueryCache();
    const sheet = new ServerStyleSheet(); // <-- creating out stylesheet
    const userApi = new ApiClient({
      gateway: apiGateway,
      jwt,
      publicSiteSlug: siteSlug,
    });
    const site = await sitePromise;
    const routes =
      Array.isArray(createRoutes) || !pluginManager || !site
        ? defaultRoutes
        : pluginManager.makeRoutes(createRoutes(pluginManager.hookComponents(components, site.id)), site.id);

    const context: StaticRouterContext = {};
    const [urlPath, urlQuery] = url.split('?');
    const path = urlPath.slice(urlPath.indexOf(basename) + basename.length);
    const queryString = urlQuery ? parse(urlQuery) : {};
    const matches = matchUniversalRoutes(routes, path);
    const blockCollector: BlockCollector = { blocks: [] };
    const requests = [];
    const routeContext: EditorialContext = {};
    const themeOverrides: any = {};
    let projectApplied = false;
    for (const { match, route } of matches) {
      if (match.isExact && match.params) {
        // Extract project.
        routeContext.collection = match.params.collectionId ? Number(match.params.collectionId) : undefined;
        routeContext.manifest = match.params.manifestId ? Number(match.params.manifestId) : undefined;
        routeContext.canvas = match.params.canvasId ? Number(match.params.canvasId) : undefined;
        routeContext.project = match.params.slug ? match.params.slug : undefined;
      }
      if (route.component.getKey && route.component.getData) {
        requests.push(
          prefetchCache.prefetchQuery(route.component.getKey(match.params, queryString, path), (key, vars) => {
            const data = route.component.getData
              ? route.component.getData(key, vars, userApi, path)
              : (undefined as any);

            // Hook for page loader.
            if (route.component === PageLoader) {
              data.then((resp: any) => {
                if (resp && resp.page && resp.page.slots) {
                  for (const slotId of Object.keys(resp.page.slots)) {
                    const slot = resp.page.slots[slotId];
                    if (slot && slot.blocks) {
                      blockCollector.blocks.push(...slot.blocks);
                    }
                  }
                }

                return resp;
              });
            }

            // Hack for server-side theme from template.
            if (!projectApplied && key === 'getSiteProject' && site) {
              data.then((resp: any) => {
                try {
                  if (resp?.template) {
                    const definition = api.projectTemplates.getDefinition(resp?.template, site.id);
                    if (definition?.theme) {
                      themeOverrides[`project-template(${definition.type})`] = definition.theme;
                    }
                    projectApplied = true;
                  }
                } catch (e) {
                  // no-op.
                }
              });
            }
            return data;
          })
        );
      }
      const hooks = route.component.hooks || [];
      for (const hook of hooks) {
        const args = hook.creator(match.params, queryString);
        if (typeof args !== 'undefined') {
          requests.push(prefetchCache.prefetchQuery([hook.name, args], () => (userApi as any)[hook.name](...args)));
        }
      }

      const customTheme = route.component.theme;
      if (customTheme && customTheme.name) {
        themeOverrides[customTheme.name] = customTheme;
      }
    }

    if (getSlots) {
      const slotRequest = prefetchCache.prefetchQuery(['slot-request', routeContext], () =>
        getSlots(routeContext, { collector: blockCollector })
      );
      const headerSlotRequest = prefetchCache.prefetchQuery(['slot-request', { slotIds: ['global-header'] }], () =>
        getSlots({ slotIds: ['global-header'] }, { collector: blockCollector })
      );

      requests.push(slotRequest);
      requests.push(headerSlotRequest);

      await headerSlotRequest;
      await slotRequest;

      if (site) {
        const processedWithHooks = [];
        for (const block of blockCollector.blocks) {
          const definition = userApi.pageBlocks.getDefinition(block.type, site.id);
          if (
            processedWithHooks.indexOf(block.id) === -1 &&
            definition &&
            definition.hooks &&
            definition.hooks.length
          ) {
            for (const hook of definition.hooks) {
              processedWithHooks.push(block.id);
              const args = hook.creator(block.static_data);
              if (typeof args !== 'undefined') {
                console.log('prefetching..', [hook.name, args]);
                requests.push(
                  prefetchCache.prefetchQuery([hook.name, args], () => (userApi as any)[hook.name](...args))
                );
              }
            }
          }
        }
      }
    }

    await Promise.all(requests);

    const dehydratedState = dehydrate(prefetchCache);
    const mapLocalCodes = (ln: string) => {
      const label = localeCodes.getByTag(ln).name;
      return { label: label, code: ln };
    };
    const supportedLocales = siteLocales.localisations.map(ln => {
      return mapLocalCodes(ln.code);
    });
    const displayLanguages = (siteLocales.displayLanguages || []).map(mapLocalCodes);
    const contentLanguages = (siteLocales.contentLanguages || []).map(mapLocalCodes);

    if (matches.length === 0) {
      return {
        type: 'redirect',
        status: 404,
      };
    }

    const state = {
      markup: '',
    };

    const resolvedSystemConfig = {
      ...(systemConfig || {}),
      ...(site?.config || {}),
    };

    try {
      state.markup = renderToString(
        sheet.collectStyles(
          <ReactQueryConfigProvider config={{ ...extraConfig, ...queryConfig }}>
            <ReactQueryCacheProvider>
              <Hydrate state={dehydratedState}>
                <I18nextProvider i18n={i18next}>
                  <StaticRouter basename={basename} location={url} context={context}>
                    <ThemeProvider theme={defaultTheme}>
                      <RootApplication
                        api={api}
                        routes={routes}
                        theme={theme}
                        site={site as any}
                        user={user}
                        defaultLocale={siteLocales.defaultLanguage || 'en'}
                        contentLanguages={contentLanguages}
                        displayLanguages={displayLanguages}
                        supportedLocales={supportedLocales}
                        themeOverrides={themeOverrides}
                        navigationOptions={navigationOptions}
                        formResponse={reactFormResponse}
                        systemConfig={resolvedSystemConfig}
                      />
                    </ThemeProvider>
                  </StaticRouter>
                </I18nextProvider>
              </Hydrate>
            </ReactQueryCacheProvider>
          </ReactQueryConfigProvider>
        )
      );
    } catch (e) {
      throw new ReactServerError(e);
    }

    const helmet = Helmet.renderStatic();

    if (context.url) {
      return {
        type: 'redirect',
        status: context.statusCode,
        to: context.url,
      };
    }

    const styles = sheet.getStyleTags(); // <-- getting all the tags from the sheet

    // sheet.seal();

    const routeData = `
      <script type="application/json" id="react-site-data">${JSON.stringify(
        {
          site: site,
          user,
          locales: supportedLocales,
          defaultLocale: siteLocales.defaultLanguage || 'en',
          navigationOptions: navigationOptions,
          contentLanguages,
          displayLanguages,
          plugins,
          theme,
          themeOverrides,
          reactFormResponse,
          systemConfig: resolvedSystemConfig,
        },
        null,
        process.env.NODE_ENV === 'production' ? undefined : 2
      )}</script>
      <script type="application/json" id="react-query-cache">${JSON.stringify(
        dehydratedState,
        null,
        process.env.NODE_ENV === 'production' ? undefined : 2
      )}</script>
    `;

    if (process.env.NODE_ENV === 'production') {
      return {
        type: 'document',
        html: `<!doctype html>
<html ${helmet.htmlAttributes.toString()}>
    <head>
        ${helmet.title.toString()}
        ${helmet.meta.toString()}
        ${helmet.link.toString()}
        ${styles}
    </head>
    <body ${helmet.bodyAttributes.toString()}>
        <div id="react-component">${state.markup}</div>
        
        
        <script crossorigin src="https://cdn.jsdelivr.net/npm/whatwg-fetch@3.0.0/dist/fetch.umd.js"></script>
        <script crossorigin src="https://cdn.jsdelivr.net/npm/react@16.13.1/umd/react.production.min.js"></script>
        <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@16.13.1/umd/react-dom.production.min.js"></script>
        <script type="application/json" id="react-data">${JSON.stringify({ basename })}</script>
        ${routeData}
    </body>
</html>`,
      };
    }

    return {
      type: 'document',
      html: `<!doctype html>
<html ${helmet.htmlAttributes.toString()}>
    <head>
        ${helmet.title.toString()}
        ${helmet.meta.toString()}
        ${helmet.link.toString()}
        ${styles}
    </head>
    <body ${helmet.bodyAttributes.toString()}>
        <div id="react-component">${state.markup}</div>

        <script crossorigin src="https://cdn.jsdelivr.net/npm/whatwg-fetch@3.0.0/dist/fetch.umd.js"></script>
        <script crossorigin src="https://cdn.jsdelivr.net/npm/react@16.13.1/umd/react.development.js"></script>
        <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@16.13.1/umd/react-dom.development.js"></script>
        <script type="application/json" id="react-data">${JSON.stringify({ basename })}</script>
        ${routeData}
    </body>
</html>`,
    };
  };
}
