import React from "react";
import { SOLUTIONS } from "../../mock";
import { ArrowUpRight } from "lucide-react";

const Products = () => {
  return (
    <section id="products" className="py-20 md:py-28 relative bg-white">
      <div className="arroyo-container">
        <div className="max-w-3xl">
          <h2 className="section-heading">
            Engineering Solutions
          </h2>
          <p className="arroyo-body mt-4 text-base md:text-lg max-w-xl">
            Three complementary services that reduce risk, cost and uncertainty across the full
            design-to-manufacture lifecycle.
          </p>
        </div>

        <div className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10">
          {SOLUTIONS.map((s, idx) => (
            <div key={s.id} className="group relative pt-6 flex flex-col">
              <div className="thin-divider mb-6" />
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs md:text-sm font-mono text-[color:var(--arroyo-muted)]">
                  {String(idx + 1).padStart(2, "0")} / {String(SOLUTIONS.length).padStart(2, "0")}
                </span>
                <ArrowUpRight
                  className="text-[color:var(--arroyo-muted)] group-hover:text-[color:var(--arroyo-accent)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"
                  size={18}
                />
              </div>
              <h3 className="arroyo-display text-xl md:text-2xl leading-snug mb-3 min-h-[3.5rem] md:min-h-[3.5rem]">
                {s.title}
              </h3>
              <p className="arroyo-body text-sm md:text-base mb-8 min-h-[4.5rem] md:min-h-[5rem]">
                {s.description}
              </p>
              <ul className="space-y-2">
                {s.items.map((item) => (
                  <li
                    key={item}
                    className="text-base md:text-lg text-[color:var(--arroyo-navy)] font-medium"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;
