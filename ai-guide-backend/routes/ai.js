const express = require('express')
const aiController = require('../controllers/aiController')

const router = express.Router()

router.post('/post/polish', aiController.polishPostText)
router.post('/post/summary', aiController.summarizePostText)

module.exports = router

