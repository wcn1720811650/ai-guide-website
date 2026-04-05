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