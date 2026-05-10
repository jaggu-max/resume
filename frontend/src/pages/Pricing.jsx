import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, Crown } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const PLANS = [
  { id: "free", name: "Free", price: "₹0", features: ["3 templates", "Basic editor", "PDF download", "Limited AI", "Basic ATS optimization"], cta: "Current Plan" },
  { id: "pro", name: "Pro", price: "₹199", period: "one-time", features: ["All 9 templates", "Unlimited AI (Claude + GPT)", "PDF + DOCX downloads", "ATS Score Checker", "Share link", "Custom template builder", "Faster AI responses"], featured: true },
  { id: "premium", name: "Premium", price: "₹499", period: "one-time", features: ["Everything in Pro", "Priority AI", "Premium creative templates", "Build your own templates", "No watermark", "Executive resume styles", "Priority support", "Future template updates"] },
];

export default function Pricing() {
  const { user } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Pricing</div>
        <h1 className="font-heading text-5xl sm:text-6xl">Simple. Honest. Fair.</h1>
        <p className="text-muted-foreground mt-4 max-w-xl">Pay once. Use forever. Indian UPI accepted (Google Pay, PhonePe, Paytm).</p>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {PLANS.map(p => (
            <div key={p.id} className={`border rounded-md p-8 bg-card ${p.featured ? "border-accent ring-1 ring-accent" : "border-border"}`} data-testid={`plan-${p.id}`}>
              {p.featured && <div className="text-[10px] uppercase tracking-[0.2em] text-accent mb-2 flex items-center gap-1"><Crown size={12}/> Most popular</div>}
              <div className="font-heading text-3xl">{p.name}</div>
              <div className="mt-2 mb-6">
                <span className="font-heading text-5xl">{p.price}</span>
                {p.period && <span className="text-sm text-muted-foreground ml-2">{p.period}</span>}
              </div>
              <ul className="space-y-2 mb-8">
                {p.features.map(f => <li key={f} className="text-sm flex items-start gap-2"><Check size={14} className="mt-0.5 text-accent"/>{f}</li>)}
              </ul>
              {p.id === "free" ? (
                <Button variant="outline" className="w-full rounded-sm" disabled={user?.plan === "free"}>
                  {user?.plan === "free" ? "Current Plan" : "Free Plan"}
                </Button>
              ) : (
                <Button className={`w-full rounded-sm ${p.featured?"bg-accent":"bg-primary"}`} onClick={() => user ? nav(`/payment/${p.id}`) : nav("/login")} data-testid={`buy-${p.id}`}>
                  {user?.plan === p.id ? "Active" : `Upgrade to ${p.name}`}
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-8">All payments are verified manually within 24 hours. UPI: Google Pay, PhonePe, Paytm supported.</p>
      </div>
      <Footer />
    </div>
  );
}
