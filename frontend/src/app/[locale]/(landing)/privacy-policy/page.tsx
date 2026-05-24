import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const isDefault = locale === routing.defaultLocale;
  const canonical = isDefault ? '/privacy-policy' : `/${locale}/privacy-policy`;

  return {
    title: t('privacyPolicy.title'),
    description: t('privacyPolicy.description'),
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((alt) => [
          alt,
          alt === routing.defaultLocale ? '/privacy-policy' : `/${alt}/privacy-policy`,
        ]),
      ),
    },
    openGraph: {
      url: canonical,
      siteName: t('siteName'),
      title: t('privacyPolicy.title'),
      description: t('privacyPolicy.description'),
      type: 'article',
      locale,
    },
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="tts-brand-surface p-7 sm:p-9">
        <h1 className="tts-landing-title text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="tts-brand-body mt-2 text-sm">Last updated: March 19, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Who We Are</h2>
          <p>
            Thong Thai Space provides project management, collaboration, client portal, and AI-assisted
            productivity tools for businesses and teams.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
          <p>We may collect:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Account data: name, email address, encrypted password, role, locale.</li>
            <li>Profile data: avatar, phone number, preferences.</li>
            <li>Usage data: login timestamps, feature usage logs, audit entries, device/browser metadata.</li>
            <li>Content data: projects, tasks, invoices, files, messages, AI prompts and outputs.</li>
            <li>Technical data: IP address, cookies, authentication tokens, error logs.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. How We Use Information</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>To provide and secure access to our platform.</li>
            <li>To operate core features including collaboration, messaging, invoicing, and AI assistance.</li>
            <li>To improve performance, reliability, and user experience.</li>
            <li>To communicate important service and security updates.</li>
            <li>To meet legal, compliance, and fraud-prevention obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Legal Basis</h2>
          <p>
            We process personal data on the basis of contractual necessity, legitimate interests, legal
            obligations, and your consent where required.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Google Login and OAuth Data</h2>
          <p>
            If you choose Google Sign-In, we receive basic profile data from Google such as your email,
            display name, profile photo, and Google account identifier. We use this only to authenticate
            your account and secure access to our services.
          </p>
          <p className="mt-2">
            We do not post to your Google account and we do not request sensitive Google scopes for core
            authentication.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Cookies and Similar Technologies</h2>
          <p>
            We use essential cookies and secure session tokens to keep you signed in, protect your account,
            and maintain platform functionality. Disabling essential cookies may prevent login.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Data Sharing</h2>
          <p>
            We do not sell personal information. We may share data with trusted service providers that help
            us operate infrastructure (hosting, database, analytics, email delivery) under contractual
            confidentiality and security requirements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">8. Data Retention</h2>
          <p>
            We retain data for as long as needed to provide services, fulfill contractual obligations,
            resolve disputes, and comply with legal requirements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">9. Security</h2>
          <p>
            We apply technical and organizational safeguards including encryption in transit, access control,
            and monitoring. No method of transmission or storage is completely secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">10. Your Rights</h2>
          <p>
            Depending on your location, you may have rights to access, correct, delete, restrict, or export
            your personal data, and to object to certain processing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">11. International Transfers</h2>
          <p>
            Your data may be processed in countries other than your own. We implement reasonable safeguards
            for cross-border transfers where required.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">12. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Material changes will be communicated through the
            platform or by other appropriate means.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">13. Contact</h2>
          <p>
            For privacy requests, contact us at{' '}
            <a href="mailto:privacy@thongthaispace.com" className="underline hover:text-foreground">
              privacy@thongthaispace.com
            </a>
            .
          </p>
        </section>
      </div>

      <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
        See also our{' '}
        <Link href="/terms-and-conditions" className="underline hover:text-foreground">
          Terms and Conditions
        </Link>
        .
      </div>
      </div>
    </main>
  );
}
