<template>
  <div class="favorites-container">
    <h1 class="page-title">我的收藏</h1>
    
    <a-spin :spinning="loading">
      <div v-if="favorites.length === 0" class="empty-state">
        还没有收藏任何内容，去社区逛逛吧！
      </div>

      <div class="post-list">
        <a-card 
          v-for="post in favorites" 
          :key="post._id" 
          class="post-card"
          hoverable
          @click="router.push(`/post/${post._id}`)"
        >
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-preview">{{ post.content.substring(0, 80) }}...</p>
          <div class="card-footer">
             <span class="author-tag">{{ post.authorName }}</span>
             <span class="time-tag">{{ new Date(post.createdAt).toLocaleDateString() }}</span>
          </div>
        </a-card>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { message } from 'ant-design-vue'

const router = useRouter()
const favorites = ref([])
const loading = ref(true)

const fetchFavorites = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await axios.get('http://localhost:3000/api/user/favorites', {
      headers: { Authorization: `Bearer ${token}` }
    })
    favorites.value = res.data
  } catch (error) {
    message.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchFavorites)
</script>

<style scoped>
.favorites-container { 
    max-width: 800px; 
    margin: 0 auto; 
    padding: 40px 20px; 
}
.page-title { 
    font-size: 24px; 
    font-weight: bold; 
    margin-bottom: 30px; 
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



.author-tag {
  color: #10b981;
  background-color: #ecfdf5;
  padding: 2px 8px;
  border-radius: 4px;
}

.time-tag {
  color: #9ca3af;
}
</style>