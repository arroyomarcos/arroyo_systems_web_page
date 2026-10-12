import React from "react";
import useInView from "../hooks/useInView";

// Wraps children in a scroll-triggered fade-and-rise. `delay` staggers siblings
// (in ms) so a row of cards resolves one after another instead of all at once.
const Reveal = ({ children, delay = 0, className = "", as: Tag = "div", ...rest }) => {
  const [ref, inView] = useInView();

  return (
    <Tag
      ref={ref}
      className={`reveal-item ${inView ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
