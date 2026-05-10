import { Instagram, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-24" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 grid md:grid-cols-3 gap-8">
        <div>
          <div className="font-heading text-3xl mb-2">ResumeAI</div>
          <p className="text-sm text-muted-foreground max-w-xs">Premium AI-powered resume builder. Craft a resume that lands interviews.</p>
        </div>
        <div className="text-sm">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Product</div>
          <ul className="space-y-2">
            <li><a href="/pricing" className="hover:text-accent">Pricing</a></li>
            <li><a href="/dashboard" className="hover:text-accent">Dashboard</a></li>
            <li><a href="/ats" className="hover:text-accent">ATS Checker</a></li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Builder</div>
          <p className="font-medium">Jagadeesh S Bentoor</p>
          <p className="text-muted-foreground text-xs mt-1">Full Stack Developer | AI/ML Enthusiast</p>
          <a href="https://www.instagram.com/god_of_world_j" target="_blank" rel="noreferrer" data-testid="instagram-link"
             className="mt-3 inline-flex items-center gap-2 text-sm hover:text-accent transition-colors">
            <Instagram size={16}/> @god_of_world_j
          </a>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5" data-testid="footer-credit">
        © 2026 ResumeAI. Crafted <Heart size={12} className="fill-accent text-accent"/> by Jagadeesh S Bentoor
      </div>
    </footer>
  );
}
