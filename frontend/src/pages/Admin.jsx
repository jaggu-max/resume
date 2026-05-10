import { useEffect, useState } from "react";
import api, { formatErr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye } from "lucide-react";

export default function Admin() {
  const [tab, setTab] = useState("payments");
  const [users, setUsers] = useState([]);
  const [pays, setPays] = useState([]);

  const load = async () => {
    try { const [u, p] = await Promise.all([api.get("/admin/users"), api.get("/admin/payments")]); setUsers(u.data); setPays(p.data); }
    catch (e) { toast.error(formatErr(e)); }
  };
  useEffect(() => { load(); }, []);

  const verify = async (id, action) => {
    try { await api.post(`/admin/payments/${id}/verify`, { action }); toast.success(`Payment ${action}d`); load(); }
    catch (e) { toast.error(formatErr(e)); }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        <h1 className="font-heading text-5xl mb-2">Admin Panel</h1>
        <p className="text-muted-foreground mb-8">Manage users and verify UPI payments.</p>
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("payments")} className={`px-4 py-2 text-sm rounded-sm border ${tab==="payments"?"bg-primary text-primary-foreground border-primary":"border-border"}`} data-testid="admin-tab-payments">Payment Queue ({pays.filter(p => p.status==="submitted").length})</button>
          <button onClick={() => setTab("users")} className={`px-4 py-2 text-sm rounded-sm border ${tab==="users"?"bg-primary text-primary-foreground border-primary":"border-border"}`} data-testid="admin-tab-users">Users ({users.length})</button>
        </div>

        {tab === "payments" && (
          <div className="border border-border rounded-md overflow-hidden" data-testid="payments-table">
            <table className="w-full text-sm">
              <thead className="bg-secondary"><tr>
                <th className="text-left p-3">Order</th><th className="text-left p-3">User</th><th className="text-left p-3">Plan</th><th className="text-left p-3">Amount</th><th className="text-left p-3">UTR</th><th className="text-left p-3">Screenshot</th><th className="text-left p-3">Status</th><th className="text-left p-3">Action</th>
              </tr></thead>
              <tbody>
                {pays.map(p => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">{p.id}</td>
                    <td className="p-3 text-xs">{p.user?.email || p.user_id}</td>
                    <td className="p-3 capitalize">{p.plan}</td>
                    <td className="p-3">₹{p.amount}</td>
                    <td className="p-3 font-mono text-xs">{p.utr || "-"}</td>
                    <td className="p-3">{p.screenshot_id ? <a href={`${process.env.REACT_APP_BACKEND_URL}/api/uploads/${p.screenshot_id}`} target="_blank" rel="noreferrer" className="text-accent inline-flex items-center gap-1" data-testid={`view-${p.id}`}><Eye size={14}/>View</a> : "-"}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded-sm ${p.status==="approved"?"bg-accent text-white":p.status==="rejected"?"bg-destructive text-white":p.status==="submitted"?"bg-yellow-500 text-white":"bg-secondary"}`}>{p.status}</span></td>
                    <td className="p-3">
                      {p.status === "submitted" && (
                        <div className="flex gap-1">
                          <Button size="sm" className="h-7 rounded-sm bg-accent" onClick={()=>verify(p.id, "approve")} data-testid={`approve-${p.id}`}><CheckCircle2 size={12}/></Button>
                          <Button size="sm" variant="outline" className="h-7 rounded-sm" onClick={()=>verify(p.id, "reject")} data-testid={`reject-${p.id}`}><XCircle size={12}/></Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {pays.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No payments yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "users" && (
          <div className="border border-border rounded-md overflow-hidden" data-testid="users-table">
            <table className="w-full text-sm">
              <thead className="bg-secondary"><tr>
                <th className="text-left p-3">Email</th><th className="text-left p-3">Name</th><th className="text-left p-3">Role</th><th className="text-left p-3">Plan</th><th className="text-left p-3">Joined</th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="p-3">{u.email}</td><td className="p-3">{u.name}</td><td className="p-3">{u.role}</td><td className="p-3 capitalize">{u.plan}</td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
