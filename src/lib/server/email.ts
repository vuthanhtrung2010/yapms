import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

// Create SMTP transporter
const transporter = nodemailer.createTransport({
	host: env.SMTP_HOST,
	port: parseInt(env.SMTP_PORT || '587'),
	secure: env.SMTP_SECURE === 'true', // true for 465, false for other ports
	auth: {
		user: env.SMTP_USER,
		pass: env.SMTP_PASS
	}
});

interface EmailOptions {
	to: string;
	subject: string;
	text: string;
	html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
	try {
		await transporter.sendMail({
			from: env.SMTP_FROM || env.SMTP_USER,
			to,
			subject,
			text,
			html: html || `<p>${text.replace(/\n/g, '<br>')}</p>`
		});
	} catch (error) {
		console.error('Failed to send email:', error);
		throw error;
	}
}

export function getVerificationEmailHTML(url: string, userName?: string) {
	return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Verify Your Email</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; margin-bottom: 30px; }
      .button { 
        display: inline-block; 
        background-color: #ff3e00; 
        color: white; 
        padding: 12px 30px; 
        text-decoration: none; 
        border-radius: 6px; 
        margin: 20px 0;
      }
      .footer { color: #888; font-size: 12px; margin-top: 30px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Xác minh Email của Bạn</h1>
      </div>
      <p>Xin chào${userName ? ' ' + userName : ''},</p>
      <p>Cảm ơn bạn đã đăng ký với YAPMS. Nhấp vào nút bên dưới để xác minh email của bạn:</p>
      <div style="text-align: center;">
        <a href="${url}" class="button">Xác minh Email</a>
      </div>
      <p>Hoặc sao chép và dán đường link này vào trình duyệt:</p>
      <p style="word-break: break-all; color: #666;">${url}</p>
      <p style="margin-top: 30px; color: #888; font-size: 13px;">Liên kết này sẽ hết hạn trong 24 giờ.</p>
      <div class="footer">
        <p>Nếu bạn không yêu cầu xác minh này, vui lòng bỏ qua email này.</p>
        <p>&copy; 2026 YAPMS. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
	`.trim();
}
