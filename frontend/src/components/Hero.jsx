import React, { Suspense, useEffect, useState } from "react";
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
    <section id="top" className="relative pt-28 md:pt-36 pb-14 md:pb-24 overflow-hidden">
      <div className="arroyo-container relative grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-center">
        <div className="reveal md:col-span-6">
          <h1 className="hero-title">
            {t.titleLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className="hero-sub mt-5 md:mt-7">
            {t.body.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>

          <div className="mt-8 md:mt-10 flex flex-wrap gap-3 items-center">
            <a href="#contact" onClick={scrollToId("contact")} className="contact-pill contact-pill--solid">
              {t.ctaPrimary}
            </a>
            <a href="#products" onClick={scrollToId("products")} className="contact-pill">
              {t.ctaSecondary}
            </a>
          </div>

          <ul className="hero-trust mt-8 md:mt-10">
            {t.trust.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <figure className="viewer-frame md:col-span-6">
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
    </section>
  );
};

export default Hero;
