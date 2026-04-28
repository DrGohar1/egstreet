import { cn } from "@/lib/utils";

interface AdSlotProps {
  id?: string;
  width: number;
  height: number;
  label?: string;
  className?: string;
  sticky?: boolean;
  src?: string;          // إذا كان فيه إعلان فعلي
  href?: string;
  forceShow?: boolean;   // للمعاينة في لوحة التحكم فقط
}

/** مساحة إعلانية — لا تظهر للزوار إلا لو فيها إعلان فعلي */
const AdSlot = ({ id, width, height, label, className, sticky, src, href, forceShow }: AdSlotProps) => {
  // إذا ما فيش إعلان فعلي → لا تعرض شيء للزوار
  if (!src && !forceShow) return null;

  const ratio = (height / width) * 100;

  const inner = src ? (
    <img src={src} alt={label || "إعلان"} className="w-full h-full object-cover absolute inset-0"/>
  ) : (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground/30 select-none">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 2l-4 5-4-5"/>
      </svg>
      <span className="text-[10px] font-bold tracking-wide">{label || "مساحة إعلانية"}</span>
      <span className="text-[9px] opacity-60">{width} × {height}</span>
    </div>
  );

  const box = (
    <div
      id={id}
      className={cn(
        "w-full overflow-hidden rounded-lg",
        src ? "shadow-sm" : "border border-dashed border-border/40 bg-muted/20",
        sticky && "sticky top-20",
        className
      )}
      style={{ maxWidth: width }}
    >
      <div style={{ paddingBottom: `${ratio}%` }} className="relative w-full">
        {inner}
      </div>
    </div>
  );

  return href ? <a href={href} target="_blank" rel="noopener noreferrer sponsored">{box}</a> : box;
};

export default AdSlot;
