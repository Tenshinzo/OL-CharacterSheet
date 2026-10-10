import { badRequest, HttpError } from '../lib/errors.js';
import { config } from '../config.js';

const TYPES = {
  bug: { labels: ['bug'], prefix: 'Bug' },
  feature: { labels: ['enhancement'], prefix: 'Feature' },
};

/** Create a GitHub issue through the REST API. Separated so tests can stub it. */
export async function createGithubIssue({ title, body, labels }) {
  const res = await fetch(`https://api.github.com/repos/${config.github.repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.github.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'ol-character-sheet',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ title, body, labels }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status}: ${text.slice(0, 300)}`);
  }
  const issue = await res.json();
  return { number: issue.number, url: issue.html_url };
}

export default async function feedbackRoutes(app, opts = {}) {
  const create = opts.createIssue || createGithubIssue;
  const enabled = () => !!(config.github.token && config.github.repo);

  app.get('/feedback/status', async () => ({ enabled: enabled(), repo: config.github.repo }));

  app.post('/feedback', {
    preHandler: app.requireAuth,
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
  }, async (request) => {
    if (!enabled()) throw new HttpError(503, 'Feedback is not configured on this server', 'FEEDBACK_DISABLED');
    const body = request.body || {};
    const kind = TYPES[body.type];
    if (!kind) throw badRequest('type must be "bug" or "feature"', 'FEEDBACK_TYPE');
    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    if (title.length < 5 || title.length > 150) throw badRequest('Title must be 5-150 characters', 'FEEDBACK_TITLE');
    if (description.length < 10 || description.length > 5000) throw badRequest('Description must be 10-5000 characters', 'FEEDBACK_DESCRIPTION');
    const context = body.context && typeof body.context === 'object' ? body.context : {};

    const lines = [
      description,
      '',
      '---',
      `**Type:** ${kind.prefix}`,
      `**Reported by:** ${request.user.displayName} (${request.user.email})`,
    ];
    if (context.page) lines.push(`**Page:** ${String(context.page).slice(0, 200)}`);
    if (context.character) lines.push(`**Character:** ${String(context.character).slice(0, 200)}`);
    if (context.userAgent) lines.push(`**Browser:** ${String(context.userAgent).slice(0, 300)}`);
    if (context.viewport) lines.push(`**Viewport:** ${String(context.viewport).slice(0, 50)}`);
    lines.push(`**Submitted:** ${new Date().toISOString()} via in-app form`);

    try {
      const issue = await create({ title: `[${kind.prefix}] ${title}`, body: lines.join('\n'), labels: [...kind.labels, 'from-app'] });
      request.log.info({ issue: issue.number, user: request.user.id }, 'feedback issue created');
      return { ok: true, ...issue };
    } catch (err) {
      request.log.error(err, 'github issue creation failed');
      throw new HttpError(502, 'Could not create the GitHub issue. Please try again later.', 'FEEDBACK_UPSTREAM');
    }
  });
}
