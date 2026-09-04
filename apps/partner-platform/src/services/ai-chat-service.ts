import { apiRequest } from './api-client.js';

export interface ChatConversationDto {
  id: string;
  tenantId: string;
  branchId?: string | null;
  userId: string;
  role: string;
  patientMrn?: string | null;
  title: string;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessageDto[];
}

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  tenantId: string;
  branchId?: string | null;
  senderType: 'USER' | 'ASSISTANT' | 'SYSTEM';
  userId?: string | null;
  content: string;
  capabilityId?: string | null;
  toolId?: string | null;
  toolInput?: Record<string, unknown> | null;
  toolOutput?: Record<string, unknown> | null;
  modelProvider?: string | null;
  modelVersion?: string | null;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  traceId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ChatExecutionResponseDto {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  content: string;
  capabilityId: string;
  toolId?: string | null;
  role: string;
  dataScope: string;
  traceId: string;
  auditHash: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
  };
}

export class AiChatClientService {
  async listConversations(): Promise<ChatConversationDto[]> {
    const res = await apiRequest<ChatConversationDto[]>('/api/v1/partner/ai/chat/conversations');
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to list AI chat conversations');
    }
    return res.data;
  }

  async createConversation(title?: string): Promise<ChatConversationDto> {
    const res = await apiRequest<ChatConversationDto>('/api/v1/partner/ai/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ title })
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to create AI chat conversation');
    }
    return res.data;
  }

  async getConversation(id: string): Promise<ChatConversationDto> {
    const res = await apiRequest<ChatConversationDto>(`/api/v1/partner/ai/chat/conversations/${id}`);
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to retrieve conversation');
    }
    return res.data;
  }

  async sendMessage(
    conversationId: string,
    message: string,
    capabilityId?: string,
    toolId?: string,
    toolInput?: Record<string, unknown>
  ): Promise<ChatExecutionResponseDto> {
    const res = await apiRequest<ChatExecutionResponseDto>(
      `/api/v1/partner/ai/chat/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ message, capabilityId, toolId, toolInput })
      }
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to send chat message');
    }
    return res.data;
  }

  async archiveConversation(id: string): Promise<ChatConversationDto> {
    const res = await apiRequest<ChatConversationDto>(
      `/api/v1/partner/ai/chat/conversations/${id}/archive`,
      { method: 'POST' }
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to archive conversation');
    }
    return res.data;
  }
}

export const aiChatClientService = new AiChatClientService();
