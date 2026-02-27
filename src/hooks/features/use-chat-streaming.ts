import { useState, useEffect } from 'react';
import { AIChatMessage, ChatSession } from '@shared/types';
import { api } from '@/lib/api-client';

export function useChatStreaming(slug: string) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const initChat = async (isAnonymous: boolean) => {
    const cachedId = localStorage.getItem(`chat_session_${slug}`);
    
    if (cachedId) {
      try {
        const history = await api<AIChatMessage[]>(`/api/${slug}/chat/sessions/${cachedId}/messages`);
        setMessages(history);
        setSessionId(cachedId);
        return;
      } catch (e) {
        localStorage.removeItem(`chat_session_${slug}`);
      }
    }

    try {
      const session = await api<ChatSession>(`/api/${slug}/chat/init`, {
        method: 'POST',
        body: JSON.stringify({ isAnonymous })
      });
      setSessionId(session.id);
      localStorage.setItem(`chat_session_${slug}`, session.id);
    } catch (error) {
      console.error('Failed to init chat session:', error);
    }
  };

  const sendMessage = async (text: string) => {
    if (!sessionId) return;
    setIsStreaming(true);
    
    const userMsg: AIChatMessage = {
      id: crypto.randomUUID(),
      sessionId,
      tenantId: 'temp',
      senderRole: 'user',
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await fetch(`/api/${slug}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          sessionId,
          history: messages.slice(-5).map(m => ({ 
            role: m.senderRole === 'user' ? 'user' : 'model', 
            parts: [{ text: m.text }] 
          }))
        })
      });

      const reader = response.body?.getReader();
      const aiMsgId = crypto.randomUUID();
      const aiMsg: AIChatMessage = {
        id: aiMsgId,
        sessionId,
        tenantId: 'temp',
        senderRole: 'ai',
        text: '',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);

      let accumulatedText = '';
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        accumulatedText += new TextDecoder().decode(value);
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, text: accumulatedText } : m
        ));
      }
    } catch (error) {
      console.error('Streaming error:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  return { messages, sendMessage, isStreaming, initChat, sessionId };
}
