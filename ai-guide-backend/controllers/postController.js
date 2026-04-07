// controllers/postController.js
const Post = require('../models/Post');

// 🌟 获取帖子列表 (所有人可见)
exports.getPosts = async (req, res) => {
  try {
    const { tag } = req.query;
    let query = {};
    if (tag) {
      query.tags = tag; 
    }
    
    // 按时间倒序，最新的帖子在最前面
    const posts = await Post.find(query).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: '获取帖子列表失败' });
  }
};

// 🌟 发布新帖子 (仅登录用户)
exports.createPost = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    
    // 这里的 req.user 是通过你之前写的 authMiddleware (保安) 挂载上来的！
    const newPost = new Post({
      title,
      content,
      tags: tags || [],
      author: req.user.userId, // JWT 解密出来的用户 ID
      authorName: req.user.username // JWT 解密出来的用户名
    });

    await newPost.save();
    res.status(201).json({ message: '发布成功！', post: newPost });
  } catch (error) {
    console.error('发布帖子错误:', error);
    res.status(500).json({ message: '服务器开小差了，发布失败' });
  }
};

// 获取单篇帖子详情 (同时阅读量 +1)
exports.getPostById = async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await Post.findById(postId);
      
      if (!post) {
        return res.status(404).json({ message: '帖子不存在或已被删除' });
      }
  
      // 有人点进来，阅读量自动 +1
      post.views = (post.views || 0) + 1;
      await post.save();
  
      res.json(post);
    } catch (error) {
      console.error('获取帖子详情错误:', error);
      res.status(500).json({ message: '服务器开小差了，获取详情失败' });
    }
  };