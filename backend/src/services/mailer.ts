import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: '3411586369@qq.com',
    pass: 'ssbvzdrbvswwcicc'
  },
  connectionTimeout: 3000,
  greetingTimeout: 3000,
  socketTimeout: 3000
});

export async function sendRealVerificationEmail(toEmail: string, code: string): Promise<boolean> {
  const mailOptions = {
    from: '"智护牙境 - 智能管控平台" <3411586369@qq.com>',
    to: toEmail,
    subject: '【智护牙境】您的系统登录与注册验证码',
    html: `
      <div style="max-width: 520px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; font-family: sans-serif; border-radius: 12px; border: 1px solid #1e293b;">
        <h2 style="color: #38bdf8; margin-top: 0;">智护牙境 - 口腔智能感控平台</h2>
        <p style="font-size: 15px; color: #cbd5e1;">尊敬的用户，您好：</p>
        <p style="font-size: 14px; color: #94a3b8;">您当前正在进行账号身份验证，本次操作的动态验证码为：</p>
        <div style="text-align: center; margin: 24px 0; padding: 16px; background-color: #1e293b; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #38bdf8;">${code}</span>
        </div>
        <p style="font-size: 13px; color: #64748b;">验证码有效期为 5 分钟，请勿将验证码泄露给他人。</p>
        <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;" />
        <p style="font-size: 12px; color: #475569; text-align: center;">示范总院口腔医疗中心 数字化感控保障系统</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`成功将验证码发送至邮箱: ${toEmail}`);
    return true;
  } catch (error: any) {
    console.warn(`SMTP 邮件发送超时或受限 (已安全捕获):`, error?.message || error);
    return false;
  }
}
