// server.js
require('dotenv').config(); // 引入环境变量（读取 .env 文件）
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');
const userRoutes = require('./routes/user');
const aiRoutes = require('./routes/ai')
const articleRoutes = require('./routes/articles')
const adminRoutes = require('./routes/admin')
const Post = require('./models/Post')
const Article = require('./models/Article')

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json()); // 允许后端接收 JSON 格式的数据
app.use('/api/user', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api', adminRoutes);

// 1. 连接云端数据库
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('🟢 成功连接到 MongoDB 云数据库！')
    try {
      await Article.syncIndexes()
      await Post.syncIndexes()
    } catch (e) {
      console.error('🔴 索引同步失败:', e)
    }
  })
  .catch(err => console.error('🔴 数据库连接失败:', err));



app.listen(PORT, () => {
  console.log(`🚀 后端服务器已启动！监听端口: ${PORT}`);
});
