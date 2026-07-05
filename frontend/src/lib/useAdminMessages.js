import { useCallback, useEffect, useState } from "react";
import {
  adminMe,
  deleteMessage,
  listMessages,
  updateMessageRead,
} from "./api";

/**
 * Custom hook that owns the admin messages state and mutations.
 * Encapsulates loading, error routing (401), and count bookkeeping.
 */
export const useAdminMessages = ({ onUnauthorized, onError }) => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, meData] = await Promise.all([listMessages(), adminMe()]);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setUnread(data.unread || 0);
      setMe(meData);
    } catch (err) {
      if (err?.response?.status === 401) {
        onUnauthorized?.();
        return;
      }
      onError?.(err, "Could not load messages");
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized, onError]);

  const toggleRead = useCallback(
    async (message) => {
      try {
        const updated = await updateMessageRead(message.id, !message.read);
        setItems((prev) =>
          prev.map((x) => (x.id === message.id ? { ...x, read: updated.read } : x))
        );
        setUnread((u) => (updated.read ? Math.max(0, u - 1) : u + 1));
        return updated;
      } catch (err) {
        onError?.(err, "Update failed");
        return null;
      }
    },
    [onError]
  );

  const removeMessage = useCallback(
    async (message) => {
      try {
        await deleteMessage(message.id);
        setItems((prev) => prev.filter((x) => x.id !== message.id));
        setTotal((t) => Math.max(0, t - 1));
        if (!message.read) setUnread((u) => Math.max(0, u - 1));
        return true;
      } catch (err) {
        onError?.(err, "Delete failed");
        return false;
      }
    },
    [onError]
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    items,
    total,
    unread,
    me,
    loading,
    load,
    toggleRead,
    removeMessage,
  };
};
