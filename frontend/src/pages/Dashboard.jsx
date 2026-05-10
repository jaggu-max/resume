import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatErr } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { Plus, FileText, Trash2, Crown } from "lucide-react";

const TEMPLATES = ["modern","minimal","corporate","software-engineer","data-scientist","fresher","internship","elegant","creative"];

const blankResume = (template = "modern") => ({
  template,
  data: {
    sections: ["personal","summary","experience","education","skills","projects","certifications","languages","achievements","interests","references"],
    personal: { name: "", title: "", email: "", phone: "", location: "", website: "", photo: "" },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    achievements: [],
    interests: [],
    references: [],
    custom: [],
  },
  customization: { accent: "#D46B4E", font: "Outfit", fontSize: 14, spacing: 16, dark: false }
});

export default function Dashboard() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { const r = await api.get("/resumes"); setResumes(r.data); }
    catch (e) { toast.error(formatErr(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (template = "modern") => {
    try {
      const blank = blankResume(template);
      const r = await api.post("/resumes", { title: "Untitled Resume", template, data: blank.data, customization: blank.customization });
      navigate(`/editor/${r.data.id}`);
    } catch (e) { toast.error(formatErr(e)); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this resume?")) return;
    try { await api.delete(`/resumes/${id}`); toast.success("Deleted"); load(); } catch (e) { toast.error(formatErr(e)); }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Welcome back, {user?.name}</div>
            <h1 className="font-heading text-5xl">Your resumes</h1>
          </div>
          <div className="flex items-center gap-3">
            {user?.plan !== "free" && <span className="text-xs px-3 py-1 bg-accent text-white rounded-sm flex items-center gap-1"><Crown size={14}/> {user.plan.toUpperCase()}</span>}
            <Button onClick={() => create("modern")} className="rounded-sm bg-primary" data-testid="create-resume-btn"><Plus size={16} className="mr-2"/>New Resume</Button>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Start with a template</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-2">
            {TEMPLATES.map(t => (
              <button key={t} onClick={() => create(t)} className="aspect-[3/4] bg-white border border-border rounded-md p-2 hover:border-accent hover:scale-105 transition" data-testid={`template-${t}`}>
                <div className="h-1 w-8 bg-accent mb-2"></div>
                <div className="text-[10px] font-medium text-ink capitalize">{t.replace("-"," ")}</div>
                <div className="mt-2 space-y-1">
                  <div className="h-1 bg-secondary rounded-sm"></div>
                  <div className="h-1 bg-secondary rounded-sm w-3/4"></div>
                  <div className="h-1 bg-secondary rounded-sm w-2/3"></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : resumes.length === 0 ? (
          <div className="border border-dashed border-border rounded-md p-16 text-center">
            <FileText size={36} className="mx-auto mb-4 text-muted-foreground"/>
            <p className="text-muted-foreground mb-4">No resumes yet. Create your first one.</p>
            <Button onClick={() => create("modern")} className="rounded-sm bg-primary" data-testid="empty-create-btn">Create Resume</Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="resume-list">
            {resumes.map(r => (
              <div key={r.id} className="border border-border rounded-md bg-card p-6 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-heading text-2xl truncate flex-1">{r.title}</h3>
                  <button onClick={() => remove(r.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition" data-testid={`delete-${r.id}`}><Trash2 size={16}/></button>
                </div>
                <div className="text-xs text-muted-foreground mb-4">Template: {r.template} · Updated {new Date(r.updated_at).toLocaleDateString()}</div>
                <Button variant="outline" className="w-full rounded-sm" onClick={() => navigate(`/editor/${r.id}`)} data-testid={`edit-${r.id}`}>Open Editor</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
