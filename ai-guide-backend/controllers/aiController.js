const authMiddleware = require('../middlewares/auth')

const getDeepseekConfig = () => {
  const apiKey = process.env.DEEPSEEK_API_KEY
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  return { apiKey, baseUrl, model }
}

const callDeepseekChat = async ({ system, user, temperature = 0.4, maxTokens = 900 }) => {
  const { apiKey, baseUrl, model } = getDeepseekConfig()
  if (!apiKey) {
    const err = new Error('服务器未配置 DEEPSEEK_API_KEY，请在 ai-guide-backend/.env 添加后重启后端')
    err.status = 500
    throw err
  }

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || 'DeepSeek 请求失败'
    const err = new Error(msg)
    err.status = 502
    throw err
  }

  const text = json?.choices?.[0]?.message?.content
  if (!text) {
    const err = new Error('DeepSeek 返回为空')
    err.status = 502
    throw err
  }

  return String(text).trim()
}

const MAX_TEXT_LEN = 8000

const getClientKey = (req) => {
  const uid = req?.user?.userId
  return uid ? `u:${uid}` : `ip:${req.ip}`
}

const rateState = new Map()
const rateLimit = (req, res, next) => {
  const key = `${getClientKey(req)}:${req.path}`
  const now = Date.now()
  const last = rateState.get(key) || 0
  const cooldownMs = 1500
  const delta = now - last
  if (delta < cooldownMs) {
    const retryAfterMs = cooldownMs - delta
    res.set('Retry-After', String(Math.ceil(retryAfterMs / 1000)))
    return res.status(429).json({ message: `操作太频繁了，请 ${Math.ceil(retryAfterMs / 1000)} 秒后再试` })
  }
  rateState.set(key, now)
  next()
}

exports.polishPostText = [authMiddleware, rateLimit, async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim()
    if (!text) return res.status(400).json({ message: '请输入需要润色的内容' })
    if (text.length > MAX_TEXT_LEN) return res.status(400).json({ message: '内容过长，请分段润色' })

    const polished = await callDeepseekChat({
      system: '你是中文写作助手。任务：润色用户的社区帖子正文。保持原意不变，语句更清晰更有条理，减少口水话；保留 Markdown；不要添加虚构事实；只输出润色后的正文，不要解释。',
      user: text,
      temperature: 0.4,
      maxTokens: 1200
    })

    res.json({ text: polished })
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || '润色失败' })
  }
}]

exports.summarizePostText = [authMiddleware, rateLimit, async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim()
    if (!text) return res.status(400).json({ message: '请输入需要生成摘要的内容' })
    if (text.length > MAX_TEXT_LEN) return res.status(400).json({ message: '内容过长，请分段生成摘要' })

    const summary = await callDeepseekChat({
      system: '你是中文写作助手。任务：为用户的社区帖子生成摘要。要求：3-5 条要点，使用 Markdown 无序列表，每条不超过 20 字；只输出摘要内容，不要额外解释。',
      user: text,
      temperature: 0.3,
      maxTokens: 300
    })

    res.json({ summary })
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || '生成摘要失败' })
  }
}]
