import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionKey } from "@/contexts/PermissionsContext";
import { Loader2, ShieldOff, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AdminGuardProps {
  children: React.ReactNode;
  permission: PermissionKey;
}

export function AdminGuard({ children, permission }: AdminGuardProps) {
  const { can, loading, role } = usePermissions();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
      </div>
    );
  }

  if (!can(permission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 select-none px-4" dir="rtl">
        <div className="w-24 h-24 rounded-3xl bg-destructive/10 flex items-center justify-center">
          <ShieldOff className="w-12 h-12 text-destructive/50"/>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-destructive">غير مصرح بالوصول</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            ليس لديك صلاحية للوصول لهذه الصفحة.
            {role && role !== "super_admin" && (
              <span className="block mt-1 font-medium">دورك الحالي: <span className="text-primary">{role}</span></span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors">
            رجوع
          </button>
          <button onClick={() => navigate("/G63-admin")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
            لوحة التحكم
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/50 mt-2">
          <Lock className="w-3 h-3"/>
          <span>الصلاحية المطلوبة: {permission}</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
