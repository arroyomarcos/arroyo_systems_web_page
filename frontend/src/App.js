import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Products from "./components/sections/Products";
import WhyArroyo from "./components/sections/WhyArroyo";
import Partners from "./components/sections/Partners";
import Footer from "./components/Footer";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { CookiesPolicy, LegalNotice, PrivacyPolicy } from "./pages/LegalPage";
import { Toaster } from "./components/ui/toaster";

const SITE_URL = "https://www.arroyo-systems.com";

const ROUTE_SEO = {
  "/": {
    title: "Arroyo Systems | Designed to Manufacture, Validated to Perform",
    description:
      "Engineering for machined components. Arroyo Systems helps develop mechanical components under load with less technical uncertainty before manufacturing.",
    canonical: `${SITE_URL}/`,
    robots: "index,follow",
  },
  "/privacy-policy": {
    title: "Privacy Policy | Arroyo Systems",
    description: "Privacy policy for Arroyo Systems website and contact form data processing.",
    canonical: `${SITE_URL}/privacy-policy`,
    robots: "noindex,follow",
  },
  "/legal-notice": {
    title: "Legal Notice | Arroyo Systems",
    description: "Legal notice and website owner information for Arroyo Systems.",
    canonical: `${SITE_URL}/legal-notice`,
    robots: "noindex,follow",
  },
  "/cookies-policy": {
    title: "Cookies Policy | Arroyo Systems",
    description: "Cookies policy for Arroyo Systems website.",
    canonical: `${SITE_URL}/cookies-policy`,
    robots: "noindex,follow",
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

const setLinkTag = (rel, href) => {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
};

const RouteEffects = () => {
  const location = useLocation();

  React.useEffect(() => {
    const seo = ROUTE_SEO[location.pathname] || ROUTE_SEO["/"];

    document.title = seo.title;
    setMetaTag('meta[name="description"]', "name", "description", seo.description);
    setMetaTag('meta[name="robots"]', "name", "robots", seo.robots);
    setMetaTag('meta[property="og:title"]', "property", "og:title", seo.title);
    setMetaTag('meta[property="og:description"]', "property", "og:description", seo.description);
    setMetaTag('meta[property="og:url"]', "property", "og:url", seo.canonical);
    setMetaTag('meta[name="twitter:title"]', "name", "twitter:title", seo.title);
    setMetaTag('meta[name="twitter:description"]', "name", "twitter:description", seo.description);
    setLinkTag("canonical", seo.canonical);
  }, [location.pathname]);

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

const Home = () => {
  return (
    <div className="App">
      <Header />
      <main>
        <Hero />
        <Products />
        <WhyArroyo />
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
          <Route path="/" element={<Home />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/legal-notice" element={<LegalNotice />} />
          <Route path="/cookies-policy" element={<CookiesPolicy />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/messages" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;
