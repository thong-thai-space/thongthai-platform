import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all paths except: API routes, Next.js internals, static files,
    // and anything with a file extension (e.g. .png, .ico, .mp4).
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
