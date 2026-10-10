export class HttpError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || undefined;
  }
}
export const badRequest = (m, c) => new HttpError(400, m, c);
export const unauthorized = (m = 'Not authenticated', c = 'UNAUTHENTICATED') => new HttpError(401, m, c);
export const forbidden = (m = 'Forbidden', c = 'FORBIDDEN') => new HttpError(403, m, c);
export const notFound = (m = 'Not found', c = 'NOT_FOUND') => new HttpError(404, m, c);
export const conflict = (m, c = 'CONFLICT') => new HttpError(409, m, c);
export const tooMany = (m = 'Too many requests', c = 'RATE_LIMITED') => new HttpError(429, m, c);
