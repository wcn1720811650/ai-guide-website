<template>
  <div class="post-detail-container">
    <a-spin :spinning="loading">
      
      <div class="back-nav" @click="router.push('/community')">
        <ArrowLeftOutlined class="mr-2" /> 返回社区广场
      </div>

      <div v-if="post" class="post-content-wrapper">
        <div class="post-header">
          <h1 class="post-title">{{ post.title }}</h1>

          <div class="post-meta">
            <div class="meta-left">
              <a-avatar size="small" class="author-avatar bg-[#10b981]">
                {{ post.authorName.charAt(0).toUpperCase() }}
              </a-avatar>
              <span class="author-name">{{ post.authorName }}</span>
              <span class="meta-divider">•</span>
              <span class="time-text">{{ new Date(post.createdAt).toLocaleString() }}</span>
            </div>

            <div class="detail-tags" v-if="post.tags && post.tags.length">
              <a-tag v-for="tag in post.tags" :key="tag" color="green" class="mb-4">
                # {{ tag }}
              </a-tag>
            </div>
            
            <div class="meta-right">
              <EyeOutlined class="mr-1" /> {{ post.views }} 次阅读
            </div>
          </div>
        </div>

        <a-divider />

        <div 
          class="post-body markdown-body" 
          v-html="parsedContent"
        ></div>

        <div class="post-actions">
          <div 
            class="action-pill" 
            :class="{ 'is-liked': isLiked }"
            @click="handleLike"
          >
            <HeartFilled v-if="isLiked" class="action-icon active-icon" />
            <HeartOutlined v-else class="action-icon" />
            <span class="action-count">{{ likeCount > 0 ? likeCount : '点赞' }}</span>
          </div>

          <div class="action-pill" :class="{ 'is-favorited': isFavorited }" @click="handleFavorite">
            <StarFilled v-if="isFavorited" class="action-icon active-icon star-icon" />
            <StarOutlined v-else class="action-icon" />
            <span class="action-count">{{ isFavorited ? '已收藏' : '收藏' }}</span>
          </div>  
        </div>

        

        <div class="comments-section">
          <h3 class="comments-title">
            评论交流 ({{ post.comments?.length || 0 }})
          </h3>

          <div class="comment-input-box">
            <a-textarea 
              v-model:value="newCommentContent" 
              placeholder="分享你的见解，支持友善交流..." 
              :rows="3" 
              class="comment-textarea"
            />
            <div class="comment-submit-row">
              <a-button 
                type="primary" 
                class="submit-comment-btn" 
                :loading="submittingComment"
                @click="submitComment"
              >
                发表评论
              </a-button>
            </div>
          </div>

          <div class="comments-list">
            <div v-for="comment in post.comments" :key="comment._id" class="comment-item">
              <div class="comment-avatar">
                <a-avatar class="bg-[#10b981] text-white">{{ comment.authorName.charAt(0).toUpperCase() }}</a-avatar>
              </div>
              <div class="comment-main">
                <div class="comment-info">
                  <span class="comment-user">{{ comment.authorName }}</span>
                  <span v-if="comment.author === post.author" class="author-badge">作者</span>
                  <span v-if="comment.author === currentUserId" class="me-badge">我</span>
                  <span class="comment-time">{{ new Date(comment.createdAt).toLocaleString() }}</span>
                </div>

                <div class="comment-text">{{ comment.content }}</div>
                <div class="comment-footer-actions">
                  <span 
                    class="comment-action-item" 
                    :class="{ 'comment-liked': isCommentLiked(comment) }"
                    @click="handleToggleCommentLike(comment._id)"
                  >
                    <HeartFilled v-if="isCommentLiked(comment)" />
                    <HeartOutlined v-else />
                    {{ comment.likes?.length || 0 }}
                  </span>

                  <a-popconfirm
                    v-if="comment.author === currentUserId"
                    title="确定要删除这条评论吗？"
                    @confirm="handleDeleteComment(comment._id)"
                    ok-text="确定"
                    cancel-text="取消"
                  >
                    <span class="comment-action-item delete-action">
                      <DeleteOutlined /> 删除
                    </span>
                  </a-popconfirm>
                </div>
              </div>
            </div>

            <div v-if="!post.comments || post.comments.length === 0" class="empty-comments">
              还没有人发言，快来抢占沙发吧！
            </div>
          </div>
        </div>

      </div>

      <a-empty v-else-if="!loading" description="哎呀，这篇帖子似乎飘向了宇宙深处..." class="mt-20" />

    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { message } from 'ant-design-vue'
