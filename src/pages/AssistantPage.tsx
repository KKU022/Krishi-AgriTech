import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  User as UserIcon,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { apiRequest } from '../lib/api.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Alert } from '../components/common/Alert.js';
import { Badge } from '../components/common/Badge.js';
import { ConversationRecord, ChatMessage } from '../types.js';

export const AssistantPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<ConversationRecord | null>(null);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [config503Error, setConfig503Error] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await apiRequest<{ conversations: ConversationRecord[] }>('/assistant/conversations');
      const list = response.conversations;
      setConversations(list);
      if (list.length > 0) {
        if (!activeConvId) {
          setActiveConvId(list[0].id);
          setActiveConv(list[0]);
        }
      } else {
        handleNewChat();
      }
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages]);

  const selectConversation = async (convId: string) => {
    setActiveConvId(convId);
    setErrorMessage('');
    setConfig503Error(false);
    try {
      const full = await apiRequest<ConversationRecord>(`/assistant/conversations/${convId}`);
      setActiveConv(full);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to open conversation.');
    }
  };

  const handleNewChat = async () => {
    setErrorMessage('');
    setConfig503Error(false);
    const created: ConversationRecord = {
      id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: user?.id || '',
      title: 'New advisory session',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
    setActiveConvId(created.id);
    setActiveConv(created);
    toast.info('New advisory session', 'AgriTech bilingual assistant is ready.');
  };
  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await apiRequest(`/assistant/conversations/${id}`, { method: 'DELETE' });
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      toast.info('Thread removed', 'Past conversation record deleted.');
      if (activeConvId === id) {
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.warn('Failed to delete conversation:', err);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard', 'Advisory response copied.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending || !activeConvId) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setErrorMessage('');
    setConfig503Error(false);
    setIsSending(true);

    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      role: 'user',
      sender: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    if (activeConv) {
      setActiveConv({
        ...activeConv,
        messages: [...activeConv.messages, tempUserMsg],
      });
    }

    try {
      const pendingMessages = [...(activeConv?.messages || []), tempUserMsg];
      const res = await apiRequest<{ reply: string; conversationId: string; messages: ChatMessage[]; conversation: ConversationRecord }>('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: activeConvId,
          language: user?.profile?.language || 'en',
          messages: pendingMessages.map((message) => ({
            ...message,
            role: (message.sender || message.role) === 'assistant' ? 'assistant' : 'user',
          })),
        }),
      });
      setActiveConv(res.conversation);

      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, title: res.conversation.title } : c))
      );
    } catch (err: any) {
      if (err.status === 503 || err.message?.includes('configuration')) {
        setConfig503Error(true);
      } else {
        setErrorMessage(err.message || 'Failed to send message.');
      }
      if (activeConv) {
        setActiveConv({
          ...activeConv,
          messages: activeConv.messages.filter((m) => m.id !== tempUserMsg.id),
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    'What is the recommended seed rate and sowing depth for Wheat?',
    'How do I test my soil moisture before scheduled canal release?',
    'What natural trap crops protect cotton against pink bollworm?',
    'Can I apply neem oil spray during the flowering stage?',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 h-[calc(100vh-6rem)] flex flex-col space-y-3">
      {/* Top Advisory Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#FFC76A]/10 rounded-xl text-xs text-[#F4F7F1] border border-[#FFC76A]/30 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#FFC76A] shrink-0" />
          <span>
            <strong className="text-[#FFC76A]">Safety Mandate: </strong> AgriTech AI refuses specific chemical pesticide dosage amounts to prevent crop burn and toxicity. Always consult product labels and your local KVK extension officer.
          </span>
        </div>
        <div className="shrink-0 flex items-center gap-2 text-[11px]">
          <span className="font-semibold text-[#B6F5D9]">Context: {user?.profile?.state || 'India'}</span>
          <span className="text-emerald-500/30">·</span>
          <span className="text-[#54F5BC] font-bold">Language: {user?.profile?.language === 'hi' ? 'Hindi' : 'English'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-hidden">
        {/* Sidebar: Conversation List */}
        <div className="hidden md:flex md:col-span-4 flex-col bg-[#0D3022]/70 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-4 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-3">
            <h2 className="text-sm font-bold text-[#F4F7F1] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#54F5BC]" />
              <span>Advisory Threads</span>
            </h2>
            <Button size="sm" variant="glass" onClick={handleNewChat} icon={<Plus className="w-3.5 h-3.5 text-[#54F5BC]" />} className="text-xs">
              New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl text-left cursor-pointer transition-all text-xs ${
                    isActive
                      ? 'bg-[#00B879]/20 border border-[#00B879]/40 text-[#F4F7F1] font-semibold shadow-xs'
                      : 'hover:bg-black/40 text-[#B6F5D9] bg-black/20 border border-emerald-500/10'
                  }`}
                >
                  <div className="truncate flex-1 mr-2">
                    <div className="truncate">{conv.title || 'Agronomy Chat'}</div>
                    <div className={`text-[10px] mt-0.5 ${isActive ? 'text-[#54F5BC]' : 'text-[#B6F5D9]/50'}`}>
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                      isActive ? 'hover:bg-white/20 text-[#F4F7F1]' : 'hover:bg-black/40 text-stone-400 hover:text-rose-400'
                    }`}
                    title="Delete thread"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="col-span-12 md:col-span-8 flex flex-col bg-[#0D3022]/70 backdrop-blur-xl rounded-2xl border border-emerald-500/20 overflow-hidden shadow-xs">
          {/* Chat Header */}
          <div className="px-5 py-3 border-b border-emerald-500/20 bg-black/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#00B879]/20 border border-[#00B879]/30 text-[#54F5BC] flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F4F7F1] truncate">
                  {activeConv?.title || 'Digital Farming Assistant'}
                </h3>
                <p className="text-[11px] text-[#B6F5D9]/70">
                  Calibrated to your {user?.profile.soilType || 'farm'} soil & local weather
                </p>
              </div>
            </div>

            <div className="md:hidden">
              <Button size="sm" variant="glass" onClick={handleNewChat} icon={<Plus className="w-3.5 h-3.5 text-[#54F5BC]" />} className="text-xs">
                New
              </Button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {config503Error && (
              <Alert variant="warning" className="shadow-xs">
                <strong>The assistant needs configuration before it can answer.</strong>
                <p className="mt-1 text-xs">
                  A valid GEMINI_API_KEY must be attached in your AI Studio project settings to initiate generative agricultural conversations.
                </p>
              </Alert>
            )}

            {errorMessage && (
              <Alert variant="error">
                {errorMessage}
              </Alert>
            )}

            {activeConv?.messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[90%] sm:max-w-[82%] ${
                    isAssistant ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                      isAssistant
                        ? 'bg-[#00B879]/20 border border-[#00B879]/40 text-[#54F5BC] shadow-2xs'
                        : 'bg-white/10 border border-white/20 text-[#F4F7F1]'
                    }`}
                  >
                    {isAssistant ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-2xs ${
                        isAssistant
                          ? 'bg-black/45 text-[#F4F7F1] rounded-tl-xs border border-emerald-500/20'
                          : 'bg-[#00B879] text-[#071B13] font-semibold rounded-tr-xs shadow-[0_4px_15px_rgba(0,184,121,0.2)]'
                      }`}
                    >
                      {msg.content}
                    </div>

                    <div className="flex items-center justify-between px-1 text-[10px] text-[#B6F5D9]/60">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isAssistant && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          className="flex items-center gap-1 text-[#B6F5D9]/60 hover:text-[#54F5BC] transition-colors ml-2 cursor-pointer"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-[#54F5BC]" />
                              <span className="text-[#54F5BC]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex gap-3 self-start mr-auto max-w-[80%]">
                <div className="w-7 h-7 rounded-full bg-[#00B879]/20 border border-[#00B879]/30 text-[#54F5BC] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-black/45 text-[#54F5BC] rounded-2xl rounded-tl-xs px-4 py-3 text-xs sm:text-sm border border-emerald-500/20 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-[#54F5BC]" />
                  <span>Synthesizing agronomic advisory...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2 border-t border-emerald-500/20 bg-black/20 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-semibold text-[#B6F5D9]/70 whitespace-nowrap">Suggested:</span>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputMessage(qp)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-black/40 border border-emerald-500/20 text-[11px] text-[#B6F5D9] hover:border-[#54F5BC] hover:text-[#54F5BC] transition-colors cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-emerald-500/20 bg-black/30">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  user?.profile?.language === 'hi'
                    ? 'फसल, सिंचाई, बीज या खाद के बारे में पूछें...'
                    : 'Ask about crop care, sowing windows, water needs...'
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                maxLength={1000}
                disabled={isSending}
                className="flex-1 bg-[#071B13]/80 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-[#F4F7F1] placeholder:text-[#B6F5D9]/50 focus:outline-none focus:ring-2 focus:ring-[#00B879] transition-colors"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!inputMessage.trim() || isSending}
                isLoading={isSending}
                className="px-5 py-3 rounded-xl shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#B6F5D9]/60 px-1">
              <span>Rate limit: 20 AI queries/hour to conserve quota</span>
              <span>{inputMessage.length}/1000</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
