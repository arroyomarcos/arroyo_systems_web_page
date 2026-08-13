import React from "react";
import { ASSETS } from "../../mock";
import { ArrowUpRight } from "lucide-react";
import { useContent } from "../../i18n/useLang";

const Partners = () => {
  const t = useContent().partners;

  return (
    <section id="partners" className="py-20 md:py-28 relative bg-white">
      <div className="arroyo-container">
        <div className="max-w-3xl">
          <h2 className="section-heading">{t.heading}</h2>
          <p className="arroyo-body mt-4 text-base md:text-lg max-w-xl">{t.subtitle}</p>
        </div>

        <div className="mt-14 md:mt-20 flex justify-center">
          {t.items.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative pt-6 flex flex-col items-center text-center w-full max-w-sm"
            >
              <div className="thin-divider mb-6" />
              <div className="flex items-center justify-center h-20 mb-6">
                <img
                  src={ASSETS[p.logo]}
                  alt={`${p.name} logo`}
                  className="max-h-12 md:max-h-14 w-auto object-contain"
                />
              </div>
              <p className="arroyo-body text-sm md:text-base mb-4">{p.description}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--arroyo-navy)] group-hover:text-[color:var(--arroyo-accent)] transition-colors">
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
    </section>
  );
};

export default Partners;
