const Article = require('../models/Article')

exports.getArticles = async (req, res) => {
  try {
    const { category, keyword, page = 1, limit = 6 } = req.query

    const filter = {}
    if (category) {
      filter.categoryId = category
    }

    const pageNum = Number.parseInt(String(page), 10)
    const limitNum = Number.parseInt(String(limit), 10)
    const safePage = Number.isFinite(pageNum) ? Math.max(pageNum, 1) : 1
    const safeLimit = Number.isFinite(limitNum) ? Math.min(Math.max(limitNum, 1), 100) : 6

    const skip = (safePage - 1) * safeLimit

    const keywordText = typeof keyword === 'string' ? keyword.trim() : ''
    let articles = []
    let total = 0

    if (keywordText) {
      const filterText = { ...filter, $text: { $search: keywordText } }
      total = await Article.countDocuments(filterText)

      if (total > 0) {
        articles = await Article.find(filterText, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' }, _id: -1 })
          .skip(skip)
          .limit(safeLimit)
      } else {
        const filterRegex = {
          ...filter,
          $or: [
            { title: { $regex: keywordText, $options: 'i' } },
            { desc: { $regex: keywordText, $options: 'i' } },
            { content: { $regex: keywordText, $options: 'i' } },
            { tags: { $regex: keywordText, $options: 'i' } }
          ]
        }
        total = await Article.countDocuments(filterRegex)
        articles = await Article.find(filterRegex)
          .sort({ _id: -1 })
          .skip(skip)
          .limit(safeLimit)
      }
    } else {
      total = await Article.countDocuments(filter)
      articles = await Article.find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(safeLimit)
    }

    res.json({
      articles,
      total,
      page: safePage,
      limit: safeLimit
    })
  } catch {
    res.status(500).json({ message: '服务器分页查询失败' })
  }
}

exports.getArticleById = async (req, res) => {
  try {
    const articleId = req.params.id
    const article = await Article.findOne({ id: articleId })

    if (!article) {
      return res.status(404).json({ message: '哎呀，文章找不到了' })
    }

    article.views += 1
    await article.save()
    res.json(article)
  } catch {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.createArticle = async (req, res) => {
  try {
    const newArticleData = req.body
    const fullArticleData = {
      ...newArticleData,
      date: new Date().toISOString().split('T')[0],
      views: 0
    }

    const createdArticle = await Article.create(fullArticleData)
    res.status(201).json({ message: '✅ 发布成功！', data: createdArticle })
  } catch (error) {
    console.error('发布失败:', error)
    res.status(500).json({ message: '发布失败，请检查服务器' })
  }
}

exports.updateArticle = async (req, res) => {
  try {
    const articleId = req.params.id
    const updateData = req.body

    const updatedArticle = await Article.findOneAndUpdate(
      { id: articleId },
      updateData,
      { returnDocument: 'after' }
    )

    if (!updatedArticle) {
      return res.status(404).json({ message: '未找到该文章' })
    }

    res.json({ message: '✅ 修改成功！', data: updatedArticle })
  } catch {
    res.status(500).json({ message: '修改失败' })
  }
}

exports.deleteArticle = async (req, res) => {
  try {
    const articleId = req.params.id
    await Article.findOneAndDelete({ id: articleId })
    res.json({ message: '🗑️ 文章已彻底删除！' })
  } catch {
    res.status(500).json({ message: '删除失败' })
  }
}

