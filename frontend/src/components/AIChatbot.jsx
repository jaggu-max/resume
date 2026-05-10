import { useState, useRef, useEffect } from "react";
import api, { formatErr } from "@/lib/api";
import { Send, Bot, User, MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const SUGGESTIONS = [
  "How can I improve my resume?",
  "Tips to boost ATS score",
  "How to prepare for interviews?",
  "Skills for software engineer roles",
];

export default function AIChatbot({ provider = "openai" }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([
    { role: "assistant", content: "Hi! I'm your ResumeAI Assistant. Ask me about your resume, ATS, interviews, or skills." }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history, typing]);

  const send = async (msg) => {
    const text = (msg ?? input).trim();
    if (!text || busy) return;
    const next = [...history, { role: "user", content: text }];
    setHistory(next); setInput(""); setBusy(true); setTyping(true);
    try {
      const r = await api.post("/ai", {
        provider, feature: "chat", text, selected_text: text,
        history: next.slice(-8),
      });
      const reply = r.data?.result || "Sorry, I couldn't respond.";
      // simulate typing for premium feel
      await new Promise(res => setTimeout(res, 250));
      setHistory(h => [...h, { role: "assistant", content: reply }]);
    } catch (e) {
      toast.error(formatErr(e));
      setHistory(h => [...h, { role: "assistant", content: "I hit an error. Please try again." }]);
    } finally { setBusy(false); setTyping(false); }
  };

  return (
    <>
      {/* Inline chatbot card (below AI tools) */}
      <div className="border border-border rounded-md bg-card mt-4" data-testid="ai-chatbot">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/40">
          <Bot size={14} className="text-accent"/>
          <span className="text-xs uppercase tracking-[0.18em] font-medium">AI Assistant</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{provider === "openai" ? "GPT-5" : "Claude 4.5"}</span>
        </div>
        <div className="p-3 space-y-2 max-h-72 overflow-y-auto thin-scroll text-xs" data-testid="chat-messages">
          {history.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && <Bot size={14} className="mt-0.5 text-accent shrink-0"/>}
              <div className={`px-2.5 py-1.5 rounded-sm max-w-[85%] whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{m.content}</div>
              {m.role === "user" && <User size={14} className="mt-0.5 shrink-0"/>}
            </motion.div>
          ))}
          {typing && (
            <div className="flex gap-2 items-center text-muted-foreground">
              <Bot size={14} className="text-accent"/>
              <span className="flex gap-1"><span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></span><span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span></span>
            </div>
          )}
          <div ref={endRef}/>
        </div>
        {history.length <= 1 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)} className="text-[10px] border border-border rounded-sm px-2 py-1 hover:bg-secondary" data-testid="chat-suggestion">{s}</button>
            ))}
          </div>
        )}
        <div className="border-t border-border p-2 flex gap-1">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter" && (e.preventDefault(), send())}
            placeholder="Ask me anything…" className="flex-1 text-xs border border-border rounded-sm px-2 py-1.5 outline-none focus:border-primary" data-testid="chat-input" disabled={busy}/>
          <button onClick={() => send()} disabled={busy} className="px-2 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 disabled:opacity-50" data-testid="chat-send"><Send size={14}/></button>
        </div>
      </div>

      {/* Floating chatbot for non-editor pages */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="hidden">
            {/* placeholder; floating mode disabled to keep this single inline card */}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
