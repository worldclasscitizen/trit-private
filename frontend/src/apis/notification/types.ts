export type NotificationType = 'LIKE' | 'COMMENT' | 'FRIEND_REQUEST' | 'FRIEND_ACCEPT' | 'SCRAP';

export interface NotificationResponse {
  id: number;
  senderId: number;
  senderNickname: string;
  senderProfileImageUrl?: string;
  type: NotificationType;
  message: string;
  targetId: number;
  targetUrl: string;
  isRead: boolean;
  createdAt: string;
}
