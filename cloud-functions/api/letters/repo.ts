import { getStore as sdkGetStore, type Store } from '@edgeone/pages-blob';
import type { LetterRecord, RateWindow } from './types.js';

// SDK 0.0.14 的 StoreOptions 声明把仅外置模式需要的 projectId/token 写成必填，
// 而官方运行时文档明确支持 { name, consistency }。此处只修正编译期类型，
// 运行时调用保持对象形式 + strong，不做任何降级。
type StrongStoreFactory = (options: { name: string; consistency: 'strong' }) => Store;
const getStore = sdkGetStore as unknown as StrongStoreFactory;

const letters = getStore({ name: 'nafisah-letters', consistency: 'strong' });
const limits = getStore({ name: 'nafisah-ratelimit', consistency: 'strong' });

export function letterKey(id: string): string {
  return `letters/${id}.json`;
}

export function hourKey(hash: string): string {
  return `letters/${hash}-hour.json`;
}

export function dayKey(hash: string): string {
  return `letters/${hash}-day.json`;
}

export async function putLetter(record: LetterRecord): Promise<void> {
  await letters.setJSON(letterKey(record.id), record);
}

export async function listLetterKeys(): Promise<string[]> {
  const { blobs = [] } = await letters.list({ prefix: 'letters/' });
  return blobs.map((blob) => blob.key);
}

export async function getLetterByKey(key: string): Promise<LetterRecord | null> {
  const value = await letters.get(key, { type: 'json' });
  return (value ?? null) as unknown as LetterRecord | null;
}

export async function getLetter(id: string): Promise<LetterRecord | null> {
  return getLetterByKey(letterKey(id));
}

export async function deleteLetter(id: string): Promise<void> {
  await letters.delete(letterKey(id));
}

export async function readWindow(key: string): Promise<RateWindow | null> {
  const value = await limits.get(key, { type: 'json' });
  return (value ?? null) as unknown as RateWindow | null;
}

export async function writeWindow(key: string, value: RateWindow): Promise<void> {
  await limits.setJSON(key, value);
}
