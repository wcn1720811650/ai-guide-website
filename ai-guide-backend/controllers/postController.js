// controllers/postController.js
const Post = require('../models/Post');

// 获取帖子列表 (所有人可见)
exports.getPosts = async (req, res) => {
  try {
    const { tag } = req.query;
    let query = { status: 'approved' };
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

// 用户举报帖子
exports.reportPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { reason } = req.body;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: '帖子不存在' });

    // 防止重复举报
    const hasReported = post.reports.some(r => r.userId.toString() === userId);
    if (hasReported) return res.status(400).json({ message: '您已经举报过该内容，请勿重复提交' });

    post.reports.push({ userId, reason });
    
    // 如果举报人数超过 3 人，可以自动将其重新打回待审核状态 (防范机制)
    if (post.reports.length >= 3) {
      post.status = 'pending';
    }

    await post.save();
    res.json({ message: '举报成功，我们会尽快核实处理' });
  } catch (error) {
    res.status(500).json({ message: '举报失败' });
  }
};

// 管理员专用 - 获取待审核与被举报列表
exports.getAdminPosts = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: '权限不足' });

    // 查询处于待审核状态，或者有举报记录的帖子
    const posts = await Post.find({
      $or: [
        { status: 'pending' },
        { 'reports.0': { $exists: true } } // 包含任何举报
      ]
    }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: '获取管理列表失败' });
  }
};

// 追加：管理员专用 - 审批帖子 (通过/拒绝)
exports.reviewPost = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: '权限不足' });

    const { id } = req.params;
    const { status } = req.body; // 'approved' 或 'rejected'

    const post = await Post.findByIdAndUpdate(id, { status, reports: [] }, { new: true });
    res.json({ message: '审批操作成功', post });
  } catch (error) {
    res.status(500).json({ message: '审批失败' });
  }
};

// 发布新帖子 (仅登录用户)
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
      const post = await Post.findByIdAndUpdate(
        postId,
        { $inc: { views: 1 } }, 
        { returnDocument: 'after' } 
      );
      
      if (!post) {
        return res.status(404).json({ message: '帖子不存在或已被删除' });
      }

      res.json(post);
    } catch (error) {
      console.error('获取帖子详情错误:', error);
      res.status(500).json({ message: '服务器开小差了，获取详情失败' });
    }
  };

  //点赞取消点赞
  exports.toggleLike = async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user.userId; // 从 JWT 保安那里拿到的当前用户 ID

      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ message: '帖子找不到了' });

      // 检查这个用户是否已经在点赞名单里
      const index = post.likes.indexOf(userId);

      if (index === -1) {
        // 没点过赞：加进去
        post.likes.push(userId);
        await post.save();
        res.json({ message: '点赞成功', liked: true, count: post.likes.length });
      } else {
        // 点过赞了：删掉 (取消点赞)
        post.likes.splice(index, 1);
        await post.save();
        res.json({ message: '已取消点赞', liked: false, count: post.likes.length });
      }
    } catch (error) {
      res.status(500).json({ message: '点赞操作失败' });
    }
  };
  
  // 发布评论
  exports.addComment = async (req, res) => {
    try {
      const postId = req.params.id;
      const { content } = req.body;
      
      // 从鉴权中间件解析出的当前登录用户信息
      const userId = req.user.userId;     
      const username = req.user.username; 

      if (!content || content.trim() === '') {
        return res.status(400).json({ message: '评论内容不能为空' });
      }

      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ message: '帖子不存在' });

      // 构建新评论并压入数组
      const newComment = {
        content,
        author: userId,
        authorName: username,
        createdAt: new Date()
      };

      post.comments.push(newComment);
      await post.save();

      // 返回最新的评论列表给前端刷新
      res.status(201).json({ message: '评论成功', comments: post.comments });
    } catch (error) {
      console.error('评论报错:', error);
      res.status(500).json({ message: '发布评论失败' });
    }
  };

    // 删除评论
  exports.deleteComment = async (req, res) => {
    try {
      const { id, commentId } = req.params;
      const userId = req.user.userId;

      const post = await Post.findById(id);
      if (!post) return res.status(404).json({ message: '帖子不存在' });

      // 找到该评论
      const comment = post.comments.id(commentId);
      if (!comment) return res.status(404).json({ message: '评论已不存在' });

      // 鉴权：只有评论作者可以删除
      if (comment.author.toString() !== userId) {
        return res.status(403).json({ message: '无权删除他人评论' });
      }

      // 从数组中移除
      post.comments.pull(commentId);
      await post.save();

      res.json({ message: '评论已删除', comments: post.comments });
    } catch (error) {
      res.status(500).json({ message: '删除评论失败' });
    }
  };

  // 切换评论点赞
  exports.toggleCommentLike = async (req, res) => {
    try {
      const { id, commentId } = req.params;
      const userId = req.user.userId;

      const post = await Post.findById(id);
      const comment = post.comments.id(commentId);
      if (!comment) return res.status(404).json({ message: '评论不存在' });

      const index = comment.likes.indexOf(userId);
      if (index === -1) {
        comment.likes.push(userId); // 点赞
      } else {
        comment.likes.splice(index, 1); // 取消点赞
      }

      await post.save();
      res.json({ comments: post.comments });
    } catch (error) {
      res.status(500).json({ message: '操作失败' });
    }
  };
