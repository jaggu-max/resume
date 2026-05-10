import React from "react";

const Section = ({ title, children, accent }) => (
  <div className="mb-4">
    <div className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-2" style={{ color: accent }}>{title}</div>
    <div className="h-px mb-2" style={{ background: accent, opacity: 0.3 }}></div>
    {children}
  </div>
);

const renderSections = (data, accent, opts={}) => {
  const { sections = [], personal = {}, summary, experience=[], education=[], skills=[], projects=[], certifications=[], languages=[], achievements=[], interests=[], references=[], custom=[] } = data;
  const out = [];
  sections.forEach(s => {
    if (s === "personal") return;
    if (s === "summary" && summary) out.push(<Section key={s} title="Summary" accent={accent}><p className="text-[12px] leading-relaxed">{summary}</p></Section>);
    if (s === "experience") {
      const hasExp = experience.length > 0;
      const hasProjects = projects.length > 0;
      // Smart fallback: if no experience but projects exist, show projects under a fresher-friendly heading
      const expTitle = hasExp ? "Experience" : (hasProjects ? "Academic Projects & Practical Learning" : null);
      if (expTitle) {
        out.push(
          <Section key={s} title={expTitle} accent={accent}>
            {hasExp ? experience.map((e,i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between text-[12px]"><b>{e.role}</b><span className="text-gray-600">{e.start} – {e.end}</span></div>
                <div className="text-[11px] text-gray-700">{e.company} {e.location && `· ${e.location}`}</div>
                <div className="text-[11px] mt-1 whitespace-pre-line">{e.description}</div>
              </div>
            )) : projects.slice(0, 3).map((p,i) => (
              <div key={i} className="mb-2 text-[12px]">
                <b>{p.name}</b> {p.link && <span className="text-[11px] text-gray-600">· {p.link}</span>}
                <div className="text-[11px] whitespace-pre-line">{p.description}</div>
              </div>
            ))}
          </Section>
        );
      }
    }
    if (s === "education" && education.length) out.push(
      <Section key={s} title="Education" accent={accent}>
        {education.map((e,i) => (
          <div key={i} className="mb-2 text-[12px]">
            <div className="flex justify-between"><b>{e.degree}</b><span className="text-gray-600">{e.year}</span></div>
            <div className="text-[11px] text-gray-700">{e.school} {e.gpa && `· GPA ${e.gpa}`}</div>
          </div>
        ))}
      </Section>);
    if (s === "skills" && skills.length) out.push(
      <Section key={s} title="Skills" accent={accent}>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((sk,i) => <span key={i} className="text-[11px] border px-2 py-0.5 rounded-sm" style={{ borderColor: accent + "55" }}>{sk}</span>)}
        </div>
      </Section>);
    if (s === "projects" && projects.length) out.push(
      <Section key={s} title="Projects" accent={accent}>
        {projects.map((p,i) => (
          <div key={i} className="mb-2 text-[12px]">
            <b>{p.name}</b> {p.link && <span className="text-[11px] text-gray-600">· {p.link}</span>}
            <div className="text-[11px] whitespace-pre-line">{p.description}</div>
          </div>
        ))}
      </Section>);
    if (s === "certifications" && certifications.length) out.push(
      <Section key={s} title="Certifications" accent={accent}>
        {certifications.map((c,i) => <div key={i} className="text-[12px]"><b>{c.name}</b> · <span className="text-[11px] text-gray-600">{c.issuer} · {c.year}</span></div>)}
      </Section>);
    if (s === "languages" && languages.length) out.push(
      <Section key={s} title="Languages" accent={accent}>
        <div className="flex flex-wrap gap-3 text-[12px]">{languages.map((l,i) => <span key={i}>{l.name} <span className="text-gray-600 text-[11px]">({l.level})</span></span>)}</div>
      </Section>);
    if (s === "achievements" && achievements.length) out.push(
      <Section key={s} title="Achievements" accent={accent}>
        <ul className="text-[12px] list-disc pl-4">{achievements.map((a,i) => <li key={i}>{a}</li>)}</ul>
      </Section>);
    if (s === "interests" && interests.length) out.push(
      <Section key={s} title="Interests" accent={accent}>
        <div className="flex flex-wrap gap-2 text-[11px]">{interests.map((it,i) => <span key={i}>{it}{i<interests.length-1?" ·":""}</span>)}</div>
      </Section>);
    if (s === "references" && references.length) out.push(
      <Section key={s} title="References" accent={accent}>
        {references.map((r,i) => <div key={i} className="text-[12px]"><b>{r.name}</b> · <span className="text-[11px] text-gray-600">{r.role}, {r.contact}</span></div>)}
      </Section>);
  });
  custom.forEach((c,i) => out.push(<Section key={`c${i}`} title={c.title || "Custom"} accent={accent}><div className="text-[12px] whitespace-pre-line">{c.content}</div></Section>));
  return out;
};

export default function ResumePreview({ resume, scale = 1, forwardRef }) {
  const data = resume?.data || {};
  const personal = data.personal || {};
  const accent = resume?.customization?.accent || "#D46B4E";
  const fontSize = resume?.customization?.fontSize || 14;
  const font = resume?.customization?.font || "Outfit";
  const template = resume?.template || "modern";

  const isTwoCol = ["modern","corporate","data-scientist","creative"].includes(template);
  const headerStyle = ["minimal","fresher","internship","elegant"].includes(template) ? "centered" : "top";

  return (
    <div ref={forwardRef} className="resume-paper print-area" style={{ fontSize, fontFamily: font, transform: `scale(${scale})`, transformOrigin: "top center" }}>
      {/* Header */}
      {headerStyle === "centered" ? (
        <div className="text-center mb-5">
          {personal.photo && <img src={personal.photo} alt="" className="w-20 h-20 rounded-full mx-auto mb-2 object-cover" style={{ border: `2px solid ${accent}` }}/>}
          <div className="font-heading text-3xl">{personal.name || "Your Name"}</div>
          <div className="text-[12px] text-gray-700">{personal.title}</div>
          <div className="text-[11px] text-gray-600 mt-1">
            {[personal.email, personal.phone, personal.location, personal.website].filter(Boolean).join(" · ")}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 mb-5 pb-3" style={{ borderBottom: `2px solid ${accent}` }}>
          {personal.photo && <img src={personal.photo} alt="" className="w-20 h-20 rounded-sm object-cover"/>}
          <div className="flex-1">
            <div className="font-heading text-3xl leading-tight">{personal.name || "Your Name"}</div>
            <div className="text-[12px] text-gray-700">{personal.title}</div>
            <div className="text-[11px] text-gray-600 mt-1">
              {[personal.email, personal.phone, personal.location, personal.website].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>
      )}

      {isTwoCol ? (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2">{renderSections({...data, sections: data.sections.filter(s => ["summary","experience","projects","achievements"].includes(s))}, accent)}</div>
          <div>{renderSections({...data, sections: data.sections.filter(s => ["education","skills","certifications","languages","interests","references"].includes(s))}, accent)}</div>
        </div>
      ) : (
        <div>{renderSections(data, accent)}</div>
      )}
    </div>
  );
}
