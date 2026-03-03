import React, { useState, useRef, useEffect } from 'react';
import { useChatStreaming } from '@/hooks/features/use-chat-streaming';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Shield, 
  X, 
  Minus,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface ChatWindowProps {
  slug: string;
  mosqueName: string;
}

export function ChatWindow({ slug, mosqueName }: ChatWindowProps) {
  const { messages, sendMessage, isStreaming, initChat, sessionId } = useChatStreaming(slug);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize session on mount
  useEffect(() => {
    initChat(isAnonymous);
    // Hide hint after 10 seconds
    const timer = setTimeout(() => setShowHint(false), 10000);
    return () => clearTimeout(timer);
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
  }, [messages, isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      <AnimatePresence>
        {/* Chat Toggle Button (FAB) */}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="relative"
          >
            {/* Sapaan Islami Popover */}
            {showHint && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-20 right-0 w-48 p-3 bg-white border border-stone-100 rounded-2xl shadow-xl text-xs text-stone-600 leading-relaxed italic"
              >
                Assalamu'alaikum! Ada yang bisa saya bantu, Akhi/Ukhti?
                <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-stone-100 rotate-45" />
              </motion.div>
            )}
            
            <Button
              size="icon"
              onClick={() => setIsOpen(true)}
              className="h-16 w-16 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-emerald-600/40 border-4 border-white transition-all hover:scale-110 active:scale-95 group"
            >
              <MessageCircle className="h-8 w-8 text-white group-hover:animate-bounce" />
              {isStreaming && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-amber-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </Button>
          </motion.div>
        )}

        {/* Chat Window */}
        {isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="flex flex-col h-[600px] w-[380px] sm:w-[420px] bg-stone-50 border border-stone-200 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-emerald-700 p-5 text-white flex items-center justify-between shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="flex items-center gap-3 relative z-10">
                <Avatar className="h-12 w-12 border-2 border-white/20 shadow-sm">
                  <AvatarImage src="/assets/mosque-icon.png" />
                  <AvatarFallback className="bg-emerald-800"><Sparkles className="h-5 w-5 text-emerald-200" /></AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-sm leading-tight">{mosqueName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <p className="text-[10px] text-emerald-100 uppercase tracking-widest font-black">Asisten Digital Aktif</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 relative z-10">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("text-white rounded-full h-9 w-9", isAnonymous && "bg-amber-500/20 text-amber-200")}
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  title={isAnonymous ? "Mode Samaran Aktif" : "Aktifkan Mode Samaran"}
                >
                  <Shield className={cn("h-5 w-5", isAnonymous && "fill-current")} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/10 rounded-full h-9 w-9"
                  onClick={() => setIsOpen(false)}
                >
                  <ChevronDown className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-5" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-stone-400 space-y-4 pt-20">
                  <div className="bg-stone-100 p-6 rounded-full">
                    <MessageCircle className="h-10 w-10 opacity-20" />
                  </div>
                  <div className="text-center px-8 space-y-2">
                    <p className="text-sm font-bold text-stone-600 italic">"Assalamu'alaikum Warahmatullahi Wabarakatuh"</p>
                    <p className="text-xs leading-relaxed">
                      Saya adalah asisten digital Masjid {mosqueName}. Tanyakan jadwal kajian, laporan kas, atau info lainnya.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {messages.map((m) => (
                  <div 
                    key={m.id} 
                    className={cn(
                      "flex w-full",
                      m.senderRole === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[85%] px-5 py-4 rounded-3xl text-sm shadow-sm",
                      m.senderRole === 'user' 
                        ? "bg-emerald-600 text-white rounded-tr-none" 
                        : "bg-white text-stone-800 border border-stone-100 rounded-tl-none"
                    )}>
                      {m.senderRole === 'ai' && (
                        <div className="flex items-center gap-1.5 mb-2 opacity-40">
                          <Badge variant="outline" className="text-[8px] h-4 py-0 bg-stone-50 border-stone-200">Asisten Digital</Badge>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                      <p className={cn(
                        "text-[9px] mt-2 text-right font-medium",
                        m.senderRole === 'user' ? "text-emerald-100" : "text-stone-300"
                      )}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-stone-100 px-5 py-4 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce" />
                      </div>
                      <span className="text-[10px] uppercase font-black text-emerald-600 tracking-widest ml-2">Berpikir...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-5 bg-white border-t border-stone-100">
              <div className="flex items-center gap-3 bg-stone-50 p-1.5 pl-4 rounded-full border border-stone-100 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all shadow-inner">
                <Input 
                  placeholder={isAnonymous ? "Tanya secara rahasia..." : "Ketik pesan di sini..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="border-none bg-transparent focus-visible:ring-0 placeholder:text-stone-300 text-sm h-10 px-0"
                />
                <Button 
                  size="icon" 
                  onClick={handleSend} 
                  disabled={!input.trim() || isStreaming || !sessionId}
                  className="h-10 w-10 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-md transition-transform active:scale-90 shrink-0"
                >
                  <Send className="h-4 w-4 text-white" />
                </Button>
              </div>
              <p className="text-[9px] text-center text-stone-400 mt-3 font-medium">
                Ditenagai oleh <span className="text-emerald-600 font-bold">MasjidHub AI</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
