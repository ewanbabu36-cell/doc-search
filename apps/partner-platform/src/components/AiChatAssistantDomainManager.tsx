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
import { aiVoiceClientService } from '../services/ai-voice-service.js';

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
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [audioPlayMap, setAudioPlayMap] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
  }, [messages, isSending, isVoiceProcessing]);

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

  /**
   * Starts microphone recording with explicit permission and browser support checks
   */
  const handleStartRecording = async () => {
    setErrorMessage(null);
    setErrorCode(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Audio recording is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach((track) => track.stop());
        await handleProcessVoiceAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access denied. Please grant microphone permissions in browser settings.');
        setErrorCode('MIC_DENIED');
      } else {
        setErrorMessage(`Microphone error: ${err.message || 'Failed to start recording'}`);
      }
    }
  };

  /**
   * Stops recording and triggers backend Voice AI pipeline
   */
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  /**
   * Converts recorded audio blob to base64 and invokes Voice pipeline
   */
  const handleProcessVoiceAudio = async (audioBlob: Blob) => {
    setIsVoiceProcessing(true);
    setErrorMessage(null);

    let targetConvId = activeConversationId;
    const tempId = `temp-voice-${Date.now()}`;

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]!);
      }
      const base64Audio = btoa(binaryString);

      // Optimistic Voice user message
      const tempUserMsg: ChatMessageDto = {
        id: tempId,
        conversationId: targetConvId || 'pending',
        tenantId: tenantId || '',
        senderType: 'USER',
        content: '🎙️ [Voice Audio Ingestion...]',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        traceId: 'pending',
        metadata: { inputType: 'VOICE' },
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      // Call Voice API endpoint
      const res = await aiVoiceClientService.interact(base64Audio, {
        conversationId: targetConvId || undefined,
        mimeType: 'audio/wav'
      });

      if (!targetConvId) {
        setActiveConversationId(res.conversationId);
        targetConvId = res.conversationId;
      }

      // Update User Message with transcribed text
      const confirmedUserMsg: ChatMessageDto = {
        ...tempUserMsg,
        id: res.userMessageId,
        conversationId: res.conversationId,
        content: `🎙️ ${res.transcript}`
      };

      // Assistant Message with Safety Category & Audio Playback
      const assistantMsg: ChatMessageDto = {
        id: res.assistantMessageId,
        conversationId: res.conversationId,
        tenantId: tenantId || '',
        senderType: 'ASSISTANT',
        content: res.content,
        capabilityId: res.capabilityId,
        toolId: res.toolId || null,
        inputTokens: res.usage.inputTokens,
        outputTokens: res.usage.outputTokens,
        latencyMs: res.usage.latencyMs,
        traceId: res.traceId,
        metadata: {
          auditHash: res.auditHash,
          inputType: 'VOICE',
          safetyCategory: res.safetyCategory,
          hasAudio: Boolean(res.audio)
        },
        createdAt: new Date().toISOString()
      };

      if (res.audio) {
        setAudioPlayMap((prev) => ({
          ...prev,
          [res.assistantMessageId]: `data:audio/wav;base64,${res.audio}`
        }));
      }

      setMessages((prev) => [...prev.filter((m) => m.id !== tempId), confirmedUserMsg, assistantMsg]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Voice interaction failed');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      if (err.message?.includes('rate limit') || err.message?.includes('429')) {
        setErrorCode('429');
      } else if (err.message?.includes('entitlement') || err.message?.includes('403')) {
        setErrorCode('403');
      }
    } finally {
      setIsVoiceProcessing(false);
    }
  };

  /**
   * Plays synthesized audio for a voice response message
   */
  const handlePlayAudio = (messageId: string) => {
    const audioDataUri = audioPlayMap[messageId];
    if (audioDataUri) {
      const audio = new Audio(audioDataUri);
      audio.play().catch((playErr) => {
        setErrorMessage(`Failed to play audio: ${playErr.message}`);
      });
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
          <Button size="sm" onClick={handleCreateNewConversation} disabled={isLoading || isRecording}>
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
            <span style={{ fontSize: '1.2rem' }}>🎙️</span>
            <div>
              <span style={{ fontWeight: 600 }}>DOC SEARCH AI Copilot & Voice</span>
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
              {errorCode === '429' ? '⚠️ Rate Limit Exceeded: ' : errorCode === 'MIC_DENIED' ? '🎙️ Permission Error: ' : '⛔ Access Denied: '}
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
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎙️💬</div>
              <div style={{ fontWeight: 600 }}>Secure Role-Aware AI Assistant & Voice</div>
              <p style={{ fontSize: '0.85rem', maxWidth: '350px' }}>
                Speak or type instructions, summarize clinical encounters, or query metrics. Voice requests route strictly through the 9-gate Permission Firewall.
              </p>
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.senderType === 'USER';
            const hasAudio = Boolean(audioPlayMap[m.id]);
            const safetyCat = m.metadata?.['safetyCategory'] as string | undefined;

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

                  {!isUser && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.75rem' }}>
                      {m.capabilityId && <Badge variant="neutral">{m.capabilityId}</Badge>}
                      {m.toolId && <Badge variant="primary">Tool: {m.toolId}</Badge>}
                      {safetyCat && (
                        <Badge variant={safetyCat === 'EXECUTED' ? 'success' : safetyCat === 'PENDING_CONFIRMATION' ? 'warning' : 'neutral'}>
                          {safetyCat}
                        </Badge>
                      )}
                      {hasAudio && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePlayAudio(m.id)}
                          style={{ fontSize: '0.75rem', padding: '2px 8px', height: '24px' }}
                        >
                          🔊 Listen
                        </Button>
                      )}
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

          {isVoiceProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563EB', fontSize: '0.85rem' }}>
              <span>🎙️ Ingesting voice, transcribing via STT, and enforcing firewall gates...</span>
            </div>
          )}

          {isRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626', fontSize: '0.85rem' }}>
              <span style={{ animation: 'pulse 1.5s infinite' }}>🔴 Recording audio... Click "Stop" when done speaking.</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message, or click the microphone to speak..."
            disabled={isSending || isRecording || isVoiceProcessing}
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

          {/* Voice Input Button */}
          {isRecording ? (
            <Button
              onClick={handleStopRecording}
              variant="danger"
              style={{ height: '42px', backgroundColor: '#DC2626', color: '#FFFFFF' }}
            >
              ⏹️ Stop
            </Button>
          ) : (
            <Button
              onClick={handleStartRecording}
              disabled={isSending || isVoiceProcessing}
              variant="outline"
              style={{ height: '42px' }}
              title="Speak to DOC SEARCH Assistant"
            >
              🎙️ Voice
            </Button>
          )}

          {/* Text Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={isSending || isRecording || isVoiceProcessing || !inputText.trim()}
            style={{ height: '42px' }}
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
};
