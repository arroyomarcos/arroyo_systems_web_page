import React, { useCallback, useEffect, useRef, useState } from "react";
import { useContent } from "../../i18n/useLang";

const STEP_IMAGES = [1, 2, 3, 4].map((n) => `${process.env.PUBLIC_URL || ""}/assets/process/step-${n}.webp`);

// While the track scrolls past, the stage inside it stays pinned to the viewport and the
// active step (and its image) follows the scroll position: the whole process, start to
// finish, without the heading or the content that follows being on screen.
const Process = () => {
  const t = useContent().process;
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const count = t.steps.length;

  useEffect(() => {
    let frame = null;
    const update = () => {
      frame = null;
      const track = trackRef.current;
      if (!track) return;
      const { top, height } = track.getBoundingClientRect();
      const travel = height - window.innerHeight;
      const progress = travel > 0 ? Math.min(1, Math.max(0, -top / travel)) : 0;
      setActive(Math.min(count - 1, Math.floor(progress * count)));
    };
    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [count]);

  const goTo = useCallback(
    (index) => {
      const track = trackRef.current;
      if (!track) return;
      const travel = track.offsetHeight - window.innerHeight;
      const top = track.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + ((index + 0.5) / count) * travel, behavior: "smooth" });
    },
    [count]
  );

  return (
    <section id="process" className="relative section-dark">
      <div className="arroyo-container pt-20 md:pt-28">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-heading">{t.heading}</h2>
          <p className="section-lead mt-5">{t.subtitle}</p>
        </div>
      </div>

      <div ref={trackRef} className="process-track" style={{ "--steps": count }}>
        <div className="process-pin">
          <div className="arroyo-container w-full">
            <div className="process-stage" aria-hidden="true">
              <div className="process-stage__frame">
                {t.steps.map((step, idx) => (
                  <img
                    key={step.title}
                    src={STEP_IMAGES[idx]}
                    alt=""
                    className={`process-stage__img ${idx === active ? "is-active" : ""}`}
                    loading={idx === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                ))}
              </div>
            </div>

            <ol className="process-steps">
              {t.steps.map((step, idx) => (
                <li
                  key={step.title}
                  className={`process-step ${idx === active ? "is-active" : ""} ${idx < active ? "is-done" : ""}`}
                >
                  <button type="button" onClick={() => goTo(idx)} aria-current={idx === active ? "step" : undefined}>
                    <span className="process-step__bar" aria-hidden="true" />
                    <span className="process-step__index font-mono">{String(idx + 1).padStart(2, "0")}</span>
                    <h3 className="process-step__title">{step.title}</h3>
                    <p className="process-step__body">{step.body}</p>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="arroyo-container pb-20 md:pb-28">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-x-6 md:gap-y-0 lg:gap-x-10">
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
