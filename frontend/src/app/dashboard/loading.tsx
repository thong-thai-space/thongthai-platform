/**
 * Pattern: Loading States
 * Dashboard loading skeleton
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Top section */}
      <div className="mb-6">
        <div className="h-10 bg-gray-200 rounded w-64"></div>
        <div className="mt-2 h-4 bg-gray-100 rounded w-96"></div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="mt-4 h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
