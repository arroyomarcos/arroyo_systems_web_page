import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { getToken, clearToken } from "../../lib/auth";
import { useAdminQuotes } from "../../lib/useAdminQuotes";
import { useToast } from "../../hooks/use-toast";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import AdminTopBar from "./components/AdminTopBar";

const STATUS_STYLES = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  VIEWED: "bg-indigo-100 text-indigo-700",
  ACCEPTED: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  FINAL_PAYMENT_REQUESTED: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-slate-200 text-slate-500",
  VOID: "bg-slate-200 text-slate-400",
};

const PAYMENT_STYLES = {
  UNPAID: "bg-slate-100 text-slate-600",
  DEPOSIT_PAID: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
};

const StatusBadge = ({ value, styles }) => (
  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${styles[value] || "bg-slate-100 text-slate-600"}`}>
    {value?.replaceAll("_", " ")}
  </span>
);

const formatAmount = (amount, currency) => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: (currency || "eur").toUpperCase() }).format(
      amount
    );
  } catch {
    return `${amount} ${currency}`;
  }
};

const AdminQuotes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!getToken()) navigate("/admin", { replace: true });
  }, [navigate]);

  const handleUnauthorized = useCallback(() => {
    clearToken();
    navigate("/admin", { replace: true });
  }, [navigate]);

  const handleError = useCallback(
    (err, title) => {
      toast({ title, description: err?.response?.data?.detail || err?.message || "", variant: "destructive" });
    },
    [toast]
  );

  const { items, total, loading } = useAdminQuotes({ onUnauthorized: handleUnauthorized, onError: handleError });

  const logout = useCallback(() => {
    clearToken();
    navigate("/admin", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[color:var(--arroyo-bg-soft)]">
      <AdminTopBar onLogout={logout} />

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="arroyo-display text-2xl">Quotes</h1>
            <p className="text-sm text-[color:var(--arroyo-muted)]">{total} total</p>
          </div>
          <Button onClick={() => navigate("/admin/quotes/new")}>
            <Plus size={14} /> New quote
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[color:var(--arroyo-muted)]">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[color:var(--arroyo-muted)]">
                    No quotes yet
                  </TableCell>
                </TableRow>
              )}
              {items.map((quote) => (
                <TableRow
                  key={quote.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/quotes/${quote.id}`)}
                >
                  <TableCell className="font-medium">{quote.quote_number}</TableCell>
                  <TableCell>{quote.customer_name}</TableCell>
                  <TableCell>{quote.project_name}</TableCell>
                  <TableCell>{formatAmount(quote.total, quote.currency)}</TableCell>
                  <TableCell>
                    <StatusBadge value={quote.status} styles={STATUS_STYLES} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={quote.payment_status} styles={PAYMENT_STYLES} />
                  </TableCell>
                  <TableCell>{new Date(quote.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default AdminQuotes;
