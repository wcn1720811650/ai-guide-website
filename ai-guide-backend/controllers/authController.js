// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ==========================================
// 🙋‍♂️ 注册逻辑提取
// ==========================================
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. 检查用户名是否已经被注册了
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '该用户名已被注册，请换一个' });
    }

    // 2. 加密密码 (数字 10 代表加密强度，越高越安全但也越慢，10 是标准值)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. 将新用户存入数据库
    const newUser = new User({
      username: username,
      password: hashedPassword
    });
    await newUser.save();

    res.status(201).json({ message: '✅ 注册成功！欢迎加入。' });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器开小差了，请稍后再试' });
  }
};

// ==========================================
// 🔐 登录逻辑提取
// ==========================================
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. 在数据库中寻找这个用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: '账号或密码错误' }); // 模糊提示，保护安全
    }

    // 2. 对比前端传来的密码和数据库里的加密密码是否一致
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '账号或密码错误' });
    }

    // 3. 密码正确，签发 JWT 通行证 (Token)
    const token = jwt.sign(
      { userId: user._id, role: 'user' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // 4. 返回给前端
    res.json({ 
      message: '✅ 登录成功！', 
      token: token,
      username: user.username 
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器开小差了，请稍后再试' });
  }
};

// 1. 建立一个“内存临时存储”，用来存所有正在等待扫码的二维码状态
// 真实场景中，大厂会把它存在 Redis 里并设置 3 分钟过期
const qrSessions = new Map();

// 接口 A：前端来请求生成二维码
exports.generateWechatQR = (req, res) => {
  // 生成一个全球唯一的随机码 (Ticket)
  const ticket = crypto.randomUUID(); 
  
  // 记录这个二维码的状态：WAITING (等待扫码)
  qrSessions.set(ticket, { status: 'WAITING' });
  
  // 把 Ticket 返回给前端，前端拿它去生成二维码图案
  res.json({ ticket, content: `wechat_login_simulation_${ticket}` });
};

// 接口 B：前端每隔 2 秒来查一次状态 (短轮询)
exports.checkWechatStatus = (req, res) => {
  const { ticket } = req.query;
  const session = qrSessions.get(ticket);
  
  if (!session) {
    return res.status(404).json({ status: 'EXPIRED', message: '二维码已失效' });
  }

  if (session.status === 'CONFIRMED') {
    // 🌟 如果被手机确认了！签发正式的系统 Token！
    // 假设你的 JWT 秘钥叫 'your_jwt_secret' (请和正常登录的秘钥保持一致)
    const token = jwt.sign({ id: 'wx_user_9527', username: session.username }, 'your_jwt_secret', { expiresIn: '24h' });
    
    // 销毁这个二维码，防止重复使用
    qrSessions.delete(ticket);
    
    return res.json({ status: 'CONFIRMED', token, username: session.username });
  }
  
  // 如果还没扫，就告诉前端继续等
  res.json({ status: session.status });
};

// 接口 C：模拟手机端点击“确认登录” (上帝视角的测试按钮)
exports.simulatePhoneScan = (req, res) => {
  const { ticket } = req.body;
  if (qrSessions.has(ticket)) {
    // 强行把状态改成 CONFIRMED，并塞入一个虚拟的微信昵称
    qrSessions.set(ticket, { status: 'CONFIRMED', username: '微信极客大侠' });
    res.json({ message: '手机端确认成功！' });
  } else {
    res.status(400).json({ message: '二维码已失效' });
  }
};