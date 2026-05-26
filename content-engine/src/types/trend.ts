export type EditorialMoat = 'data' | 'workflows' | 'orchestration' | 'operating-standard';
export type AuthorLane = 'capital' | 'ai' | 'regulation' | 'proptech' | 'tenant' | 'strategy' | 'tech';

export interface TrendSource {
  title: string;
  url?: string;
  sender: string;
  quote?: string;
}

export interface DetectedTrend {
  title: string;
  lane: AuthorLane;
  supportingSourceIds: string[];
  ownerImplication: string;
  fallbackMode: boolean;
}

export interface TrendDetectionResult {
  billTrend: DetectedTrend;
  drewTrend: DetectedTrend;
  alternatives: Array<{
    title: string;
    lane: string;
    reasonSetAside: string;
  }>;
}
