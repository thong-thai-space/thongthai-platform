/**
 * Pattern: Loading States
 * Member area loading skeleton
 */
export default function MemberLoading() {
  return (
    <div className="space-y-6">
      <div className="tts-skeleton h-10 w-64 rounded"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="tts-skeleton h-4 w-20 rounded"></div>
            <div className="tts-skeleton mt-3 h-6 w-24 rounded"></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="tts-skeleton h-12 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
