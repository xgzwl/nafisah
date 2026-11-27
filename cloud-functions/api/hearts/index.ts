/**
 * 爱心计数端点：把"为他点亮一颗心"的次数存到 Blob，全局累计。
 * - GET  读当前计数（公开、no-store）
 * - POST 计数 +1（公开；前端做节流，服务端做 read-modify-write）
 *
 * 数据：单个 key `hearts/count.json`，值 { count, version }。
 * 强一致 store 保证写完即读可见；多实例并发 +1 可能丢个别计数，
 * 对私人神龛的温柔计数可接受，不做分布式锁。
 */
import { getStore as sdkGetStore, type Store } from '@edgeone/pages-blob';

// SDK 0.0.14 类型声明把外置模式才需要的 projectId/token 写成必填，
// 运行时文档支持 { name, consistency }——仅修正编译期类型。
type StrongStoreFactory = (options: { name: string; consistency: 'strong' }) => Store;
const getStore = sdkGetStore as unknown as StrongStoreFactory;

const hearts = getStore({ name: 'nafisah-hearts', consistency: 'strong' });
const COUNT_KEY = 'hearts/count.json';
const CACHE_CONTROL = 'no-store';

interface CountRecord {
  count: number;
  version: 1;
}

type ResponseLike = {
  json(body: unknown, init?: { status?: number; headers?: Record<string, string> }): unknown;
};
const response = (globalThis as unknown as { Response: ResponseLike }).Response;

function json(data: unknown, status = 200): unknown {
  return response.json(
    { code: 0, message: '', data },
    { status, headers: { 'Cache-Control': CACHE_CONTROL, 'Content-Type': 'application/json' } },
  );
}
function fail(status: number, code: number, message: string): unknown {
  return response.json(
    { code, message, data: null },
    { status, headers: { 'Cache-Control': CACHE_CONTROL, 'Content-Type': 'application/json' } },
  );
}

async function readRecord(): Promise<CountRecord> {
  const value = await hearts.get(COUNT_KEY, { type: 'json' });
  if (value && typeof (value as CountRecord).count === 'number' && (value as CountRecord).count >= 0) {
    return value as CountRecord;
  }
  return { count: 0, version: 1 };
}

export async function onRequestGet(): Promise<unknown> {
  try {
    const record = await readRecord();
    return json({ count: record.count });
  } catch {
    return fail(500, 50001, 'storage unavailable');
  }
}

export async function onRequestPost(): Promise<unknown> {
  try {
    const record = await readRecord();
    const next: CountRecord = { count: record.count + 1, version: 1 };
    await hearts.setJSON(COUNT_KEY, next);
    return json({ count: next.count });
  } catch {
    return fail(500, 50001, 'storage unavailable');
  }
}
