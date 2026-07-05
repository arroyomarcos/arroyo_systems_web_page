import React from "react";

const StatCard = ({ label, value, accent }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <p className="text-xs uppercase tracking-widest text-[color:var(--arroyo-muted)]">
      {label}
    </p>
    <p
      className={`arroyo-display text-3xl mt-1 ${
        accent ? "text-[color:var(--arroyo-accent)]" : ""
      }`}
    >
      {value}
    </p>
  </div>
);

const StatsRow = ({ total, unread }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
    <StatCard label="Total messages" value={total} />
    <StatCard label="Unread" value={unread} accent />
    <StatCard label="Read" value={total - unread} />
  </div>
);

export default StatsRow;
