import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientDetailLoading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-3 w-40" />
      <Card className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-36" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="mt-6 grid gap-3 border-t border-ink-100 pt-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-4 w-40" />
          ))}
        </div>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {[0, 1, 2].map((item) => (
            <Card key={item} className="p-6">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="mt-2 h-3 w-64" />
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((field) => (
                  <div key={field} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[0, 1].map((item) => (
            <Card key={item} className="p-6">
              <Skeleton className="h-5 w-36" />
              <div className="mt-5 space-y-4">
                {[0, 1, 2].map((row) => (
                  <Skeleton key={row} className="h-9 w-full" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
      <Card className="p-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-3 w-72 max-w-full" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Card>
    </div>
  );
}
