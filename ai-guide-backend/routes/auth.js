// routes/auth.js
const express = require('express');
const router = express.Router();

// 引入对应的控制器
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

// 定义接口：将网址和处理函数绑定
router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/wechat/qrcode', authController.generateWechatQR);
router.get('/wechat/status', authController.checkWechatStatus);
router.post('/wechat/simulate-scan', authController.simulatePhoneScan);

router.post('/favorites/:postId', authMiddleware, authController.toggleFavorite);
router.get('/favorites', authMiddleware, authController.getFavorites);

module.exports = router;