import { ArrowLeftOutlined, EyeOutlined, HeartOutlined, HeartFilled, DeleteOutlined, StarOutlined, StarFilled } from '@ant-design/icons-vue'

// 🌟 引入 Markdown 和 代码高亮核心库
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
// 引入一款极其极客的暗黑代码高亮主题（你也可以换成 github-dark.css）
import 'highlight.js/styles/atom-one-dark.css'

const route = useRoute()
const router = useRouter()

const post = ref<any>(null)
const loading = ref(true)

const isLiked = ref(false)
const likeCount = ref(0)

const newCommentContent = ref('')
const submittingComment = ref(false)
const isFavorited = ref(false)

// ==========================================
// 🚀 配置超强 Markdown 解析引擎
// ==========================================
const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      // 检查语言是否被 highlight.js 支持，不支持就降级为纯文本
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    }
  })
)

// 🌟 提交评论方法
const submitComment = async () => {
  if (!newCommentContent.value.trim()) {
    message.warning('写点什么再发布吧~')
    return
  }

  const token = localStorage.getItem('token')
  if (!token) {
    message.warning('请先登录后再参与交流')
    router.push('/login')
    return
  }

  submittingComment.value = true
  try {
    const res = await axios.post(
      `http://localhost:3000/api/posts/${post.value._id}/comments`,
      { content: newCommentContent.value },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    post.value.comments = res.data.comments
    newCommentContent.value = '' 
    message.success('评论发布成功！')
  } catch (error) {
    message.error('评论发布失败，请重试')
  } finally {
    submittingComment.value = false
  }
}

// 获取当前登录用户 ID (用于判断是否显示删除按钮)
const currentUserId = computed(() => {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.userId || payload.id
  } catch (e) { return null }
})

// 判断评论是否被当前用户点赞
const isCommentLiked = (comment: any) => {
  const userId = currentUserId.value
  return userId && comment.likes?.includes(userId)
}

