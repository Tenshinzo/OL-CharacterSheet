/**
 * Cache-busting for the static client.
 *
 * The client has no build step, so index.html references its scripts and
 * stylesheets by plain file name. Static files are served with a long
 * max-age, which means browsers kept showing stale CSS/JS after a deploy.
 *
 * At startup we hash the contents of every local asset referenced from
 * index.html and append `?v=<hash>` to those URLs. index.html itself is
 * served with `Cache-Control: no-cache`, so a new deploy changes the URLs
 * and the browser fetches the new files immediately, while unchanged
 * versions stay cacheable.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// href="styles.css" / src="script.js" with a relative path and no query string.
const LOCAL_ASSET_RE = /\b(href|src)="([^"':?#]+\.(?:css|js))"/g;

export function buildIndexHtml(clientDir) {
  const html = readFileSync(join(clientDir, 'index.html'), 'utf8');
  const hash = createHash('sha1');
  const files = new Set();
  for (const match of html.matchAll(LOCAL_ASSET_RE)) files.add(match[2]);
  for (const file of [...files].sort()) {
    hash.update(file).update('\0').update(readFileSync(join(clientDir, file)));
  }
  const version = hash.digest('hex').slice(0, 12);
  const rendered = html.replace(LOCAL_ASSET_RE, (_, attr, file) => `${attr}="${file}?v=${version}"`);
  return { html: rendered, version, files: [...files] };
}
