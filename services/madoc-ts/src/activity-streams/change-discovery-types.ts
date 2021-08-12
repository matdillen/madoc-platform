import { InternationalString, Manifest } from '@hyperion-framework/types';

/**
 * Madoc change discovery implementation.
 *
 * - 1. Genesis - on initial start up, check for existing resources that do not have create events via configured endpoint.
 * - 2. Track creation events - a simple API to post events.
 * - 3. Publish endpoints for tracking those changes.
 */

export type ActivityItemRow = {
  activity_id: number;
  activity_type: string;
  primary_stream: string;
  secondary_string: string | null;
  object_id: string;
  object_type: string;
  object_canonical_id: string;
  start_time: number | null;
  end_time: number;
  site_id: number;
  // A JSON field
  properties: {
    summary: string;
    provider?: Manifest['provider'];
    seeAlso?: ChangeDiscoverySeeAlso[];
    actor?: ChangeDiscoveryActor;
    target?: ChangeDiscoveryBaseObject;
  };
};

export type ActivityOptions = {
  dispatchToSecondaryStreams?: boolean;
  preventAddToPrimaryStream?: boolean;
  preventUpdateToPrimaryStream?: boolean;
  primaryObjectId?: string;
};

export type ChangeDiscoveryActivityRequest = {
  startTime?: string; // xsd:dateTime
  summary?: string;
  actor?: ChangeDiscoveryActor;
  target?: ChangeDiscoveryBaseObject;
  object: ChangeDiscoveryBaseObject;
  madoc?: {
    manifestId: number;
    project: string;
  };
};

export type ChangeDiscoveryActivity = {
  id: string;
  endTime: string; // xsd:dateTime
  startTime?: string; // xsd:dateTime
  summary?: string;
  actor?: ChangeDiscoveryActor;
  target?: ChangeDiscoveryBaseObject;
} & (
  | {
      type: Exclude<ChangeDiscoveryActivityType, 'Move'>;
      object: ChangeDiscoveryBaseObject;
    }
  | {
      type: 'Move';
      object: ChangeDiscoveryBaseObject;
      target: ChangeDiscoveryBaseObject;
    }
);

export type ChangeDiscoveryBaseObject = {
  id: string;
  canonical?: string;
  name?: string; // Non-standard.
  type: 'Collection' | 'Manifest' | 'Canvas'; // Technically also: Range, Canvas etc.
  seeAlso?: ChangeDiscoverySeeAlso[];
  provider?: Manifest['provider'];
};

type ChangeDiscoveryActor = {
  id: string;
  type: 'Person' | 'Application' | 'Organization';
};

export type ChangeDiscoveryActivityType = 'Create' | 'Update' | 'Delete' | 'Move' | 'Add' | 'Remove';

export type ChangeDiscoverySeeAlso = {
  id: string;
  type: 'Dataset';
  format: string;
  label: InternationalString;
  profile: string;
};

export type ActivityOrderedCollection = {
  '@context': 'http://iiif.io/api/discovery/1/context.json' | string[];
  id: string;
  type: 'OrderedCollection';
  first?: {
    id: string;
    type: 'OrderedCollectionPage';
  };
  last: {
    id: string;
    type: 'OrderedCollectionPage';
  };
  totalItems?: number;
  seeAlso?: ChangeDiscoverySeeAlso[];
  partOf?: Array<{
    id: string;
    type: 'OrderedCollection';
  }>;
  rights: string;
  // Non-standard
  totalPages?: number;
};

export type ActivityOrderedCollectionPage = {
  '@context': 'http://iiif.io/api/discovery/1/context.json' | string[];
  id: string;
  type: 'OrderedCollectionPage';
  partOf?: {
    id: string;
    type: 'OrderedCollection';
  };
  startIndex?: number;
  next?: {
    id: string;
    type: 'OrderedCollectionPage';
  };
  prev?: {
    id: string;
    type: 'OrderedCollectionPage';
  };
  orderedItems: ChangeDiscoveryActivity[];
};
