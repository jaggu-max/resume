import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { formatErr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await login(email, password); toast.success("Welcome back!"); navigate("/dashboard"); }
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
        <h1 className="font-heading text-5xl mb-2">Welcome back.</h1>
        <p className="text-muted-foreground mb-10">Sign in to continue building.</p>
        <form onSubmit={submit} className="space-y-6" data-testid="login-form">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</label>
            <input className="input-line w-full" type="email" required value={email} onChange={e => setEmail(e.target.value)} data-testid="login-email" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Password</label>
            <input className="input-line w-full" type="password" required value={password} onChange={e => setPassword(e.target.value)} data-testid="login-password" />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-sm h-11 bg-primary" data-testid="login-submit">
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
        </div>
        <Button type="button" variant="outline" onClick={google} className="w-full rounded-sm h-11" data-testid="google-login-btn">
          Continue with Google
        </Button>
        <p className="mt-8 text-sm text-muted-foreground">No account? <Link to="/register" className="text-accent underline" data-testid="goto-register">Create one</Link></p>
      </div>
    </div>
  );
}
