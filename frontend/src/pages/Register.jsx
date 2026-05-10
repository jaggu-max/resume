import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { formatErr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

export default function Register() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await register(email, password, name); toast.success("Account created!"); navigate("/dashboard"); }
    catch (err) { toast.error(formatErr(err)); }
    finally { setLoading(false); }
  };
  const google = async () => {
    const email = prompt("Enter your Google email (demo Google sign-in)");
    if (!email) return;
    try { await googleLogin(email, email.split("@")[0]); toast.success("Signed in!"); navigate("/dashboard"); }
    catch (err) { toast.error(formatErr(err)); }
  };

  return (
    <div className="min-h-screen">
      <Navbar minimal />
      <div className="max-w-md mx-auto px-6 py-16">
        <h1 className="font-heading text-5xl mb-2">Start free.</h1>
        <p className="text-muted-foreground mb-10">Build your first resume in under 5 minutes.</p>
        <form onSubmit={submit} className="space-y-6" data-testid="register-form">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Full Name</label>
            <input className="input-line w-full" required value={name} onChange={e => setName(e.target.value)} data-testid="register-name" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</label>
            <input className="input-line w-full" type="email" required value={email} onChange={e => setEmail(e.target.value)} data-testid="register-email" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Password (min 6)</label>
            <input className="input-line w-full" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} data-testid="register-password" />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-sm h-11 bg-primary" data-testid="register-submit">
            {loading ? "Creating…" : "Create Account"}
          </Button>
        </form>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
        </div>
        <Button type="button" variant="outline" onClick={google} className="w-full rounded-sm h-11" data-testid="google-register-btn">
          Continue with Google
        </Button>
        <p className="mt-8 text-sm text-muted-foreground">Already have one? <Link to="/login" className="text-accent underline" data-testid="goto-login">Sign in</Link></p>
      </div>
    </div>
  );
}
