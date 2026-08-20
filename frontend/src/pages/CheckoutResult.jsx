import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getCheckoutSessionStatus } from "../lib/api";

const CONTACT_EMAIL = "contact@arroyo-systems.com";

const ResultLayout = ({ icon, title, children }) => (
  <div className="App">
    <Header />
    <main className="legal-page">
      <div className="arroyo-container text-center py-16">
        {icon}
        <h1 className="section-heading mt-6">{title}</h1>
        <div className="arroyo-body mt-4 max-w-xl mx-auto">{children}</div>
      </div>
    </main>
    <Footer />
  </div>
);

export const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(sessionId));

  useEffect(() => {
    if (!sessionId) return;
    getCheckoutSessionStatus(sessionId)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <ResultLayout
        icon={<Loader2 className="mx-auto animate-spin text-[color:var(--arroyo-accent)]" size={48} />}
        title="Confirming your payment..."
      >
        This should only take a moment.
      </ResultLayout>
    );
  }

  return (
    <ResultLayout
      icon={<CheckCircle2 className="mx-auto text-emerald-500" size={48} />}
      title="Payment received"
    >
      {order ? (
        <>
          Thank you. We've received your payment for <b>{order.description}</b>. A confirmation has
          been sent to your email.
        </>
      ) : (
        <>
          Thank you for your payment. If you have any questions, reach out at{" "}
          <a className="link-underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </>
      )}
    </ResultLayout>
  );
};

export const CheckoutCancel = () => (
  <ResultLayout
    icon={<XCircle className="mx-auto text-[color:var(--arroyo-muted)]" size={48} />}
    title="Payment cancelled"
  >
    Your payment was not completed. If this was a mistake, you can use the link we sent you again, or
    contact us at{" "}
    <a className="link-underline" href={`mailto:${CONTACT_EMAIL}`}>
      {CONTACT_EMAIL}
    </a>
    .
  </ResultLayout>
);
