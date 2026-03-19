import Anthropic from '@anthropic-ai/sdk';
import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import type { ApiResponse, ExplainResponse } from '../../src/types/index.js';

const MAX_INPUT_LENGTH = 5000;

function sanitizeCss(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/url\s*\(\s*['"]?\s*javascript/gi, '');
}

function isLikelyCss(input: string): boolean {
  const cssIndicators = [
    /[{};]/,
    /:\s*[^:]+;/,
    /^\s*[\w-]+\s*[{:]/m,
  ];
  return cssIndicators.some((re) => re.test(input));
}

const SYSTEM_PROMPT = `You are a CSS expert. Analyze CSS snippets and return ONLY valid JSON — no markdown, no code fences, no explanation outside the JSON structure.

The JSON must match this exact shape:
{
  "properties": [
    {
      "property": "string — the CSS property name",
      "value": "string — the value as written",
      "explanation": "string — plain English explanation, 1–3 sentences, accessible to a junior dev",
      "isOutdated": boolean,
      "modernAlternative": "string — only if isOutdated is true",
      "modernCode": "string — only if isOutdated is true, e.g. 'display: flex;'"
    }
  ],
  "summary": "string — 1–2 sentence overall assessment of the CSS snippet"
}

Rules for isOutdated:
- true for: float-based layouts, clearfix hacks, vendor prefixes that have modern equivalents (-webkit-border-radius, -moz-border-radius, -ms-flex, etc.), IE-era hacks (*zoom, _height), table-display layout hacks, font-size in px for accessibility-critical text, position:absolute grid-like layouts, display:table-cell layouts
- false for: modern properties, valid vendor prefixes still needed (e.g. -webkit-appearance in some cases), intentional use of older syntax

Only include each unique property–value pair once. If the snippet has no valid CSS properties, return { "properties": [], "summary": "No valid CSS properties found." }`;

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    const body: ApiResponse = { ok: false, error: 'Method not allowed', code: 'API_ERROR' };
    return { statusCode: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  }

  let cssInput: string;
  try {
    const parsed = JSON.parse(event.body ?? '{}') as { css?: unknown };
    if (typeof parsed.css !== 'string' || parsed.css.trim().length === 0) {
      const body: ApiResponse = { ok: false, error: 'Please paste some CSS to analyze.', code: 'INVALID_INPUT' };
      return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
    }
    cssInput = parsed.css.trim();
  } catch {
    const body: ApiResponse = { ok: false, error: 'Invalid request body.', code: 'INVALID_INPUT' };
    return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  }

  if (cssInput.length > MAX_INPUT_LENGTH) {
    const body: ApiResponse = {
      ok: false,
      error: `Input too long. Maximum ${MAX_INPUT_LENGTH} characters allowed.`,
      code: 'INVALID_INPUT',
    };
    return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  }

  const sanitized = sanitizeCss(cssInput);

  if (!isLikelyCss(sanitized)) {
    const body: ApiResponse = { ok: false, error: 'Input does not appear to be CSS. Please paste valid CSS properties.', code: 'INVALID_INPUT' };
    return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  }

  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    const body: ApiResponse = { ok: false, error: 'Service configuration error.', code: 'API_ERROR' };
    return { statusCode: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this CSS snippet:\n\n\`\`\`css\n${sanitized}\n\`\`\``,
        },
      ],
    });

    const rawText = message.content[0]?.type === 'text' ? message.content[0].text : '';

    const cleanedText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      const body: ApiResponse = { ok: false, error: 'Failed to parse AI response. Please try again.', code: 'PARSE_ERROR' };
      return { statusCode: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray((parsed as ExplainResponse).properties) ||
      typeof (parsed as ExplainResponse).summary !== 'string'
    ) {
      const body: ApiResponse = { ok: false, error: 'Unexpected response shape from AI. Please try again.', code: 'PARSE_ERROR' };
      return { statusCode: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
    }

    const data = parsed as ExplainResponse;
    const body: ApiResponse = { ok: true, data };
    return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  } catch (err) {
    console.error('Anthropic API error:', err);
    const isRateLimit = err instanceof Anthropic.RateLimitError;
    const body: ApiResponse = {
      ok: false,
      error: isRateLimit ? 'Rate limit reached. Please wait a moment and try again.' : 'An error occurred while analyzing your CSS.',
      code: isRateLimit ? 'RATE_LIMITED' : 'API_ERROR',
    };
    return {
      statusCode: isRateLimit ? 429 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    };
  }
};
