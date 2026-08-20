import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";

const NAV_LINKS = [
  { to: "/admin/messages", label: "Messages" },
  { to: "/admin/quotes", label: "Quotes" },
  { to: "/admin/payments", label: "Payments" },
];

const AdminTopBar = ({ me, onLogout }) => {
  const location = useLocation();

  return (
  <header className="bg-white border-b border-slate-200">
    <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="arroyo-display text-lg">Arroyo Systems</div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[color:var(--arroyo-navy)] text-white">
          admin
        </span>
        <nav className="hidden sm:flex items-center gap-1 ml-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm px-3 py-1.5 rounded-md ${
                location.pathname.startsWith(link.to)
                  ? "bg-[color:var(--arroyo-bg-soft)] text-[color:var(--arroyo-navy)] font-medium"
                  : "text-[color:var(--arroyo-muted)] hover:text-[color:var(--arroyo-navy)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {me && (
          <span className="text-sm text-[color:var(--arroyo-muted)] hidden sm:inline">
            Signed in as{" "}
            <b className="text-[color:var(--arroyo-navy)]">{me.username}</b>
          </span>
        )}
        <button onClick={onLogout} className="contact-pill text-sm">
          <LogOut size={14} /> Logout
        </button>
      </div>
    </div>
  </header>
  );
};

export default AdminTopBar;
