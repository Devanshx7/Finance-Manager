import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config/supabase";

export function useStore(key, init) {
  const [data, setData] = useState(init);
  const [loaded, setLoaded] = useState(false);

  const userId = localStorage.getItem("vault:user_id");

  useEffect(() => {
    if (!userId) { setLoaded(true); return; }

    (async () => {
      try {
        const { data: row, error } = await supabase
          .from("vault_data")
          .select("value")
          .eq("key", key)
          .eq("user_id", userId)
          .single();

        if (row && !error) {
          setData(row.value);
        }
      } catch {}
      setLoaded(true);
    })();
  }, [key, userId]);

  const update = useCallback(
    (fn) => {
      setData((prev) => {
        const next = typeof fn === "function" ? fn(prev) : fn;

        (async () => {
          try {
            await supabase
              .from("vault_data")
              .upsert(
                { key, value: next, user_id: userId, updated_at: new Date().toISOString() },
                { onConflict: "key,user_id" }
              );
          } catch (e) {
            console.error("Supabase save failed:", e);
          }
        })();

        return next;
      });
    },
    [key, userId]
  );

  return [data, update, loaded];
}
