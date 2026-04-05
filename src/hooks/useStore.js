import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config/supabase";

export function useStore(key, init) {
  const [data, setData] = useState(init);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: row, error } = await supabase
          .from("vault_data")
          .select("value")
          .eq("key", key)
          .single();

        if (row && !error) {
          setData(row.value);
        }
      } catch {}
      setLoaded(true);
    })();
  }, [key]);

  const update = useCallback(
    (fn) => {
      setData((prev) => {
        const next = typeof fn === "function" ? fn(prev) : fn;

        (async () => {
          try {
            await supabase
              .from("vault_data")
              .upsert(
                { key, value: next, updated_at: new Date().toISOString() },
                { onConflict: "key" }
              );
          } catch (e) {
            console.error("Supabase save failed:", e);
          }
        })();

        return next;
      });
    },
    [key]
  );

  return [data, update, loaded];
}
