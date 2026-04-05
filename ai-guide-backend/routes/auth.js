// routes/auth.js
const express = require('express');
const router = express.Router();

// 引入对应的控制器
const authController = require('../controllers/authController');

// 定义接口：将网址和处理函数绑定
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;