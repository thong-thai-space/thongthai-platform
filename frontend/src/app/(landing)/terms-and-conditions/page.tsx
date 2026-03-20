import Link from 'next/link';

export default function TermsAndConditionsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Terms and Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: March 19, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Thong Thai Space services, you agree to these Terms and Conditions. If you
            do not agree, do not use the services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Services</h2>
          <p>
            We provide business software services including project management, client portal, messaging,
            invoicing, file handling, and AI-assisted workflows.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Account Responsibilities</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You must provide accurate account information and keep it up to date.</li>
            <li>You are responsible for activities that occur under your account.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Acceptable Use</h2>
          <p>You agree not to misuse the service, including by:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Violating laws or regulations.</li>
            <li>Interfering with security, availability, or integrity of the platform.</li>
            <li>Uploading malicious code or abusive content.</li>
            <li>Attempting unauthorized access to accounts or systems.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. AI Features Disclaimer</h2>
          <p>
            AI-generated outputs are provided for assistance only and may be inaccurate or incomplete. You are
            responsible for reviewing and validating outputs before business use.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Intellectual Property</h2>
          <p>
            We retain rights in our platform, software, and branding. You retain rights to your uploaded and
            generated content, subject to rights required to operate the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Privacy</h2>
          <p>
            Use of the service is also governed by our{' '}
            <Link href="/privacy-policy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">8. Fees and Billing</h2>
          <p>
            If paid plans are offered, pricing, billing cycle, and payment terms will be provided at purchase
            time and may be updated with notice as required by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">9. Suspension and Termination</h2>
          <p>
            We may suspend or terminate access for violations of these Terms, security risks, or legal
            obligations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, services are provided &quot;as is&quot; without warranties of any
            kind, and we are not liable for indirect or consequential damages.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Thong Thai Space from claims arising out of your misuse
            of the services or violation of these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">12. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the services after updates means you
            accept the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">13. Contact</h2>
          <p>
            For legal inquiries, contact{' '}
            <a href="mailto:legal@thongthaispace.com" className="underline hover:text-foreground">
              legal@thongthaispace.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
