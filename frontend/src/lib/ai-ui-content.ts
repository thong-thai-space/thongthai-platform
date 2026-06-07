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

