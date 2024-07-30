import { verifyWebhookSignature } from '@/lib/googleCalendar/webhookUtils';
import { CalendarSyncService } from '@/services/CalendarSyncService';
import { NextResponse } from 'next/server';

const channelSecret = process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET || '';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-goog-signature');

  if (!signature || !verifyWebhookSignature(body, signature, channelSecret)) {
    return new NextResponse('Invalid signature', { status: 403 });
  }

  const data = JSON.parse(body);
  const userId = data.userId;
  const calendarId = data.calendarId;

  const calendarSyncService = new CalendarSyncService();
  await calendarSyncService.syncCalendar(userId, calendarId);

  return new NextResponse('OK', { status: 200 });
}
