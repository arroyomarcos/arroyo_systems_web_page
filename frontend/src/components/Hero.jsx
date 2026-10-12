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
  const [inputs, setInputs] = useState("loading"); // loading | ready | failed
  const [result, setResult] = useState("loading");

  return (
    <section id="top" className="relative pt-28 md:pt-36 pb-10 md:pb-16 overflow-hidden">
      <div className="arroyo-container relative">
        <div className="reveal text-center">
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

          <div className="mt-8 md:mt-10 flex flex-wrap justify-center gap-3 items-center">
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

        <div className="viewer-pair mt-6 md:mt-10">
          {inputs !== "failed" && (
            <figure className="viewer-frame">
              <div className={`viewer-frame__stage ${inputs === "ready" && result !== "loading" ? "is-ready" : ""}`}>
                {canMountViewer && (
                  <Suspense fallback={null}>
                    <PartViewer model="inputs" onReady={() => setInputs("ready")} onFail={() => setInputs("failed")} />
                  </Suspense>
                )}
              </div>
              <figcaption className="viewer-frame__caption">
                <strong>{t.viewerInputs.label}</strong>
                <span>{t.viewerInputs.note}</span>
              </figcaption>
            </figure>
          )}
          <figure className="viewer-frame">
            <div className={`viewer-frame__stage ${result !== "loading" ? "is-ready" : ""}`}>
              {result === "failed" ? (
                <img src={ASSETS.hero} alt="" className="viewer-frame__fallback" loading="eager" />
              ) : (
                canMountViewer && (
                  <Suspense fallback={null}>
                    <PartViewer model="result" onReady={() => setResult("ready")} onFail={() => setResult("failed")} />
                  </Suspense>
                )
              )}
            </div>
            <figcaption className="viewer-frame__caption">
              <strong>{t.viewerResult.label}</strong>
              <span>{t.viewerResult.note}</span>
            </figcaption>
          </figure>
        </div>
        {result === "ready" && <p className="viewer-hint">{t.viewerCaption}</p>}
      </div>
    </section>
  );
};

export default Hero;
