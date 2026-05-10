import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentResult() {
  const { status } = useParams();
  const ok = status === "success";
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center mb-6">
          {ok ? <CheckCircle2 size={64} className="text-accent" data-testid="success-icon"/> : <XCircle size={64} className="text-destructive" data-testid="failed-icon"/>}
        </motion.div>
        <h1 className="font-heading text-5xl mb-3">{ok ? "Payment submitted!" : "Payment failed"}</h1>
        <p className="text-muted-foreground mb-8">
          {ok ? "We've received your transaction. Our team will verify and unlock premium features within 24 hours. You'll get an email when it's ready." : "Something went wrong. Please try again or contact support."}
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/dashboard"><Button className="rounded-sm bg-primary" data-testid="result-dashboard">Back to Dashboard</Button></Link>
          {!ok && <Link to="/pricing"><Button variant="outline" className="rounded-sm">Try Again</Button></Link>}
        </div>
      </div>
    </div>
  );
}
