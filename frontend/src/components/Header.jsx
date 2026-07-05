import React, { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, ASSETS } from "../mock";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = useCallback(() => setOpen(false), []);

  const scrollToContact = useCallback(
    (e) => {
      e.preventDefault();
      closeMenu();
      const el = document.getElementById("contact");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [closeMenu]
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(10,26,58,0.06)]"
          : "bg-white/80 backdrop-blur-sm"
      }`}
    >
      <div className="arroyo-container flex items-center justify-between h-20 md:h-24">
        {/* Logo */}
        <a href="#top" className="shrink-0" onClick={closeMenu}>
          <span className="logo-badge">
            <img
              src={ASSETS.logo}
              alt="Arroyo Systems"
              className="logo-img h-10 md:h-14 w-auto object-contain"
            />
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-10">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav-link">
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA - Desktop */}
        <a href="#contact" onClick={scrollToContact} className="hidden md:inline-flex contact-pill">
          Contact Us
        </a>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 -mr-2 text-[color:var(--arroyo-navy)]"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 bg-white border-t border-slate-100 ${
          open ? "max-h-[500px]" : "max-h-0"
        }`}
      >
        <div className="arroyo-container py-4 flex flex-col gap-4">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-link py-1 text-base"
              onClick={closeMenu}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            className="contact-pill self-start mt-2"
            onClick={scrollToContact}
          >
            Contact Us
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
