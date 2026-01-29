/**
 * Chat API endpoints
 */

import { apiPost } from '../client';

export interface ChatRequest {
  message: string;
  system_prompt?: string;
}

export interface ChatResponse {
  reply: string;
}

export async function sendChatMessage(
  message: string,
  systemPrompt?: string
): Promise<ChatResponse> {
  return apiPost<ChatResponse, ChatRequest>('/chat', {
    message,
    system_prompt: systemPrompt,
  });
}
