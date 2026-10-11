/**
 * FIX #7 — Skeleton loaders for every page type.
 * Replace ad-hoc shimmer divs with these consistent components.
 */
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg", className)} />;
}

/** 4-column stat row */
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card p-5 flex items-start gap-4">
          <Bone className="w-11 h-11 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-7 w-16" />
            <Bone className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Card grid (batches, tasks) */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <div className="flex items-start justify-between">
            <Bone className="w-10 h-10 rounded-xl" />
            <Bone className="w-20 h-6 rounded-full" />
          </div>
          <Bone className="h-5 w-3/4" />
          <Bone className="h-4 w-full" />
          <div className="flex gap-2">
            <Bone className="h-4 w-20" />
            <Bone className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** List rows (tasks, submissions, reports) */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 flex items-start gap-4">
          <Bone className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Bone className="h-5 w-48" />
              <Bone className="h-5 w-20 rounded-full" />
            </div>
            <Bone className="h-4 w-32" />
            <Bone className="h-4 w-full" />
          </div>
          <Bone className="w-20 h-8 rounded-lg flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Table rows */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-3.5 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className="h-4 w-24" />
        ))}
      </div>
      <div className="divide-y divide-slate-50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Bone className="w-9 h-9 rounded-lg flex-shrink-0" />
              <div className="space-y-1.5">
                <Bone className="h-4 w-32" />
                <Bone className="h-3 w-48" />
              </div>
            </div>
            {Array.from({ length: cols - 1 }).map((_, j) => (
              <Bone key={j} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Evaluation score card */
export function EvaluationSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="p-6 bg-slate-800 flex gap-6">
        <Bone className="w-32 h-32 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-4">
          <Bone className="h-6 w-40" />
          <Bone className="h-5 w-56" />
          <Bone className="h-4 w-32" />
        </div>
      </div>
      <div className="p-6 space-y-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Bone className="w-36 h-10 flex-shrink-0" />
            <Bone className="flex-1 h-2.5 rounded-full" />
            <Bone className="w-12 h-5" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dashboard page full skeleton */
export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="space-y-2">
        <Bone className="h-8 w-64" />
        <Bone className="h-4 w-80" />
      </div>
      <StatsSkeleton />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5 space-y-3">
          <Bone className="h-5 w-32" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Bone className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-4 w-40" />
                <Bone className="h-3 w-56" />
              </div>
              <Bone className="w-20 h-6 rounded-full" />
            </div>
          ))}
        </div>
        <div className="card p-5 space-y-3">
          <Bone className="h-5 w-28" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Bone className="w-8 h-8 rounded-lg" />
              <Bone className="flex-1 h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
