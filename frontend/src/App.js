import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import "@/App.css";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Editor from "@/pages/Editor";
import Pricing from "@/pages/Pricing";
import Payment from "@/pages/Payment";
import PaymentResult from "@/pages/PaymentResult";
import Admin from "@/pages/Admin";
import SharedResume from "@/pages/SharedResume";
import ATSChecker from "@/pages/ATSChecker";

function Protected({ children, admin }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster richColors position="top-right" />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/share/:id" element={<SharedResume />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/editor/:id" element={<Protected><Editor /></Protected>} />
          <Route path="/ats" element={<Protected><ATSChecker /></Protected>} />
          <Route path="/payment/:plan" element={<Protected><Payment /></Protected>} />
          <Route path="/payment-result/:status" element={<PaymentResult />} />
          <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
