import { motion } from "framer-motion";
import { Instagram, Code2, Sparkles } from "lucide-react";

export default function AboutBuilder() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20" data-testid="about-builder">
      <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">About the Builder</div>
      <h2 className="font-heading text-4xl sm:text-5xl mb-10">Crafted with care.</h2>
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="relative overflow-hidden border border-border rounded-md bg-card p-8 md:p-12 grid md:grid-cols-12 gap-8 items-center">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none"/>
        <div className="md:col-span-4 flex justify-center md:justify-start">
          <motion.div whileHover={{ scale: 1.04, rotate: -2 }} transition={{ type: "spring", stiffness: 200 }}
            className="w-44 h-44 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center text-bone shadow-xl">
            <span className="font-heading text-7xl">J</span>
          </motion.div>
        </div>
        <div className="md:col-span-8">
          <div className="text-xs uppercase tracking-[0.2em] text-accent mb-2">Builder</div>
          <h3 className="font-heading text-4xl sm:text-5xl tracking-tight">Jagadeesh S Bentoor</h3>
          <p className="text-muted-foreground mt-2">Full Stack Developer · AI/ML Enthusiast</p>
          <p className="mt-5 text-sm leading-relaxed max-w-xl">
            ResumeAI is a personal labor of love — built to help job seekers craft beautiful, ATS-friendly resumes
            with the help of cutting-edge AI. Designed for India and the world.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <a href="https://www.instagram.com/god_of_world_j" target="_blank" rel="noreferrer" data-testid="builder-instagram"
              className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-sm hover:bg-accent/90 transition-colors">
              <Instagram size={16}/> @god_of_world_j
            </a>
            <span className="inline-flex items-center gap-2 border border-border px-3 py-2 rounded-sm text-xs">
              <Code2 size={14}/> React · FastAPI · MongoDB
            </span>
            <span className="inline-flex items-center gap-2 border border-border px-3 py-2 rounded-sm text-xs">
              <Sparkles size={14}/> Claude 4.5 · GPT-5
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
