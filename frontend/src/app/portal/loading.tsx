/**
 * Pattern: Loading States
 * Client portal loading skeleton
 */
export default function PortalLoading() {
  return (
    <div className="space-y-6">
      <div className="tts-skeleton h-10 w-64 rounded"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="tts-skeleton h-4 w-32 rounded"></div>
            <div className="tts-skeleton mt-3 h-8 w-40 rounded"></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="tts-skeleton h-16 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
