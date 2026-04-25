import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePermissions, PermissionKey } from "@/hooks/usePermissions";
import { Loader2, ShieldOff } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
  permission: PermissionKey;
}

export function AdminGuard({ children, permission }: AdminGuardProps) {
  const { can, loading, role } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !can(permission)) {
      // Hard redirect — no back navigation to blocked page
      navigate("/G63-admin", { replace: true });
    }
  }, [loading, can, permission, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
      </div>
    );
  }

  if (!can(permission)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ShieldOff className="w-16 h-16 text-destructive/50"/>
        <p className="text-xl font-black text-destructive">غير مصرح بالوصول</p>
        <p className="text-sm text-muted-foreground">ليس لديك صلاحية الوصول لهذه الصفحة</p>
      </div>
    );
  }

  return <>{children}</>;
}
