import React, { useState } from "react";
import { ArrowUpRight, Check, Minus } from "lucide-react";
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
    <p className="text-xs font-semibold tracking-[0.1em] uppercase text-[color:var(--arroyo-muted)] mb-1">
      {label}
    </p>
    <p className="text-sm md:text-base text-[color:var(--arroyo-navy)]">{value}</p>
  </div>
);

const PriceBlock = ({ pkg, className = "" }) => {
  const isQuoted = pkg.priceInclVat === null;
  return (
    <div className={className}>
      <p
        className={
          isQuoted
            ? "text-lg font-bold leading-snug text-[color:var(--arroyo-navy)]"
            : "text-2xl md:text-3xl font-bold text-[color:var(--arroyo-navy)]"
        }
      >
        {pkg.price}
      </p>
      <p className="text-xs md:text-sm text-[color:var(--arroyo-muted)] mt-1">{pkg.priceNote}</p>
    </div>
  );
};

const PackageDialog = ({ pkg, onOpenChange, t }) => (
  <Dialog open={!!pkg} onOpenChange={onOpenChange}>
    <DialogContent
      overlayClassName="bg-white/60"
      className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white border-0 rounded-xl p-8 md:p-10"
      style={{
        boxShadow:
          "0 0 0 1px rgba(43,107,214,0.15), 0 25px 70px -15px rgba(10,26,58,0.35), 0 0 50px rgba(151,192,241,0.55)",
      }}
    >
      {pkg && (
        <>
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="arroyo-display text-2xl md:text-3xl leading-snug text-[color:var(--arroyo-navy)]">
              {pkg.name}
            </DialogTitle>
            <DialogDescription className="sr-only">{pkg.tagline}</DialogDescription>
            <p className="arroyo-body text-base md:text-lg">{pkg.tagline}</p>
          </DialogHeader>

          <div className="mt-6 rounded-lg border border-slate-200 bg-[color:var(--arroyo-bg-soft)] px-5 py-4">
            <PriceBlock pkg={pkg} />
            {pkg.priceInclVat && (
              <p className="text-sm text-[color:var(--arroyo-muted)] mt-1">{pkg.priceInclVat}</p>
            )}
          </div>

          <p className="arroyo-body text-sm md:text-base mt-6">{pkg.description}</p>

          <div className="mt-8">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[color:var(--arroyo-accent)] mb-4">
              {t.includesLabel}
            </p>
            <ul className="space-y-4">
              {pkg.includes.map((d) => (
                <li key={d.title} className="flex gap-3 border-t border-slate-200 pt-4">
                  <Check size={16} className="mt-1 shrink-0 text-[color:var(--arroyo-accent)]" />
                  <div>
                    <p className="font-semibold text-[color:var(--arroyo-navy)]">{d.title}</p>
                    <p className="arroyo-body text-sm mt-1">{d.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[color:var(--arroyo-muted)] mb-4">
              {t.excludesLabel}
            </p>
            <ul className="space-y-3">
              {pkg.excludes.map((line) => (
                <li key={line} className="flex gap-3 text-sm arroyo-body">
                  <Minus size={16} className="mt-0.5 shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <MetaField label={t.leadTimeLabel} value={pkg.leadTime} />
            <MetaField label={t.revisionsLabel} value={pkg.revisions} />
          </div>

          {pkg.note && (
            <p className="mt-6 pt-6 border-t border-slate-200 text-xs text-[color:var(--arroyo-muted)] leading-relaxed">
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
        <div className="max-w-3xl">
          <h2 className="section-heading">{t.heading}</h2>
          <p className="arroyo-body mt-4 text-base md:text-lg max-w-xl">{t.subtitle}</p>
        </div>

        <div className="mt-12 md:mt-16">
          {t.packages.map((p, idx) => (
            <div key={p.id} className="group">
              <div className="thin-divider" />
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 py-8 md:py-10">
                <div className="md:col-span-5">
                  <span className="text-xs md:text-sm font-mono text-[color:var(--arroyo-muted)]">
                    {String(idx + 1).padStart(2, "0")} / {String(t.packages.length).padStart(2, "0")}
                  </span>
                  <h3 className="arroyo-display text-2xl md:text-3xl leading-snug mt-3">{p.name}</h3>
                  <PriceBlock pkg={p} className="mt-5" />
                  <p className="mt-3 text-sm md:text-base text-[color:var(--arroyo-navy)]">{p.leadTime}</p>
                </div>

                <div className="md:col-span-7 md:pl-10 md:border-l border-slate-200 flex flex-col">
                  <p className="text-lg md:text-xl font-semibold leading-snug text-[color:var(--arroyo-navy)]">
                    {p.tagline}
                  </p>
                  <p className="arroyo-body text-sm md:text-base mt-3 max-w-2xl">{p.description}</p>
                  <button
                    type="button"
                    onClick={() => setActivePackage(p)}
                    aria-label={t.viewDetailsAria(p.name)}
                    className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-[color:var(--arroyo-accent)] hover:underline underline-offset-4"
                  >
                    {t.detailsLink}
                    <ArrowUpRight
                      className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"
                      size={16}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="thin-divider" />
        </div>
      </div>

      <PackageDialog pkg={activePackage} onOpenChange={(open) => !open && setActivePackage(null)} t={t} />
    </section>
  );
};

export default Products;
