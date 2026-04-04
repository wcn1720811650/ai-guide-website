<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios' // 引入发送网络请求的神器

const route = useRoute()
const categoryId = route.params.id as string

const categoryMap: Record<string, string> = {
  basic: '零基础入门',
  work: '打工人提效',
  life: '生活小助手'
}
const categoryName = categoryMap[categoryId] || '全部教程'

// 🌟 新增：用来存放后端返回的数据
const filteredArticles = ref<any[]>([])
// 🌟 新增：用来控制加载动画
const isLoading = ref(true)

// 当页面一加载，就立刻向后端要数据
onMounted(async () => {
  isLoading.value = true
  try {
    // 📞 向我们刚写的 Node.js 接口发请求！注意带上了分类参数
    const response = await axios.get(`http://localhost:3000/api/articles?category=${categoryId}`)
    
    // 把后端给的数据（response.data）存进变量里
    filteredArticles.value = response.data.articles
    console.log(filteredArticles.value)
  } catch (error) {
    console.error('哎呀，后端服务器是不是没开？', error)
  } finally {
    isLoading.value = false // 数据拿到了，关闭加载动画
  }
})
</script>

<template>
  <div>
    <a-breadcrumb style="margin-bottom: 24px;">
      <a-breadcrumb-item><router-link to="/">首页</router-link></a-breadcrumb-item>
      <a-breadcrumb-item>{{ categoryName }}</a-breadcrumb-item>
    </a-breadcrumb>

    <div style="margin-bottom: 32px;">
      <h1 style="font-size: 32px; font-weight: bold; color: #1f2937; margin-bottom: 8px;">
        {{ categoryName }}
      </h1>
      <p style="color: #6b7280; font-size: 16px;">
        这里收录了所有关于“{{ categoryName }}”的 AI 实用教程。
      </p>
    </div>

    <div style="background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #f0f0f0;">
      <a-spin :spinning="isLoading" tip="正在从后端服务器拼命拉取文章...">
        <a-list
          v-if="filteredArticles.length > 0"
          item-layout="vertical"
          size="large"
          :data-source="filteredArticles"
        >
        <template #renderItem="{ item }">
          <a-list-item style="padding: 24px 0; border-bottom: 1px solid #f0f0f0;">
            <a-list-item-meta :description="item.date">
              <template #title>
                <router-link :to="`/article/${item.id}`" style="font-size: 20px; font-weight: bold; color: #10b981; text-decoration: none;">
                  {{ item.title }}
                </router-link>
              </template>
            </a-list-item-meta>
            <div style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-top: 8px;">
              {{ item.desc }}
            </div>
          </a-list-item>
        </template>
      </a-list>
        <a-empty 
          v-else 
          description="站长正在疯狂码字中，敬请期待..." 
          style="margin: 60px 0;" 
        />
      </a-spin>
    </div>
  </div>
</template>