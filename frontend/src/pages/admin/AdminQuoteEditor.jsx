import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Copy, Download, ExternalLink, Plus, Send, Trash2, Wallet } from "lucide-react";
import { getToken, clearToken } from "../../lib/auth";
import {
  adminQuotePdfUrl,
  createQuote,
  createQuoteVersion,
  getQuote,
  requestFinalPayment,
  sendQuote,
  updateQuote,
} from "../../lib/api";
import { useToast } from "../../hooks/use-toast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import AdminTopBar from "./components/AdminTopBar";

// Mirrors backend/pricing.py exactly - a live preview only. The server always recomputes
// and is the authoritative source for what actually gets saved, PDF'd and charged.
const PACKAGES_PREVIEW = {
  rapid_design: { name: "Rapid Design", basePrice: 1300, maxPrice: 1550, maxExtraHours: 5 },
  validated_design: { name: "Validated Design", basePrice: 3000, maxPrice: 3500, maxExtraHours: 10 },
  performance_design: { name: "Performance Design", basePrice: 5000, maxPrice: 5750, maxExtraHours: 15 },
};
const ENGINEERING_RATE = 50;
const EDITABLE_STATUSES = ["DRAFT", "SENT", "VIEWED"];

const previewItemTotal = (item) => {
  if (item.type === "package") {
    const spec = PACKAGES_PREVIEW[item.product_key];
    if (!spec) return 0;
    const extraHours = Number(item.extra_hours) || 0;
    let price = spec.basePrice + extraHours * ENGINEERING_RATE;
    if (extraHours <= spec.maxExtraHours) price = Math.min(price, spec.maxPrice);
    return price;
  }
  return (Number(item.quantity) || 0) * ENGINEERING_RATE;
};

const formatAmount = (amount, currency = "eur") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};

const emptyCustomer = { company_name: "", contact_person: "", email: "", billing_address: "", vat_id: "" };

