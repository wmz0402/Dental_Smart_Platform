import { Router, Request, Response } from 'express';
import { sendRealVerificationEmail } from '../services/mailer';

export const authRouter = Router();

// 系统持久/内存注册用户表
interface RegisteredUser {
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'OPERATOR';
  realName: string;
  avatar?: string;
  createdAt: string;
}

// 初始化用户表（包含系统内置超级管理员）
const userDatabase = new Map<string, RegisteredUser>();

// 植入内置超级管理员账号
userDatabase.set('admin@qq.com', {
  email: 'admin@qq.com',
  passwordHash: 'luck0070402',
  role: 'ADMIN',
  realName: '超级管理员',
  avatar: '',
  createdAt: new Date().toISOString()
});

// 动态验证码缓存 (邮箱 -> { code, expires })
const verifyCodes = new Map<string, { code: string; expires: number }>();

// 1. 发送真实邮箱验证码 (发件箱: 3411586369@qq.com)
authRouter.post('/send-code', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: '请输入有效的电子邮箱地址' });
  }

  // 动态生成随机 6 位数字验证码
  const realCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 5 * 60 * 1000; // 5分钟有效

  verifyCodes.set(email, { code: realCode, expires });

  try {
    await sendRealVerificationEmail(email, realCode);
    console.log(`[验证码服务] 已成功通过 3411586369@qq.com 真实投递验证码至: ${email}`);
    res.json({
      success: true,
      message: `验证码已成功发送至邮箱 ${email}`
    });
  } catch (err: any) {
    console.error(`[验证码服务失败] 无法发送至 ${email}:`, err);
    res.status(500).json({
      error: `邮件发送失败，请检查电子邮箱格式或稍后重试 (${err.message || '网络或SMTP服务异常'})`
    });
  }
});

// 2. 检查邮箱注册状态
authRouter.post('/check-email', (req: Request, res: Response) => {
  const { email } = req.body;
  const isRegistered = userDatabase.has(email);
  res.json({ isRegistered });
});

// 3. 已注册用户——邮箱+密码登录
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '邮箱与密码不能为空' });
  }

  let user = userDatabase.get(email);
  
  // 如果是系统内置管理员或已有动态用户
  if (!user && email === 'admin@qq.com') {
    user = {
      email: 'admin@qq.com',
      passwordHash: 'luck0070402',
      role: 'ADMIN',
      realName: '超级管理员',
      avatar: '',
      createdAt: new Date().toISOString()
    };
    userDatabase.set(email, user);
  }

  if (!user) {
    return res.status(400).json({ error: '该邮箱尚未注册，请先使用邮箱验证码进行注册' });
  }

  if (user.passwordHash !== password) {
    return res.status(400).json({ error: '登录密码错误，请重新输入' });
  }

  const token = `token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  res.json({
    success: true,
    user: {
      email: user.email,
      role: user.role,
      realName: user.realName,
      avatar: user.avatar || '',
      token
    }
  });
});

// 4. 未注册用户——动态验证码校验 + 设置新密码注册
authRouter.post('/register', (req: Request, res: Response) => {
  const { email, code, password } = req.body;

  if (!email || !code || !password) {
    return res.status(400).json({ error: '邮箱、验证码及设置的新密码均不能为空' });
  }

  if (userDatabase.has(email)) {
    return res.status(400).json({ error: '该邮箱已注册，请直接使用账号密码登录' });
  }

  const cached = verifyCodes.get(email);
  if (!cached || cached.code !== code || cached.expires < Date.now()) {
    return res.status(400).json({ error: '验证码错误或已过期，请查收邮件并输入正确的6位验证码' });
  }

  const newUser: RegisteredUser = {
    email,
    passwordHash: password,
    role: 'OPERATOR',
    realName: '普通牙医诊疗师',
    avatar: '',
    createdAt: new Date().toISOString()
  };

  userDatabase.set(email, newUser);
  verifyCodes.delete(email);

  const token = `token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  res.json({
    success: true,
    user: {
      email: newUser.email,
      role: newUser.role,
      realName: newUser.realName,
      avatar: newUser.avatar,
      token
    }
  });
});

// 5. 凭旧密码修改新密码
authRouter.post('/change-password', (req: Request, res: Response) => {
  const { email, oldPassword, newPassword } = req.body;

  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ error: '邮箱、旧密码与新密码均不能为空' });
  }

  let user = userDatabase.get(email);
  if (!user && email === 'admin@qq.com') {
    user = {
      email: 'admin@qq.com',
      passwordHash: 'luck0070402',
      role: 'ADMIN',
      realName: '超级管理员',
      avatar: '',
      createdAt: new Date().toISOString()
    };
    userDatabase.set(email, user);
  }

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  if (user.passwordHash !== oldPassword) {
    return res.status(400).json({ error: '原旧密码输入错误，请重新输入' });
  }

  user.passwordHash = newPassword;
  userDatabase.set(email, user);

  res.json({ success: true, message: '密码修改成功' });
});

// 6. 忘记密码——邮箱验证码重置密码
authRouter.post('/reset-password', (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: '邮箱、验证码与重置的新密码均不能为空' });
  }

  let user = userDatabase.get(email);
  if (!user) {
    return res.status(404).json({ error: '该邮箱账户尚未注册' });
  }

  const cached = verifyCodes.get(email);
  if (!cached || cached.code !== code || cached.expires < Date.now()) {
    return res.status(400).json({ error: '验证码错误或已过期' });
  }

  user.passwordHash = newPassword;
  userDatabase.set(email, user);
  verifyCodes.delete(email);

  res.json({ success: true, message: '密码重置成功，请使用新密码进行登录' });
});

// 7. 更新个人资料 (用户名与头像，支持 Base64 大图)
authRouter.post('/update-profile', (req: Request, res: Response) => {
  const { email, realName, avatar } = req.body;

  if (!email) {
    return res.status(400).json({ error: '用户邮箱不能为空' });
  }

  let user = userDatabase.get(email);
  // 如果库中暂时缺失，自动兜底初始化
  if (!user) {
    user = {
      email,
      passwordHash: 'default123',
      role: email === 'admin@qq.com' ? 'ADMIN' : 'OPERATOR',
      realName: realName || (email === 'admin@qq.com' ? '超级管理员' : '普通牙医诊疗师'),
      avatar: avatar || '',
      createdAt: new Date().toISOString()
    };
  }

  if (realName) user.realName = realName;
  if (avatar !== undefined) user.avatar = avatar;

  userDatabase.set(email, user);

  res.json({
    success: true,
    user: {
      email: user.email,
      role: user.role,
      realName: user.realName,
      avatar: user.avatar
    }
  });
});

// 8. 注销账户
authRouter.post('/delete-account', (req: Request, res: Response) => {
  const { email } = req.body;

  if (email === 'admin@qq.com') {
    return res.status(400).json({ error: '系统内置超级管理员账号禁止注销' });
  }

  if (userDatabase.has(email)) {
    userDatabase.delete(email);
  }

  res.json({ success: true, message: '账号已成功注销' });
});
