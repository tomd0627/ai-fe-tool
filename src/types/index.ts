export interface CssPropertyAnalysis {
  property: string;
  value: string;
  explanation: string;
  isOutdated: boolean;
  modernAlternative?: string;
  modernCode?: string;
}

export interface ExplainResponse {
  properties: CssPropertyAnalysis[];
  summary: string;
}

export type ApiResponse =
  | { ok: true; data: ExplainResponse }
  | { ok: false; error: string; code: 'INVALID_INPUT' | 'RATE_LIMITED' | 'API_ERROR' | 'PARSE_ERROR' };
