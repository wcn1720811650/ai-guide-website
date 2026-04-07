const jwt = require('jsonwebtoken');

// 秘钥需要和签发 Token 时保持绝对一致！
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here_super_safe';

// 这就是一个标准的 Express 中间件
module.exports = (req, res, next) => {
  // 1. 从前端请求头 (Headers) 中获取 Token
  // Token 通常放在 Authorization 字段，格式为 "Bearer <token>"
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    // 状态码 401 代表 Unauthorized (未授权)
    return res.status(401).json({ message: '拒绝访问：未提供身份令牌 (Token)' });
  }

  // 把前缀 "Bearer " 切掉，只留下纯 Token 字符串
  const token = authHeader.replace('Bearer ', '');

  try {
    // 2. 使用 jwt 验证这个 token 是不是我们发的，有没有过期
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 3.把解密出来的用户信息（比如 userId, username）挂载到 req 上
    req.user = decoded;
    
    // 4. 放行！让请求继续往下走，进入 Controller
    next();
  } catch (error) {
    // 如果 Token 被篡改，或者超过了 7 天有效期，jwt.verify 会直接抛出错误跑来这里
    res.status(401).json({ message: '身份令牌已失效或过期，请重新登录' });
  }
};