export interface MessageRealtimePort {
  pushNewMessage(recipientId: string, payload: unknown): void;
}
