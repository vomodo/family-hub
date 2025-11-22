import type { Env } from '../types';

export async function sendOTPEmail(
  env: Env,
  to: string,
  otp: string,
  fullName?: string
) {
  const from = 'no-reply@ducvu.vn';
  const fromName = 'FamilyHub';
  
  const subject = `Mã OTP xác thực đăng ký - FamilyHub`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
        .otp-box { background: #f3f4f6; border: 2px dashed #3B82F6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #3B82F6; letter-spacing: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🏠 FamilyHub</h1>
          <p style="margin: 10px 0 0 0;">Quản lý chi tiêu gia đình</p>
        </div>
        
        <div class="content">
          <h2>Xin chào${fullName ? ` ${fullName}` : ''}!</h2>
          
          <p>Cảm ơn bạn đã đăng ký tài khoản FamilyHub. Để hoàn tất quá trình đăng ký, vui lòng nhập mã OTP bên dưới:</p>
          
          <div class="otp-box">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Mã xác thực của bạn</p>
            <div class="otp-code">${otp}</div>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">Có hiệu lực trong 10 phút</p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Lưu ý bảo mật:</strong>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>Không chia sẻ mã OTP này với bất kỳ ai</li>
              <li>FamilyHub sẽ không bao giờ yêu cầu mã OTP qua điện thoại</li>
              <li>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email</li>
            </ul>
          </div>
          
          <p>Nếu bạn cần hỗ trợ, vui lòng liên hệ: <a href="mailto:duc@ducvu.vn">duc@ducvu.vn</a></p>
          
          <div class="footer">
            <p>© 2025 FamilyHub. Made with ❤️ for Vietnamese families</p>
            <p style="font-size: 12px; color: #9ca3af;">Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Xin chào${fullName ? ` ${fullName}` : ''}!

Cảm ơn bạn đã đăng ký tài khoản FamilyHub.

Mã OTP của bạn là: ${otp}

Mã này có hiệu lực trong 10 phút.

Lưu ý: Không chia sẻ mã này với bất kỳ ai.

Trân trọng,
FamilyHub Team
  `;

  try {
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: env.SMTP_API_KEY,
        to: [to],
        sender: `${fromName} <${from}>`,
        subject,
        html_body: html,
        text_body: text,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`SMTP error: ${JSON.stringify(result)}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
