import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  recovery: boolean;
}>({ user: null, loading: true, recovery: false });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) {
          setUser(data.session?.user ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setLoading(false);
        }
      });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") setRecovery(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return (
    <AuthContext.Provider value={{ user, loading, recovery }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
