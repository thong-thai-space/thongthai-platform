import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import { deepMerge } from '@/lib/deep-merge';
import { fetchContentOverrides } from '@/lib/content-overrides';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Static messages are the complete, always-present defaults. CMS overrides for
  // this locale are deep-merged on top — each locale is independent, so the VN/EN
  // copies can never drift or clobber each other.
  const staticMessages = (await import(`../../messages/${locale}.json`)).default;
  const overrides = await fetchContentOverrides(locale);
  const messages = deepMerge(staticMessages, overrides);

  return { locale, messages };
});
