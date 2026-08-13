import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { useContent } from "../../i18n/useLang";

const MetaField = ({ label, value, valueClassName = "" }) => (
  <div>
    <p className="text-xs font-semibold tracking-[0.1em] uppercase text-[color:var(--arroyo-muted)] mb-1">
      {label}
    </p>
    <p className={`text-sm md:text-base text-[color:var(--arroyo-navy)] ${valueClassName}`}>{value}</p>
  </div>
);

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
            <p className="text-xl md:text-2xl font-bold text-[color:var(--arroyo-navy)]">{pkg.priceRange}</p>
            <p className="text-sm text-[color:var(--arroyo-muted)] mt-1">{pkg.priceInclVat}</p>
          </div>

          <p className="arroyo-body text-sm md:text-base mt-6">{pkg.description}</p>

          <div className="mt-8">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[color:var(--arroyo-accent)] mb-4">
              {t.deliverablesLabel}
            </p>
            <ul className="space-y-4">
              {pkg.deliverables.map((d) => (
                <li key={d.title} className="border-t border-slate-200 pt-4">
                  <p className="font-semibold text-[color:var(--arroyo-navy)]">{d.title}</p>
                  <p className="arroyo-body text-sm mt-1">{d.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <MetaField label={t.leadTimeLabel} value={pkg.leadTime} />
            <MetaField label={t.revisionsLabel} value={pkg.revisions} />
          </div>
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

        <div className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10">
          {t.packages.map((p, idx) => (
            <div key={p.id} className="group relative pt-6 flex flex-col">
              <div className="thin-divider mb-6" />
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs md:text-sm font-mono text-[color:var(--arroyo-muted)]">
                  {String(idx + 1).padStart(2, "0")} / {String(t.packages.length).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => setActivePackage(p)}
                  aria-label={t.viewDetailsAria(p.name)}
                  className="-m-2 p-2 text-[color:var(--arroyo-muted)] hover:text-[color:var(--arroyo-accent)] transition-colors"
                >
                  <ArrowUpRight
                    className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"
                    size={18}
                  />
                </button>
              </div>
              <h3 className="arroyo-display text-xl md:text-2xl leading-snug mb-3">{p.name}</h3>
              <p className="arroyo-body text-sm md:text-base mb-6">{p.tagline}</p>

              <div className="mt-auto pt-6 border-t border-slate-200 text-center">
                <p className="text-lg md:text-xl font-bold text-[color:var(--arroyo-navy)]">
                  {p.priceRange}
                </p>
                <p className="mt-2 text-sm md:text-base text-[color:var(--arroyo-navy)]">{p.leadTime}</p>
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
