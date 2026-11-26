export async function onRequest(context: any): Promise<unknown> {
  return new Response(JSON.stringify({ code: 0, message: '', data: { route: 'apiprobe-ok' } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
