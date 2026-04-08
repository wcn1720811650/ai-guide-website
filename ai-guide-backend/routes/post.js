// routes/post.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/auth');

// 任何人都可以看帖子
router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);

// 必须经过 authMiddleware 检查（必须登录）才能发帖
router.post('/', authMiddleware, postController.createPost);
router.post('/:id/like', authMiddleware, postController.toggleLike);
router.post('/:id/comments', authMiddleware, postController.addComment);

// 删除评论路由
router.delete('/:id/comments/:commentId', authMiddleware, postController.deleteComment);
// 评论点赞路由
router.post('/:id/comments/:commentId/like', authMiddleware, postController.toggleCommentLike);
module.exports = router;