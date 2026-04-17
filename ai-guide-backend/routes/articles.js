const express = require('express')
const articleController = require('../controllers/articleController')
const authMiddleware = require('../middlewares/auth')

const router = express.Router()

router.get('/', articleController.getArticles)
router.get('/:id', articleController.getArticleById)
router.post('/', authMiddleware, articleController.createArticle)
router.put('/:id', authMiddleware, articleController.updateArticle)
router.delete('/:id', authMiddleware, articleController.deleteArticle)

module.exports = router

