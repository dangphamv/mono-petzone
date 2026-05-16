import { ApiProperty } from '@nestjs/swagger';
import { NOTIFICATION_TYPES, NOTIFICATION_EVENTS, type NotificationType, type NotificationEvent } from '@petzone/shared';

export class RegisterDeviceTokenDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]', description: 'Device push token (FCM registration token)' })
  token: string;

  @ApiProperty({ enum: ['ios', 'android', 'web'], example: 'ios', description: 'Device platform' })
  platform: 'ios' | 'android' | 'web';
}

/** Reference DTO — shape of a notification row returned by GET /notifications */
export class NotificationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Recipient user UUID' })
  user_id: string;

  @ApiProperty({
    enum: NOTIFICATION_TYPES,
    example: 'payment',
    description: 'Visual category — app uses for icon + sound + badge.',
  })
  type: NotificationType;

  @ApiProperty({ example: 'Đã nhận thanh toán ✅' })
  title: string;

  @ApiProperty({ example: 'Đơn PB-20260516-0001 (1.200.000đ) — đang chờ chủ hotel xác nhận.' })
  body: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      type: 'payment',
      event: NOTIFICATION_EVENTS.PAYMENT_COMPLETED,
      notification_id: '550e8400-...',
      click_action: 'petzone://orders/abc-123',
      order_id: 'abc-123',
      order_number: 'PB-20260516-0001',
      amount: '1200000',
      gateway: 'vietqr',
    },
    description: 'FCM data payload (all values stringified). App should parse to handle deep link + pre-fill UI.',
  })
  data: Record<string, unknown>;

  @ApiProperty({ example: false })
  is_read: boolean;

  @ApiProperty({ example: true, description: 'Whether the FCM push was successfully delivered to at least 1 device' })
  push_sent: boolean;

  @ApiProperty({ example: '2026-05-16T08:30:00.000Z' })
  created_at: string;

  @ApiProperty({ required: false, example: null, nullable: true })
  read_at: string | null;
}

/** Reference DTO — shape of FCM payload the app receives */
export class FcmPayloadReferenceDto {
  @ApiProperty({
    type: 'object',
    properties: {
      title: { type: 'string', example: 'Đã nhận thanh toán ✅' },
      body: { type: 'string', example: 'Đơn PB-20260516-0001 (1.200.000đ) — đang chờ chủ hotel xác nhận.' },
    },
    description: 'OS-rendered banner when app is in background. App handles foreground manually.',
  })
  notification: { title: string; body: string };

  @ApiProperty({
    type: 'object',
    properties: {
      type: { type: 'string', enum: [...NOTIFICATION_TYPES], description: 'Visual category' },
      event: { type: 'string', enum: Object.values(NOTIFICATION_EVENTS), description: 'Semantic trigger' },
      notification_id: { type: 'string', description: 'Use to PATCH /notifications/:id/read when user taps' },
      click_action: { type: 'string', description: 'Deep link to open. Schema: petzone://...' },
      order_id: { type: 'string' },
      order_number: { type: 'string' },
      amount: { type: 'string', description: 'STRINGIFIED — parse to number' },
      gateway: { type: 'string', example: 'vietqr' },
      conversation_id: { type: 'string', description: 'Present for chat notifications' },
      sender_id: { type: 'string', description: 'Present for chat notifications' },
    },
    description: 'FCM data fields. ALL VALUES ARE STRINGS — parse on app side.',
  })
  data: Record<string, string>;
}

/** Event metadata returned by GET /notifications/meta — for app introspection */
export class NotificationMetaDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        value: { type: 'string', enum: [...NOTIFICATION_TYPES] },
        label: { type: 'string', description: 'Vietnamese label' },
      },
    },
    example: NOTIFICATION_TYPES.map((value) => ({ value, label: value })),
  })
  types: { value: NotificationType; label: string }[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'TypeScript constant name' },
        value: { type: 'string', description: 'Event string (stable, used in FCM data.event)' },
        type: { type: 'string', enum: [...NOTIFICATION_TYPES], description: 'Which NotificationType this event produces' },
      },
    },
    example: Object.entries(NOTIFICATION_EVENTS).slice(0, 3).map(([key, value]) => ({ key, value, type: 'payment' })),
  })
  events: { key: string; value: NotificationEvent; type: NotificationType }[];

  @ApiProperty({ example: 'petzone', description: 'Custom URI scheme the app should reserve' })
  deep_link_scheme: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    example: ['type', 'event', 'notification_id', 'click_action', 'order_id', 'order_number'],
    description: 'Keys that may appear in FCM data field — app should know how to parse',
  })
  fcm_data_keys: string[];
}
