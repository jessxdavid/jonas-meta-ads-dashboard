import clsx from "clsx";
import type { CSSProperties } from "react";

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={clsx("skeleton rounded-md", className)} style={style} />;
}

export function KpiCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <Skeleton className="mb-3 h-3 w-24" />
      <div className="flex items-end justify-between gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <Skeleton className="mb-2 h-4 w-40" />
      <Skeleton className="mb-4 h-3 w-56" />
      <Skeleton style={{ height }} className="w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <Skeleton className="mb-4 h-4 w-40" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3"
        >
          <Skeleton className="mb-3 aspect-square w-full" />
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="mb-2 h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
