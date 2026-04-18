export interface AiUiContent {
  dashboardAiChatEmptyState: string;
  dashboardAiChatInputPlaceholder: string;
  publicChatOnlineTitle: string;
  publicChatOnlineSubtitle: string;
  publicChatHeaderTitle: string;
  publicChatHeaderSubtitle: string;
  publicChatWelcomeTitle: string;
  publicChatWelcomeBody: string;
  publicChatInputPlaceholder: string;
  portalChatOnlineTitle: string;
  portalChatOnlineSubtitle: string;
  portalChatHeaderTitle: string;
  portalChatWelcomeBody: string;
  portalChatInputPlaceholder: string;
  architectureAgentBadge: string;
  architectureAgentInputPlaceholder: string;
  architectureAgentGeneratingSteps: string[];
  architectureAgentCtaLabel: string;
  architectureAgentGeneratingLabel: string;
  architectureAgentSynthesizingLabel: string;
}

export const AI_UI_DEFAULTS: AiUiContent = {
  dashboardAiChatEmptyState:
    'Ask the AI assistant a question. I can help you with coding, project consulting, code review...',
  dashboardAiChatInputPlaceholder:
    'Type a message... (Enter to send, Shift+Enter for new line)',
  publicChatOnlineTitle: 'AI Assistant is online',
  publicChatOnlineSubtitle: 'Need help? Ask me anything about our services.',
  publicChatHeaderTitle: 'Thong Thai Space',
  publicChatHeaderSubtitle: 'AI Assistant',
  publicChatWelcomeTitle: 'Hello!',
  publicChatWelcomeBody:
    "I'm the AI assistant of Thong Thai Space. Do you have any questions about our services?",
  publicChatInputPlaceholder: 'Ask about our services...',
  portalChatOnlineTitle: 'AI Assistant is online',
  portalChatOnlineSubtitle: 'Ask about projects, invoices, or progress updates.',
  portalChatHeaderTitle: 'AI Assistant',
  portalChatWelcomeBody: 'Hello! I can help you ask about your projects.',
  portalChatInputPlaceholder: 'Ask something...',
  architectureAgentBadge: 'Architecture Agent',
  architectureAgentInputPlaceholder:
    'How can I help your project today? Describe your requirements, upload a file, then click View Architecture...',
  architectureAgentGeneratingSteps: [
    'Analyzing project requirements...',
    'Designing system layers and data flow...',
    'Rendering architecture diagram...',
  ],
  architectureAgentCtaLabel: 'View Architecture',
  architectureAgentGeneratingLabel: 'Generating...',
  architectureAgentSynthesizingLabel: 'Synthesizing architecture review...',
};

function readString(data: Record<string, unknown>, key: keyof AiUiContent, fallback: string) {
  const value = data[key];
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function readStringArray(
  data: Record<string, unknown>,
  key: keyof AiUiContent,
  fallback: string[],
) {
  const value = data[key];
  if (!Array.isArray(value)) return fallback;

  const sanitized = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  return sanitized.length > 0 ? sanitized : fallback;
}

export function parseAiUiContent(sectionData: unknown): AiUiContent {
  if (!sectionData || typeof sectionData !== 'object') {
    return AI_UI_DEFAULTS;
  }

  const data = sectionData as Record<string, unknown>;

  return {
    dashboardAiChatEmptyState: readString(
      data,
      'dashboardAiChatEmptyState',
      AI_UI_DEFAULTS.dashboardAiChatEmptyState,
    ),
    dashboardAiChatInputPlaceholder: readString(
      data,
      'dashboardAiChatInputPlaceholder',
      AI_UI_DEFAULTS.dashboardAiChatInputPlaceholder,
    ),
    publicChatOnlineTitle: readString(
      data,
      'publicChatOnlineTitle',
      AI_UI_DEFAULTS.publicChatOnlineTitle,
    ),
    publicChatOnlineSubtitle: readString(
      data,
      'publicChatOnlineSubtitle',
      AI_UI_DEFAULTS.publicChatOnlineSubtitle,
    ),
    publicChatHeaderTitle: readString(
      data,
      'publicChatHeaderTitle',
      AI_UI_DEFAULTS.publicChatHeaderTitle,
    ),
    publicChatHeaderSubtitle: readString(
      data,
      'publicChatHeaderSubtitle',
      AI_UI_DEFAULTS.publicChatHeaderSubtitle,
    ),
    publicChatWelcomeTitle: readString(
      data,
      'publicChatWelcomeTitle',
      AI_UI_DEFAULTS.publicChatWelcomeTitle,
    ),
    publicChatWelcomeBody: readString(
      data,
      'publicChatWelcomeBody',
      AI_UI_DEFAULTS.publicChatWelcomeBody,
    ),
    publicChatInputPlaceholder: readString(
      data,
      'publicChatInputPlaceholder',
      AI_UI_DEFAULTS.publicChatInputPlaceholder,
    ),
    portalChatOnlineTitle: readString(
      data,
      'portalChatOnlineTitle',
      AI_UI_DEFAULTS.portalChatOnlineTitle,
    ),
    portalChatOnlineSubtitle: readString(
      data,
      'portalChatOnlineSubtitle',
      AI_UI_DEFAULTS.portalChatOnlineSubtitle,
    ),
    portalChatHeaderTitle: readString(
      data,
      'portalChatHeaderTitle',
      AI_UI_DEFAULTS.portalChatHeaderTitle,
    ),
    portalChatWelcomeBody: readString(
      data,
      'portalChatWelcomeBody',
      AI_UI_DEFAULTS.portalChatWelcomeBody,
    ),
    portalChatInputPlaceholder: readString(
      data,
      'portalChatInputPlaceholder',
      AI_UI_DEFAULTS.portalChatInputPlaceholder,
    ),
    architectureAgentBadge: readString(
      data,
      'architectureAgentBadge',
      AI_UI_DEFAULTS.architectureAgentBadge,
    ),
    architectureAgentInputPlaceholder: readString(
      data,
      'architectureAgentInputPlaceholder',
      AI_UI_DEFAULTS.architectureAgentInputPlaceholder,
    ),
    architectureAgentGeneratingSteps: readStringArray(
      data,
      'architectureAgentGeneratingSteps',
      AI_UI_DEFAULTS.architectureAgentGeneratingSteps,
    ),
    architectureAgentCtaLabel: readString(
      data,
      'architectureAgentCtaLabel',
      AI_UI_DEFAULTS.architectureAgentCtaLabel,
    ),
    architectureAgentGeneratingLabel: readString(
      data,
      'architectureAgentGeneratingLabel',
      AI_UI_DEFAULTS.architectureAgentGeneratingLabel,
    ),
    architectureAgentSynthesizingLabel: readString(
      data,
      'architectureAgentSynthesizingLabel',
      AI_UI_DEFAULTS.architectureAgentSynthesizingLabel,
    ),
  };
}
