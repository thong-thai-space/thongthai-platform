'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useSectionContent } from '@/hooks/use-content';
import {
  BrandContainer,
  BrandHeroContainer,
  BrandSection,
  BrandSurface,
} from '@/components/brand/brand-primitives';
import { TurnstileWidget } from '@/components/security/turnstile-widget';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  budget: string;
  message: string;
}

type ContactContent = {
  hero: {
    title: string;
    titleHighlight?: string;
    subtitle: string;
  };
  infoTitle: string;
  info: {
    emailLabel: string;
    email: string;
    phoneLabel: string;
    phone: string;
    addressLabel: string;
    address: string;
  };
  responseCard: {
    title: string;
    body: string;
  };
  form: {
    submitText: string;
    sendingText: string;
    successTitle: string;
    successSubtitle: string;
    errorText: string;
  };
};

const defaults: ContactContent = {
  hero: {
    title: 'Contact Us',
    titleHighlight: 'Us',
    subtitle:
      'Describe your project requirements, and we will provide a free consultation and quote within 24 hours',
  },
  infoTitle: 'Contact Information',
  info: {
    emailLabel: 'Email',
    email: 'hoangthai229@gmail.com',
    phoneLabel: 'Phone',
    phone: '0345807906',
    addressLabel: 'Address',
    address: 'Ho Chi Minh City, Vietnam',
  },
  responseCard: {
    title: 'Response Time',
    body: 'We will get back to you within 24 business hours. For urgent requests, please call us directly.',
  },
  form: {
    submitText: 'Submit Request',
    sendingText: 'Sending...',
    successTitle: 'Thank you!',
    successSubtitle: 'We have received your message and will respond within 24 hours.',
    errorText: 'An error occurred. Please try again later.',
  },
};

/**
 * Pattern: Client Island — the contact form needs React Hook Form, submission state,
 * and API integration. The route page (`page.tsx`) stays a thin RSC wrapper for
 * `generateMetadata` and locale handling.
 */
export function ContactPageContent() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const isTurnstileEnabled = Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  );
  const { data } = useSectionContent('contact');
  const raw = (data?.data as Partial<ContactContent>) || {};
  const c: ContactContent = {
    ...defaults,
    ...raw,
    hero: { ...defaults.hero, ...raw.hero },
    info: { ...defaults.info, ...raw.info },
    responseCard: { ...defaults.responseCard, ...raw.responseCard },
    form: { ...defaults.form, ...raw.form },
  };
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>();

  const onSubmit = async (data: ContactForm) => {
    try {
      setError('');
      if (isTurnstileEnabled && !turnstileToken) {
        setError('Please complete the security challenge.');
        return;
      }
      await api.post('/contact', {
        ...data,
        turnstileToken: turnstileToken || undefined,
      });
      setSubmitted(true);
    } catch {
      setError(c.form.errorText || defaults.form.errorText);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <BrandSurface className="w-full max-w-xl p-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold">{c.form.successTitle}</h2>
          <p className="tts-brand-body mt-2">{c.form.successSubtitle}</p>
        </BrandSurface>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <BrandSection className="tts-brand-grid bg-linear-to-br from-background via-background to-primary/5 py-20">
        <BrandHeroContainer>
          <h1 className="tts-landing-display text-4xl font-bold tracking-tight sm:text-5xl">
            {c.hero.titleHighlight && c.hero.title.includes(c.hero.titleHighlight) ? (
              <>
                {c.hero.title.split(c.hero.titleHighlight)[0]}
                <span className="text-primary">{c.hero.titleHighlight}</span>
                {c.hero.title.split(c.hero.titleHighlight)[1]}
              </>
            ) : (
              c.hero.title
            )}
          </h1>
          <p className="tts-brand-body mt-6 text-lg">{c.hero.subtitle}</p>
        </BrandHeroContainer>
      </BrandSection>

      <BrandSection>
        <BrandContainer>
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Contact info */}
            <div>
              <h2 className="text-xl font-bold">{c.infoTitle}</h2>
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">{c.info.emailLabel}</div>
                    <div className="tts-brand-body text-sm">{c.info.email}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">{c.info.phoneLabel}</div>
                    <div className="tts-brand-body text-sm">{c.info.phone}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">{c.info.addressLabel}</div>
                    <div className="tts-brand-body text-sm">{c.info.address}</div>
                  </div>
                </div>
              </div>

              <BrandSurface className="mt-8 bg-primary/5 p-6">
                <h3 className="font-semibold">{c.responseCard.title}</h3>
                <p className="tts-brand-body mt-2 text-sm">{c.responseCard.body}</p>
              </BrandSurface>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      {...register('name', { required: 'Please enter your name' })}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      {...register('email', {
                        required: 'Please enter your email',
                        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
                      })}
                      type="email"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="email@company.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <input
                      {...register('phone')}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="0123 456 789"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Company</label>
                    <input
                      {...register('company')}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Service of Interest</label>
                    <select
                      {...register('service')}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select a service</option>
                      <option value="web">Web Development</option>
                      <option value="mobile">Mobile Apps</option>
                      <option value="ai">AI Solutions</option>
                      <option value="consulting">IT Consulting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Estimated Budget</label>
                    <select
                      {...register('budget')}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select a budget range</option>
                      <option value="<2k">Under $2,000</option>
                      <option value="2k-5k">$2,000 - $5,000</option>
                      <option value="5k-15k">$5,000 - $15,000</option>
                      <option value="15k-25k">$15,000 - $25,000</option>
                      <option value=">25k">Over $25,000</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Project Description <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    {...register('message', {
                      required: 'Please describe your project requirements',
                    })}
                    rows={5}
                    className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Describe your project in detail: goals, desired features, timeline..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>
                  )}
                </div>

                {error && (
                  <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <TurnstileWidget
                  onTokenChange={setTurnstileToken}
                  className="flex justify-start"
                />

                <button
                  type="submit"
                  disabled={
                    isSubmitting || (isTurnstileEnabled && !turnstileToken)
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? c.form.sendingText : c.form.submitText}
                </button>
              </form>
            </div>
          </div>
        </BrandContainer>
      </BrandSection>
    </div>
  );
}
