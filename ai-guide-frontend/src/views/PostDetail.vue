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
              
              <div class="meta-right">
                <EyeOutlined class="mr-1" /> {{ post.views }} 次阅读
              </div>
            </div>
          </div>
  
          <a-divider />
  
          <div class="post-body">
            {{ post.content }}
          </div>
        </div>
  
        <a-empty v-else-if="!loading" description="哎呀，这篇帖子似乎飘向了宇宙深处..." class="mt-20" />
  
      </a-spin>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import axios from 'axios'
  import { message } from 'ant-design-vue'
  import { ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons-vue'
  
  const route = useRoute()
  const router = useRouter()
  
  const post = ref<any>(null)
  const loading = ref(true)
  
  // 根据 URL 里的 ID 去后端拉取这篇帖子的详细信息
  const fetchPostDetail = async () => {
    const postId = route.params.id
    try {
      const res = await axios.get(`http://localhost:3000/api/posts/${postId}`)
      post.value = res.data
    } catch (error) {
      message.error('无法加载帖子详情')
    } finally {
      loading.value = false
    }
  }
  
  onMounted(() => {
    fetchPostDetail()
  })
  </script>
  
  <style scoped>

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
  
  .back-nav:hover {
    color: #10b981;
  }
  
  .post-content-wrapper {
    background: #ffffff;
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  }
  
  .post-header {
    margin-bottom: 24px;
  }
  
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
  
  .meta-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .author-name {
    font-weight: 600;
    color: #374151;
  }
  
  .meta-divider {
    color: #d1d5db;
  }
  
  .post-body {
    font-size: 16px;
    line-height: 1.8;
    color: #374151;
    white-space: pre-wrap; 
    word-wrap: break-word;
  }
  </style>