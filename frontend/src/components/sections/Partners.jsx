import React from "react";
import { ASSETS } from "../../mock";
import { ArrowUpRight } from "lucide-react";
import { useContent } from "../../i18n/useLang";

// Deliberately smaller than the other sections: it supports the purchase, it isn't the pitch.
const Partners = () => {
  const t = useContent().partners;

  return (
    <section id="partners" className="py-16 md:py-20 relative bg-white">
      <div className="arroyo-container">
        <div className="max-w-3xl">
          <h2 className="section-heading">{t.heading}</h2>
          <p className="arroyo-body mt-4 text-base md:text-lg max-w-xl">{t.subtitle}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          <div>
            <div className="thin-divider mb-6" />
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[color:var(--arroyo-muted)]">
              {t.softwareLabel}
            </p>
            <ul className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-6">
              {t.softwareItems.map((item) => (
                <li key={item.id}>
                  <img
                    src={ASSETS[item.logo]}
                    alt={item.name}
                    className="h-9 md:h-10 w-auto object-contain"
                    loading="lazy"
                  />
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[11px] leading-relaxed text-[color:var(--arroyo-muted)] max-w-md">
              {t.trademark}
            </p>
          </div>

          <div>
            <div className="thin-divider mb-6" />
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[color:var(--arroyo-muted)]">
              {t.partnersLabel}
            </p>
            {t.items.map((p) => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-6 flex flex-col items-start"
              >
                <img
                  src={ASSETS[p.logo]}
                  alt={`${p.name} logo`}
                  className="h-9 md:h-10 w-auto object-contain"
                  loading="lazy"
                />
                <p className="arroyo-body text-sm md:text-base mt-5 max-w-md">{p.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--arroyo-navy)] group-hover:text-[color:var(--arroyo-accent)] transition-colors">
                  {t.visitWebsite}
                  <ArrowUpRight
                    size={16}
                    className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"
                  />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partners;
