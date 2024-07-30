import crypto from 'node:crypto';

export function verifyWebhookSignature(
  body: string,
  signature: string,
  channelSecret: string,
): boolean {
  const hmac = crypto.createHmac('sha1', channelSecret);
  hmac.update(body);
  const computedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature),
  );
}
