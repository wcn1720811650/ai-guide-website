<template>
  <div class="community-container">
    <div class="community-header">
      <div>
        <h1 class="page-title">AI 灵感交流站</h1>
        <p class="page-desc">在这里分享你的 AI 提示词、工具体验和硬核技巧</p>
      </div>
      
      <a-button type="primary" size="large" class="publish-btn" @click="handlePublishClick">
        + 发布帖子
      </a-button>
    </div>

    <a-spin :spinning="loading">
      <div v-if="selectedTag" class="filter-banner">
        <span>正在查看领域: <strong class="filter-highlight"># {{ selectedTag }}</strong></span>
        <a-button type="link" @click="clearFilter" size="small" class="clear-btn">
          清除过滤 ✖
        </a-button>
      </div>

      <div v-if="posts.length === 0" class="empty-state">
        <span v-if="selectedTag">没有找到关于 "{{ selectedTag }}" 的内容哦~</span>
        <span v-else>暂无内容，来做第一个分享灵感的人吧！</span>
      </div>

      <div class="post-list">
        <a-card 
          v-for="post in posts" 
          :key="post._id" 
          class="post-card cursor-pointer"
          hoverable
          @click="router.push(`/post/${post._id}`)"
        >
          <div class="card-header">
            <h3 class="post-title">{{ post.title }}</h3>
            <div class="stats-group">
              <span class="stat-item"><EyeOutlined /> {{ post.views || 0 }}</span>
              <span 
                class="stat-item like-interaction" 
                :class="{ 'is-liked-text': isLiked(post) }"
                @click.stop="handleToggleLike(post)"
              >
                <HeartFilled v-if="isLiked(post)" class="heart-active" />
                <HeartOutlined v-else class="heart-inactive" />
                {{ post.likes?.length || 0 }}
              </span>
            </div>
          </div>

          <p class="post-preview">{{ post.content.substring(0, 80) }}...</p>

          <div class="card-footer">
            <div class="post-meta">
              <span class="author-tag">发布者: {{ post.authorName }}</span>
              <span class="time-tag">{{ new Date(post.createdAt).toLocaleDateString() }}</span>
            </div>

            <div class="post-tags" v-if="post.tags && post.tags.length">
              <a-tag 
                v-for="tag in post.tags" 
                :key="tag" 
                class="custom-tag clickable-tag" 
                @click.stop="handleTagClick(tag)"
              >
                {{ tag }}
              </a-tag>
            </div>
          </div>
        </a-card>
      </div>
    </a-spin>

    <a-modal 
      v-model:open="isModalVisible" 
      title="分享你的 AI 灵感" 
      @ok="submitPost" 
      :confirmLoading="submitting"
      okText="立即发布"
      cancelText="取消"
      width="600px"
    >
      <div class="post-form">
        <a-input 
          v-model:value="newPost.title" 
          placeholder="给你的帖子起个响亮的标题 (例如: ChatGPT 高效工作流分享)" 
          size="large"
          class="form-item"
        />
        <a-select
          v-model:value="newPost.tags"
          mode="tags"
          placeholder="选择或输入相关领域 (如: ChatGPT, 提示词, 绘图)"
          class="form-item"
          style="width: 100%"
        >
          <a-select-option value="ChatGPT">ChatGPT</a-select-option>
          <a-select-option value="提示词">提示词</a-select-option>
          <a-select-option value="Midjourney">Midjourney</a-select-option>
        </a-select>

        <a-textarea 
          v-model:value="newPost.content" 
          placeholder="支持 Markdown 语法。在这里写下你的干货内容..." 
          :rows="10" 
          size="large"
          class="form-item"
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { EyeOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons-vue'
import axios from 'axios'

const router = useRouter()
const posts = ref<any[]>([])
const loading = ref(true)

// 弹窗与表单状态
const isModalVisible = ref(false)
const submitting = ref(false)
const newPost = ref({ title: '', content: '', tags: [] }) 
const selectedTag = ref('')

// 🌟 获取当前登录用户ID
const getCurrentUserId = () => {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.userId || payload.id 
  } catch (e) {
    return null
  }
}

// 🌟 判断当前帖子是否被点赞
const isLiked = (post: any) => {
  const userId = getCurrentUserId()
  if (!userId || !post.likes) return false
  return post.likes.includes(userId)
}

