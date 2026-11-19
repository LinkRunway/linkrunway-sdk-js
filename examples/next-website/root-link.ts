import { isRootLinkPath } from '@linkrunway/sdk';
import { forward } from './linkrunway';

/** Call after checking the site's own routes in its single-segment fallback. */
export async function forwardRootLink(
  request: Request,
  siteFallback: (request: Request) => Promise<Response> | Response,
) {
  const path = new URL(request.url).pathname;
  const name = path.slice(1);
  const aliases = (process.env.LINKRUNWAY_ROOT_NAMES ?? '').split(',').map((alias) => alias.trim());
  if (
    process.env.LINKRUNWAY_ROOT_LINKS !== 'true' ||
    !isRootLinkPath(path) ||
    !(/^[A-Z0-9]{5}$/.test(name) || /^lr-check-[a-f0-9]{32}$/.test(name) || aliases.includes(name))
  )
    return siteFallback(request);
  const response = await forward(request);
  if (response.status !== 404) return response;
  await response.body?.cancel();
  return siteFallback(request);
}
