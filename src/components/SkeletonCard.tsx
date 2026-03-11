import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  variant?: "hero" | "standard" | "compact";
}

const SkeletonCard = ({ variant = "standard" }: SkeletonCardProps) => {
  if (variant === "hero") {
    return (
      <div className="rounded-lg overflow-hidden">
        <Skeleton className="aspect-[16/9] w-full" />
        <div className="p-6 space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex gap-3 py-3">
        <Skeleton className="w-20 h-20 rounded shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
};

export default SkeletonCard;
