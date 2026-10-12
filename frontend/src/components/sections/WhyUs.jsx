import React from "react";
import { ArrowRight } from "lucide-react";
import { PERSON_PHOTO } from "../../mock";
import { useContent } from "../../i18n/useLang";

const Portrait = ({ person }) => (
  <div className="flex items-center gap-5">
    {PERSON_PHOTO ? (
      <img
        src={PERSON_PHOTO}
        alt={person.photoAlt}
        className="h-24 w-24 md:h-28 md:w-28 rounded-full object-cover ring-1 ring-slate-200"
      />
    ) : (
      <div
        className="h-24 w-24 md:h-28 md:w-28 shrink-0 rounded-full border border-dashed border-slate-300 bg-[color:var(--arroyo-bg-soft)] flex items-center justify-center font-mono text-sm text-[color:var(--arroyo-muted)]"
        aria-hidden="true"
      >
        MA
      </div>
    )}
    <div>
      <p className="arroyo-display text-lg md:text-xl">{person.name}</p>
      <p className="text-sm text-[color:var(--arroyo-muted)]">{person.role}</p>
      {!PERSON_PHOTO && <p className="mt-2 text-xs font-mono text-amber-700">{person.pending}</p>}
    </div>
  </div>
);

const WhyUs = () => {
  const t = useContent().whyUs;

  return (
    <section id="why-us" className="py-20 md:py-28 relative bg-white">
      <div className="arroyo-container">
        <h2 className="section-heading max-w-3xl">{t.heading}</h2>

        <div className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 lg:gap-10">
          {t.points.map((point, idx) => (
            <div key={point.title} className="pt-6">
              <div className="thin-divider mb-6" />
              <span className="text-xs md:text-sm font-mono text-[color:var(--arroyo-muted)]">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 arroyo-display text-xl md:text-2xl leading-snug">{point.title}</h3>
              <p className="mt-3 arroyo-body text-base">{point.body}</p>
              {point.limit && (
                <p className="mt-4 text-xs md:text-sm text-[color:var(--arroyo-muted)] leading-relaxed">
                  {point.limit}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 md:mt-24 rounded-2xl border border-slate-200 bg-[color:var(--arroyo-bg-soft)] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 md:p-8 md:border-r border-slate-200">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[color:var(--arroyo-muted)]">
                {t.contrast.before}
              </p>
              <ul className="mt-5 space-y-4">
                {t.contrast.rows.map((row) => (
                  <li key={row.before} className="text-base arroyo-body line-through decoration-slate-300">
                    {row.before}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 md:p-8 bg-white border-t md:border-t-0 border-slate-200">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[color:var(--arroyo-accent)]">
                {t.contrast.after}
              </p>
              <ul className="mt-5 space-y-4">
                {t.contrast.rows.map((row) => (
                  <li
                    key={row.after}
                    className="flex items-start gap-3 text-base font-medium text-[color:var(--arroyo-navy)]"
                  >
                    <ArrowRight size={18} className="mt-1 shrink-0 text-[color:var(--arroyo-accent)]" />
                    {row.after}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <p className="md:col-span-7 arroyo-display text-2xl md:text-3xl lg:text-4xl leading-snug">{t.closing}</p>
          <div className="md:col-span-5 md:pl-6 md:border-l border-slate-200">
            <Portrait person={t.person} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyUs;
