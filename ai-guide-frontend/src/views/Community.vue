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
        <div v-if="posts.length === 0" class="empty-state">
          暂无内容，来做第一个分享灵感的人吧！
        </div>
        
        <div class="post-list">
          <a-card 
            v-for="post in posts" 
            :key="post._id" 
            class="post-card cursor-pointer"
            hoverable
            @click="router.push(`/post/${post._id}`)"
          >
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-preview">{{ post.content.substring(0, 100) }}...</p>
            
            <div class="post-meta">
              <span class="author-tag">发布者: {{ post.authorName }}</span>
              <span class="time-tag">{{ new Date(post.createdAt).toLocaleDateString() }}</span>
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
  import axios from 'axios'
  
  const router = useRouter()
  const posts = ref<any[]>([])
  const loading = ref(true)
  
  // 弹窗与表单状态
  const isModalVisible = ref(false)
  const submitting = ref(false)
  const newPost = ref({ title: '', content: '' })
  
  // 1. 获取帖子列表
  const fetchPosts = async () => {
    loading.value = true
    try {
      const res = await axios.get('http://localhost:3000/api/posts')
      posts.value = res.data
    } catch (error) {
      message.error('获取帖子失败')
    } finally {
      loading.value = false
    }
  }
  
  // 2. 点击发布按钮时的拦截逻辑
  const handlePublishClick = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      message.warning('请先登录后再发布帖子')
      router.push('/login')
      return
    }
    isModalVisible.value = true
  }
  
  // 3. 提交帖子
  const submitPost = async () => {
    if (!newPost.value.title || !newPost.value.content) {
      message.error('标题和内容不能为空！')
      return
    }
  
    submitting.value = true
    try {
      const token = localStorage.getItem('token')
      // 🌟 发送请求时，务必在 Header 中带上身份令牌 (Token) 供中间件检查！
      await axios.post(
        'http://localhost:3000/api/posts', 
        newPost.value,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      message.success('发布成功！')
      isModalVisible.value = false
      newPost.value = { title: '', content: '' } // 清空表单
      fetchPosts() // 刷新列表
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
  
  .post-title {
    font-size: 18px;
    font-weight: bold;
    color: #111827;
    margin-bottom: 8px;
  }
  
  .post-preview {
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 16px;
  }
  
  .post-meta {
    display: flex;
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
  </style>