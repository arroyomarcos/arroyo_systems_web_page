import React from "react";
import { ASSETS } from "../../mock";

const Approach = () => {
  return (
    <section id="approach" className="py-20 md:py-28 relative bg-white">
      <div className="arroyo-container">
        {/* Full-width heading — both sentences balanced on 2 lines */}
        <div className="max-w-5xl">
          <h2 className="section-heading">
            We do not design parts.
            <br />
            We decide which part makes sense to manufacture.
          </h2>
        </div>

        <div className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-12 lg:gap-20 items-start">
          {/* Text side */}
          <div>
            <div className="space-y-6 max-w-lg">
              <p className="arroyo-body text-base md:text-lg">
                The same function can be achieved through machining, sheet metal, welded assemblies
                or different material selections.
              </p>
              <p className="arroyo-body text-base md:text-lg">
                The challenge is not creating geometry. It is choosing the right solution before
                manufacturing.
              </p>
            </div>

            <p className="fig-caption mt-10">
              Fig. 1 - Machining accessibility analysis based on single fixturing setup
            </p>
          </div>

          {/* Image grid: 2x2 machining accessibility */}
          <div className="figure-wrap">
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <img
                src={ASSETS.accessibilityFront}
                alt="Accessibility front"
                className="w-full h-auto object-contain"
              />
              <img
                src={ASSETS.accessibilitySide}
                alt="Accessibility side"
                className="w-full h-auto object-contain"
              />
              <img
                src={ASSETS.accessibilityTop}
                alt="Accessibility top"
                className="w-full h-auto object-contain"
              />
              <img
                src={ASSETS.machiningAccessibility}
                alt="Machining accessibility"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Approach;
