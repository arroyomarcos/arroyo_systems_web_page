import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exportCsvUrl } from "../../lib/api";
import { getToken, clearToken } from "../../lib/auth";
import { filterMessages } from "../../lib/messageUtils";
import { useAdminMessages } from "../../lib/useAdminMessages";
import { useToast } from "../../hooks/use-toast";
import AdminTopBar from "./components/AdminTopBar";
import StatsRow from "./components/StatsRow";
import Toolbar from "./components/Toolbar";
import MessagesTable from "./components/MessagesTable";
import MessageDrawer from "./components/MessageDrawer";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  // Guard: no token → redirect to login
  React.useEffect(() => {
    if (!getToken()) navigate("/admin", { replace: true });
  }, [navigate]);

  const handleUnauthorized = useCallback(() => {
    clearToken();
    navigate("/admin", { replace: true });
  }, [navigate]);

  const handleError = useCallback(
    (err, title) => {
      toast({
        title,
        description: err?.message || "",
        variant: "destructive",
      });
    },
    [toast]
  );

  const {
    items,
    total,
    unread,
    me,
    loading,
    load,
    toggleRead,
    removeMessage,
  } = useAdminMessages({
    onUnauthorized: handleUnauthorized,
    onError: handleError,
  });

  const logout = useCallback(() => {
    clearToken();
    navigate("/admin", { replace: true });
  }, [navigate]);

  const onToggleRead = useCallback(
    async (message) => {
      const updated = await toggleRead(message);
      if (updated && selected && selected.id === message.id) {
        setSelected((s) => ({ ...s, read: updated.read }));
      }
    },
    [toggleRead, selected]
  );

  const onDelete = useCallback(
    async (message) => {
      if (!window.confirm(`Delete message from ${message.name}?`)) return;
      const ok = await removeMessage(message);
      if (ok) {
        if (selected && selected.id === message.id) setSelected(null);
        toast({ title: "Message deleted" });
      }
    },
    [removeMessage, selected, toast]
  );

  const exportCsv = useCallback(() => {
    const token = getToken();
    fetch(exportCsvUrl(), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "arroyo_messages.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
  }, []);

  const filtered = useMemo(() => filterMessages(items, query), [items, query]);

  return (
    <div className="min-h-screen bg-[color:var(--arroyo-bg-soft)]">
      <AdminTopBar me={me} onLogout={logout} />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <StatsRow total={total} unread={unread} />
        <Toolbar
          query={query}
          onQueryChange={setQuery}
          onRefresh={load}
          onExport={exportCsv}
        />
        <MessagesTable
          loading={loading}
          items={items}
          filtered={filtered}
          onSelect={setSelected}
          onToggleRead={onToggleRead}
          onDelete={onDelete}
        />
      </main>

      <MessageDrawer
        message={selected}
        onClose={() => setSelected(null)}
        onToggleRead={onToggleRead}
        onDelete={onDelete}
      />
    </div>
  );
};

export default AdminDashboard;
