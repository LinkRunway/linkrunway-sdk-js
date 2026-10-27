import { afterEach, expect, it, vi } from 'vitest';
import { LinkRunwayServer } from '../src';

const input = { key: 'invite-123', title: 'Invite', url: 'https://example.com/welcome' };
const options = { endpoint: 'https://api.example.com', apiKey: 'lr_sk_example' };
afterEach(() => {
  vi.unstubAllGlobals();
});

it('retries a lost response with the identical link identity and body', async () => {
  const sent: RequestInit[] = [];
  const sdk = new LinkRunwayServer({
    ...options,
    retries: 1,
    fetch: async (_, init) => {
      sent.push(init!);
      if (sent.length === 1) throw new TypeError('Connection closed after committing');
      return Response.json({ ...input, id: 'created', duplicate: true });
    },
  });
  expect(await sdk.createLink(input)).toMatchObject({ id: 'created', duplicate: true });
  expect(sent).toHaveLength(2);
  expect(sent.map((request) => request.body)).toEqual([
    JSON.stringify(input),
    JSON.stringify(input),
  ]);
  expect(sent.every((request) => request.redirect === 'error')).toBe(true);
});

it('surfaces conflicts without retrying or changing the caller key', async () => {
  const fetcher = vi.fn(async () => Response.json({ message: 'Conflicting key' }, { status: 409 }));
  const sdk = new LinkRunwayServer({ ...options, fetch: fetcher });
  await expect(sdk.createLink(input)).rejects.toMatchObject({
    name: 'Error',
    message: 'Conflicting key',
    status: 409,
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('encodes identifiers and query data and sends the server credential only to the configured API', async () => {
  const sent: { url: string; init?: RequestInit }[] = [];
  const sdk = new LinkRunwayServer({
    ...options,
    fetch: async (url, init) => {
      sent.push({ url: String(url), init });
      return Response.json({});
    },
  });
  await sdk.getLink('a/b?other=1');
  await sdk.updateLink('a/b', { archived: true });
  await sdk.listLinks({ search: 'a&limit=1000', page: 2, limit: 20 });
  expect(sent.map((request) => request.url)).toEqual([
    'https://api.example.com/v1/server/links/a%2Fb%3Fother%3D1',
    'https://api.example.com/v1/server/links/a%2Fb',
    'https://api.example.com/v1/server/links?search=a%26limit%3D1000&page=2&limit=20',
  ]);
  expect(sent[1]!.init).toMatchObject({ method: 'PATCH', body: '{"archived":true}' });
  for (const request of sent)
    expect(request.init).toMatchObject({
      redirect: 'error',
      headers: { Authorization: 'Bearer lr_sk_example' },
    });
});

it('rejects publishable keys, insecure remote endpoints, and browser or worker runtimes', () => {
  expect(() => new LinkRunwayServer({ ...options, apiKey: 'lr_pk_example' })).toThrow('server key');
  for (const endpoint of [
    'http://api.example.com',
    'https://u:p@api.example.com',
    'https://api.example.com/?token=bad',
    'https://api.example.com/#fragment',
  ])
    expect(() => new LinkRunwayServer({ ...options, endpoint })).toThrow('HTTPS');
  for (const name of ['window', 'document', 'WorkerGlobalScope']) {
    vi.stubGlobal(name, {});
    expect(() => new LinkRunwayServer(options)).toThrow('browser');
    vi.unstubAllGlobals();
  }
});
