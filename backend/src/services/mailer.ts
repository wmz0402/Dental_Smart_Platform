import nodemailer from 'nodemailer';

// 配置 QQ 邮箱真实的 SMTP 传输基础参数
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true, // 使用 465 SSL 安全端口
  auth: {
    user: '3411586369@qq.com',
    pass: 'ssbvzdrbvswwcicc' // 用户提供的 QQ 邮箱授权码
  }
});

/**
 * 发送真实邮件验证码服务
 * @param targetEmail 目标收件人邮箱
 * @param code 动态产生的6位验证码
 */
export async function sendRealVerificationEmail(targetEmail: string, code: string): Promise<boolean> {
  const mailOptions = {
    from: '"智护牙境感控平台" <3411586369@qq.com>',
    to: targetEmail,
    subject: '智护牙境 - 口腔智能感控平台 账号注册验证码',
    html: `
      <div style="max-width: 540px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; font-family: sans-serif; border-radius: 12px; border: 1px solid #334155;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #38bdf8; margin: 0;">智护牙境 - 口腔智能感控平台</h2>
          <p style="color: #94a3b8; font-size: 13px;">账号注册与身份验证</p>
        </div>
        
        <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; border: 1px solid #334155; text-align: center;">
          <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 12px;">您正在注册智护牙境平台账号，您的动态验证码为：</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10b981; margin: 16px 0; font-family: monospace;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">验证码有效期为 5 分钟，请勿将验证码泄露给他人。</p>
        </div>

        <div style="margin-top: 24px; text-align: center; font-size: 11px; color: #64748b;">
          此邮件由智护牙境智能系统自动发出，请勿直接回复。
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[真实邮件发送成功] 发件箱: 3411586369@qq.com -> 收件箱: ${targetEmail}, MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[真实邮件发送异常] 目标: ${targetEmail}, 原因:`, error);
    throw error;
  }
}
