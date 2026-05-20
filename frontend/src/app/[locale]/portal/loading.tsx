/**
 * Pattern: Loading States
 * Client portal loading skeleton
 */
import { RouteLoadingState } from '@/components/state/route-loading-state';

export default function PortalLoading() {
  return <RouteLoadingState cardCount={2} rowCount={5} />;
}