// 🌟 处理点击小爱心点赞
const handleToggleLike = async (post: any) => {
  const token = localStorage.getItem('token')
  if (!token) {
    message.warning('请先登录后再为心仪的灵感点赞哦')
    router.push('/login')
    return
  }

  const userId = getCurrentUserId()
  if (!userId) return

  // 乐观更新
  const originalLikes = [...(post.likes || [])]
  const alreadyLiked = isLiked(post)
  
  if (alreadyLiked) {
    post.likes = post.likes.filter((id: string) => id !== userId) 
  } else {
    post.likes.push(userId) 
  }

  try {
    await axios.post(
      `http://localhost:3000/api/posts/${post._id}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
  } catch (error) {
    post.likes = originalLikes
    message.error('点赞同步失败，请检查网络')
  }
}

// 🌟 获取帖子列表
const fetchPosts = async () => {
  loading.value = true
  try {
    const url = selectedTag.value 
      ? `http://localhost:3000/api/posts?tag=${encodeURIComponent(selectedTag.value)}`
      : 'http://localhost:3000/api/posts'
      
    const res = await axios.get(url)
    posts.value = res.data
  } catch (error) {
    message.error('获取帖子失败')
  } finally {
    loading.value = false
  }
}

// 🌟 标签过滤点击
const handleTagClick = (tag: string) => {
  if (selectedTag.value === tag) return 
  selectedTag.value = tag
  fetchPosts()
}

// 🌟 清除标签过滤
const clearFilter = () => {
  selectedTag.value = ''
  fetchPosts()
}

// 🌟 点击发布拦截
const handlePublishClick = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    message.warning('请先登录后再发布帖子')
    router.push('/login')
    return
  }
  isModalVisible.value = true
}

// 🌟 提交帖子
const submitPost = async () => {
  if (!newPost.value.title || !newPost.value.content) {
    message.error('标题和内容不能为空！')
    return
  }

  submitting.value = true
  try {
    const token = localStorage.getItem('token')
    await axios.post(
      'http://localhost:3000/api/posts', 
      newPost.value,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    message.success('发布成功！')
    isModalVisible.value = false
    newPost.value = { title: '', content: '', tags: [] } // 清空表单，注意也要清空 tags
    fetchPosts()
  } catch (error: any) {
    message.error(error.response?.data?.message || '发布失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchPosts()
})
</script>

<style scoped>
/* 纯原生 CSS 布局 */
.community-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 0;
}

.community-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-desc {
  color: #6b7280;
  margin: 0;
}

.publish-btn {
  background-color: #10b981 !important;
  border-color: #10b981 !important;
  font-weight: bold;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
}

.publish-btn:hover {
  background-color: #34d399 !important;
  transform: translateY(-1px);
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  transition: all 0.3s ease;
}

.post-card:hover {
  border-color: #10b981;
  box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.post-title {
  font-size: 18px;
  font-weight: bold;
  color: #111827;
  margin: 0;
}

.post-preview {
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 16px;
}

.card-footer {
  display: flex;
  justify-content: space-between; 
  align-items: flex-end; 
  margin-top: 16px;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
}

.author-tag {
  color: #10b981;
  background-color: #ecfdf5;
  padding: 2px 8px;
  border-radius: 4px;
}

.time-tag {
  color: #9ca3af;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end; 
  gap: 6px;
  max-width: 50%;
}

.custom-tag {
  margin-right: 0; 
  border-radius: 4px;
  font-size: 12px;
  border: none;
  background-color: #f0fdf4;
  color: #10b981;
}

.form-item {
  margin-bottom: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #9ca3af;
  background-color: #f9fafb;
  border-radius: 12px;
  border: 1px dashed #e5e7eb;
}

/* 过滤提示条样式 */
.filter-banner {
  background-color: #ecfdf5;
  border: 1px dashed #10b981;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #065f46;
  font-size: 14px;
}

.filter-highlight {
  font-size: 16px;
  color: #10b981;
}

.clear-btn {
  color: #64748b;
}

.clear-btn:hover {
  color: #ef4444; 
}

/* 标签的交互效果 */
.clickable-tag {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-tag:hover {
  background-color: #10b981;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.2);
}

/* 点赞交互区域样式 */
.stats-group {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #94a3b8;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.like-interaction {
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 2px 8px;
  border-radius: 6px;
  margin-left: -8px; 
}

.like-interaction:hover {
  background-color: #fff1f2;
  color: #f43f5e;
}

.like-interaction:hover .heart-inactive {
  transform: scale(1.15); 
}

.is-liked-text {
  color: #f43f5e !important;
  font-weight: 500;
}

.heart-active {
  color: #f43f5e;
  animation: heartBeat 0.3s ease-in-out forwards; 
}

.heart-inactive {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes heartBeat {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
</style>