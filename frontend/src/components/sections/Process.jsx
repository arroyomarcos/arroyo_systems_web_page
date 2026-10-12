import React from "react";
import { ASSETS } from "../../mock";
import { useContent } from "../../i18n/useLang";

const Process = () => {
  const t = useContent().process;

  return (
    <section id="process" className="py-20 md:py-28 relative section-dark">
      <div className="arroyo-container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-heading">{t.heading}</h2>
          <p className="section-lead mt-5">{t.subtitle}</p>
        </div>

        <div className="mt-14 md:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20 items-center">
          <ol className="lg:col-span-6 process-steps">
            {t.steps.map((step, idx) => (
              <li key={step.title} className="process-step">
                <span className="process-step__index font-mono">{String(idx + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-xl md:text-[1.5rem] font-semibold tracking-tight leading-snug text-[color:var(--arroyo-navy)]">{step.title}</h3>
                  <p className="mt-2 arroyo-body text-base md:text-[1.0625rem]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <figure className="lg:col-span-6">
            <div className="rounded-[28px] bg-white p-5 md:p-8 flex items-center gap-3">
              <img
                src={ASSETS.safetyFactor}
                alt={t.figureCaption}
                className="flex-1 min-w-0 w-full h-auto object-contain max-h-[360px]"
                loading="lazy"
              />
              <img
                src={ASSETS.safetyFactorLegend}
                alt=""
                className="h-40 sm:h-52 md:h-60 w-auto object-contain shrink-0"
                loading="lazy"
              />
            </div>
            <figcaption className="mt-4 text-center text-xs text-[color:var(--arroyo-muted)]">
              {t.figureCaption}
            </figcaption>
          </figure>
        </div>

        <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-x-6 md:gap-y-0 lg:gap-x-10">
          {t.promises.map((promise) => (
            <div key={promise.title} className="pt-6 md:row-span-3 md:grid md:[grid-template-rows:subgrid]">
              <div className="thin-divider mb-6" />
              <h3 className="text-xl md:text-[1.5rem] font-semibold tracking-tight leading-snug text-[color:var(--arroyo-navy)]">
                {promise.title}
              </h3>
              <div>
                <p className="mt-3 arroyo-body text-base md:text-[1.0625rem]">{promise.body}</p>
                {promise.limit && (
                  <p className="mt-4 text-xs md:text-sm text-[color:var(--arroyo-muted)] leading-relaxed">
                    {promise.limit}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Process;
