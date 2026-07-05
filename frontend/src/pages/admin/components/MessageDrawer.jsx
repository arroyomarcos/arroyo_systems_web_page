import React from "react";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { formatDate } from "../../../lib/messageUtils";

const DetailRow = ({ label, value }) => (
  <div>
    <p className="text-xs text-[color:var(--arroyo-muted)] uppercase tracking-widest">
      {label}
    </p>
    <p className="mt-1 text-[color:var(--arroyo-navy)]">{value}</p>
  </div>
);

const MessageDrawer = ({ message, onClose, onToggleRead, onDelete }) => {
  if (!message) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex justify-end"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-xs text-[color:var(--arroyo-muted)] uppercase tracking-widest">
              Message
            </p>
            <h2 className="arroyo-display text-2xl mt-1">{message.name}</h2>
            <p className="text-sm text-[color:var(--arroyo-muted)] mt-1">
              {formatDate(message.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[color:var(--arroyo-muted)] hover:text-[color:var(--arroyo-navy)] text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <DetailRow
            label="Email"
            value={
              <a className="link-underline" href={`mailto:${message.email}`}>
                {message.email}
              </a>
            }
          />
          <DetailRow label="Company" value={message.company || "—"} />
          <DetailRow
            label="Project type"
            value={message.project_type || "—"}
          />
          <DetailRow
            label="Status"
            value={message.read ? "Read" : "Unread"}
          />

          <div>
            <p className="text-xs text-[color:var(--arroyo-muted)] uppercase tracking-widest mb-2">
              Message
            </p>
            <p className="text-[color:var(--arroyo-navy)] whitespace-pre-wrap leading-relaxed">
              {message.message}
            </p>
          </div>

          <div className="pt-4 flex gap-3 flex-wrap">
            <button
              onClick={() => onToggleRead(message)}
              className="contact-pill text-sm"
            >
              {message.read ? (
                <>
                  <Mail size={14} /> Mark as unread
                </>
              ) : (
                <>
                  <MailOpen size={14} /> Mark as read
                </>
              )}
            </button>
            <a href={`mailto:${message.email}`} className="contact-pill text-sm">
              Reply by email
            </a>
            <button
              onClick={() => onDelete(message)}
              className="contact-pill text-sm border-red-300 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default MessageDrawer;
