import React, { useState } from "react";
import { BadgeCheck, Check, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { useContent } from "../../i18n/useLang";

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
      {/* On the coordination product this line says who bills what, so it stays readable. */}
      <p
        className={
          isQuoted
            ? "text-[0.9375rem] leading-snug text-[color:var(--arroyo-navy)] opacity-80 mt-3 max-w-sm"
            : "text-[0.8125rem] leading-snug text-[color:var(--arroyo-muted)] mt-2 max-w-xs"
        }
      >
        {pkg.priceNote}
      </p>
    </div>
  );
};

const MARK_URL = `${process.env.PUBLIC_URL || ""}/assets/brand/logo-mark.svg`;

// The detail panel stays short on purpose: the price and what you get come first, the fine
// print last. The tile it opens from already carries the description, so it is not repeated
// here, and the includes are listed by title only.
const PackageDialog = ({ pkg, onOpenChange, t }) => (
  <Dialog open={!!pkg} onOpenChange={onOpenChange}>
    <DialogContent
      overlayClassName="bg-black/30 backdrop-blur-sm"
      className="max-w-2xl max-h-[88vh] overflow-y-auto bg-white border-0 rounded-[28px] p-6 md:p-9"
      style={{ boxShadow: "0 30px 90px -20px rgba(0,0,0,0.35)" }}
    >
      {pkg && (
        <>
          <DialogHeader className="space-y-1.5 text-left">
            <img src={MARK_URL} alt="" aria-hidden="true" className="block h-8 w-auto mb-3 self-start" />
            <DialogTitle className="text-2xl md:text-[2rem] font-semibold tracking-tight leading-tight text-[color:var(--arroyo-navy)]">
              {pkg.name}
            </DialogTitle>
            <DialogDescription className="sr-only">{pkg.description}</DialogDescription>
            <p className="text-base md:text-lg text-[color:var(--arroyo-muted)] leading-snug">{pkg.tagline}</p>
          </DialogHeader>

          <div className="mt-6 rounded-2xl bg-[color:var(--arroyo-bg-soft)] px-5 py-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-8 gap-y-4 items-center">
            <div>
              <p
                className={
                  pkg.priceInclVat === null
                    ? "text-lg md:text-xl font-semibold tracking-tight leading-snug text-[color:var(--arroyo-navy)]"
                    : "text-[1.5rem] md:text-[1.75rem] font-semibold tracking-tight leading-none text-[color:var(--arroyo-navy)]"
                }
              >
                {pkg.price}
              </p>
              <p
                className={
                  pkg.priceInclVat === null
                    ? "text-[0.9375rem] leading-snug text-[color:var(--arroyo-navy)] opacity-80 mt-2"
                    : "text-[0.8125rem] leading-snug text-[color:var(--arroyo-muted)] mt-1.5"
                }
              >
                {pkg.priceInclVat ?? pkg.priceNote}
              </p>
            </div>
            <dl className="text-[0.8125rem] leading-snug space-y-1.5">
              <div className="flex gap-2">
                {!pkg.leadTimeSentence && <dt className="text-[color:var(--arroyo-muted)]">{t.leadTimeLabel}</dt>}
                <dd className="font-medium text-[color:var(--arroyo-navy)]">{pkg.leadTime}</dd>
              </div>
              {pkg.revisions && (
                <div className="flex gap-2">
                  <dt className="text-[color:var(--arroyo-muted)]">{t.revisionsLabel}</dt>
                  <dd className="font-medium text-[color:var(--arroyo-navy)]">{pkg.revisions}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="mt-7">
            <p className="eyebrow mb-3">{t.includesLabel}</p>
            <ul className={`grid grid-cols-1 gap-x-8 gap-y-2.5 ${pkg.wideIncludes ? "" : "sm:grid-cols-2"}`}>
              {pkg.includes.map((d) => (
                <li key={d.title} className="flex gap-2.5">
                  <Check size={16} className="mt-[3px] shrink-0 text-[color:var(--arroyo-accent)]" />
                  <p className="text-[0.9375rem] font-medium leading-snug text-[color:var(--arroyo-navy)]">{d.title}</p>
                </li>
              ))}
            </ul>
          </div>

          {pkg.id !== "product-manufacturing" && (
            <p className="mt-5 flex items-center gap-2.5 text-[0.875rem] font-medium leading-snug text-[color:var(--arroyo-navy)]">
              <BadgeCheck size={18} className="shrink-0 text-[color:var(--arroyo-navy)]" />
              <span>{t.signedLine}</span>
            </p>
          )}

          <div className="mt-6 pt-5 border-t border-[color:var(--arroyo-line)]">
            <p className="eyebrow mb-2.5">{t.excludesLabel}</p>
            <ul className="space-y-1.5">
              {pkg.excludes.map((line) => (
                <li key={line} className="flex gap-2.5 text-[0.8125rem] leading-snug arroyo-body">
                  <Minus size={14} className="mt-[3px] shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {pkg.howItWorks && (
            <div className="mt-5 pt-5 border-t border-[color:var(--arroyo-line)]">
              <p className="eyebrow mb-2.5">{t.howLabel}</p>
              <p className="text-[0.9375rem] leading-snug text-[color:var(--arroyo-navy)]">{pkg.howItWorks}</p>
            </div>
          )}

          {pkg.note && (
            <p className="mt-5 text-xs text-[color:var(--arroyo-muted)] leading-relaxed">{pkg.note}</p>
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

        <div className="mt-12 md:mt-16 space-y-4 max-w-[1140px] mx-auto">
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
