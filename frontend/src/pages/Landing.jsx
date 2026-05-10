import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AboutBuilder from "@/components/AboutBuilder";
import { ArrowRight, Sparkles, FileText, Layout, Shield, Zap, Brain } from "lucide-react";

const features = [
  { icon: Brain, title: "AI Writing Assistant", desc: "Claude & GPT-powered summaries, bullet rewrites, and grammar fixes." },
  { icon: Layout, title: "9 Premium Templates", desc: "Modern, Minimal, Corporate, Software Engineer, Data Scientist & more." },
  { icon: Shield, title: "ATS Score Checker", desc: "Real-time keyword and ATS optimization analysis." },
  { icon: FileText, title: "PDF / DOCX / Print", desc: "Pixel-perfect downloads. Share via public link." },
  { icon: Zap, title: "Live Preview", desc: "See your resume update in real time as you type." },
  { icon: Sparkles, title: "Drag & Drop Sections", desc: "Reorder sections instantly. Customize colors and fonts." },
];

const templates = ["Modern", "Minimal", "Corporate", "Software Engineer", "Data Scientist", "Fresher", "Internship", "Elegant", "Creative"];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grain opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-16 grid md:grid-cols-12 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="md:col-span-7">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-6">A premium SaaS · Built for India & beyond</div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
              Craft a resume that <em className="text-accent not-italic">opens doors.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
              ResumeAI combines elegant editorial templates with AI from Claude Sonnet 4.5 and GPT-5 to help you write, optimize, and ship a job-winning resume in minutes.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/register" data-testid="hero-get-started">
                <Button size="lg" className="rounded-sm bg-primary hover:bg-primary/90 px-8 h-12">
                  Get Started Free <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
              <Link to="/pricing" data-testid="hero-pricing">
                <Button size="lg" variant="outline" className="rounded-sm h-12">View Pricing</Button>
              </Link>
            </div>
            <div className="mt-10 text-xs text-muted-foreground tracking-wider">
              ATS-FRIENDLY · PIXEL-PERFECT · 9 TEMPLATES · UPI PAYMENTS · MADE IN INDIA
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="md:col-span-5">
            <div className="relative aspect-[3/4] bg-white border border-border rounded-md shadow-2xl p-7 rotate-1 hover:rotate-0 transition-transform">
              <div className="flex items-center gap-3 pb-3 mb-3 border-b border-border">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-heading text-2xl shrink-0 shadow-md">
                  AS
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-2xl font-heading leading-tight truncate">Aarav Sharma</div>
                  <div className="text-[11px] text-muted-foreground">Software Engineer · Bengaluru</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">aarav@example.com · +91 98xxx</div>
                </div>
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] mb-2 text-accent font-semibold">Experience</div>
              <div className="space-y-2.5 text-[12px]">
                <div><b>Senior Engineer</b> · Stripe · 2022-Present<br/><span className="text-muted-foreground">Led payment infrastructure handling 2B+/year.</span></div>
                <div><b>Engineer</b> · Razorpay · 2019-2022<br/><span className="text-muted-foreground">Shipped UPI 2.0 integration across 200+ merchants.</span></div>
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] mt-4 mb-2 text-accent font-semibold">Skills</div>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                {["React","FastAPI","MongoDB","AWS","Python"].map(s => <span key={s} className="border border-border px-2 py-0.5 rounded-sm">{s}</span>)}
              </div>
              <div className="absolute -bottom-4 -right-4 bg-accent text-white text-xs px-3 py-2 rounded-sm shadow-lg font-medium">ATS Score: 94</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Why ResumeAI</div>
        <h2 className="font-heading text-4xl sm:text-5xl tracking-tight max-w-2xl">Everything you need. Nothing you don't.</h2>
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="border border-border bg-card p-8 rounded-md hover:shadow-md transition-shadow">
              <f.icon className="text-accent mb-4" size={28} />
              <h3 className="font-heading text-2xl mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section className="bg-secondary/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Templates</div>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight">Nine designs. One winning resume.</h2>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {templates.map((t, i) => (
              <div key={t} className="bg-white border border-border rounded-md aspect-[3/4] p-4 hover:scale-[1.02] transition-transform shadow-sm">
                <div className={`h-1 w-12 mb-3 ${i % 3 === 0 ? 'bg-accent' : i % 3 === 1 ? 'bg-primary' : 'bg-foreground'}`}></div>
                <div className="font-heading text-xl mb-1 text-ink">{t}</div>
                <div className="space-y-1.5 mt-4">
                  <div className="h-2 bg-secondary rounded-sm w-full"></div>
                  <div className="h-2 bg-secondary rounded-sm w-3/4"></div>
                  <div className="h-2 bg-secondary rounded-sm w-5/6"></div>
                  <div className="h-2 bg-secondary rounded-sm w-2/3 mt-3"></div>
                  <div className="h-2 bg-secondary rounded-sm w-4/5"></div>
                </div>
                <div className="absolute"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AboutBuilder />

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h2 className="font-heading text-5xl sm:text-6xl tracking-tight">Ready to land your next role?</h2>
        <p className="mt-6 text-muted-foreground max-w-xl mx-auto">Join thousands building beautiful, ATS-friendly resumes with ResumeAI.</p>
        <Link to="/register" className="inline-block mt-10" data-testid="cta-get-started">
          <Button size="lg" className="rounded-sm bg-accent hover:bg-accent/90 h-12 px-10">Build Resume — It's Free</Button>
        </Link>
      </section>

      <Footer />
    </div>
  );
}
