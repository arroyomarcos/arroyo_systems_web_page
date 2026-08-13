import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { NAV_HREFS, ASSETS } from "../mock";
import { content } from "../i18n/content";
import { useLang, stripLangPrefix, withLang, LANG_PREF_KEY } from "../i18n/useLang";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const lang = useLang();
  const t = content[lang];
  const base = lang === "es" ? "/es" : "";
  const homePath = lang === "es" ? "/es" : "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = useCallback(() => setOpen(false), []);

  const navItems = [
    { key: "solutions", label: t.nav.solutions, href: `${base}${NAV_HREFS.solutions}` },
    { key: "whyUs", label: t.nav.whyUs, href: `${base}${NAV_HREFS.whyUs}` },
    { key: "partners", label: t.nav.partners, href: `${base}${NAV_HREFS.partners}` },
  ];

  const handleHashNavigation = useCallback(
    (e, href) => {
      closeMenu();
      const [path, hash] = href.split("#");

      if (location.pathname !== path || !hash) return;

      e.preventDefault();
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [closeMenu, location.pathname]
  );

  const scrollToContact = useCallback(
    (e) => {
      e.preventDefault();
      closeMenu();

      if (location.pathname !== homePath) {
        navigate(`${base}/#contact`);
        return;
      }

      const el = document.getElementById("contact");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [closeMenu, location.pathname, navigate, homePath, base]
  );

  const otherLang = lang === "es" ? "en" : "es";
  const otherLangPath = withLang(otherLang, stripLangPrefix(location.pathname)) + location.hash;

  const switchLang = useCallback(
    (nextLang) => () => {
      window.localStorage.setItem(LANG_PREF_KEY, nextLang);
      closeMenu();
    },
    [closeMenu]
  );

  const LangSwitch = ({ className = "" }) => (
    <div className={`flex items-center gap-1 text-sm font-semibold ${className}`}>
      <Link
        to={lang === "en" ? location.pathname + location.hash : otherLangPath}
        onClick={switchLang("en")}
        aria-current={lang === "en" ? "true" : undefined}
        className={lang === "en" ? "text-[color:var(--arroyo-navy)]" : "text-[color:var(--arroyo-muted)] hover:text-[color:var(--arroyo-navy)] transition-colors"}
      >
        EN
      </Link>
      <span className="text-[color:var(--arroyo-muted)]">|</span>
      <Link
        to={lang === "es" ? location.pathname + location.hash : otherLangPath}
        onClick={switchLang("es")}
        aria-current={lang === "es" ? "true" : undefined}
        className={lang === "es" ? "text-[color:var(--arroyo-navy)]" : "text-[color:var(--arroyo-muted)] hover:text-[color:var(--arroyo-navy)] transition-colors"}
      >
        ES
      </Link>
    </div>
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
        <Link to={homePath} className="shrink-0" onClick={closeMenu}>
          <span className="logo-badge">
            <img
              src={ASSETS.logo}
              alt="Arroyo Systems"
              className="logo-img h-8 md:h-11 w-auto object-contain"
            />
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-10">
          {navItems.map((l) => (
            <Link key={l.key} to={l.href} className="nav-link" onClick={(e) => handleHashNavigation(e, l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-5 lg:gap-6">
          <LangSwitch />
          <a href={`${base}/#contact`} onClick={scrollToContact} className="contact-pill">
            {t.nav.contact}
          </a>
        </div>

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
          {navItems.map((l) => (
            <Link
              key={l.key}
              to={l.href}
              className="nav-link py-1 text-base"
              onClick={(e) => handleHashNavigation(e, l.href)}
            >
              {l.label}
            </Link>
          ))}
          <LangSwitch className="py-1" />
          <a
            href={`${base}/#contact`}
            className="contact-pill self-start mt-2"
            onClick={scrollToContact}
          >
            {t.nav.contact}
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
