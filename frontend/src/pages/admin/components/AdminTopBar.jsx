import React from "react";
import { LogOut } from "lucide-react";

const AdminTopBar = ({ me, onLogout }) => (
  <header className="bg-white border-b border-slate-200">
    <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="arroyo-display text-lg">Arroyo Systems</div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[color:var(--arroyo-navy)] text-white">
          admin
        </span>
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

export default AdminTopBar;
