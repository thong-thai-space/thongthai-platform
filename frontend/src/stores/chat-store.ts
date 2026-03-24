interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatState {
  messages: Message[];
  conversationId: string | undefined;
}

const STORAGE_KEY = 'tts-ai-chat-store';

function createInitialState(): ChatState {
  if (typeof window === 'undefined') {
    return {
      messages: [],
      conversationId: undefined,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        messages: [],
        conversationId: undefined,
      };
    }

    const parsed = JSON.parse(raw) as ChatState;
    if (!Array.isArray(parsed.messages)) {
      return {
        messages: [],
        conversationId: undefined,
      };
    }

    return {
      messages: parsed.messages,
      conversationId: parsed.conversationId,
    };
  } catch {
    return {
      messages: [],
      conversationId: undefined,
    };
  }
}

// Module-level state — persists across component mount/unmount and page reload.
let state: ChatState = createInitialState();

const listeners = new Set<() => void>();

function notify() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

export const chatStore = {
  getState: () => state,

  addMessage: (msg: Message) => {
    state = { ...state, messages: [...state.messages, msg] };
    notify();
  },

  setConversationId: (id: string) => {
    state = { ...state, conversationId: id };
    notify();
  },

  reset: () => {
    state = { messages: [], conversationId: undefined };
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    notify();
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
