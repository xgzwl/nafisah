/**
 * Gateway environment resolution for the no-framework direct-fetch path.
 * Internal module: takes `env` as a parameter, never reads global env.
 * Two key names exist across Makers docs; both are accepted. A missing key
 * is a hard error — no silent fallback to a fake or empty credential.
 */

const DEFAULT_BASE_URL = 'https://ai-gateway.edgeone.link';
const DEFAULT_MODEL = '@makers/deepseek-v4-flash';

export interface GatewayEnv {
  apiKey: string;
  baseUrl: string; // no trailing slash; caller appends '/v1/chat/completions'
  model: string;
}

export function resolveGatewayEnv(env: Record<string, string | undefined> | undefined): GatewayEnv {
  const source = env ?? {};

  const apiKey = (source.AI_GATEWAY_API_KEY || source.MAKERS_MODELS_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Missing gateway API key (AI_GATEWAY_API_KEY / MAKERS_MODELS_KEY)');
  }

  const configuredBase = (source.AI_GATEWAY_BASE_URL || '').trim();
  const baseUrl = (configuredBase || DEFAULT_BASE_URL).replace(/\/+$/, '');

  const configuredModel = (source.AI_GATEWAY_MODEL || '').trim();
  const model = configuredModel || DEFAULT_MODEL;

  return { apiKey, baseUrl, model };
}
