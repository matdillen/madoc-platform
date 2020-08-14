import React, { useMemo } from 'react';
import { useContentType } from '@capture-models/plugin-api';
import { Target } from '@capture-models/types';

export const ViewContent: React.FC<{ target: Target[]; canvas: any }> = ({ target, canvas }) => {
  console.log('view content');
  return useContentType(
    useMemo(() => {
      const fixedType = [];
      const collectionType = target.find(item => item && item.type.toLowerCase() === 'collection');
      const manifestType = target.find(item => item && item.type.toLowerCase() === 'manifest');
      const canvasType = target.find(item => item && item.type.toLowerCase() === 'canvas');

      if (collectionType) {
        fixedType.push({ type: 'Collection', id: collectionType.id });
      }
      if (manifestType) {
        fixedType.push({ type: 'Manifest', id: manifestType.id });
      }
      if (canvasType) {
        fixedType.push({ type: 'Canvas', id: canvasType.id });
      }

      console.log({ fixedType, target });

      return fixedType;
    }, [target]),
    useMemo(
      () => ({
        height: 600,
        custom: {
          customFetcher: (mid: string) => {
            const canvasTarget: any = target.find((r: any) => r.type === 'Canvas');
            return {
              '@context': 'http://iiif.io/api/presentation/2/context.json',
              '@id': `${mid}`,
              '@type': 'sc:Manifest',
              sequences: [
                {
                  '@id': `${mid}/s1`,
                  '@type': 'sc:Sequence',
                  canvases: [{ ...canvas.source, '@id': `${canvasTarget.id}` }],
                },
              ],
            };
          },
        },
      }),
      [canvas.source, target]
    )
  );
};
