import { cn } from "@/lib/utils";

interface AdSlotProps {
  id?: string;
  width: number;
  height: number;
  label?: string;
  className?: string;
  sticky?: boolean;
}

/** مساحة إعلانية — تظهر placeholder حتى يتم ربط الإعلانات */
const AdSlot = ({ id, width, height, label, className, sticky }: AdSlotProps) => {
  const ratio = (height / width) * 100;

  return (
    <div
      id={id}
      className={cn(
        "w-full overflow-hidden rounded-lg border border-dashed border-border/40 bg-muted/20",
        sticky && "sticky top-20",
        className
      )}
      style={{ maxWidth: width }}
    >
      <div style={{ paddingBottom: `${ratio}%` }} className="relative w-full">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground/30 select-none">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 2l-4 5-4-5"/>
          </svg>
          <span className="text-[10px] font-bold tracking-wide">{label || `مساحة إعلانية`}</span>
          <span className="text-[9px] opacity-60">{width} × {height}</span>
        </div>
      </div>
    </div>
  );
};

export default AdSlot;
