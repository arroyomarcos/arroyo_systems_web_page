import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Approach from "./components/sections/Approach";
import Decisions from "./components/sections/Decisions";
import Capabilities from "./components/sections/Capabilities";
import Products from "./components/sections/Products";
import Footer from "./components/Footer";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { CookiesPolicy, LegalNotice, PrivacyPolicy } from "./pages/LegalPage";
import { Toaster } from "./components/ui/toaster";

const Home = () => {
  return (
    <div className="App">
      <Header />
      <main>
        <Hero />
        <Approach />
        <Decisions />
        <Capabilities />
        <Products />
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <>
      <BrowserRouter>
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
