type RouteLoadingStateProps = {
  cardCount?: number;
  rowCount?: number;
  showSubtitle?: boolean;
};

export function RouteLoadingState({
  cardCount = 3,
  rowCount = 4,
  showSubtitle = false,
}: RouteLoadingStateProps) {
  return (
    <div className="space-y-6 p-4">
      <div>
        <div className="tts-skeleton h-10 w-64 rounded" />
        {showSubtitle && <div className="tts-skeleton mt-2 h-4 w-96 rounded" />}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cardCount }).map((_, index) => (
          <div key={index} className="tts-workspace-surface p-4">
            <div className="tts-skeleton h-4 w-24 rounded" />
            <div className="tts-skeleton mt-3 h-8 w-36 rounded" />
          </div>
        ))}
      </div>

      <div className="tts-workspace-surface p-6">
        <div className="space-y-3">
          {Array.from({ length: rowCount }).map((_, index) => (
            <div key={index} className="tts-skeleton h-12 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
