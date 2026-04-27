import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setLoading(false);

      // Fire-and-forget profile upsert — don't await so it doesn't block
      // rendering. This lazily ensures the profiles row exists for FK constraints.
      if (_event === "SIGNED_IN" && session?.user) {
        const u = session.user;
        supabase.from("profiles").upsert(
          {
            id: u.id,
            username:
              u.user_metadata?.display_name ||
              u.user_metadata?.full_name ||
              u.email?.split("@")[0] ||
              "User",
          },
          { onConflict: "id", ignoreDuplicates: true }
        ).then(); // non-blocking
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
