// routes/post.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/auth');

// 任何人都可以看帖子
router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);

// 管理员专用路由
router.get('/admin/list', authMiddleware, postController.getAdminPosts);
router.put('/admin/:id/status', authMiddleware, postController.reviewPost);

// 用户举报路由
router.post('/:id/report', authMiddleware, postController.reportPost);

// 必须经过 authMiddleware 检查（必须登录）才能发帖
router.post('/', authMiddleware, postController.createPost);
router.post('/:id/like', authMiddleware, postController.toggleLike);
router.post('/:id/comments', authMiddleware, postController.addComment);

// 删除评论路由
router.delete('/:id/comments/:commentId', authMiddleware, postController.deleteComment);
// 评论点赞路由
router.post('/:id/comments/:commentId/like', authMiddleware, postController.toggleCommentLike);
module.exports = router;