export const SOCKET_EVENTS = {
  // Connection & Auth
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Presence
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  USER_STATUS_CHANGE: 'user_status_change',

  // Rooms
  JOIN_REQUEST_ROOM: 'join_request_room',
  LEAVE_REQUEST_ROOM: 'leave_request_room',
  ROOM_JOINED: 'room_joined',
  ROOM_ERROR: 'room_error',

  // Messaging (WhatsApp-style)
  SEND_MESSAGE: 'send_message',
  NEW_MESSAGE: 'new_message',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_STATUS_UPDATE: 'message_status_update',
  MARK_READ: 'mark_read',
  MESSAGES_READ: 'messages_read',
  MESSAGE_DELETED: 'message_deleted',

  // Typing
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_TYPING: 'user_typing',

  // Quotation & Milestones in chat
  QUOTATION_RECEIVED: 'quotation_received',
  PAYMENT_CONFIRMED: 'payment_confirmed',
} as const;

export default SOCKET_EVENTS;
