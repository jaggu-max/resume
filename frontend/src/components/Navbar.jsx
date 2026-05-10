import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

export default function Navbar({ minimal }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
          <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-heading text-xl">R</div>
          <span className="font-heading text-2xl tracking-tight">ResumeAI</span>
        </Link>
        {!minimal && (
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            <Link to="/pricing" className="hover:text-accent transition-colors" data-testid="nav-pricing">Pricing</Link>
            {user && <Link to="/dashboard" className="hover:text-accent transition-colors" data-testid="nav-dashboard">Dashboard</Link>}
            {user && <Link to="/ats" className="hover:text-accent transition-colors" data-testid="nav-ats">ATS Checker</Link>}
            {user?.role === "admin" && <Link to="/admin" className="hover:text-accent transition-colors" data-testid="nav-admin">Admin</Link>}
          </nav>
        )}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-muted-foreground" data-testid="user-name">{user.name}</span>
              <Button variant="outline" size="sm" onClick={async () => { await logout(); navigate("/"); }} data-testid="logout-btn" className="rounded-sm">Logout</Button>
            </>
          ) : (
            <>
              <Link to="/login" data-testid="signin-link"><Button variant="ghost" size="sm" className="rounded-sm">Sign In</Button></Link>
              <Link to="/register" data-testid="signup-link"><Button size="sm" className="rounded-sm bg-primary">Get Started</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
