export const formatDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

/**
 * Filters messages by a plain-text query against name, email, company, message.
 */
export const filterMessages = (items, query) => {
  if (!query || !query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter((m) =>
    [m.name, m.email, m.company, m.message]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q))
  );
};
