<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined, CalendarOutlined, LikeOutlined, FileTextOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const userInfo = ref<any>(null)
const userStats = ref({ postCount: 0, totalLikes: 0 })
const userPosts = ref<any[]>([])
const loading = ref(true)

const fetchUserProfile = async () => {
  const userId = route.params.id
  try {
    const res = await axios.get(`http://localhost:3000/api/users/${userId}`)
    userInfo.value = res.data.user
    userStats.value = res.data.stats
    userPosts.value = res.data.posts
  } catch (error: any) {
    message.error(error.response?.data?.message || '获取主页失败')
    router.push('/404') // 用户不存在则跳走
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  // 如果 .back 有值，说明有上一页
  if (window.history.state && window.history.state.back) {
    router.back()
  } else {
    // 如果没有上一页（比如别人直接点链接进来的），就默认返回广场主页
    router.push('/')
  }
}

watch(
  () => route.params.id, // 盯着 URL 里的 ID 看
  (newId) => {
    if (newId) { // 只要 ID 发生变化（包含第一次进入），就立刻重新拉取数据
      fetchUserProfile()
    }
  },
  { immediate: true } // 保证页面第一次打开时也会执行
)
</script>

<template>
  <div class="user-profile-container">
    <a-spin :spinning="loading">
    <div class="back-nav" @click="handleBack">
        <ArrowLeftOutlined class="mr-2" /> 返回上一页
    </div>
      <div v-if="userInfo" class="profile-header">
        <div class="user-main">
          <a-avatar :size="80" class="user-avatar bg-[#10b981]">
            {{ userInfo.username.charAt(0).toUpperCase() }}
          </a-avatar>
          <div class="user-info">
            <h1 class="username">{{ userInfo.username }}</h1>
            <div class="join-date">
              <CalendarOutlined class="mr-1" /> 加入于 {{ new Date(userInfo.createdAt).toLocaleDateString() }}
            </div>
          </div>
        </div>

        <div class="user-stats">
          <div class="stat-item">
            <div class="stat-value">{{ userStats.postCount }}</div>
            <div class="stat-label"><FileTextOutlined /> 创作内容</div>
          </div>
          <div class="stat-item">
            <div class="stat-value text-pink-500">{{ userStats.totalLikes }}</div>
            <div class="stat-label"><LikeOutlined /> 获得点赞</div>
          </div>
        </div>
      </div>

      <div class="profile-content" v-if="userInfo">
        <h2 class="section-title">Ta 的发布</h2>
        
        <div v-if="userPosts.length === 0" class="empty-state">
          该用户还在潜水，暂无发布内容~
        </div>

        <div class="post-grid" v-else>
          <div v-for="post in userPosts" :key="post._id" class="post-card" @click="router.push(`/post/${post._id}`)">
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-desc">{{ post.content.substring(0, 80) }}...</p>
            <div class="post-meta">
              <a-tag color="blue" v-if="post.tags && post.tags.length > 0">{{ post.tags[0] }}</a-tag>
              <div class="meta-right">
                <span class="mr-3">👀 {{ post.views }}</span>
                <span>💖 {{ post.likes?.length || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </a-spin>
  </div>
</template>

<style scoped>
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

.user-profile-container {
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  margin-bottom: 30px;
}

.user-main {
  display: flex;
  align-items: center;
  gap: 24px;
}

.user-avatar {
  font-size: 36px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.username {
  font-size: 28px;
  font-weight: bold;
  color: #111827;
  margin: 0 0 8px 0;
}

.join-date {
  color: #6b7280;
  font-size: 14px;
}

.user-stats {
  display: flex;
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 900;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #111827;
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.post-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  cursor: pointer;
  border: 1px solid #f3f4f6;
  transition: all 0.3s ease;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.08);
  border-color: #10b981;
}

.post-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #111827;
}

.post-desc {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #9ca3af;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #9ca3af;
  background: white;
  border-radius: 12px;
  border: 1px dashed #d1d5db;
}

@media (max-width: 640px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 24px;
  }
  .user-main {
    flex-direction: column;
  }
}
</style>