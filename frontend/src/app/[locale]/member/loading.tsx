/**
 * Pattern: Loading States
 * Member area loading skeleton
 */
import { RouteLoadingState } from '@/components/state/route-loading-state';

export default function MemberLoading() {
  return <RouteLoadingState cardCount={3} rowCount={4} />;
}
