import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { formatErr } from "@/lib/api";
import ResumePreview from "@/components/ResumePreview";

export default function SharedResume() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api.get(`/resumes/share/${id}`).then(r => setResume(r.data)).catch(e => setErr(formatErr(e))); }, [id]);
  if (err) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{err}</div>;
  if (!resume) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  return (
    <div className="min-h-screen bg-secondary/30 py-8 px-4">
      <div className="flex justify-center"><ResumePreview resume={resume}/></div>
      <div className="text-center text-xs text-muted-foreground mt-6">Made with ResumeAI · resumeai.app</div>
    </div>
  );
}
