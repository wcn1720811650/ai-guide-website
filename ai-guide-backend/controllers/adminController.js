const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here_super_safe'

exports.login = async (req, res) => {
  const { password } = req.body
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: '密码错误' })
  }

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' })
  res.json({ token })
}

