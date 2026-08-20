import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Link2 } from "lucide-react";
import { getToken, clearToken } from "../../lib/auth";
import { useAdminOrders } from "../../lib/useAdminOrders";
import { useToast } from "../../hooks/use-toast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import AdminTopBar from "./components/AdminTopBar";

const EMPTY_FORM = {
  description: "",
  amount: "",
  currency: "eur",
  customer_email: "",
  reference: "",
};

const STATUS_STYLES = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  expired: "bg-slate-200 text-slate-600",
};

const formatAmount = (amount, currency) => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: (currency || "eur").toUpperCase() }).format(
      amount
    );
  } catch {
    return `${amount} ${currency}`;
  }
};

const AdminPayments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [lastLink, setLastLink] = useState(null);

  React.useEffect(() => {
    if (!getToken()) navigate("/admin", { replace: true });
  }, [navigate]);

  const handleUnauthorized = useCallback(() => {
    clearToken();
    navigate("/admin", { replace: true });
  }, [navigate]);

  const handleError = useCallback(
    (err, title) => {
      toast({
        title,
        description: err?.response?.data?.detail || err?.message || "",
        variant: "destructive",
      });
    },
    [toast]
  );

  const { items, total, loading, creating, createLink } = useAdminOrders({
    onUnauthorized: handleUnauthorized,
    onError: handleError,
  });

  const logout = useCallback(() => {
    clearToken();
    navigate("/admin", { replace: true });
  }, [navigate]);

  const updateField = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.customer_email) return;

    const session = await createLink({
      description: form.description,
      amount: parseFloat(form.amount),
      currency: form.currency || undefined,
      customer_email: form.customer_email,
      reference: form.reference || undefined,
    });

    if (session) {
      setLastLink(session.url);
      setForm(EMPTY_FORM);
      toast({ title: "Payment link created" });
    }
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied" });
  };

  return (
    <div className="min-h-screen bg-[color:var(--arroyo-bg-soft)]">
      <AdminTopBar onLogout={logout} />

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div>
          <h1 className="arroyo-display text-2xl">Payment links</h1>
          <p className="text-sm text-[color:var(--arroyo-muted)]">
            Generate a Stripe Checkout link for a client quote. Tax is calculated automatically.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white rounded-xl border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-[color:var(--arroyo-muted)]">
              Description
            </label>
            <Input
              value={form.description}
              onChange={updateField("description")}
              placeholder="e.g. DFM review - bracket assembly"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[color:var(--arroyo-muted)]">
              Amount
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={updateField("amount")}
              placeholder="1500.00"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[color:var(--arroyo-muted)]">
              Currency
            </label>
            <Input value={form.currency} onChange={updateField("currency")} placeholder="eur" />
          </div>
          <div>
            <label className="text-xs font-medium text-[color:var(--arroyo-muted)]">
              Client email
            </label>
            <Input
              type="email"
              value={form.customer_email}
              onChange={updateField("customer_email")}
              placeholder="client@example.com"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[color:var(--arroyo-muted)]">
              Reference (optional)
            </label>
            <Input
              value={form.reference}
              onChange={updateField("reference")}
              placeholder="Quote #, PO number..."
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={creating}>
              <Link2 size={14} /> {creating ? "Creating..." : "Create payment link"}
            </Button>
          </div>
        </form>

        {lastLink && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3">
            <span className="text-sm truncate">{lastLink}</span>
            <Button variant="outline" size="sm" onClick={() => copyLink(lastLink)}>
              <Copy size={14} /> Copy
            </Button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-medium">Orders</h2>
            <span className="text-xs text-[color:var(--arroyo-muted)]">{total} total</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[color:var(--arroyo-muted)]">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[color:var(--arroyo-muted)]">
                    No orders yet
                  </TableCell>
                </TableRow>
              )}
              {items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.description}</TableCell>
                  <TableCell>{order.customer_email}</TableCell>
                  <TableCell>{formatAmount(order.amount, order.currency)}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        STATUS_STYLES[order.status] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default AdminPayments;
