// routes/user.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 获取某个用户的主页数据
router.get('/:id', userController.getUserProfile);

module.exports = router;