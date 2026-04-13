// controllers/userController.js
const User = require('../models/User');
const Post = require('../models/Post');

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    // 获取用户基本信息 (剔除密码)
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: '该用户不存在' });
    }

    // 获取该用户所有【已通过】的帖子
    const posts = await Post.find({ author: userId, status: 'approved' }).sort({ createdAt: -1 });

    // 聚合计分：算出他获得的总点赞数
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes ? post.likes.length : 0), 0);

    // 返回组装好的主页数据
    res.json({
      user,
      stats: {
        postCount: posts.length,
        totalLikes: totalLikes
      },
      posts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取用户主页失败' });
  }
};