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
    const keyword = req.query.keyword; // 接收前端传来的搜索词
    
    // 初始化一个空的查询条件
    const filter = {};

    // 1. 如果有分类，加上分类条件
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // 2. 如果带有关键字，开启正则模糊搜索
    if (keyword) {
      filter.$or = [
        // $regex 代表正则表达式，$options: 'i' 代表不区分大小写
        { title: { $regex: keyword, $options: 'i' } }, 
        { desc: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 去数据库里按条件搜，并按发布日期倒序排列 (最新的在前面)
    const articles = await Article.find(filter).sort({ _id: -1 }); 
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

// ==========================================
// 🌟 新增：站长专属发布接口 (POST 请求)
// 接收前端表单传来的新文章数据，存入 MongoDB
// ==========================================
app.post('/api/articles', async (req, res) => {
  try {
    // req.body 就是前端表单填写的那些数据
    const newArticleData = req.body;

    // 自动补全一些后台默认数据
    const fullArticleData = {
      ...newArticleData,
      date: new Date().toISOString().split('T')[0], // 自动生成今天的日期 (YYYY-MM-DD)
      views: 0 // 新文章阅读量默认为 0
    };

    // 使用 Mongoose 创建一条新记录
    const createdArticle = await Article.create(fullArticleData);
    
    // 成功后，给前端返回一个成功的信号
    res.status(201).json({ 
      message: '✅ 发布成功！', 
      data: createdArticle 
    });
  } catch (error) {
    console.error('发布失败:', error);
    res.status(500).json({ message: '发布失败，请检查服务器' });
  }
});

// ==========================================
// ✏️ 修改文章接口 (PUT)
// ==========================================
app.put('/api/articles/:id', async (req, res) => {
  try {
    const articleId = req.params.id;
    const updateData = req.body;
    
    // 找到对应 id 的文章，并用新数据覆盖它
    // { new: true } 的意思是返回修改后的最新数据
    const updatedArticle = await Article.findOneAndUpdate({ id: articleId }, updateData, { new: true });
    
    if (updatedArticle) {
      res.json({ message: '✅ 修改成功！', data: updatedArticle });
    } else {
      res.status(404).json({ message: '未找到该文章' });
    }
  } catch (error) {
    res.status(500).json({ message: '修改失败' });
  }
});

// ==========================================
// 🗑️ 删除文章接口 (DELETE)
// ==========================================
app.delete('/api/articles/:id', async (req, res) => {
  try {
    const articleId = req.params.id;
    // 直接让数据库抹除这条记录
    await Article.findOneAndDelete({ id: articleId });
    res.json({ message: '🗑️ 文章已彻底删除！' });
  } catch (error) {
    res.status(500).json({ message: '删除失败' });
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