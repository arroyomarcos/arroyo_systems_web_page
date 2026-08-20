import React, { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Download, FileSignature } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  getContractSigningUrl,
  getPublicQuote,
  payQuoteDeposit,
  payQuoteFinal,
  publicQuotePdfUrl,
} from "../lib/api";
import { Button } from "../components/ui/button";

const formatAmount = (amount, currency = "eur") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};

const ItemRow = ({ item, currency }) => (
  <div className="flex justify-between py-3 border-b border-slate-100 last:border-0">
    <div>
      <p className="font-medium text-[color:var(--arroyo-navy)]">
        {item.type === "package" ? item.description : "Engineering Hours"}
      </p>
      {item.type === "engineering_hours" && (
        <p className="text-sm text-[color:var(--arroyo-muted)]">
          {item.quantity}h × {formatAmount(item.unit_price, currency)}
          {item.description ? ` — ${item.description}` : ""}
        </p>
      )}
      {item.type === "package" && item.extra_hours > 0 && (
        <p className="text-sm text-[color:var(--arroyo-muted)]">Includes {item.extra_hours}h extra hours</p>
      )}
    </div>
    <p className="font-medium">{formatAmount(item.total, currency)}</p>
  </div>
);

const QuotePublic = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [signing, setSigning] = useState(false);
  const paymentFlag = searchParams.get("payment");
  const signingEvent = searchParams.get("event");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPublicQuote(token);
      setQuote(data);
      setError(null);
    } catch (err) {
      setError(err?.response?.status === 404 ? "not_found" : "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // DocuSign's own redirect param is optimistic UI only - the source of truth for
  // contract_status is the webhook, so if we come back still showing GENERATED, poll once
  // more shortly after in case the webhook simply hasn't landed yet.
  useEffect(() => {
    if (signingEvent === "signing_complete" && quote?.contract_status === "GENERATED") {
      const t = setTimeout(load, 2500);
      return () => clearTimeout(t);
    }
  }, [signingEvent, quote?.contract_status, load]);

  const onPayDeposit = async () => {
    setPaying(true);
    try {
      const { url } = await payQuoteDeposit(token);
      window.location.href = url;
    } catch (err) {
      setPaying(false);
    }
  };

  const onPayFinal = async () => {
    setPaying(true);
    try {
      const { url } = await payQuoteFinal(token);
      window.location.href = url;
    } catch (err) {
      setPaying(false);
    }
  };

  const onSignContract = async () => {
    setSigning(true);
    try {
      const { url } = await getContractSigningUrl(token);
      window.location.href = url;
    } catch (err) {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="App">
        <Header />
        <main className="legal-page">
          <div className="arroyo-container py-16 text-center text-[color:var(--arroyo-muted)]">Loading quote...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <Header />
        <main className="legal-page">
          <div className="arroyo-container py-16 text-center">
            <h1 className="section-heading">Quote not found</h1>
            <p className="arroyo-body mt-4">
              This link may be invalid or expired. Contact us at{" "}
              <a className="link-underline" href="mailto:contact@arroyo-systems.com">
                contact@arroyo-systems.com
              </a>
              .
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const contractStatus = quote.contract_status || "NOT_GENERATED";
  const contractSigned = contractStatus === "SIGNED";
  const canSignContract = contractStatus === "GENERATED";
  const canPayDeposit = ["SENT", "VIEWED"].includes(quote.status) && contractSigned;
  const canPayFinal = quote.status === "FINAL_PAYMENT_REQUESTED";
  const depositPaid = quote.payment_status !== "UNPAID";
  const fullyPaid = quote.payment_status === "PAID";

  return (
    <div className="App">
      <Header />
      <main className="legal-page">
        <div className="arroyo-container py-12 max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[color:var(--arroyo-accent)]">
            Arroyo Systems
          </p>
          <h1 className="section-heading mt-3">Quote {quote.quote_number}</h1>
          <p className="arroyo-body mt-2">
            {quote.customer.company_name}
            {quote.project_name ? ` — ${quote.project_name}` : ""}
          </p>

          {paymentFlag === "success" && (
            <div className="mt-6 flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3 text-sm">
              <CheckCircle2 size={16} /> Payment received - thank you.
            </div>
          )}

          <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
            {quote.items.map((item) => (
              <ItemRow key={item.id} item={item} currency={quote.currency} />
            ))}

            <div className="mt-4 pt-4 border-t border-slate-200 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[color:var(--arroyo-muted)]">Subtotal</span>
                <span>{formatAmount(quote.subtotal, quote.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--arroyo-muted)]">VAT ({(quote.vat_rate * 100).toFixed(0)}%)</span>
                <span>{formatAmount(quote.vat_amount, quote.currency)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>Total</span>
                <span>{formatAmount(quote.total, quote.currency)}</span>
              </div>
            </div>
          </div>

          {(canSignContract || contractSigned) && (
            <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-medium mb-3 flex items-center gap-2">
                <FileSignature size={18} /> Service contract
              </h2>
              {contractSigned ? (
                <div className="flex items-center gap-2 text-emerald-700 text-sm">
                  <CheckCircle2 size={16} /> Contract signed{quote.contract_number ? ` (${quote.contract_number})` : ""}.
                </div>
              ) : (
                <>
                  <p className="arroyo-body text-sm mb-4">
                    Please sign the service contract before paying the 50% deposit. Signing opens
                    a secure DocuSign window.
                  </p>
                  <Button onClick={onSignContract} disabled={signing} size="lg" className="w-full sm:w-auto">
                    {signing ? "Opening DocuSign..." : "Sign the service contract"}
                  </Button>
                  {signingEvent && signingEvent !== "signing_complete" && (
                    <p className="text-sm text-amber-700 mt-3">
                      Signing was not completed ({signingEvent.replaceAll("_", " ")}). You can try again above.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-medium mb-3">Payment terms</h2>
            <div className="flex justify-between text-sm py-1">
              <span>50% upfront</span>
              <span className={depositPaid ? "text-emerald-700 font-medium" : ""}>
                {formatAmount(quote.deposit_amount, quote.currency)} {depositPaid ? "· Paid" : ""}
              </span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span>50% remaining (upon delivery)</span>
              <span className={fullyPaid ? "text-emerald-700 font-medium" : ""}>
                {formatAmount(quote.remaining_amount, quote.currency)} {fullyPaid ? "· Paid" : ""}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {canPayDeposit && (
              <Button onClick={onPayDeposit} disabled={paying} size="lg" className="flex-1">
                {paying ? "Redirecting..." : "Accept & Pay 50%"}
              </Button>
            )}
            {canPayFinal && (
              <Button onClick={onPayFinal} disabled={paying} size="lg" className="flex-1">
                {paying ? "Redirecting..." : "Pay Remaining Balance"}
              </Button>
            )}
            <a href={publicQuotePdfUrl(token)} target="_blank" rel="noreferrer" className="flex-1">
              <Button variant="outline" size="lg" className="w-full">
                <Download size={16} /> Download Quote PDF
              </Button>
            </a>
          </div>

          {!canPayDeposit && !canPayFinal && !fullyPaid && !canSignContract && (
            <p className="text-sm text-[color:var(--arroyo-muted)] mt-4">
              This quote is currently: {quote.status.replaceAll("_", " ").toLowerCase()}.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default QuotePublic;
