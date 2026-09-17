function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[20px] bg-[#f0ede8] ${className}`} />;
}

export function GridSkeleton() {
  return (
    <div className="pt-5">
      <Block className="mb-4 h-[180px] w-full" />

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-[104px]" />
        ))}
      </div>

      <div className="mb-3.5 flex items-center gap-3">
        <div className="mr-auto h-5 w-24 animate-pulse rounded bg-[#f0ede8]" />
      </div>

      <div className="space-y-3.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Block key={i} className="h-[190px]" />
        ))}
      </div>
    </div>
  );
}
