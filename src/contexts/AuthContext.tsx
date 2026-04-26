import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

// Username → fake email helper
const toEmail = (username: string) =>
  username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") + "@egstreet.local";

interface AuthContextType {
  user:         User | null;
  session:      Session | null;
  profile:      Profile | null;
  loading:      boolean;
  signIn:       (username: string, password: string) => Promise<{ error: string | null }>;
  signUp:       (username: string, password: string, displayName?: string) => Promise<{ error: string | null }>;
  signOut:      () => Promise<void>;
  updateProfile:(data: Partial<Profile>) => Promise<{ error: string | null }>;
}

interface Profile {
  id: string; user_id: string; username: string; display_name: string | null;
  avatar_url: string | null; bio: string | null; role: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, username, display_name, avatar_url, bio")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) {
      // Get role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      setProfile({ ...data as Profile, role: roleData?.role || "reader" });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Sign In with username ──────────────────────────────
  const signIn = async (username: string, password: string) => {
    // Try to resolve email from username/displayName via RPC
    let loginEmail = username.trim();
    if (!loginEmail.includes("@")) {
      const { data: resolved } = await supabase.rpc("get_email_by_username", { p_username: loginEmail });
      if (resolved) loginEmail = resolved;
      else return { error: "اسم المستخدم غير موجود" };
    }
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    if (error) {
      if (error.message.includes("Invalid login")) return { error: "اسم المستخدم أو كلمة السر غلط" };
      if (error.message.includes("Email not confirmed")) return { error: "الحساب لم يتم تفعيله بعد" };
      return { error: error.message };
    }
    return { error: null };
  };

  // ── Sign Up with username ──────────────────────────────
  const signUp = async (username: string, password: string, displayName?: string) => {
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (clean.length < 3) return { error: "اسم المستخدم لازم يكون 3 حروف على الأقل" };
    if (password.length < 6) return { error: "كلمة السر لازم تكون 6 أحرف على الأقل" };

    // Check username not taken
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", clean)
      .maybeSingle();
    if (existing) return { error: "اسم المستخدم ده موجود بالفعل، اختار اسم تاني" };

    const email = toEmail(clean);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: clean, display_name: displayName || clean },
        emailRedirectTo: undefined,
      }
    });

    if (error) {
      if (error.message.includes("already registered")) return { error: "اسم المستخدم ده موجود بالفعل" };
      return { error: error.message };
    }

    // Create profile manually (trigger as backup)
    if (data.user) {
      await supabase.from("profiles").upsert({
        user_id: data.user.id,
        username: clean,
        display_name: displayName || clean,
      }, { onConflict: "user_id" });
    }

    return { error: null };
  };

  // ── Sign Out ───────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  // ── Update Profile ────────────────────────────────────
  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: "مش مسجل دخول" };
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("user_id", user.id);
    if (!error) await loadProfile(user.id);
    return { error: error?.message || null };
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
