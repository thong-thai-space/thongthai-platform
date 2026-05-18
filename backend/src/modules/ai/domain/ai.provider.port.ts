// Pattern: Provider Port
export interface AiMessageParam {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiProviderUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AiProviderPort {
  createMessage(params: {
    model: string;
    maxTokens: number;
    system: string;
    messages: AiMessageParam[];
  }): Promise<{ text: string; usage: AiProviderUsage }>;
}
