// models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100 // 限制标题长度
  },
  content: {
    type: String,
    required: true // 存储用户的 Markdown 纯文本
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // 🌟 关联到你的 User 模型
    required: true
  },
  authorName: {
    type: String,
    required: true // 冗余一个用户名，方便列表展示，减少联表查询压力
  },
  views: {
    type: Number,
    default: 0
  },
  tags: {
    type: [String],
    default: []
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  comments: [
    {
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      authorName: String,
      content: { type: String, required: true },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', postSchema);