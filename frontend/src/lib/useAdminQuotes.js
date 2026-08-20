import { useCallback, useEffect, useState } from "react";
import { listQuotes } from "./api";

/**
 * Owns the admin quotes list state. Mirrors useAdminOrders/useAdminMessages.
 */
export const useAdminQuotes = ({ onUnauthorized, onError }) => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listQuotes();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      if (err?.response?.status === 401) {
        onUnauthorized?.();
        return;
      }
      onError?.(err, "Could not load quotes");
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized, onError]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, total, loading, load };
};
