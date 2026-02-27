import React, { useState, useRef, useEffect } from 'react';
import { useChatStreaming } from '@/hooks/features/use-chat-streaming';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, User, Shield, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  slug: string;
  mosqueName: string;
}

export function ChatWindow({ slug, mosqueName }: ChatWindowProps) {
  const { messages, sendMessage, isStreaming, initChat, sessionId } = useChatStreaming(slug);
  const [input, setInput] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize session on mount
  useEffect(() => {
    initChat(isAnonymous);
  }, [slug]);

  const handleSend = () => {
    if (!input.trim() || isStreaming || !sessionId) return;
    sendMessage(input);
    setInput('');
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[500px] w-full max-w-md bg-stone-50 border border-stone-200 rounded-3xl shadow-xl overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-emerald-700 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarImage src="/assets/mosque-icon.png" />
            <AvatarFallback className="bg-emerald-800">MH</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-sm leading-tight">{mosqueName}</h3>
            <p className="text-[10px] text-emerald-100 uppercase tracking-widest">Asisten Digital</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("text-white rounded-full transition-colors", isAnonymous && "bg-amber-500/20 text-amber-200")}
          onClick={() => setIsAnonymous(!isAnonymous)}
          title={isAnonymous ? "Mode Samaran Aktif" : "Aktifkan Mode Samaran"}
        >
          <Shield className={cn("h-5 w-5", isAnonymous && "fill-current")} />
        </Button>
      </div>

      {/* Announcements / Quick Snippets area could go here */}

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-stone-400 space-y-4 pt-10">
            <div className="bg-stone-100 p-4 rounded-full">
              <MessageCircle className="h-8 w-8" />
            </div>
            <p className="text-sm text-center px-6">
              Assalamu'alaikum! Ada yang bisa kami bantu seputar kegiatan atau info masjid?
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          {messages.map((m) => (
            <div 
              key={m.id} 
              className={cn(
                "flex w-full",
                m.senderRole === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm",
                m.senderRole === 'user' 
                  ? "bg-emerald-600 text-white rounded-tr-none" 
                  : "bg-white text-stone-800 border border-stone-100 rounded-tl-none"
              )}>
                {m.senderRole === 'ai' && (
                  <div className="flex items-center gap-1.5 mb-1 opacity-60">
                    <Badge variant="outline" className="text-[9px] h-4 py-0 bg-stone-50">AI</Badge>
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                <p className="text-[9px] mt-1 opacity-40 text-right">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-white border border-stone-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm italic text-stone-400 animate-pulse text-xs">
                Sedang mengetik...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-stone-100 flex items-center gap-2">
        <Input 
          placeholder={isAnonymous ? "Bertanya secara anonim..." : "Tulis pesan..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="rounded-full bg-stone-50 border-none focus-visible:ring-emerald-500"
        />
        <Button 
          size="icon" 
          onClick={handleSend} 
          disabled={!input.trim() || isStreaming}
          className="rounded-full bg-emerald-600 hover:bg-emerald-700"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
