import { afterEach, expect, it, vi } from 'vitest';
import { forwardLinkRunway } from '../src';

const token = `lr_dp_${'x'.repeat(43)}`;
const options = { endpoint: 'https://api.example.com', token, clientIp: '203.0.113.3' };
afterEach(() => vi.unstubAllGlobals());
it('forwards only approved visitor headers and never follows redirects with the credential', async () => {
  const request = new Request('https://website.example.com/r/hello?s=share', {
    headers: {
      cookie: 'customer-session=private',
      authorization: 'Bearer private',
      'x-forwarded-for': 'spoofed',
      'x-linkrunway-client-ip': 'spoofed',
      'x-linkrunway-domain-token': 'spoofed',
      'sec-gpc': '1',
      dnt: '1',
      'user-agent': 'Example',
      'accept-language': 'en-US',
    },
  });
  const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    expect(String(url)).toBe('https://api.example.com/r/hello?s=share');
    expect(init?.redirect).toBe('manual');
    const headers = new Headers(init?.headers);
    expect(headers.get('x-linkrunway-domain-token')).toBe(token);
    expect(headers.get('x-linkrunway-client-ip')).toBe('203.0.113.3');
    expect(headers.get('sec-gpc')).toBe('1');
    expect(headers.get('dnt')).toBe('1');
    for (const name of ['authorization', 'cookie', 'x-forwarded-for', 'host'])
      expect(headers.has(name)).toBe(false);
    return new Response(null, {
      status: 302,
      headers: {
        Location: 'https://store.example.com',
        'Cache-Control': 'no-store',
        'Set-Cookie': 'private=bad',
        'X-Internal-Secret': 'secret',
      },
    });
  });
  const reply = await forwardLinkRunway(request, { ...options, fetch: fetcher });
  expect(reply.status).toBe(302);
  expect(reply.headers.get('location')).toBe('https://store.example.com');
  expect(reply.headers.get('cache-control')).toBe('no-store');
  expect(reply.headers.has('set-cookie')).toBe(false);
  expect(reply.headers.has('x-internal-secret')).toBe(false);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('does not proxy other website paths or methods and does not expose transport failures', async () => {
  const fetcher = vi.fn(async () => {
    throw new Error(`private failure ${token}`);
  });
  for (const path of ['/account', '/v1/track', '/r/../account', '/.well-known/other.json'])
    expect(
      (
        await forwardLinkRunway(new Request(`https://website.example.com${path}`), {
          ...options,
          fetch: fetcher,
        })
      ).status,
    ).toBe(404);
  expect(
    (
      await forwardLinkRunway(
        new Request('https://website.example.com/r/hello', { method: 'POST' }),
        { ...options, fetch: fetcher },
      )
    ).status,
  ).toBe(404);
  expect(fetcher).not.toHaveBeenCalled();
  const failed = await forwardLinkRunway(new Request('https://website.example.com/r/hello'), {
    ...options,
    fetch: fetcher,
  });
  expect(failed.status).toBe(503);
  expect(await failed.text()).not.toContain(token);
});
it('rejects browser secrets, insecure endpoints and combined IP header values', async () => {
  const request = new Request('https://website.example.com/r/hello');
  for (const endpoint of [
    'http://api.example.com',
    'https://name:pass@api.example.com',
    'https://api.example.com/path',
  ])
    await expect(forwardLinkRunway(request, { ...options, endpoint })).rejects.toThrow('HTTPS');
  await expect(
    forwardLinkRunway(request, { ...options, clientIp: '203.0.113.3, 127.0.0.1' }),
  ).rejects.toThrow('client IP');
  vi.stubGlobal('window', {});
  await expect(forwardLinkRunway(request, options)).rejects.toThrow('website server');
});
