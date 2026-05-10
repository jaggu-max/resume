import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { formatErr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Loader2, Upload } from "lucide-react";

export default function Payment() {
  const { plan } = useParams();
  const nav = useNavigate();
  const [intent, setIntent] = useState(null);
  const [utr, setUtr] = useState("");
  const [screenshotId, setScreenshotId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { (async () => {
    try { const r = await api.post("/payments/intent", { plan }); setIntent(r.data); }
    catch (e) { toast.error(formatErr(e)); nav("/pricing"); }
  })(); }, [plan]);

  const upload = async (file) => {
    if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    try { const r = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } }); setScreenshotId(r.data.id); toast.success("Screenshot uploaded"); }
    catch (e) { toast.error(formatErr(e)); }
  };

  const submit = async () => {
    if (!utr.trim()) return toast.error("Enter UTR / Transaction ID");
    setSubmitting(true);
    try {
      await api.post("/payments/submit", { order_id: intent.order_id, utr, screenshot_id: screenshotId });
      nav("/payment-result/success");
    } catch (e) { toast.error(formatErr(e)); nav("/payment-result/failed"); }
    finally { setSubmitting(false); }
  };

  if (!intent) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-accent"/></div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Order #{intent.order_id}</div>
        <h1 className="font-heading text-5xl mb-2 capitalize">{plan} Plan</h1>
        <p className="text-muted-foreground mb-10">Total: <b className="text-foreground">₹{intent.amount}</b> · Pay using any UPI app</p>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border border-border rounded-md p-6 bg-card">
            <h3 className="font-heading text-2xl mb-4">Scan to pay</h3>
            <div className="bg-white p-4 rounded-sm flex items-center justify-center" data-testid="payment-qr">
              <QRCodeSVG value={intent.upi_link} size={220} fgColor="#202F26"/>
            </div>
            <a href={intent.upi_link} className="block mt-4 text-center bg-accent text-white py-3 rounded-sm hover:bg-accent/90" data-testid="upi-link">Open UPI App</a>
            <p className="text-xs text-muted-foreground mt-3 text-center">Works with Google Pay, PhonePe, Paytm, BHIM</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="border border-border rounded-md p-6 bg-card">
            <h3 className="font-heading text-2xl mb-4">Confirm payment</h3>
            <p className="text-sm text-muted-foreground mb-4">After paying, enter your UPI Transaction ID (UTR) below. Our team will verify and unlock premium within 24 hours.</p>
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">UTR / Transaction ID</label>
            <input value={utr} onChange={e=>setUtr(e.target.value)} className="w-full input-line mb-4" placeholder="e.g. 412345678901" data-testid="utr-input"/>
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Payment Screenshot (optional)</label>
            <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-sm py-4 cursor-pointer hover:bg-secondary/30">
              <Upload size={14}/>{screenshotId ? "Uploaded ✓" : "Upload screenshot"}
              <input type="file" accept="image/*" className="hidden" onChange={e => upload(e.target.files[0])} data-testid="screenshot-input"/>
            </label>
            <Button onClick={submit} disabled={submitting} className="w-full rounded-sm bg-primary mt-6 h-11" data-testid="submit-payment">
              {submitting ? <Loader2 size={14} className="animate-spin mr-2"/> : null}
              {submitting ? "Submitting…" : "Submit for Verification"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
