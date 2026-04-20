/**
 * Pattern: Loading States
 * Dashboard loading skeleton
 */
import { RouteLoadingState } from '@/components/state/route-loading-state';

export default function DashboardLoading() {
  return <RouteLoadingState cardCount={4} rowCount={5} showSubtitle />;
}
