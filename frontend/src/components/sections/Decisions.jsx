import React from "react";
import { ASSETS, TRADE_OFFS } from "../../mock";

const Decisions = () => {
  return (
    <section id="decisions" className="relative py-20 md:py-28 bg-white">
      <div className="arroyo-container">
        {/* Row 1: FEA image + short statement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-12 lg:gap-20 items-center">
          <div className="figure-wrap order-2 lg:order-1">
            <img
              src={ASSETS.displacementVm}
              alt="Early structural validation of a load-critical component"
              className="w-full h-auto object-contain max-h-[420px]"
            />
            <p className="fig-caption mt-6">Fig. 2 - Early structural validation of a load-critical component</p>
          </div>

          <div className="order-1 lg:order-2">
            <p className="arroyo-body text-lg md:text-xl leading-relaxed max-w-md">
              Cost overruns. Redesigns.
              <br />
              Delays. Unnecessarily complex
              <br />
              manufacturing.
            </p>
            <p className="arroyo-body text-lg md:text-xl leading-relaxed max-w-md mt-6">
              Most problems appear once the design is already finished.
              <br />
              <span className="text-[color:var(--arroyo-navy)] font-medium">We aim to solve them earlier.</span>
            </p>
          </div>
        </div>

        {/* Row 2: Big statement */}
        <div className="mt-20 md:mt-32">
          <h2 className="section-heading">
            Poor engineering decisions are expensive.
          </h2>
        </div>

        {/* Row 3: Trade-offs — heading full width above the 2-column content */}
        <div className="mt-16 md:mt-24">
          <div className="max-w-6xl">
            <h3 className="section-heading">Every decision is a trade-off.</h3>
          </div>

          <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-12 lg:gap-20 items-center">
            <div>
              <p className="arroyo-body text-base md:text-lg max-w-lg">
                Optimizing one variable often makes the others worse. We balance the technical and
                manufacturing consequences before committing to a path.
              </p>

              <ul className="mt-8 space-y-3">
                {TRADE_OFFS.map((t) => (
                  <li
                    key={t}
                    className="text-lg md:text-xl arroyo-body flex items-center gap-3 group"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-[color:var(--arroyo-accent)] opacity-70 group-hover:opacity-100 transition" />
                    <span className="group-hover:text-[color:var(--arroyo-navy)] transition-colors">
                      {t}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="figure-wrap">
              <div className="flex items-center gap-3">
                <img
                  src={ASSETS.safetyFactor}
                  alt="Safety factor assessment for engineering trade-off decisions"
                  className="flex-1 w-full h-auto object-contain max-h-[360px]"
                />
                <img
                  src={ASSETS.safetyFactorLegend}
                  alt="Safety factor legend"
                  className="h-32 md:h-44 w-auto object-contain"
                />
              </div>
              <p className="fig-caption mt-6">
                Fig. 3 - Safety factor assessment for engineering trade-off decisions
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Decisions;
