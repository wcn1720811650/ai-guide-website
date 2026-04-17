const mongoose = require('mongoose')

const articleSchema = new mongoose.Schema({
  id: String,
  title: String,
  desc: String,
  content: String,
  tags: [String],
  categoryId: String,
  date: String,
  author: String,
  views: Number
})

articleSchema.index(
  { title: 'text', desc: 'text', content: 'text', tags: 'text' },
  {
    name: 'article_text_index',
    weights: { title: 10, desc: 6, tags: 4, content: 1 },
    default_language: 'none'
  }
)

module.exports = mongoose.model('Article', articleSchema)

