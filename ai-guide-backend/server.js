// server.js
require('dotenv').config(); // 引入环境变量（读取 .env 文件）
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json()); // 允许后端接收 JSON 格式的数据

// ==========================================
// 1. 连接云端数据库
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🟢 成功连接到 MongoDB 云数据库！'))
  .catch(err => console.error('🔴 数据库连接失败:', err));

// ==========================================
// 2. 定义文章的数据模型 (Schema)
// 这就像给数据库定规矩，告诉它文章有哪些字段
// ==========================================
const articleSchema = new mongoose.Schema({
  id: String,        // 文章英文名 (如 hello-ai)
  title: String,     // 标题
  desc: String,      // 简介
  categoryId: String,// 分类
  date: String,      // 日期
  author: String,    // 作者
  views: Number      // 阅读量
});

// 生成操作文章的 Model（这就相当于操作数据库的遥控器）
const Article = mongoose.model('Article', articleSchema);

// ==========================================
// 3. 编写真实的 API 接口
// ==========================================

// 获取文章列表接口
app.get('/api/articles', async (req, res) => {
  try {
    const categoryId = req.query.category;
    // 如果有分类，就按分类查；如果没有，就查全部 (用 Article.find)
    const filter = categoryId ? { categoryId: categoryId } : {};
    const articles = await Article.find(filter); 
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: '服务器开小差了' });
  }
});

// 获取单篇文章详情接口
app.get('/api/articles/:id', async (req, res) => {
  try {
    const articleId = req.params.id;
    // 去数据库里找 id 匹配的第一篇文章
    const article = await Article.findOne({ id: articleId });
    
    if (article) {
      // 每次有人访问，阅读量自动 +1，并保存到数据库！
      article.views += 1;
      await article.save();
      res.json(article);
    } else {
      res.status(404).json({ message: '哎呀，文章找不到了' });
    }
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// // ==========================================
// // 4. 🌟 魔法接口：一键初始化假数据
// // 因为现在你的云数据库是空的，我们写个临时接口帮你把数据塞进去
// // ==========================================
// app.get('/api/init-db', async (req, res) => {
//   try {
//     // 先清空旧数据（防止你点多次重复插入）
//     await Article.deleteMany({}); 
    
//     // 插入我们的初始文章
//     await Article.insertMany([
//       {
//         id: 'hello-ai',
//         title: '第一课：如何让 AI 帮你写出爆款文案？',
//         desc: '了解 AI 沟通的万能公式：身份 + 任务 + 具体要求。',
//         categoryId: 'basic',
//         date: '2023-10-24',
//         author: 'AI 小助手',
//         views: 100
//       },
//       {
//         id: 'weekly-report',
//         title: '只需 3 步，让 AI 帮你把流水账变成高级“周报”',
//         desc: '打工人必看！把每天碎碎念的工作记录，转化为高管级汇报。',
//         categoryId: 'work',
//         date: '2023-10-25',
//         author: '站长',
//         views: 88
//       }
//     ]);
//     res.send('✅ 初始数据已成功灌入 MongoDB 云端数据库！');
//   } catch (error) {
//     res.status(500).send('❌ 灌入数据失败：' + error.message);
//   }
// });

app.listen(PORT, () => {
  console.log(`🚀 后端服务器已启动！监听端口: ${PORT}`);
});