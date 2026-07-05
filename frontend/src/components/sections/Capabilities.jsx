import React from "react";
import { ASSETS, CAPABILITIES } from "../../mock";

const Capabilities = () => {
  return (
    <section id="capabilities" className="py-20 md:py-28 relative bg-white">
      <div className="arroyo-container">
        {/* Header row */}
        <div className="max-w-5xl">
          <h2 className="section-heading">We do not sell engineering hours.</h2>
        </div>

        {/* Row: image + list */}
        <div className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-12 lg:gap-20 items-center">
          <div className="figure-wrap">
            <img
              src={ASSETS.conceptDevelopment}
              alt="Concept development supported by engineering analysis"
              className="w-full h-auto object-contain max-h-[420px]"
            />
            <p className="fig-caption mt-6">
              Fig. 4 - Concept development supported by engineering analysis
            </p>
          </div>

          <div>
            <ul className="space-y-4">
              {CAPABILITIES.map((c, idx) => (
                <li
                  key={c}
                  className="group flex items-center gap-4 border-b border-slate-200 pb-4"
                >
                  <span className="text-sm font-mono text-[color:var(--arroyo-muted)] w-8">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="text-lg md:text-xl arroyo-body group-hover:text-[color:var(--arroyo-navy)] transition-colors">
                    {c}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Full-width closing heading — same style as main section titles */}
        <div className="mt-16 md:mt-24 max-w-6xl">
          <h3 className="section-heading">
            We reduce uncertainty before manufacturing.
          </h3>
        </div>

        {/* Big closing statement — text left column, images right column */}
        <div className="mt-24 md:mt-32 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-12 lg:gap-20 items-center">
          <div>
            <h3 className="section-heading">
              It is not about doing more engineering.
              <br />
              It is about making better decisions.
            </h3>
            <p className="arroyo-body text-base md:text-lg max-w-lg mt-6 md:mt-8">
              Arroyo Systems helps develop mechanical components under load with less technical
              uncertainty before manufacturing.
            </p>
          </div>

          <div className="figure-wrap">
            <div className="flex flex-col items-center gap-4 md:gap-6">
              <img
                src={ASSETS.manufacturingStudy}
                alt="Design evolution driven by engineering analysis"
                className="w-full max-w-[420px] h-auto object-contain"
              />
              <img
                src={ASSETS.manufacturingStudyWhite}
                alt="Design evolution driven by engineering analysis white"
                className="w-[75%] max-w-[315px] h-auto object-contain opacity-95"
              />
            </div>
            <p className="fig-caption mt-6 text-center md:text-left">
              Fig. 5 - Design evolution driven by engineering analysis
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Capabilities;
