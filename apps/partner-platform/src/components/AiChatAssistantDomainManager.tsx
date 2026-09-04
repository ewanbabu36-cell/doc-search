import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Badge,
  Button
} from '@docsearch/ui-kit';
import {
  aiChatClientService,
  type ChatConversationDto,
  type ChatMessageDto
} from '../services/ai-chat-service.js';

interface Props {
  tenantId?: string | undefined;
  role?: string | undefined;
}

export const AiChatAssistantDomainManager: React.FC<Props> = ({ tenantId, role = 'STAFF' }) => {
  const [conversations, setConversations] = useState<ChatConversationDto[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const list = await aiChatClientService.listConversations();
      setConversations(list);
      if (list.length > 0 && !activeConversationId) {
        setActiveConversationId(list[0]?.id || null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const conv = await aiChatClientService.getConversation(convId);
      setMessages(conv.messages || []);
      scrollToBottom();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load message history');
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleCreateNewConversation = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const newConv = await aiChatClientService.createConversation('New AI Copilot Session');
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setMessages([]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    let targetConvId = activeConversationId;
    setErrorMessage(null);
    setErrorCode(null);

    try {
      setIsSending(true);

      // If no conversation active, create one first
      if (!targetConvId) {
        const newConv = await aiChatClientService.createConversation('New AI Copilot Session');
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        targetConvId = newConv.id;
      }

      const userText = inputText.trim();
      setInputText('');

      // Optimistic user message append
      const tempUserMsg: ChatMessageDto = {
        id: `temp-${Date.now()}`,
        conversationId: targetConvId,
        tenantId: tenantId || '',
        senderType: 'USER',
        content: userText,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        traceId: 'pending',
        metadata: {},
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      // Execute AI through backend pipeline
      const res = await aiChatClientService.sendMessage(targetConvId, userText);

      // Append assistant message
      const assistantMsg: ChatMessageDto = {
        id: res.assistantMessageId,
        conversationId: targetConvId,
        tenantId: tenantId || '',
        senderType: 'ASSISTANT',
        content: res.content,
        capabilityId: res.capabilityId,
        toolId: res.toolId || null,
        inputTokens: res.usage.inputTokens,
        outputTokens: res.usage.outputTokens,
        latencyMs: res.usage.latencyMs,
        traceId: res.traceId,
        metadata: { auditHash: res.auditHash },
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, assistantMsg]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with AI Core');
      if (err.message?.includes('rate limit') || err.message?.includes('429')) {
        setErrorCode('429');
      } else if (err.message?.includes('entitlement') || err.message?.includes('403')) {
        setErrorCode('403');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: '1rem', padding: '1rem' }}>
      {/* Sidebar: Conversations List */}
      <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Conversations</h3>
          <Button size="sm" onClick={handleCreateNewConversation} disabled={isLoading}>
            + New
          </Button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {conversations.length === 0 && !isLoading && (
            <div style={{ color: '#6B7280', fontSize: '0.875rem', textAlign: 'center', marginTop: '2rem' }}>
              No active conversations. Start one above!
            </div>
          )}

          {conversations.map((c) => (
            <Card
              key={c.id}
              style={{
                padding: '0.75rem',
                cursor: 'pointer',
                border: activeConversationId === c.id ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                backgroundColor: activeConversationId === c.id ? '#EFF6FF' : '#FFFFFF'
              }}
              onClick={() => setActiveConversationId(c.id)}
            >
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                {c.title || 'New Session'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6B7280' }}>
                <Badge variant="neutral">{c.role || role}</Badge>
                <span>{new Date(c.updatedAt).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
        {/* Header */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🤖</span>
            <div>
              <span style={{ fontWeight: 600 }}>DOC SEARCH AI Copilot</span>
              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#6B7280' }}>
                Role: <strong>{role}</strong> (Permission Firewall Verified)
              </span>
            </div>
          </div>
          <Badge variant="success">Entitlement: Active</Badge>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: errorCode === '429' ? '#FEF3C7' : '#FEE2E2',
            color: errorCode === '429' ? '#92400E' : '#B91C1C',
            fontSize: '0.875rem',
            borderBottom: '1px solid #FCA5A5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>
              {errorCode === '429' ? '⚠️ Rate Limit Exceeded: ' : '⛔ Access Denied: '}
              {errorMessage}
            </span>
            <Button size="sm" variant="outline" onClick={() => setErrorMessage(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {/* Message Log */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.length === 0 && !isLoading && (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
              <div style={{ fontWeight: 600 }}>Secure Role-Aware AI Assistant</div>
              <p style={{ fontSize: '0.85rem', maxWidth: '350px' }}>
                Ask questions, summarize encounters, review operational metrics, or request clinical guidance within your verified permissions.
              </p>
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.senderType === 'USER';
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '0.75rem 1rem',
                    borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    backgroundColor: isUser ? '#2563EB' : '#F3F4F6',
                    color: isUser ? '#FFFFFF' : '#1F2937',
                    fontSize: '0.9rem',
                    lineHeight: '1.4'
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>

                  {!isUser && m.capabilityId && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                      <Badge variant="neutral">{m.capabilityId}</Badge>
                      {m.toolId && <Badge variant="primary">Tool: {m.toolId}</Badge>}
                      {m.latencyMs > 0 && <span style={{ color: '#6B7280' }}>⚡ {m.latencyMs}ms</span>}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '0.2rem' }}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}

          {isSending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6B7280', fontSize: '0.85rem' }}>
              <span>🤖 Evaluating permissions and generating response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '0.5rem' }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
            disabled={isSending}
            rows={2}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              fontSize: '0.9rem',
              resize: 'none',
              fontFamily: 'inherit'
            }}
          />
          <Button onClick={handleSendMessage} disabled={isSending || !inputText.trim()} style={{ alignSelf: 'flex-end', height: '42px' }}>
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
};
