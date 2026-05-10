import { useEffect, useState } from "react";
import api, { formatErr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ATSChecker() {
  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get("/resumes").then(r => setResumes(r.data)); }, []);

  const run = async () => {
    if (!selectedId) return toast.error("Select a resume first");
    setBusy(true); setResult(null);
    try {
      const resume = resumes.find(r => r.id === selectedId);
      const ctx = JSON.stringify(resume?.data || {}).slice(0, 4000);
      const r = await api.post("/ai", { provider: "openai", feature: "ats", context: ctx, job_description: jd });
      const txt = r.data.result.replace(/```json|```/g, "").trim();
      try { setResult(JSON.parse(txt)); }
      catch { setResult({ raw: txt }); }
    } catch (e) { toast.error(formatErr(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">AI Powered</div>
        <h1 className="font-heading text-5xl mb-2">ATS Score Checker</h1>
        <p className="text-muted-foreground mb-10">See how your resume scores against any job description.</p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Select Resume</label>
              <select value={selectedId} onChange={e=>setSelectedId(e.target.value)} className="w-full border border-border rounded-sm px-3 py-2.5" data-testid="ats-resume-select">
                <option value="">— pick one —</option>
                {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Job Description</label>
              <textarea value={jd} onChange={e=>setJd(e.target.value)} className="w-full border border-border rounded-sm px-3 py-2 min-h-[200px]" placeholder="Paste the job description here…" data-testid="ats-jd"/>
            </div>
            <Button onClick={run} disabled={busy} className="rounded-sm bg-primary h-11 px-8" data-testid="ats-run">
              {busy && <Loader2 size={14} className="animate-spin mr-2"/>}
              {busy ? "Analyzing…" : "Check ATS Score"}
            </Button>
          </div>

          <div className="border border-border rounded-md p-6 bg-card min-h-[300px]">
            {!result && !busy && <div className="text-muted-foreground text-sm">Your ATS analysis will appear here.</div>}
            {busy && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin"/>Running analysis…</div>}
            {result?.score != null && (
              <>
                <div className="text-center mb-6">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">ATS Match Score</div>
                  <div className="font-heading text-7xl text-accent" data-testid="ats-score">{result.score}</div>
                  <div className="text-sm text-muted-foreground">/ 100</div>
                </div>
                {result.matched_keywords?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Matched ({result.matched_keywords.length})</div>
                    <div className="flex flex-wrap gap-1.5">{result.matched_keywords.map((k,i) => <span key={i} className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-sm">{k}</span>)}</div>
                  </div>
                )}
                {result.missing_keywords?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Missing ({result.missing_keywords.length})</div>
                    <div className="flex flex-wrap gap-1.5">{result.missing_keywords.map((k,i) => <span key={i} className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded-sm">{k}</span>)}</div>
                  </div>
                )}
                {result.suggestions?.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Suggestions</div>
                    <ul className="text-sm space-y-1 list-disc pl-5">{result.suggestions.map((s,i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
              </>
            )}
            {result?.raw && <pre className="text-xs whitespace-pre-wrap">{result.raw}</pre>}
          </div>
        </div>
      </div>
    </div>
  );
}
