import React, { useState } from "react";
import { Check, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { useContent } from "../../i18n/useLang";

const MetaField = ({ label, value }) => (
  <div>
    <p className="eyebrow mb-1">{label}</p>
    <p className="text-base text-[color:var(--arroyo-navy)]">{value}</p>
  </div>
);

const PriceBlock = ({ pkg, className = "" }) => {
  const isQuoted = pkg.priceInclVat === null;
  return (
    <div className={className}>
      <p
        className={
          isQuoted
            ? "text-xl md:text-2xl font-semibold tracking-tight leading-snug text-[color:var(--arroyo-navy)]"
            : "text-[1.75rem] md:text-[2rem] font-semibold tracking-tight leading-none text-[color:var(--arroyo-navy)]"
        }
      >
        {pkg.price}
      </p>
      <p className="text-[0.8125rem] leading-snug text-[color:var(--arroyo-muted)] mt-2 max-w-xs">{pkg.priceNote}</p>
    </div>
  );
};

const PackageDialog = ({ pkg, onOpenChange, t }) => (
  <Dialog open={!!pkg} onOpenChange={onOpenChange}>
    <DialogContent
      overlayClassName="bg-black/30 backdrop-blur-sm"
      className="max-w-2xl max-h-[88vh] overflow-y-auto bg-white border-0 rounded-[28px] p-8 md:p-12"
      style={{ boxShadow: "0 30px 90px -20px rgba(0,0,0,0.35)" }}
    >
      {pkg && (
        <>
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-3xl md:text-[2.5rem] font-semibold tracking-tight leading-tight text-[color:var(--arroyo-navy)]">
              {pkg.name}
            </DialogTitle>
            <DialogDescription className="sr-only">{pkg.tagline}</DialogDescription>
            <p className="text-xl md:text-2xl font-semibold tracking-tight text-[color:var(--arroyo-muted)] leading-snug">
              {pkg.tagline}
            </p>
          </DialogHeader>

          <div className="mt-8 rounded-2xl bg-[color:var(--arroyo-bg-soft)] px-6 py-5">
            <PriceBlock pkg={pkg} />
            {pkg.priceInclVat && (
              <p className="text-sm text-[color:var(--arroyo-muted)] mt-3">{pkg.priceInclVat}</p>
            )}
          </div>

          <p className="arroyo-body text-base md:text-lg mt-8 leading-relaxed">{pkg.description}</p>

          <div className="mt-10">
            <p className="eyebrow mb-4">{t.includesLabel}</p>
            <ul className="space-y-4">
              {pkg.includes.map((d) => (
                <li key={d.title} className="flex gap-3 border-t border-[color:var(--arroyo-line)] pt-4">
                  <Check size={18} className="mt-0.5 shrink-0 text-[color:var(--arroyo-accent)]" />
                  <div>
                    <p className="font-semibold text-[color:var(--arroyo-navy)]">{d.title}</p>
                    <p className="arroyo-body text-[0.9375rem] mt-1">{d.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10">
            <p className="eyebrow mb-4">{t.excludesLabel}</p>
            <ul className="space-y-3">
              {pkg.excludes.map((line) => (
                <li key={line} className="flex gap-3 text-[0.9375rem] arroyo-body">
                  <Minus size={18} className="mt-0.5 shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--arroyo-line)] grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <MetaField label={t.leadTimeLabel} value={pkg.leadTime} />
            <MetaField label={t.revisionsLabel} value={pkg.revisions} />
          </div>

          {pkg.note && (
            <p className="mt-6 pt-6 border-t border-[color:var(--arroyo-line)] text-xs text-[color:var(--arroyo-muted)] leading-relaxed">
              {pkg.note}
            </p>
          )}
        </>
      )}
    </DialogContent>
  </Dialog>
);

const Products = () => {
  const t = useContent().products;
  const [activePackage, setActivePackage] = useState(null);

  return (
    <section id="products" className="py-20 md:py-28 relative bg-white">
      <div className="arroyo-container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-heading">{t.heading}</h2>
          <p className="section-lead mt-5">{t.subtitle}</p>
        </div>

        <div className="mt-12 md:mt-16 space-y-4 max-w-[1080px] mx-auto">
          {t.packages.map((p) => (
            <div key={p.id} className="product-tile">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 md:items-start">
                <div className="md:col-span-5">
                  <h3 className="text-[1.75rem] md:text-[2.25rem] font-semibold tracking-tight leading-tight text-[color:var(--arroyo-navy)]">
                    {p.name}
                  </h3>
                  <PriceBlock pkg={p} className="mt-6" />
                  <p className="mt-4 text-base text-[color:var(--arroyo-muted)]">{p.leadTime}</p>
                </div>

                <div className="md:col-span-7 flex flex-col">
                  <p className="text-xl md:text-[1.5rem] font-semibold tracking-tight leading-snug text-[color:var(--arroyo-navy)]">
                    {p.tagline}
                  </p>
                  <p className="arroyo-body text-base md:text-[1.0625rem] mt-4 max-w-2xl">{p.description}</p>
                  <button
                    type="button"
                    onClick={() => setActivePackage(p)}
                    aria-label={t.viewDetailsAria(p.name)}
                    className="link-chevron mt-6 self-start"
                  >
                    {t.detailsLink}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PackageDialog pkg={activePackage} onOpenChange={(open) => !open && setActivePackage(null)} t={t} />
    </section>
  );
};

export default Products;
