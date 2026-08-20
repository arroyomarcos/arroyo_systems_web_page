import { useCallback, useEffect, useState } from "react";
import { createCheckoutSession, listOrders } from "./api";

/**
 * Custom hook that owns the admin orders state and the checkout-session mutation.
 * Mirrors useAdminMessages: loading, error routing (401), and count bookkeeping.
 */
export const useAdminOrders = ({ onUnauthorized, onError }) => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listOrders();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      if (err?.response?.status === 401) {
        onUnauthorized?.();
        return;
      }
      onError?.(err, "Could not load orders");
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized, onError]);

  const createLink = useCallback(
    async (payload) => {
      setCreating(true);
      try {
        const session = await createCheckoutSession(payload);
        await load();
        return session;
      } catch (err) {
        if (err?.response?.status === 401) {
          onUnauthorized?.();
          return null;
        }
        onError?.(err, "Could not create payment link");
        return null;
      } finally {
        setCreating(false);
      }
    },
    [load, onUnauthorized, onError]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { items, total, loading, creating, load, createLink };
};
