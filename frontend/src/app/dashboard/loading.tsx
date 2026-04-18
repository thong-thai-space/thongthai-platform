/**
 * Pattern: Loading States
 * Dashboard loading skeleton
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Top section */}
      <div className="mb-6">
        <div className="tts-skeleton h-10 w-64 rounded"></div>
        <div className="tts-skeleton mt-2 h-4 w-96 rounded"></div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="tts-skeleton h-4 w-20 rounded"></div>
            <div className="tts-skeleton mt-4 h-8 w-32 rounded"></div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="tts-skeleton mb-4 h-6 w-40 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="tts-skeleton h-12 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
