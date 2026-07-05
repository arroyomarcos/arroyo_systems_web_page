import React from "react";
import { Loader2, Mail, MailOpen, Trash2 } from "lucide-react";
import { formatDate } from "../../../lib/messageUtils";

const EmptyOrLoading = ({ loading, itemsCount, filteredCount }) => {
  if (loading) {
    return (
      <div className="p-16 flex items-center justify-center text-[color:var(--arroyo-muted)]">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading messages...
      </div>
    );
  }
  if (filteredCount === 0) {
    return (
      <div className="p-16 text-center text-[color:var(--arroyo-muted)]">
        {itemsCount === 0
          ? "No messages yet."
          : "No messages match your search."}
      </div>
    );
  }
  return null;
};

const MessagesTable = ({
  loading,
  items,
  filtered,
  onSelect,
  onToggleRead,
  onDelete,
}) => {
  const empty = (
    <EmptyOrLoading
      loading={loading}
      itemsCount={items.length}
      filteredCount={filtered.length}
    />
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {loading || filtered.length === 0 ? (
        empty
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[color:var(--arroyo-muted)] uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 hidden md:table-cell">Email</th>
                <th className="px-4 py-3 hidden lg:table-cell">Company</th>
                <th className="px-4 py-3 hidden lg:table-cell">Type</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  onSelect={onSelect}
                  onToggleRead={onToggleRead}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const MessageRow = ({ message, onSelect, onToggleRead, onDelete }) => (
  <tr
    className={`border-t border-slate-100 hover:bg-slate-50 cursor-pointer ${
      !message.read ? "bg-blue-50/40" : ""
    }`}
    onClick={() => onSelect(message)}
  >
    <td className="px-4 py-3">
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          message.read ? "bg-slate-300" : "bg-[color:var(--arroyo-accent)]"
        }`}
      />
    </td>
    <td className="px-4 py-3 font-medium text-[color:var(--arroyo-navy)]">
      {message.name}
    </td>
    <td className="px-4 py-3 hidden md:table-cell text-[color:var(--arroyo-muted)]">
      {message.email}
    </td>
    <td className="px-4 py-3 hidden lg:table-cell text-[color:var(--arroyo-muted)]">
      {message.company || "—"}
    </td>
    <td className="px-4 py-3 hidden lg:table-cell text-[color:var(--arroyo-muted)]">
      {message.project_type || "—"}
    </td>
    <td className="px-4 py-3 text-[color:var(--arroyo-muted)] whitespace-nowrap">
      {formatDate(message.created_at)}
    </td>
    <td
      className="px-4 py-3 text-right whitespace-nowrap"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => onToggleRead(message)}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-slate-100 text-[color:var(--arroyo-navy)]"
        title={message.read ? "Mark as unread" : "Mark as read"}
      >
        {message.read ? <Mail size={14} /> : <MailOpen size={14} />}
      </button>
      <button
        onClick={() => onDelete(message)}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-red-50 text-red-600"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </td>
  </tr>
);

export default MessagesTable;
