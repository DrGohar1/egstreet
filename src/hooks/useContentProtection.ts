import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export const useContentProtection = () => {
  const { user } = useAuth();
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) { setIsStaff(false); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (data && data.length > 0) {
        setIsStaff(true);
      }
    };
    checkRole();
  }, [user]);

  useEffect(() => {
    // Staff (admins/journalists) can copy freely
    if (isStaff) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "u" || e.key === "s")) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C"))
      ) {
        e.preventDefault();
        return false;
      }
    };

    const handleDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, [isStaff]);
};
