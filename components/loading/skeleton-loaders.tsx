export function BallotSkeleton() {
  return (
    <div className="space-y-6">
      {/* Progress bar skeleton */}
      <div className="h-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse" />

      {/* Position title skeleton */}
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />

      {/* Candidate cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            {/* Image */}
            <div className="aspect-square bg-gray-200 rounded animate-pulse" />
            {/* Name */}
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            {/* Title */}
            <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
            {/* Zone */}
            <div className="h-3 bg-gray-100 rounded w-2/5 animate-pulse" />
            {/* Button */}
            <div className="h-9 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CandidatesSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter skeleton */}
      <div className="flex gap-2">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>

      {/* Candidate cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            {/* Image */}
            <div className="aspect-video bg-gray-200 animate-pulse" />
            {/* Content */}
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
              <div className="h-9 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Position results */}
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-40 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 pb-4 border-b">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
        ))}
      </div>

      {/* Rows */}
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array(4).fill(0).map((_, j) => (
            <div key={j} className="h-4 bg-gray-100 rounded flex-1 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-4/5 animate-pulse" />
      </div>
    </div>
  )
}
