import React from "react";
import { ArrowRight } from "lucide-react";
import { ASSETS } from "../mock";

const scrollToId = (id) => (e) => {
  e.preventDefault();
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const Hero = () => {
  return (
    <section id="top" className="relative pt-24 sm:pt-28 md:pt-32 pb-16 md:pb-24 overflow-hidden">
      <div className="absolute inset-0 hero-glow pointer-events-none" />

      {/* Background hero image - consistent across all viewports */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none flex items-center justify-end"
      >
        <img
          src={ASSETS.hero}
          alt=""
          className="hero-bg-img w-[95%] sm:w-[80%] md:w-[70%] lg:w-[62%] max-w-[900px] h-auto object-contain translate-x-4 sm:translate-x-6 md:translate-x-10"
          loading="eager"
        />
      </div>

      <div className="arroyo-container relative">
        <div className="min-h-[420px] sm:min-h-[480px] md:min-h-[520px] flex items-center">
          <div className="reveal max-w-xl">
            <h1 className="arroyo-display text-4xl sm:text-5xl md:text-6xl lg:text-[4.2rem] leading-[1.05]">
              Engineering,
              <br />
              <span className="text-[color:var(--arroyo-navy)]">on demand.</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg md:text-xl arroyo-body max-w-lg">
              No retainers. No six-week discovery phase. No &quot;we&apos;ll circle back.&quot;
            </p>
            <p className="mt-4 text-base sm:text-lg md:text-xl arroyo-body max-w-lg">
              You send the part. We design it, prove it works, and get it manufacturing-ready —
              in days, not months.
            </p>
            <div className="mt-8 md:mt-10 flex flex-wrap gap-4 items-center">
              <a href="#products" onClick={scrollToId("products")} className="contact-pill">
                See pricing <ArrowRight size={16} />
              </a>
              <a href="#contact" onClick={scrollToId("contact")} className="link-underline">
                Start a project
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
