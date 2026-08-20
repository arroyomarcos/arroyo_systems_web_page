import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Products from "./components/sections/Products";
import WhyUs from "./components/sections/WhyUs";
import Partners from "./components/sections/Partners";
import Footer from "./components/Footer";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPayments from "./pages/admin/AdminPayments";
import { CookiesPolicy, LegalNotice, PrivacyPolicy } from "./pages/LegalPage";
import { CheckoutSuccess, CheckoutCancel } from "./pages/CheckoutResult";
import { Toaster } from "./components/ui/toaster";
import { getContent } from "./i18n/content";
import { getLangFromPath, stripLangPrefix, withLang } from "./i18n/useLang";

const SITE_URL = "https://www.arroyo-systems.com";
const LANG_PREF_KEY = "arroyo_lang";

// Maps a language-stripped pathname to the content.seo key and canonical path.
const PAGE_ROUTES = {
  "/": "home",
  "/privacy-policy": "privacyPolicy",
  "/legal-notice": "legalNotice",
  "/cookies-policy": "cookiesPolicy",
};

const STATIC_SEO = {
  "/admin": {
    title: "Admin Login | Arroyo Systems",
    description: "Arroyo Systems admin login.",
    robots: "noindex,nofollow",
  },
  "/admin/messages": {
    title: "Admin Dashboard | Arroyo Systems",
    description: "Arroyo Systems admin dashboard.",
    robots: "noindex,nofollow",
  },
  "/admin/payments": {
    title: "Admin Payments | Arroyo Systems",
    description: "Arroyo Systems admin payments.",
    robots: "noindex,nofollow",
  },
  "/checkout/success": {
    title: "Payment received | Arroyo Systems",
    description: "Payment confirmation.",
    robots: "noindex,nofollow",
  },
  "/checkout/cancel": {
    title: "Payment cancelled | Arroyo Systems",
    description: "Payment cancelled.",
    robots: "noindex,nofollow",
  },
};

const setMetaTag = (selector, attrName, attrValue, content) => {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const setLinkTag = (selector, rel, href, extraAttrs = {}) => {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    Object.entries(extraAttrs).forEach(([k, v]) => tag.setAttribute(k, v));
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
};

const removeTag = (selector) => {
  const tag = document.head.querySelector(selector);
  if (tag) tag.remove();
};

const RouteEffects = () => {
  const location = useLocation();
  const lang = getLangFromPath(location.pathname);
  const basePath = stripLangPrefix(location.pathname);

  React.useEffect(() => {
    document.documentElement.lang = lang;

    const adminSeo = STATIC_SEO[basePath];
    const pageKey = PAGE_ROUTES[basePath];

    let seo;
    let alternates = null;
    if (adminSeo) {
      seo = { ...adminSeo, canonical: `${SITE_URL}${basePath}` };
    } else {
      const pk = pageKey || "home";
      const t = getContent(lang);
      const enPath = pk === "home" ? "/" : basePath;
      seo = {
        title: t.seo[pk].title,
        description: t.seo[pk].description,
        robots: pk === "home" ? "index,follow" : "noindex,follow",
        canonical: `${SITE_URL}${withLang(lang, enPath)}`,
      };
      alternates = {
        en: `${SITE_URL}${enPath}`,
        es: `${SITE_URL}${withLang("es", enPath)}`,
      };
    }

    document.title = seo.title;
    setMetaTag('meta[name="description"]', "name", "description", seo.description);
    setMetaTag('meta[name="robots"]', "name", "robots", seo.robots);
    setMetaTag('meta[property="og:title"]', "property", "og:title", seo.title);
    setMetaTag('meta[property="og:description"]', "property", "og:description", seo.description);
    setMetaTag('meta[property="og:url"]', "property", "og:url", seo.canonical);
    setMetaTag('meta[name="twitter:title"]', "name", "twitter:title", seo.title);
    setMetaTag('meta[name="twitter:description"]', "name", "twitter:description", seo.description);
    setLinkTag('link[rel="canonical"]', "canonical", seo.canonical);

    if (alternates) {
      setLinkTag('link[rel="alternate"][hreflang="en"]', "alternate", alternates.en, { hreflang: "en" });
      setLinkTag('link[rel="alternate"][hreflang="es"]', "alternate", alternates.es, { hreflang: "es" });
      setLinkTag('link[rel="alternate"][hreflang="x-default"]', "alternate", alternates.en, {
        hreflang: "x-default",
      });
    } else {
      removeTag('link[rel="alternate"][hreflang="en"]');
      removeTag('link[rel="alternate"][hreflang="es"]');
      removeTag('link[rel="alternate"][hreflang="x-default"]');
    }
  }, [location.pathname, lang, basePath]);

  React.useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    window.requestAnimationFrame(() => {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.pathname, location.hash]);

  return null;
};

// Redirects a first-time visitor away from the English root to /es if their
// browser prefers Spanish. Only runs on "/", never overrides a direct link,
// and never fires again once the visitor has an explicit stored preference.
const RootLanguageRedirect = () => {
  const stored = window.localStorage.getItem(LANG_PREF_KEY);
  if (stored) return stored === "es" ? <Navigate to="/es" replace /> : null;

  const prefersSpanish = (window.navigator.language || "").toLowerCase().startsWith("es");
  return prefersSpanish ? <Navigate to="/es" replace /> : null;
};

const Home = () => {
  return (
    <div className="App">
      <Header />
      <main>
        <Hero />
        <Products />
        <WhyUs />
        <Partners />
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <>
      <BrowserRouter>
        <RouteEffects />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <RootLanguageRedirect />
                <Home />
              </>
            }
          />
          <Route path="/es" element={<Home />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/es/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/legal-notice" element={<LegalNotice />} />
          <Route path="/es/legal-notice" element={<LegalNotice />} />
          <Route path="/cookies-policy" element={<CookiesPolicy />} />
          <Route path="/es/cookies-policy" element={<CookiesPolicy />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/messages" element={<AdminDashboard />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;
