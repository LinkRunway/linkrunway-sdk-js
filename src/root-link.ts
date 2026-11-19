const reserved = new Set(
  'api v1 admin health metrics ready status login logout signup dashboard docs support pricing settings account assets static _next l r i robots favicon sitemap www'.split(
    ' ',
  ),
);

/** Use only on hosts or individual routes explicitly assigned to root short links. */
export const isRootLinkPath = (path: string) =>
  /^\/[a-zA-Z0-9_-]{3,60}$/.test(path) && !reserved.has(path.slice(1).toLowerCase());
