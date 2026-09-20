"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Send, Sparkles, RefreshCw, User, Bot } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "What do my latest biomarker results mean?",
  "Is my hemoglobin level normal?",
  "Summarize my most recent report.",
  "Which of my values are outside the reference range?",
  "What lifestyle changes would help my health?",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="w-2 h-2 bg-[#0a4e3e] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 bg-[#0a4e3e] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 bg-[#0a4e3e] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

export default function AskAIPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  async function sendMessage(question: string) {
    if (!question.trim() || loading || !user) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to get response.");
      }

      const data = await res.json();

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Sorry, something went wrong: ${err.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function clearChat() {
    setMessages([]);
  }

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f9faf7]">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-[#ecebe6] shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#0a4e3e] via-[#1c7f69] to-[#8bd0b3] text-xs font-black text-white shadow-sm">
              S
            </div>
            Ask AI
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Ask anything about your health records — Swasthya has full context.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear chat
          </button>
        )}
      </header>

      {/* ── Chat Area ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-24 py-6 space-y-6">

        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
            {/* Swasthya brand logo */}
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#0a4e3e] via-[#1d8f72] to-[#9be1c7] text-4xl font-black text-white shadow-[0_18px_45px_rgba(10,78,62,0.22)] ring-4 ring-white">
                S
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-[#0a4e3e] opacity-20 animate-ping" />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Hello, {user?.displayName?.split(" ")[0] || "there"}!</h2>
              <p className="text-sm text-slate-400 font-medium mt-1 max-w-xs">
                I'm Swasthya, your AI health assistant. I have access to all your uploaded medical reports. Ask me anything!
              </p>
            </div>

            {/* Suggested questions */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs font-semibold text-[#0a4e3e] bg-[#eef8f5] border border-[#d6ede4] px-4 py-2 rounded-full hover:bg-[#d6ede4] transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* Avatar — assistant */}
            {msg.role === "assistant" && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-[#eef8f5] border border-[#d6ede4] flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#0a4e3e]" />
              </div>
            )}

            <div className={`max-w-[75%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#0a4e3e] text-white rounded-tr-sm"
                    : "bg-white border border-[#ecebe6] text-slate-700 rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.content}
              </div>
              <span className="text-[10px] font-semibold text-slate-400 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Avatar — user */}
            {msg.role === "user" && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-[#0a4e3e] flex items-center justify-center">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="You" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="shrink-0 w-8 h-8 rounded-full bg-[#eef8f5] border border-[#d6ede4] flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#0a4e3e]" />
            </div>
            <div className="bg-white border border-[#ecebe6] px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-6 md:px-12 lg:px-24 py-4 bg-white border-t border-[#ecebe6]">
        {/* Suggested chips (shown after first message) */}
        {messages.length > 0 && messages.length < 3 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="text-[11px] font-semibold text-[#0a4e3e] bg-[#eef8f5] border border-[#d6ede4] px-3 py-1.5 rounded-full hover:bg-[#d6ede4] transition-all disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              id="ask-ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask anything about your health..."
              disabled={loading}
              className="w-full bg-[#faf9f5] border border-[#ebeae4] rounded-2xl py-3.5 pl-5 pr-5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-[#0a4e3e] focus:bg-white transition-all resize-none leading-relaxed disabled:opacity-60"
            />
          </div>

          <button
            id="ask-ai-send"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="shrink-0 bg-[#0a4e3e] hover:bg-[#083d31] disabled:bg-slate-200 disabled:cursor-not-allowed text-white p-3.5 rounded-2xl transition-all flex items-center justify-center shadow-sm"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <p className="text-[10px] text-slate-400 font-medium text-center mt-2">
          Swasthya AI may make mistakes. Always consult a healthcare professional.
        </p>
      </div>
    </main>
  );
}