/**
 * Gửi email OTP qua webhook n8n, không dựng html ở BE.
 * @param n8nWebhookUrl URL webhook của n8n
 * @param to Email người nhận
 * @param otp Mã OTP (chuỗi 6 số)
 * @param fullName Tên người nhận (tùy chọn)
 */
export async function sendOTPEmailViaN8n(
  n8nWebhookUrl: string,
  to: string,
  otp: string,
  fullName?: string
) {
  const subject = `Mã OTP xác thực đăng ký - FamilyHub`;

  const res = await fetch(n8nWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: to,
      subject,
      otp,
      fullName,
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`n8n webhook failed: ${res.status} - ${text}`);
  }
  return { success: true };
}

/**
 * Sinh mã OTP ngẫu nhiên 6 chữ số.
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