// 处理评论点赞
const handleToggleCommentLike = async (commentId: string) => {
  const token = localStorage.getItem('token')
  if (!token) return message.warning('请登录后再点赞')

  try {
    const res = await axios.post(
      `http://localhost:3000/api/posts/${post.value._id}/comments/${commentId}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    post.value.comments = res.data.comments // 局部刷新评论数据
  } catch (error) {
    message.error('点赞失败')
  }
}

// 处理删除评论
const handleDeleteComment = async (commentId: string) => {
  const token = localStorage.getItem('token')
  try {
    const res = await axios.delete(
      `http://localhost:3000/api/posts/${post.value._id}/comments/${commentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    post.value.comments = res.data.comments
    message.success('评论已删除')
  } catch (error) {
    message.error('删除失败')
  }
}

// 当获取到文章数据时，实时将其转译为带有高亮标签的 HTML 字符串
const parsedContent = computed(() => {
  if (!post.value || !post.value.content) return ''
  return marked.parse(post.value.content)
})

// 在获取详情时，也要检查当前用户是否收藏了这篇文章
const checkFavoriteStatus = async () => {
  const token = localStorage.getItem('token')
  if (!token || !post.value) return
  try {
    const res = await axios.get(
      `http://localhost:3000/api/user/favorites`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    isFavorited.value = res.data.some((favPost: any) => favPost._id === post.value._id)
  } catch (e) {
    console.error('获取收藏状态失败', error)
  }
}

const handleFavorite = async () => {
  const token = localStorage.getItem('token')
  if (!token) return message.warning('请登录后再收藏')

  try {
    const res = await axios.post(
      `http://localhost:3000/api/user/favorites/${post.value._id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    isFavorited.value = res.data.isFavorited
    if (isFavorited.value) message.success('收藏成功，可在个人中心查看')
  } catch (error) {
    message.error('收藏失败')
  }
}

// ==========================================
// 获取帖子详情逻辑
// ==========================================
const fetchPostDetail = async () => {
  const postId = route.params.id
  try {
    const res = await axios.get(`http://localhost:3000/api/posts/${postId}`)
    post.value = res.data
    
    await checkFavoriteStatus()
    // 初始化点赞状态
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const userId = payload.userId || payload.id
        isLiked.value = post.value.likes?.includes(userId)
      } catch (e) {}
    }
    likeCount.value = post.value.likes?.length || 0

  } catch (error) {
    message.error('无法加载帖子详情')
  } finally {
    loading.value = false
  }
}

// ==========================================
// 详情页点赞逻辑
// ==========================================
const handleLike = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    message.warning('请先登录再为干货点赞哦')
    router.push('/login')
    return
  }

  isLiked.value = !isLiked.value
  likeCount.value += isLiked.value ? 1 : -1

  try {
    const res = await axios.post(
      `http://localhost:3000/api/posts/${post.value._id}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    isLiked.value = res.data.liked
    likeCount.value = res.data.count
    if (res.data.liked) message.success('❤')
  } catch (error) {
    isLiked.value = !isLiked.value
    likeCount.value += isLiked.value ? 1 : -1
    message.error('操作失败')
  }
}

onMounted(() => {
  fetchPostDetail()
})
</script>

<style scoped>
/* ==========================================
   原生的布局样式 (保持原有高级感)
========================================== */
.post-detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 20px 80px 20px;
}

.back-nav {
  display: inline-flex;
  align-items: center;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 24px;
  transition: color 0.3s;
}

.back-nav:hover { color: #10b981; }

.post-content-wrapper {
  background: #ffffff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.post-header { margin-bottom: 24px; }

.post-title {
  font-size: 32px;
  font-weight: 800;
  color: #111827;
  line-height: 1.4;
  margin-bottom: 16px;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #6b7280;
  font-size: 14px;
}

.detail-tags {
  display: flex;
  margin-right: -200px;
  gap: 8px;
}
.meta-left { display: flex; align-items: center; gap: 8px; }
.author-name { font-weight: 600; color: #374151; }
.meta-divider { color: #d1d5db; }

.post-actions {
  display: flex;
  justify-content: space-between; /* 左对齐，显得更克制。如果是居中可以改成 center */
  margin-top: 40px;
  padding-top: 24px;
}

.action-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #64748b; /* 低调的灰色 */
  font-size: 14px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 20px; /* 圆角胶囊 */
  border: 1px solid #e2e8f0;
  background-color: #f8fafc;
  transition: all 0.2s ease;
  user-select: none;
}

/* 鼠标悬浮时的反馈 */
.action-pill:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  color: #0f172a;
}

.action-icon {
  font-size: 16px;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.action-pill:hover .action-icon {
  transform: scale(1.15); /* 悬浮时图标微动 */
}

/* 点赞后的激活状态 */
.action-pill.is-liked {
  color: #f43f5e;
  border-color: #fecdd3;
  background-color: #fff1f2;
}
.action-pill.is-liked:hover {
  background-color: #ffe4e6;
  border-color: #fda4af;
}

.action-pill.is-favorited {
  color: #f59e0b; 
  border-color: #fde68a; 
  background-color: #fffbeb;
}
.action-pill.is-favorited:hover {
  background-color: #fef3c7; 
  border-color: #fcd34d;
}

.active-icon {
  animation: detailHeartBeat 0.4s ease-in-out forwards;
}

/* 独立的心跳微动画 */
@keyframes detailHeartBeat {
  0% { transform: scale(1); }
  40% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* ==========================================
   🌟 Markdown 深度美化 CSS  (掘金同款)
   因为 v-html 注入的标签不受 scoped 限制，必须用 :deep() 穿透！
========================================== */
.markdown-body {
  font-size: 16px;
  line-height: 1.8;
  color: #334155;
  word-wrap: break-word;
}

/* 标题样式 */
:deep(.markdown-body h1), 
:deep(.markdown-body h2), 
:deep(.markdown-body h3) {
  color: #0f172a;
  font-weight: 700;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

:deep(.markdown-body h2) {
  font-size: 24px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
}

/* 段落与列表 */
:deep(.markdown-body p) { margin-bottom: 1.2em; }
:deep(.markdown-body ul), :deep(.markdown-body ol) {
  padding-left: 1.5em;
  margin-bottom: 1.2em;
}
:deep(.markdown-body li) { margin-bottom: 0.5em; }

/* 🌟 引用块 (Blockquote) */
:deep(.markdown-body blockquote) {
  margin: 1em 0;
  padding: 10px 20px;
  color: #64748b;
  background-color: #f8fafc;
  border-left: 4px solid #10b981; /* 左侧薄荷绿指示条 */
  border-radius: 0 8px 8px 0;
}

/* 🌟 行内代码块 */
:deep(.markdown-body code:not([class*="language-"])) {
  background-color: #f1f5f9;
  color: #ec4899; /* 骚粉色高亮 */
  padding: 2px 6px;
  border-radius: 4px;
  font-family: Consolas, Monaco, monospace;
  font-size: 0.9em;
}

/* 🌟 多行代码块 (Pre) 外框美化 */
:deep(.markdown-body pre) {
  background-color: #282c34 !important; /* 暗黑背景 */
  padding: 16px;
  border-radius: 12px;
  overflow-x: auto;
  margin: 1.5em 0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

:deep(.markdown-body pre code) {
  font-family: 'Fira Code', Consolas, Monaco, monospace;
  font-size: 14px;
  line-height: 1.5;
  background: transparent !important;
}

/* 图片防溢出 */
:deep(.markdown-body img) {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.comments-section {
  margin-top: 50px;
  border-top: 1px solid #e5e7eb;
  padding-top: 40px;
}

.comments-title {
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 24px;
}

.comment-input-box {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 32px;
  transition: border-color 0.3s;
}

.comment-input-box:focus-within {
  border-color: #10b981;
}

.comment-textarea {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  resize: none;
  font-size: 15px;
  padding: 0;
  margin-bottom: 12px;
}

.comment-submit-row {
  display: flex;
  justify-content: flex-end;
}

.submit-comment-btn {
  background-color: #10b981 !important;
  border-color: #10b981 !important;
  border-radius: 8px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.comment-item {
  display: flex;
  gap: 16px;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-main {
  flex-grow: 1;
  background-color: #f8fafc;
  padding: 16px;
  border-radius: 0 12px 12px 12px;
  border: 1px solid #f1f5f9;
}

.comment-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.comment-user {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

/* 🌟 作者专属小标 */
.author-badge {
  background-color: #ecfdf5;
  color: #10b981;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #a7f3d0;
  line-height: 1;
}

.comment-time {
  font-size: 12px;
  color: #94a3b8;
  margin-left: auto;
}

.comment-text {
  font-size: 15px;
  color: #475569;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.empty-comments {
  text-align: center;
  color: #9ca3af;
  padding: 40px 0;
  font-size: 14px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #e2e8f0;
}

.comment-footer-actions {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 13px;
  color: #94a3b8;
}

.comment-action-item {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.comment-action-item:hover {
  color: #10b981;
}

.comment-liked {
  color: #f43f5e !important;
}

.delete-action:hover {
  color: #ef4444 !important;
}

.comment-main {
  /* 调整下内边距，给操作栏留空间 */
  padding: 12px 16px 10px 16px;
}

.me-badge {
  background-color: #eff6ff;
  color: #3b82f6;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #bfdbfe;
  line-height: 1;
}

/* 确保两个标签同时出现时有间距 */
.author-badge + .me-badge {
  margin-left: 4px;
}
</style>