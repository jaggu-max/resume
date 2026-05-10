import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { formatErr, API } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ResumePreview from "@/components/ResumePreview";
import AIPanel from "@/components/AIPanel";
import AIChatbot from "@/components/AIChatbot";
import { toast } from "sonner";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Save, Download, Share2, Trash2, Plus, GripVertical, Image as ImgIcon, Printer, Crown } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import saveAs from "file-saver";

const TEMPLATES = ["modern","minimal","corporate","software-engineer","data-scientist","fresher","internship","elegant","creative"];
const PREMIUM_TEMPLATES = ["software-engineer","data-scientist","elegant","creative"];
const FONTS = ["Outfit","Cormorant Garamond","JetBrains Mono","Georgia","Helvetica"];
const SECTION_LABELS = { personal: "Personal", summary: "Summary", experience: "Experience", education: "Education", skills: "Skills", projects: "Projects", certifications: "Certifications", languages: "Languages", achievements: "Achievements", interests: "Interests", references: "References" };

function SortableSection({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="border border-border rounded-sm bg-card mb-3" data-testid={`section-${id}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30">
        <button {...attributes} {...listeners} className="drag-handle text-muted-foreground" data-testid={`drag-${id}`}><GripVertical size={14}/></button>
        <span className="text-xs uppercase tracking-[0.18em] font-medium">{SECTION_LABELS[id] || id}</span>
      </div>
      <div className="p-3 space-y-2">{children}</div>
    </div>
  );
}

const Field = ({ label, value, onChange, type="text", testid }) => (
  <div>
    <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</label>
    <input type={type} value={value || ""} onChange={e=>onChange(e.target.value)} className="w-full border border-border rounded-sm px-2 py-1.5 text-sm focus:border-primary outline-none" data-testid={testid}/>
  </div>
);
const Area = ({ label, value, onChange, testid }) => (
  <div>
    <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</label>
    <textarea value={value || ""} onChange={e=>onChange(e.target.value)} className="w-full border border-border rounded-sm px-2 py-1.5 text-sm focus:border-primary outline-none min-h-[70px]" data-testid={testid}/>
  </div>
);

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [saving, setSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState(null);
  const [tab, setTab] = useState("content"); // content, design, ai, downloads
  const previewRef = useRef(null);
  const dirtyRef = useRef(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { (async () => {
    try { const r = await api.get(`/resumes/${id}`); setResume(r.data); } catch (e) { toast.error(formatErr(e)); navigate("/dashboard"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })(); }, [id]);

  // Auto-save: 2s debounced after edits (preserves all data)
  useEffect(() => {
    if (!resume) return;
    if (!dirtyRef.current) return;
    const t = setTimeout(async () => {
      try {
        await api.put(`/resumes/${id}`, { title: resume.title, template: resume.template, data: resume.data, customization: resume.customization });
        setAutoSaved(new Date().toLocaleTimeString());
        dirtyRef.current = false;
      } catch (e) { /* silent */ }
    }, 2000);
    return () => clearTimeout(t);
  }, [resume, id]);

  const update = (patch) => { dirtyRef.current = true; setResume(r => ({ ...r, ...patch })); };
  const updateData = (patch) => { dirtyRef.current = true; setResume(r => ({ ...r, data: { ...r.data, ...patch } })); };
  const setSec = (key, value) => updateData({ [key]: value });

  const save = async () => {
    setSaving(true);
    try { const r = await api.put(`/resumes/${id}`, { title: resume.title, template: resume.template, data: resume.data, customization: resume.customization }); setResume(r.data); toast.success("Saved"); }
    catch (e) { toast.error(formatErr(e)); }
    finally { setSaving(false); }
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = resume.data.sections.indexOf(active.id);
    const newIdx = resume.data.sections.indexOf(over.id);
    updateData({ sections: arrayMove(resume.data.sections, oldIdx, newIdx) });
  };

  const onPhoto = async (file) => {
    if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    try {
      const r = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = `${process.env.REACT_APP_BACKEND_URL}${r.data.url}`;
      updateData({ personal: { ...resume.data.personal, photo: url } });
      toast.success("Photo uploaded");
    } catch (e) { toast.error(formatErr(e)); }
  };

  const downloadPDF = async () => {
    if (!previewRef.current) return;
    toast.info("Generating PDF…");
    const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const w = 210, h = (canvas.height * 210) / canvas.width;
    let pos = 0;
    if (h <= 297) { pdf.addImage(img, "PNG", 0, 0, w, h); }
    else {
      let remaining = h;
      while (remaining > 0) {
        pdf.addImage(img, "PNG", 0, pos, w, h);
        remaining -= 297; pos -= 297;
        if (remaining > 0) pdf.addPage();
      }
    }
    pdf.save(`${resume.title || "resume"}.pdf`);
  };

  const downloadDOCX = async () => {
    const d = resume.data;
    const children = [
      new Paragraph({ children: [new TextRun({ text: d.personal?.name || "Resume", bold: true, size: 36 })] }),
      new Paragraph({ children: [new TextRun({ text: d.personal?.title || "", italics: true })] }),
      new Paragraph({ children: [new TextRun({ text: [d.personal?.email, d.personal?.phone, d.personal?.location].filter(Boolean).join(" · ") })] }),
      new Paragraph({ text: "" }),
    ];
    if (d.summary) { children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, text: "Summary" })); children.push(new Paragraph({ text: d.summary })); }
    (d.experience || []).forEach(e => { children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, text: `${e.role} - ${e.company}` })); children.push(new Paragraph({ text: `${e.start} – ${e.end}` })); children.push(new Paragraph({ text: e.description || "" })); });
    (d.education || []).forEach(e => { children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, text: e.degree })); children.push(new Paragraph({ text: `${e.school} · ${e.year}` })); });
    if (d.skills?.length) { children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, text: "Skills" })); children.push(new Paragraph({ text: d.skills.join(", ") })); }
    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${resume.title || "resume"}.docx`);
  };

  const shareLink = () => {
    const url = `${window.location.origin}/share/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied!");
  };

  if (!resume) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading editor…</div>;

  const accent = resume.customization?.accent || "#D46B4E";
  const isPremiumTemplate = PREMIUM_TEMPLATES.includes(resume.template);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="border-b border-border bg-background sticky top-16 z-30">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <input value={resume.title} onChange={e => update({ title: e.target.value })} className="font-heading text-2xl bg-transparent outline-none border-0 px-0 max-w-xs" data-testid="resume-title"/>
          <div className="flex gap-1 bg-secondary rounded-sm p-1 text-xs">
            {["content","design","ai","downloads"].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded-sm capitalize ${tab===t?"bg-primary text-primary-foreground":""}`} data-testid={`tab-${t}`}>{t}</button>
            ))}
          </div>
          <div className="ml-auto flex gap-2 items-center">
            {autoSaved && <span className="text-[10px] text-muted-foreground hidden sm:inline" data-testid="autosave-status">Auto-saved {autoSaved}</span>}
            <Button variant="outline" size="sm" onClick={shareLink} className="rounded-sm" data-testid="share-btn"><Share2 size={14}/></Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-sm" data-testid="print-btn"><Printer size={14}/></Button>
            <Button size="sm" onClick={save} disabled={saving} className="rounded-sm bg-primary" data-testid="save-btn"><Save size={14} className="mr-1"/>{saving?"Saving…":"Save"}</Button>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Sidebar */}
        <aside className="lg:col-span-4 xl:col-span-3 border-r border-border p-4 overflow-y-auto thin-scroll max-h-[calc(100vh-130px)]" data-testid="editor-sidebar">
          {tab === "content" && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={resume.data.sections} strategy={verticalListSortingStrategy}>
                {resume.data.sections.map(secKey => (
                  <SortableSection key={secKey} id={secKey}>
                    {secKey === "personal" && (
                      <>
                        <Field testid="f-name" label="Full Name" value={resume.data.personal.name} onChange={v=>setSec("personal", { ...resume.data.personal, name: v })}/>
                        <Field testid="f-title" label="Title" value={resume.data.personal.title} onChange={v=>setSec("personal", { ...resume.data.personal, title: v })}/>
                        <Field testid="f-email" label="Email" value={resume.data.personal.email} onChange={v=>setSec("personal", { ...resume.data.personal, email: v })}/>
                        <Field testid="f-phone" label="Phone" value={resume.data.personal.phone} onChange={v=>setSec("personal", { ...resume.data.personal, phone: v })}/>
                        <Field testid="f-location" label="Location" value={resume.data.personal.location} onChange={v=>setSec("personal", { ...resume.data.personal, location: v })}/>
                        <Field testid="f-website" label="Website" value={resume.data.personal.website} onChange={v=>setSec("personal", { ...resume.data.personal, website: v })}/>
                        <label className="flex items-center gap-2 text-xs cursor-pointer mt-2">
                          <input type="file" accept="image/*" className="hidden" onChange={e=>onPhoto(e.target.files[0])} data-testid="photo-input"/>
                          <span className="border border-border rounded-sm px-3 py-2 inline-flex items-center gap-2 hover:bg-secondary"><ImgIcon size={14}/>Upload Photo</span>
                          {resume.data.personal.photo && <img src={resume.data.personal.photo} alt="" className="w-10 h-10 rounded-sm object-cover"/>}
                        </label>
                        {resume.data.personal.photo && (
                          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={()=>setSec("personal", { ...resume.data.personal, photo: "" })}>Remove photo</Button>
                        )}
                      </>
                    )}
                    {secKey === "summary" && <Area testid="f-summary" label="Professional Summary" value={resume.data.summary} onChange={v=>setSec("summary", v)}/>}
                    {secKey === "experience" && (
                      <ListEditor items={resume.data.experience} onChange={v=>setSec("experience", v)} fields={[
                        { k: "role", l: "Role" }, { k: "company", l: "Company" }, { k: "location", l: "Location" },
                        { k: "start", l: "Start" }, { k: "end", l: "End" }, { k: "description", l: "Description", area: true }
                      ]} addLabel="Add Experience" testid="exp"/>
                    )}
                    {secKey === "education" && (
                      <ListEditor items={resume.data.education} onChange={v=>setSec("education", v)} fields={[
                        { k:"degree",l:"Degree" },{ k:"school",l:"School" },{ k:"year",l:"Year" },{ k:"gpa",l:"GPA" }
                      ]} addLabel="Add Education" testid="edu"/>
                    )}
                    {secKey === "skills" && (
                      <TagEditor items={resume.data.skills} onChange={v=>setSec("skills", v)} testid="skills"/>
                    )}
                    {secKey === "projects" && (
                      <ListEditor items={resume.data.projects} onChange={v=>setSec("projects", v)} fields={[
                        { k:"name",l:"Project Name" },{ k:"link",l:"Link" },{ k:"description",l:"Description",area:true }
                      ]} addLabel="Add Project" testid="prj"/>
                    )}
                    {secKey === "certifications" && (
                      <ListEditor items={resume.data.certifications} onChange={v=>setSec("certifications", v)} fields={[
                        { k:"name",l:"Name" },{ k:"issuer",l:"Issuer" },{ k:"year",l:"Year" }
                      ]} addLabel="Add Certification" testid="cert"/>
                    )}
                    {secKey === "languages" && (
                      <ListEditor items={resume.data.languages} onChange={v=>setSec("languages", v)} fields={[
                        { k:"name",l:"Language" },{ k:"level",l:"Level (Native/Fluent)" }
                      ]} addLabel="Add Language" testid="lang"/>
                    )}
                    {secKey === "achievements" && <TagEditor items={resume.data.achievements} onChange={v=>setSec("achievements", v)} testid="ach"/>}
                    {secKey === "interests" && <TagEditor items={resume.data.interests} onChange={v=>setSec("interests", v)} testid="int"/>}
                    {secKey === "references" && (
                      <ListEditor items={resume.data.references} onChange={v=>setSec("references", v)} fields={[
                        { k:"name",l:"Name" },{ k:"role",l:"Role" },{ k:"contact",l:"Contact" }
                      ]} addLabel="Add Reference" testid="ref"/>
                    )}
                  </SortableSection>
                ))}
              </SortableContext>
            </DndContext>
          )}

          {tab === "design" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Template</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {TEMPLATES.map(t => {
                    const locked = PREMIUM_TEMPLATES.includes(t) && !["pro","premium"].includes(resume?._userPlan) && !window.__isPremium;
                    return (
                      <button key={t} onClick={() => update({ template: t })} className={`relative aspect-[3/4] border rounded-sm p-2 text-[10px] capitalize ${resume.template===t?"border-accent ring-1 ring-accent":"border-border hover:border-accent/60"}`} data-testid={`pick-${t}`}>
                        {t.replace("-"," ")}
                        {PREMIUM_TEMPLATES.includes(t) && <Crown size={10} className="absolute top-1 right-1 text-accent"/>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Accent Color</label>
                <input type="color" value={accent} onChange={e=>update({ customization: { ...resume.customization, accent: e.target.value }})} className="w-full h-10 rounded-sm border border-border" data-testid="color-picker"/>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Font</label>
                <select value={resume.customization.font} onChange={e=>update({ customization: { ...resume.customization, font: e.target.value }})} className="w-full border border-border rounded-sm px-2 py-2 text-sm" data-testid="font-select">
                  {FONTS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Font Size: {resume.customization.fontSize}px</label>
                <input type="range" min={10} max={18} value={resume.customization.fontSize} onChange={e=>update({ customization: { ...resume.customization, fontSize: Number(e.target.value) }})} className="w-full" data-testid="font-size"/>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Section Spacing: {resume.customization.spacing}px</label>
                <input type="range" min={8} max={32} value={resume.customization.spacing} onChange={e=>update({ customization: { ...resume.customization, spacing: Number(e.target.value) }})} className="w-full" data-testid="spacing"/>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={resume.customization.dark} onChange={e=>update({ customization: { ...resume.customization, dark: e.target.checked }})} data-testid="dark-toggle"/> Dark editor mode
                </label>
              </div>
              {isPremiumTemplate && <div className="text-xs text-accent border border-accent/40 rounded-sm p-2">Premium template. <Link to="/pricing" className="underline">Upgrade</Link> to unlock downloads without watermark.</div>}
            </div>
          )}

          {tab === "ai" && (
            <>
              <AIPanel
                resume={resume}
                onApply={(text) => { setSec("summary", text); toast.success("Applied to summary"); }}
                onApplySection={(key, value) => setSec(key, value)}
              />
              <AIChatbot provider="openai" />
            </>
          )}

          {tab === "downloads" && (
            <div className="space-y-2">
              <Button onClick={downloadPDF} className="w-full justify-start rounded-sm" data-testid="download-pdf"><Download size={14} className="mr-2"/>Download PDF</Button>
              <Button onClick={downloadDOCX} variant="outline" className="w-full justify-start rounded-sm" data-testid="download-docx"><Download size={14} className="mr-2"/>Download DOCX</Button>
              <Button onClick={() => window.print()} variant="outline" className="w-full justify-start rounded-sm" data-testid="download-print"><Printer size={14} className="mr-2"/>Print</Button>
              <Button onClick={shareLink} variant="outline" className="w-full justify-start rounded-sm" data-testid="download-share"><Share2 size={14} className="mr-2"/>Copy Share Link</Button>
              <div className="text-xs text-muted-foreground mt-3">Tip: Use Print → "Save as PDF" for native browser PDF output.</div>
              <Link to="/ats" className="block text-center text-accent text-sm underline mt-4" data-testid="goto-ats">Run ATS Score Check →</Link>
            </div>
          )}
        </aside>

        {/* Preview */}
        <main className="lg:col-span-8 xl:col-span-9 bg-secondary/30 p-4 overflow-y-auto thin-scroll max-h-[calc(100vh-130px)]" style={{ background: resume.customization.dark ? "#1A1D1A" : undefined }}>
          <div className="flex justify-center">
            <div ref={previewRef}><ResumePreview resume={resume}/></div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ListEditor({ items=[], onChange, fields, addLabel, testid }) {
  const add = () => onChange([...(items||[]), Object.fromEntries(fields.map(f => [f.k, ""]))]);
  const upd = (i, k, v) => onChange(items.map((it, idx) => idx===i ? { ...it, [k]: v } : it));
  const del = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="border border-border rounded-sm p-2 space-y-1.5 relative">
          <button onClick={()=>del(i)} className="absolute top-1 right-1 text-muted-foreground hover:text-destructive" data-testid={`${testid}-del-${i}`}><Trash2 size={12}/></button>
          {fields.map(f => f.area ?
            <Area key={f.k} label={f.l} value={it[f.k]} onChange={v=>upd(i,f.k,v)} testid={`${testid}-${f.k}-${i}`}/> :
            <Field key={f.k} label={f.l} value={it[f.k]} onChange={v=>upd(i,f.k,v)} testid={`${testid}-${f.k}-${i}`}/>
          )}
        </div>
      ))}
      <Button size="sm" variant="outline" className="w-full rounded-sm" onClick={add} data-testid={`${testid}-add`}><Plus size={12} className="mr-1"/>{addLabel}</Button>
    </div>
  );
}

function TagEditor({ items=[], onChange, testid }) {
  const [v, setV] = useState("");
  const add = () => { if (v.trim()) { onChange([...(items||[]), v.trim()]); setV(""); } };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((t, i) => (
          <span key={i} className="text-xs border border-border rounded-sm px-2 py-1 flex items-center gap-1">
            {t}<button onClick={()=>onChange(items.filter((_,idx)=>idx!==i))} className="text-muted-foreground" data-testid={`${testid}-rm-${i}`}>×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>e.key==="Enter" && (e.preventDefault(), add())} className="flex-1 border border-border rounded-sm px-2 py-1 text-sm" placeholder="Add and press Enter" data-testid={`${testid}-input`}/>
        <Button size="sm" className="rounded-sm" onClick={add} data-testid={`${testid}-add`}><Plus size={12}/></Button>
      </div>
    </div>
  );
}
