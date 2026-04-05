import { useState, useCallback } from "react";
import { supabase } from "../config/supabase";

const STORAGE_KEY = "vault:user_id";
const NAME_KEY = "vault:user_name";

function getStored() {
  const id = localStorage.getItem(STORAGE_KEY);
  const name = localStorage.getItem(NAME_KEY);
  return id && name ? { id, name } : null;
}

export function useAuth() {
  const [user, setUser] = useState(getStored);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const signup = useCallback(async (name, pin) => {
    setLoading(true);
    setError(null);
    try {
      const trimmed = name.trim();
      if (!trimmed || !/^\d{4}$/.test(pin)) {
        setError("Name required and PIN must be 4 digits");
        return false;
      }

      // Check if name already exists
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("name", trimmed.toLowerCase())
        .single();

      if (existing) {
        setError("Name already taken. Try logging in instead.");
        return false;
      }

      const { data, error: err } = await supabase
        .from("users")
        .insert({ name: trimmed.toLowerCase(), pin })
        .select("id, name")
        .single();

      if (err) throw err;

      localStorage.setItem(STORAGE_KEY, data.id);
      localStorage.setItem(NAME_KEY, data.name);
      setUser({ id: data.id, name: data.name });
      return true;
    } catch (e) {
      setError(e.message || "Signup failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (name, pin) => {
    setLoading(true);
    setError(null);
    try {
      const trimmed = name.trim();
      if (!trimmed || !pin) {
        setError("Name and PIN required");
        return false;
      }

      const { data, error: err } = await supabase
        .from("users")
        .select("id, name")
        .eq("name", trimmed.toLowerCase())
        .eq("pin", pin)
        .single();

      if (err || !data) {
        setError("Invalid name or PIN");
        return false;
      }

      localStorage.setItem(STORAGE_KEY, data.id);
      localStorage.setItem(NAME_KEY, data.name);
      setUser({ id: data.id, name: data.name });
      return true;
    } catch (e) {
      setError("Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NAME_KEY);
    setUser(null);
  }, []);

  return { user, loading, error, signup, login, logout, setError };
}
