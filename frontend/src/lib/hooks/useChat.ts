/**
 * Hook for AI chat functionality
 */

'use client';

import { useState, useCallback } from 'react';
import { sendChatMessage, ChatResponse } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseChatResult {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

export function useChat(systemPrompt?: string): UseChatResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(
    async (message: string) => {
      setLoading(true);
      setError(null);

      // Add user message
      setMessages((prev) => [...prev, { role: 'user', content: message }]);

      try {
        const response = await sendChatMessage(message, systemPrompt);
        // Add assistant message
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: response.reply },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to send message'));
      } finally {
        setLoading(false);
      }
    },
    [systemPrompt]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearMessages };
}
