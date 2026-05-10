import { useState } from "react";
import api, { formatErr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, ScanSearch, Lightbulb, FileCheck2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ACTIONS = [
  { key: "summary", icon: Sparkles, label: "Generate Summary", autoApply: "summary" },
  { key: "skills", icon: Lightbulb, label: "Suggest Skills", autoApply: "skills" },
  { key: "improve", icon: Wand2, label: "Improve Selected Text", autoApply: null },
  { key: "grammar", icon: FileCheck2, label: "Grammar Fix", autoApply: null },
  { key: "keywords", icon: ScanSearch, label: "ATS Keywords", autoApply: null },
];

export default function AIPanel({ resume, onApply, onApplySection }) {
  const [provider, setProvider] = useState("openai"); // GPT-5 default for credit efficiency
  const [text, setText] = useState("");
  const [jd, setJd] = useState("");
  const [busy, setBusy] = useState(null);
  const [out, setOut] = useState("");
  const [lastFeature, setLastFeature] = useState(null);

  const run = async (feature) => {
    setBusy(feature); setOut(""); setLastFeature(feature);
    try {
      const ctx = JSON.stringify(resume?.data || {}).slice(0, 3500);
      const payload = {
        provider,
        feature,
        context: ctx,
        job_description: jd || "",
        text: text || "",
        selected_text: text || "",
        mode: feature,
      };
      console.log("[AI] →", feature, provider);
      const r = await api.post("/ai", payload);
      const result = r.data?.result || "";
      setOut(result);
      console.log("[AI] ✓", feature, "len=", result.length);

      // Auto-apply for summary and skills
      const action = ACTIONS.find(a => a.key === feature);
      if (action?.autoApply === "summary" && onApplySection) {
        onApplySection("summary", result);
        toast.success("Summary added to your resume!");
      } else if (action?.autoApply === "skills" && onApplySection) {
        const skills = result.split(/[,\n]/).map(s => s.trim()).filter(Boolean).slice(0, 12);
        onApplySection("skills", [...new Set([...(resume?.data?.skills || []), ...skills])]);
        toast.success(`Added ${skills.length} skills!`);
      } else {
        toast.success("Generated. Click Apply to use it.");
      }
    } catch (e) {
      console.error("[AI] ✗", feature, e);
      toast.error(formatErr(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 text-xs">
        <button onClick={() => setProvider("openai")} className={`flex-1 py-2 border rounded-sm transition-colors ${provider==="openai"?"bg-primary text-primary-foreground border-primary":"border-border hover:bg-secondary"}`} data-testid="ai-gpt">GPT-5</button>
        <button onClick={() => setProvider("anthropic")} className={`flex-1 py-2 border rounded-sm transition-colors ${provider==="anthropic"?"bg-primary text-primary-foreground border-primary":"border-border hover:bg-secondary"}`} data-testid="ai-claude">Claude 4.5</button>
      </div>
      <textarea placeholder="Selected text — use for Improve / Grammar Fix" value={text} onChange={e=>setText(e.target.value)} className="w-full text-xs border border-border rounded-sm p-2 h-16 focus:border-primary outline-none" data-testid="ai-text"/>
      <textarea placeholder="Job description — for ATS Keywords" value={jd} onChange={e=>setJd(e.target.value)} className="w-full text-xs border border-border rounded-sm p-2 h-16 focus:border-primary outline-none" data-testid="ai-jd"/>
      <div className="grid grid-cols-1 gap-2">
        {ACTIONS.map(a => (
          <Button key={a.key} variant="outline" size="sm" disabled={!!busy} onClick={() => run(a.key)} className="justify-start rounded-sm transition-all" data-testid={`ai-${a.key}`}>
            {busy===a.key ? <Loader2 size={14} className="mr-2 animate-spin"/> : <a.icon size={14} className="mr-2"/>}
            {busy===a.key?"Thinking…":a.label}
          </Button>
        ))}
      </div>
      {out && (
        <div className="border border-border rounded-sm p-3 bg-secondary/40 text-xs whitespace-pre-wrap animate-fade-up" data-testid="ai-output">
          {out}
          <div className="mt-2 flex gap-2">
            {lastFeature === "improve" || lastFeature === "grammar" ? (
              <Button size="sm" className="rounded-sm h-7 text-xs" onClick={() => onApply?.(out)} data-testid="ai-apply">Apply</Button>
            ) : null}
            <Button size="sm" variant="ghost" className="rounded-sm h-7 text-xs" onClick={() => { navigator.clipboard.writeText(out); toast.success("Copied"); }}>Copy</Button>
          </div>
        </div>
      )}
    </div>
  );
}
