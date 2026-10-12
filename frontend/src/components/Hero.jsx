import React, { Suspense, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ASSETS } from "../mock";
import { useContent } from "../i18n/useLang";

// Three.js is ~150kB gzipped: it loads after first paint and never blocks the headline.
const PartViewer = React.lazy(() => import("./PartViewer"));

const scrollToId = (id) => (e) => {
  e.preventDefault();
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const useAfterFirstPaint = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const saveData = navigator.connection?.saveData;
    if (saveData) return undefined;
    const start = () => setReady(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 1800 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(start, 700);
    return () => clearTimeout(id);
  }, []);
  return ready;
};

const Hero = () => {
  const t = useContent().hero;
  const canMountViewer = useAfterFirstPaint();
  const [viewer, setViewer] = useState("loading"); // loading | ready | failed

  return (
    <section id="top" className="relative pt-24 sm:pt-28 md:pt-32 pb-16 md:pb-24 overflow-hidden">
      <div className="absolute inset-0 hero-glow pointer-events-none" />

      <div className="arroyo-container relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 items-center md:min-h-[540px]">
          <div className="reveal md:col-span-6">
            <h1 className="arroyo-display text-5xl sm:text-6xl md:text-[3.6rem] lg:text-[4.4rem] leading-[1.02]">
              {t.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-6 text-lg sm:text-xl md:text-2xl arroyo-body" style={{ lineHeight: 1.2 }}>
              {t.body.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>

            <div className="mt-8 md:mt-10 flex flex-wrap gap-x-6 gap-y-4 items-center">
              <a href="#contact" onClick={scrollToId("contact")} className="contact-pill contact-pill--solid">
                {t.ctaPrimary} <ArrowRight size={16} />
              </a>
              <a href="#products" onClick={scrollToId("products")} className="link-underline">
                {t.ctaSecondary}
              </a>
            </div>

            <ul className="hero-trust mt-8 md:mt-10">
              {t.trust.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-6">
            <figure className="viewer-frame">
              <span className="viewer-frame__tick viewer-frame__tick--tl" aria-hidden="true" />
              <span className="viewer-frame__tick viewer-frame__tick--tr" aria-hidden="true" />
              <span className="viewer-frame__tick viewer-frame__tick--bl" aria-hidden="true" />
              <span className="viewer-frame__tick viewer-frame__tick--br" aria-hidden="true" />

              <div className={`viewer-frame__stage ${viewer !== "loading" ? "is-ready" : ""}`}>
                {viewer === "failed" ? (
                  <img src={ASSETS.hero} alt="" className="viewer-frame__fallback" loading="eager" />
                ) : (
                  canMountViewer && (
                    <Suspense fallback={null}>
                      <PartViewer onReady={() => setViewer("ready")} onFail={() => setViewer("failed")} />
                    </Suspense>
                  )
                )}
              </div>
              {viewer === "ready" && <figcaption className="viewer-frame__caption">{t.viewerCaption}</figcaption>}
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
