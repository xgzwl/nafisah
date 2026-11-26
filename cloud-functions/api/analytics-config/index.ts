/**
 * 前端分析服务的公开配置入口。
 *
 * Browser Key（pk_ 开头的 publishable key）不放进静态 JS 文件，存平台环境变量，
 * 由本端点在运行时读 context.env 返回——这样密钥不入库、不出现在构建产物里。
 * 只返回公开字段，不暴露任何服务端密钥；缺 key 时返回 code:0 + null，前端静默跳过。
 */
type ResponseLike = {
  json(body: unknown, init?: { status?: number; headers?: Record<string, string> }): unknown;
};
type EnvSource = Record<string, string | undefined>;
type ContextLike = { env?: EnvSource };

const response = (globalThis as unknown as { Response: ResponseLike }).Response;

const SDK_URL = 'https://static.1ms.run/entmesh/sdk-js/v0.8.0/entmesh.umd.js';
const ENDPOINT = 'https://collector.entmesh.mliev.com';

export async function onRequestGet(context: ContextLike): Promise<unknown> {
  const writeKey = context.env?.ENTMESH_BROWSER_KEY || '';
  if (!writeKey.startsWith('pk_')) {
    return response.json(
      { code: 0, message: '', data: null },
      { status: 200, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' } },
    );
  }
  return response.json(
    { code: 0, message: '', data: { writeKey, sdkUrl: SDK_URL, endpoint: ENDPOINT } },
    { status: 200, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' } },
  );
}
