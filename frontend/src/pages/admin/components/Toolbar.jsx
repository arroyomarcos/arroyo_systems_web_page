import React from "react";
import { Download, RefreshCw, Search } from "lucide-react";

const Toolbar = ({ query, onQueryChange, onRefresh, onExport }) => (
  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
    <div className="relative flex-1 max-w-md">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--arroyo-muted)]"
      />
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search by name, email, company, message..."
        className="cf-input pl-9"
      />
    </div>
    <div className="flex gap-2">
      <button onClick={onRefresh} className="contact-pill text-sm">
        <RefreshCw size={14} /> Refresh
      </button>
      <button onClick={onExport} className="contact-pill text-sm">
        <Download size={14} /> Export CSV
      </button>
    </div>
  </div>
);

export default Toolbar;
