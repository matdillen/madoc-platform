import React, { ReactNode, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import { EditorialContext } from '../../../types/schemas/site-page';
import { useSiteConfiguration } from '../../site/features/SiteConfigurationContext';
import { useApi } from '../hooks/use-api';
import { SlotProvider } from './slot-context';

export const AutoSlotLoader: React.FC<{ fuzzy?: boolean; slots?: string[]; children: ReactNode }> = ({
  children,
  slots,
  fuzzy,
}) => {
  const params = useParams();
  // @todo fix when this should be false.
  // const isExact = useOutlet() === null;
  const routeMatch = { isExact: true, params };

  const api = useApi();
  const { editMode } = useSiteConfiguration();

  const parsedContext = useMemo(() => {
    const routeContext: EditorialContext = {};

    if (!fuzzy) {
      routeContext.collection = routeMatch.params.collectionId ? Number(routeMatch.params.collectionId) : undefined;
      routeContext.manifest = routeMatch.params.manifestId ? Number(routeMatch.params.manifestId) : undefined;
      routeContext.canvas = routeMatch.params.canvasId ? Number(routeMatch.params.canvasId) : undefined;
      routeContext.project = routeMatch.params.slug ? routeMatch.params.slug : undefined;
    }
    routeContext.slotIds = slots && slots.length ? slots : undefined;

    return routeContext;
  }, [
    fuzzy,
    slots,
    routeMatch.params.canvasId,
    routeMatch.params.collectionId,
    routeMatch.params.manifestId,
    routeMatch.params.slug,
  ]);

  const { data, refetch } = useQuery(
    ['slot-request', parsedContext],
    async () => {
      return api.pageBlocks.requestSlots(parsedContext);
    },
    { enabled: routeMatch.isExact || fuzzy, keepPreviousData: true }
  );

  const invalidateSlots = async () => {
    await refetch();
  };

  if (!routeMatch.isExact && !fuzzy) {
    return children as any;
  }

  // Now to resolve the slots.
  return (
    <SlotProvider
      onCreateSlot={invalidateSlots}
      onUpdateSlot={invalidateSlots}
      onUpdateBlock={invalidateSlots}
      invalidateSlots={invalidateSlots}
      editable={editMode}
      slots={data}
      context={parsedContext}
    >
      {children}
    </SlotProvider>
  );
};
