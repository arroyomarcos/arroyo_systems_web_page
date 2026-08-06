import React from "react";
import { ASSETS, WHY_ARROYO_BULLETS } from "../../mock";

const WhyArroyo = () => {
  return (
    <section id="why-arroyo" className="py-20 md:py-28 relative bg-white">
      <div className="arroyo-container">
        <div className="max-w-5xl">
          <h2 className="section-heading">
            We&apos;re not a consultancy. We&apos;re the engineer you&apos;d hire in-house
            <br className="hidden md:block" /> if you could afford to wait for one.
          </h2>
        </div>

        <div className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-12 lg:gap-20 items-center">
          <div>
            <p className="arroyo-body text-base md:text-lg max-w-lg">
              AI-accelerated design workflow. Manufacturing coordination built in — from
              finished design to a part in your hands, without you chasing suppliers. No account
              managers between you and the person doing the work.
            </p>
          </div>

          <div className="figure-wrap">
            <img
              src={ASSETS.displacementVm}
              alt="Structural validation of a load-critical component"
              className="w-full h-auto object-contain max-h-[360px]"
            />
            <p className="fig-caption mt-6">
              Structural validation runs on every design before it ships.
            </p>
          </div>
        </div>

        <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10">
          {WHY_ARROYO_BULLETS.map((b, idx) => (
            <div key={b} className="pt-6">
              <div className="thin-divider mb-6" />
              <span className="text-xs md:text-sm font-mono text-[color:var(--arroyo-muted)]">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <p className="mt-3 text-base md:text-lg text-[color:var(--arroyo-navy)] font-medium leading-snug">
                {b}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyArroyo;
