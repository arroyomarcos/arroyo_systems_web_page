import React, { useEffect, useRef, useState } from "react";
import { ASSETS } from "../../mock";
import { useContent } from "../../i18n/useLang";
import Reveal from "../Reveal";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Drawing-frame corner ticks. The whole section borrows the language of a
// technical drawing sheet, and these are the cheapest, most legible piece of it.
const FrameTicks = () => (
  <>
    <span className="frame-tick frame-tick--tl" aria-hidden="true" />
    <span className="frame-tick frame-tick--tr" aria-hidden="true" />
    <span className="frame-tick frame-tick--bl" aria-hidden="true" />
    <span className="frame-tick frame-tick--br" aria-hidden="true" />
  </>
);

const StageIndex = ({ index, total, label }) => (
  <p className="font-mono text-xs md:text-sm tracking-[0.2em] uppercase text-[color:var(--arroyo-accent)]">
    {label} {String(index + 1).padStart(2, "0")}
    <span className="text-[color:var(--arroyo-muted)]"> / {String(total).padStart(2, "0")}</span>
  </p>
);

const StageFigure = ({ stage, caption }) => (
  <figure className="pipeline-figure">
    <FrameTicks />
    <img src={ASSETS[stage.image]} alt={caption} className="pipeline-figure__img" loading="lazy" />
    <figcaption className="pipeline-figure__caption font-mono">{caption}</figcaption>
  </figure>
);

const Pipeline = () => {
  const t = useContent().pipeline;
  const stages = t.stages;
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);

  // Progress is 0 when the sticky panel locks and 1 when it releases, measured
  // off the section's own box rather than absolute page offsets so it stays
  // correct no matter how much content grows above it.
  useEffect(() => {
    let raf = null;

    const measure = () => {
      raf = null;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      setProgress(scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0);
    };

    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    measure();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const active = clamp(Math.floor(progress * stages.length), 0, stages.length - 1);

  return (
    <section id="process" className="relative bg-white/75">
      <div className="arroyo-container pt-20 md:pt-28">
        <Reveal className="max-w-3xl">
          <p className="font-mono text-xs md:text-sm tracking-[0.25em] uppercase text-[color:var(--arroyo-accent)] mb-4">
            {t.eyebrow}
          </p>
          <h2 className="section-heading">{t.heading}</h2>
          <p className="arroyo-body mt-5 text-base md:text-lg max-w-xl">{t.subtitle}</p>
        </Reveal>
      </div>

      {/* ---------- Desktop: sticky scroll walkthrough ---------- */}
      <div
        ref={sectionRef}
        className="hidden md:block relative"
        style={{ height: `${stages.length * 85}vh` }}
      >
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <div className="arroyo-container w-full pt-20">
            <div className="grid grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Progress rail */}
              <div className="col-span-1">
                <div className="pipeline-rail">
                  <span
                    className="pipeline-rail__fill"
                    style={{ transform: `scaleY(${(active + 1) / stages.length})` }}
                  />
                  {stages.map((s, i) => (
                    <span
                      key={s.id}
                      className={`pipeline-rail__tick ${i <= active ? "is-done" : ""}`}
                      style={{ top: `${(i / (stages.length - 1)) * 100}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Copy column — all stages stacked, only the active one visible */}
              <div className="col-span-5 relative min-h-[320px]">
                {stages.map((s, i) => (
                  <div
                    key={s.id}
                    className={`pipeline-copy ${i === active ? "is-active" : ""}`}
                    aria-hidden={i !== active}
                  >
                    <StageIndex index={i} total={stages.length} label={t.stageLabel} />
                    <h3 className="arroyo-display text-3xl lg:text-[2.75rem] leading-[1.1] mt-5">
                      {s.title}
                    </h3>
                    <p className="arroyo-body text-base lg:text-lg mt-5 max-w-md">{s.body}</p>
                    <p className="mt-8 flex flex-wrap gap-x-3 gap-y-2">
                      {stages.map((other, oi) => (
                        <span
                          key={other.id}
                          className={`pipeline-chip ${oi === active ? "is-active" : ""}`}
                        >
                          {other.label}
                        </span>
                      ))}
                    </p>
                  </div>
                ))}
              </div>

              {/* Figure column — cross-fading renders */}
              <div className="col-span-6 relative h-[58vh] min-h-[380px]">
                {stages.map((s, i) => (
                  <div
                    key={s.id}
                    className={`pipeline-slide ${i === active ? "is-active" : ""}`}
                    aria-hidden={i !== active}
                  >
                    <StageFigure stage={s} caption={s.caption} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Mobile: plain stacked stages ---------- */}
      {/* Spacing uses padding, not margin: `.arroyo-container` sets the
          `margin` shorthand, which would cancel any `mt-*` utility here. */}
      <div className="md:hidden arroyo-container pt-14 pb-20 space-y-16">
        {stages.map((s, i) => (
          <Reveal key={s.id}>
            <StageIndex index={i} total={stages.length} label={t.stageLabel} />
            <h3 className="arroyo-display text-xl leading-snug mt-4">{s.title}</h3>
            <p className="arroyo-body text-base mt-3">{s.body}</p>
            <div className="mt-6 aspect-[4/3]">
              <StageFigure stage={s} caption={s.caption} />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default Pipeline;
