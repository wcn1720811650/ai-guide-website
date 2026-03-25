<script setup lang="ts">
import { defineAsyncComponent, shallowRef, watchEffect, ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()

// 存放 Markdown 视图组件
const CurrentArticle = shallowRef()
// 🌟 存放从后端拉取来的动态数据
const articleData = ref<any>(null)
// 加载状态
const isLoading = ref(true)

watchEffect(async () => {
  const id = route.params.id as string
  if (id) {
    isLoading.value = true
    
    try {
      // 1. 📞 向后端请求这篇文章的动态数据
      const response = await axios.get(`http://localhost:3000/api/articles/${id}`)
      articleData.value = response.data
      console.log(articleData.value);
      
    } catch (error) {
      console.error('获取文章数据失败', error)
    } finally {
      isLoading.value = false
    }

    // 2. 依然从本地动态加载 Markdown 组件（保留 PromptCard 的魔法）
    CurrentArticle.value = defineAsyncComponent(() => 
      import(`../content/${id}.md`).catch(() => {
        return null
      })
    )
  }
})
</script>

<template>
  <div>
    <a-breadcrumb style="margin-bottom: 24px;">
      <a-breadcrumb-item><router-link to="/">首页</router-link></a-breadcrumb-item>
      <a-breadcrumb-item><router-link to="/category/basic">基础教程</router-link></a-breadcrumb-item>
      <a-breadcrumb-item v-if="articleData">{{ articleData.title }}</a-breadcrumb-item>
    </a-breadcrumb>

    <div style="background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #f0f0f0;">
      
      <div v-if="articleData" style="margin-bottom: 32px; border-bottom: 1px solid #f0f0f0; padding-bottom: 24px;">
        <h1 style="font-size: 32px; font-weight: bold; color: #1f2937; margin-bottom: 16px;">
          {{ articleData.title }}
        </h1>
        
        <div style="display: flex; gap: 16px; color: #6b7280; font-size: 14px;">
          <span>✍️ 作者：{{ articleData.author }}</span>
          <span>📅 发布于：{{ articleData.date }}</span>
          <span style="color: #10b981;">🔥 阅读量：{{ articleData.views }}</span>
        </div>
      </div>

      <a-spin :spinning="isLoading">
        <component :is="CurrentArticle" v-if="CurrentArticle" class="markdown-body" />
        <a-empty v-else-if="!isLoading" description="哎呀，这篇文章还在疯狂码字中..." style="margin: 60px 0;" />
      </a-spin>
      
    </div>
  </div>
</template>

<style>

.markdown-body h1 { display: none; /* 因为我们在上面用后端数据渲染了更好看的标题，所以把 md 自带的标题隐藏掉 */ }
.markdown-body h3 { font-size: 20px; font-weight: bold; margin-top: 30px; margin-bottom: 16px; color: #374151; }
.markdown-body p { font-size: 16px; line-height: 1.8; color: #4b5563; margin-bottom: 16px; max-width: 70ch; }
.markdown-body strong { color: #111827; }
</style>