import React from "react";
import { ASSETS } from "../../mock";
import { useContent } from "../../i18n/useLang";

// Every logo sits in an identical tile, on one shared row, so the different logo
// typefaces never decide the layout: same box, same height, same alignment.
const LogoTile = ({ src, alt }) => (
  <div className="partner-tile">
    <img src={src} alt={alt} className="partner-tile__logo" loading="lazy" />
  </div>
);

const GroupLabel = ({ children }) => (
  <>
    <p className="eyebrow mb-4">{children}</p>
  </>
);

const Partners = () => {
  const t = useContent().partners;

  return (
    <section id="partners" className="py-20 md:py-28 relative bg-[color:var(--arroyo-bg-soft)]">
      <div className="arroyo-container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-heading">{t.heading}</h2>
          <p className="section-lead mt-5">{t.subtitle}</p>
        </div>

        <div className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-12 lg:gap-x-10">
          <div className="md:col-span-2">
            <GroupLabel>{t.softwareLabel}</GroupLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-10">
              {t.softwareItems.map((item) => (
                <LogoTile key={item.id} src={ASSETS[item.logo]} alt={item.name} />
              ))}
            </div>
          </div>

          <div>
            <GroupLabel>{t.partnersLabel}</GroupLabel>
            {t.items.map((p) => (
              <LogoTile key={p.id} src={ASSETS[p.logo]} alt={`${p.name} logo`} />
            ))}
          </div>
        </div>

        <p className="mt-12 text-center text-xs leading-relaxed text-[color:var(--arroyo-muted)]">
          {t.trademark.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
};

export default Partners;
