import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionKey } from "@/contexts/PermissionsContext";
import { Loader2, ShieldOff } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
  permission: PermissionKey;
}

export function AdminGuard({ children, permission }: AdminGuardProps) {
  const { can, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
      </div>
    );
  }

  if (!can(permission)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 select-none">
        <ShieldOff className="w-16 h-16 text-destructive/40"/>
        <p className="text-lg font-black text-destructive">غير مصرح بالوصول</p>
        <p className="text-sm text-muted-foreground">ليس لديك صلاحية لهذه الصفحة</p>
      </div>
    );
  }

  return <>{children}</>;
}