const AdminQuoteEditor = () => {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quote, setQuote] = useState(null); // last saved quote from the server, when editing/viewing
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [customer, setCustomer] = useState(emptyCustomer);
  const [projectName, setProjectName] = useState("");
  const [notes, setNotes] = useState("");
  const [validDays, setValidDays] = useState(30);
  const [vatPercent, setVatPercent] = useState(21);
  const [currency, setCurrency] = useState("eur");
  const [items, setItems] = useState([]);
  const [extraHours, setExtraHours] = useState(""); // Engineering Hours added at final-payment time
  const [extraHoursDesc, setExtraHoursDesc] = useState("");
  const [requestingFinal, setRequestingFinal] = useState(false);

  React.useEffect(() => {
    if (!getToken()) navigate("/admin", { replace: true });
  }, [navigate]);

  const handleUnauthorized = useCallback(() => {
    clearToken();
    navigate("/admin", { replace: true });
  }, [navigate]);

  const handleError = useCallback(
    (err, title) => {
      if (err?.response?.status === 401) return handleUnauthorized();
      toast({ title, description: err?.response?.data?.detail || err?.message || "", variant: "destructive" });
    },
    [toast, handleUnauthorized]
  );

  const editable =
    isNew || (quote && quote.payment_status === "UNPAID" && EDITABLE_STATUSES.includes(quote.status));

  const loadQuote = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const data = await getQuote(id);
      setQuote(data);
      setCustomer({
        company_name: data.customer.company_name || "",
        contact_person: data.customer.contact_person || "",
        email: data.customer.email || "",
        billing_address: data.customer.billing_address || "",
        vat_id: data.customer.vat_id || "",
      });
      setProjectName(data.project_name || "");
      setNotes(data.notes || "");
      setVatPercent(Math.round((data.vat_rate || 0) * 10000) / 100);
      setCurrency(data.currency || "eur");
      setItems(
        data.items.map((it) => ({
          type: it.type,
          product_key: it.product_key,
          description: it.description,
          quantity: it.quantity,
          extra_hours: it.extra_hours,
          override_confirmed: false,
        }))
      );
    } catch (err) {
      handleError(err, "Could not load quote");
    } finally {
      setLoading(false);
    }
  }, [id, isNew, handleError]);

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  const logout = useCallback(() => {
    clearToken();
    navigate("/admin", { replace: true });
  }, [navigate]);

  const addPackageItem = (productKey) => {
    setItems((prev) => [
      ...prev,
      { type: "package", product_key: productKey, description: "", extra_hours: 0, override_confirmed: false },
    ]);
  };

  const addEngineeringHoursItem = () => {
    setItems((prev) => [...prev, { type: "engineering_hours", quantity: 1, description: "" }]);
  };

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, it) => sum + previewItemTotal(it), 0);
  const vatAmount = subtotal * (vatPercent / 100);
  const total = subtotal + vatAmount;
  // Deposit is 50% of package items only (incl. VAT) - Engineering Hours always fall
  // entirely into the remaining/second payment. Mirrors backend/pricing.py.
  const packageSubtotal = items
    .filter((it) => it.type === "package")
    .reduce((sum, it) => sum + previewItemTotal(it), 0);
  const deposit = (packageSubtotal * (1 + vatPercent / 100)) / 2;

  const buildPayload = () => ({
    customer,
    project_name: projectName,
    notes: notes || undefined,
    valid_days: Number(validDays) || 30,
    vat_rate: (Number(vatPercent) || 0) / 100,
    currency,
    items: items.map((it) =>
      it.type === "package"
        ? {
            type: "package",
            product_key: it.product_key,
            description: it.description || undefined,
            extra_hours: Number(it.extra_hours) || 0,
            override_confirmed: !!it.override_confirmed,
          }
        : {
            type: "engineering_hours",
            quantity: Number(it.quantity) || 0,
            description: it.description || undefined,
          }
    ),
  });

  const onSave = async () => {
    if (!projectName || !customer.company_name || !customer.email || items.length === 0) {
      toast({ title: "Fill in customer, project name, and at least one service", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      const saved = isNew ? await createQuote(payload) : await updateQuote(id, payload);
      toast({ title: isNew ? "Quote created" : "Quote updated" });
      navigate(`/admin/quotes/${saved.id}`);
    } catch (err) {
      handleError(err, "Could not save quote");
    } finally {
      setSaving(false);
    }
  };

  const clientQuoteUrl = quote?.public_token ? `${window.location.origin}/quote/${quote.public_token}` : "";

  const onCopyClientLink = () => {
    navigator.clipboard.writeText(clientQuoteUrl);
    toast({ title: "Link copied" });
  };

  const onSend = async () => {
    try {
      const updated = await sendQuote(id);
      setQuote(updated);
      toast({ title: "Quote sent" });
    } catch (err) {
      handleError(err, "Could not send quote");
    }
  };

  const onRequestFinalPayment = async () => {
    const qty = Number(extraHours) || 0;
    const additionalItems =
      qty > 0 ? [{ type: "engineering_hours", quantity: qty, description: extraHoursDesc || undefined }] : [];
    setRequestingFinal(true);
    try {
      const updated = await requestFinalPayment(id, additionalItems);
      setQuote(updated);
      setExtraHours("");
      setExtraHoursDesc("");
      toast({ title: "Final payment requested" });
    } catch (err) {
      handleError(err, "Could not request final payment");
    } finally {
      setRequestingFinal(false);
    }
  };

  const onNewVersion = async () => {
    try {
      const versioned = await createQuoteVersion(id);
      toast({ title: `Created version ${versioned.version}` });
      navigate(`/admin/quotes/${versioned.id}`);
    } catch (err) {
      handleError(err, "Could not create a new version");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--arroyo-bg-soft)]">
        <AdminTopBar onLogout={logout} />
        <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 text-[color:var(--arroyo-muted)]">Loading...</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--arroyo-bg-soft)]">
      <AdminTopBar onLogout={logout} />

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="arroyo-display text-2xl">{isNew ? "New quote" : quote?.quote_number}</h1>
            {quote && (
              <p className="text-sm text-[color:var(--arroyo-muted)]">
                {quote.status.replaceAll("_", " ")} · {quote.payment_status.replaceAll("_", " ")}
              </p>
            )}
          </div>
          {!isNew && quote && (
            <div className="flex gap-2 flex-wrap justify-end">
              <a href={adminQuotePdfUrl(id)} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">
                  <Download size={14} /> PDF
                </Button>
              </a>
              {["DRAFT", "SENT"].includes(quote.status) && (
                <Button variant="outline" size="sm" onClick={onSend}>
                  <Send size={14} /> {quote.status === "DRAFT" ? "Send" : "Resend"}
                </Button>
              )}
              {quote.payment_status === "UNPAID" && !editable && (
                <Button variant="outline" size="sm" onClick={onNewVersion}>
                  New version
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-medium">Customer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company name">
              <Input
                value={customer.company_name}
                disabled={!editable}
                onChange={(e) => setCustomer((c) => ({ ...c, company_name: e.target.value }))}
              />
            </Field>
            <Field label="Contact person">
              <Input
                value={customer.contact_person}
                disabled={!editable}
                onChange={(e) => setCustomer((c) => ({ ...c, contact_person: e.target.value }))}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={customer.email}
                disabled={!editable}
                onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
              />
            </Field>
            <Field label="VAT / Tax ID">
              <Input
                value={customer.vat_id}
                disabled={!editable}
                onChange={(e) => setCustomer((c) => ({ ...c, vat_id: e.target.value }))}
              />
            </Field>
            <Field label="Billing address" className="md:col-span-2">
              <Input
                value={customer.billing_address}
                disabled={!editable}
                onChange={(e) => setCustomer((c) => ({ ...c, billing_address: e.target.value }))}
              />
            </Field>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-medium">Quote</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Project name" className="md:col-span-2">
              <Input value={projectName} disabled={!editable} onChange={(e) => setProjectName(e.target.value)} />
            </Field>
            <Field label="Valid for (days)">
              <Input
                type="number"
                min="1"
                value={validDays}
                disabled={!editable}
                onChange={(e) => setValidDays(e.target.value)}
              />
            </Field>
            <Field label="Currency">
              <Input value={currency} disabled={!editable} onChange={(e) => setCurrency(e.target.value)} />
            </Field>
            <Field label="VAT (%)">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={vatPercent}
                disabled={!editable}
                onChange={(e) => setVatPercent(e.target.value)}
              />
            </Field>
            <Field label="Notes" className="md:col-span-3">
              <Input value={notes} disabled={!editable} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Services</h2>
            {editable && (
              <div className="flex gap-2 flex-wrap">
                {Object.entries(PACKAGES_PREVIEW).map(([key, spec]) => (
                  <Button key={key} type="button" variant="outline" size="sm" onClick={() => addPackageItem(key)}>
                    <Plus size={14} /> {spec.name}
                  </Button>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addEngineeringHoursItem}>
                  <Plus size={14} /> Engineering Hours
                </Button>
              </div>
            )}
          </div>

          {items.length === 0 && <p className="text-sm text-[color:var(--arroyo-muted)]">No services added yet.</p>}

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs font-medium text-[color:var(--arroyo-muted)] mb-1">
                        {item.type === "package" ? PACKAGES_PREVIEW[item.product_key]?.name : "Engineering Hours"}
                      </p>
                      <Input
                        placeholder="Description (optional)"
                        value={item.description || ""}
                        disabled={!editable}
                        onChange={(e) => updateItem(index, { description: e.target.value })}
                      />
                    </div>
                    {item.type === "package" ? (
                      <div>
                        <p className="text-xs font-medium text-[color:var(--arroyo-muted)] mb-1">
                          Extra hours (max {PACKAGES_PREVIEW[item.product_key]?.maxExtraHours}h)
                        </p>
                        <Input
                          type="number"
                          min="0"
                          value={item.extra_hours}
                          disabled={!editable}
                          onChange={(e) => updateItem(index, { extra_hours: e.target.value })}
                        />
                        {Number(item.extra_hours) > (PACKAGES_PREVIEW[item.product_key]?.maxExtraHours || 0) && (
                          <label className="flex items-center gap-2 mt-2 text-xs text-amber-700">
                            <input
                              type="checkbox"
                              checked={!!item.override_confirmed}
                              disabled={!editable}
                              onChange={(e) => updateItem(index, { override_confirmed: e.target.checked })}
                            />
                            Confirm hours exceed the standard package range
                          </label>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-[color:var(--arroyo-muted)] mb-1">Hours</p>
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity}
                          disabled={!editable}
                          onChange={(e) => updateItem(index, { quantity: e.target.value })}
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-[color:var(--arroyo-muted)] mb-1">Amount</p>
                      <p className="h-9 flex items-center font-medium">{formatAmount(previewItemTotal(item), currency)}</p>
                    </div>
                  </div>
                  {editable && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-[color:var(--arroyo-muted)]">Subtotal</span>
              <span>{formatAmount(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[color:var(--arroyo-muted)]">VAT ({vatPercent}%)</span>
              <span>{formatAmount(vatAmount, currency)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-1">
              <span>Total</span>
              <span>{formatAmount(total, currency)}</span>
            </div>
            <div className="flex justify-between text-[color:var(--arroyo-muted)]">
              <span>50% upfront / 50% remaining</span>
              <span>
                {formatAmount(deposit, currency)} / {formatAmount(total - deposit, currency)}
              </span>
            </div>
          </div>
        </div>

        {!isNew && quote?.status === "IN_PROGRESS" && quote?.payment_status === "DEPOSIT_PAID" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div>
              <h2 className="font-medium">Request final payment</h2>
              <p className="text-sm text-[color:var(--arroyo-muted)] mt-1">
                The remaining balance is always due in full. If delays or scope changes added
                Engineering Hours, add them here - they're billed entirely in this final payment,
                never split into the deposit already paid.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Extra Engineering Hours (optional)">
                <Input
                  type="number"
                  min="0"
                  value={extraHours}
                  onChange={(e) => setExtraHours(e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Description" className="md:col-span-2">
                <Input
                  value={extraHoursDesc}
                  onChange={(e) => setExtraHoursDesc(e.target.value)}
                  placeholder="e.g. Extra revisions requested by client"
                />
              </Field>
            </div>
            {Number(extraHours) > 0 && (
              <p className="text-sm text-[color:var(--arroyo-muted)]">
                Adds {formatAmount(Number(extraHours) * ENGINEERING_RATE, currency)} to the final payment.
              </p>
            )}
            <div className="flex justify-end">
              <Button onClick={onRequestFinalPayment} disabled={requestingFinal}>
                <Wallet size={14} /> {requestingFinal ? "Requesting..." : "Request final payment"}
              </Button>
            </div>
          </div>
        )}

        {editable && (
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : isNew ? "Create quote" : "Save changes"}
            </Button>
          </div>
        )}

        {!isNew && quote?.public_token && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[color:var(--arroyo-muted)] mb-1">Client link</p>
              <p className="text-sm truncate">{clientQuoteUrl}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={onCopyClientLink}>
                <Copy size={14} /> Copy
              </Button>
              <a href={clientQuoteUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink size={14} /> Open
                </Button>
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const Field = ({ label, children, className = "" }) => (
  <div className={className}>
    <label className="text-xs font-medium text-[color:var(--arroyo-muted)] block mb-1">{label}</label>
    {children}
  </div>
);

export default AdminQuoteEditor;
