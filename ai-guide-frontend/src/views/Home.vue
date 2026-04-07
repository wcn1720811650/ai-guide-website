<script setup lang="ts">
import { Bot, Zap, Coffee, BookOpen, Briefcase, Smile } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import axios from 'axios'
import type {Article} from '../types/index.ts'

const articles = ref<Article[]>([])
// 绑定搜索框的关键字
const searchQuery = ref('')
// 用来装倒计时器的“盒子”
let searchTimeout: any = null

const hasSearched = ref(false)


// 分页相关状态
const currentPage = ref(1) // 当前页码
const pageSize = ref(6)    // 每页显示 6 条
const totalArticles = ref(0) // 总数

// 核心拉取数据函数（把关键字参数带上！）
const fetchArticles = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/articles', {
      params: {
        keyword: searchQuery.value, // 把用户输的词发给后端
        page: currentPage.value, // 🌟 发送当前页码
        limit: pageSize.value    // 🌟 发送每页条数
        // category: 'basic' (如果有分类切换)
      }
    })
    articles.value = res.data.articles 
    totalArticles.value = res.data.total
    hasSearched.value = true
  } catch (error) {
    console.error('拉取列表失败', error)
  }
}

// 🌟 新增：页码改变时的处理函数
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchArticles() // 切换页码后，重新拉取数据
  // 顺便滚回搜索框的位置，体验更好
  window.scrollTo({ top: 600, behavior: 'smooth' }) 
}

// 防抖搜索函数
const onSearchInput = () => {
  currentPage.value = 1 // 🌟 每次重新搜索，都必须回到第 1 页
  // 每次用户敲击键盘，立刻把上一次的倒计时砸碎
  if (searchTimeout) clearTimeout(searchTimeout)

  // 如果用户把搜索框删空了
  if (!searchQuery.value.trim()) {
    articles.value = [] // 立刻清空下方的文章列表
    hasSearched.value = false // 重置搜索状态
    totalArticles.value = 0
    return 
  }

  // 重新设定一个 500 毫秒（半秒）的倒计时
  searchTimeout = setTimeout(() => {
    // 只有当用户半秒钟都不再敲键盘了，才会走到这里，真正发送请求！
    fetchArticles() 
  }, 500)
}

const router = useRouter()
// 定义一下教程分类的数据（这里把颜色改为了直接的 HEX 色值，兼容 Antdv）
const categories = [
  {
    id: 'basic',
    title: '零基础入门',
    desc: '连账号都不会注册？从这里开始，手把手带你上车。',
    icon: BookOpen,
    color: '#1890ff' // 蓝色
  },
  {
    id: 'work',
    title: '打工人提效',
    desc: '写周报、做PPT、回邮件，让 AI 帮你干脏活累活。',
    icon: Briefcase,
    color: '#fa8c16' // 橙色
  },
  {
    id: 'life',
    title: '生活小助手',
    desc: '旅游规划、菜谱生成、英语陪练，AI 也是生活好帮手。',
    icon: Smile,
    color: '#52c41a' // 绿色
  }
]
</script>

<template>
  <div style="max-width: 1000px; margin: 0 auto; padding: 20px;">
    
    <div style="text-align: center; padding: 40px 0 20px;">
      <div style="margin-bottom: 24px;">
        <Bot :size="64" color="#10b981" />
      </div>
      
      <a-typography-title :level="1" style="font-weight: 900; margin-bottom: 24px;">
        不再害怕，<span style="color: #10b981;">轻松驾驭 AI</span>
      </a-typography-title>
      
      <a-typography-paragraph style="font-size: 18px; color: #666; max-width: 600px; margin: 0 auto 40px; line-height: 1.8;">
        这里没有复杂的算法和晦涩的代码。我们只讲大白话，提供直接能用的模板，核心目标只有一个：<strong>帮你提早下班，享受生活。</strong>
      </a-typography-paragraph>

      <a-space size="large" style="margin-bottom: 40px;">
        <router-link to="/article/hello-ai">
          <a-button type="primary" size="large" style="background-color: #10b981; border-color: #10b981; border-radius: 8px; height: 50px; padding: 0 30px; font-size: 16px;">
            <template #icon><Zap :size="18" style="margin-right: 6px; vertical-align: -4px;"/></template>
            开始第一课
          </a-button>
        </router-link>
        <router-link to="/community">
          <a-button size="large" style="border-radius: 8px; height: 50px; padding: 0 30px; font-size: 16px;">
            <template #icon><Coffee :size="18" style="margin-right: 6px; vertical-align: -4px;"/></template>
            先随便逛逛
          </a-button>
        </router-link>
      </a-space>
    </div>

    <a-divider style="font-size: 20px; color: #333; font-weight: bold;">探索适合你的 AI 玩法</a-divider>

    <a-row :gutter="[24, 24]" style="margin-top: 24px; text-align: left;">
      <a-col :xs="24" :sm="24" :md="8" v-for="cat in categories" :key="cat.id">
        <a-card hoverable style="border-radius: 12px; height: 100%; border: 1px solid #eaeaea;" 
            @click="router.push(`/category/${cat.id}`)">
          <div :style="{ color: cat.color, marginBottom: '16px' }">
            <component :is="cat.icon" :size="32" />
          </div>
          <a-card-meta :title="cat.title">
            <template #description>
              <span style="color: #888; font-size: 14px; line-height: 1.6;">{{ cat.desc }}</span>
            </template>
          </a-card-meta>
        </a-card>
      </a-col>
    </a-row>

    <a-divider style="font-size: 20px; color: #333; font-weight: bold; margin-top: 60px;">全部秘籍</a-divider>

    <div style="margin-bottom: 32px; text-align: center;">
      <a-input-search
        v-model:value="searchQuery"
        placeholder="搜点什么... (比如: AI, 效率, 周报)"
        size="large"
        @input="onSearchInput" 
        style="max-width: 500px; border-radius: 8px;"
      />
    </div>

    <a-row :gutter="[16, 16]">
      <a-col :span="24" v-for="article in articles" :key="article.id">
        <router-link :to="`/article/${article.id}`" style="text-decoration: none;">
          <a-card hoverable style="border-radius: 8px; border: 1px solid #f0f0f0;">
            <h2 style="color: #1f2937; margin-bottom: 8px;">{{ article.title }}</h2>
            <p style="color: #6b7280; margin: 0;">{{ article.desc }}</p>
          </a-card>
        </router-link>
      </a-col>
    </a-row>

    <div v-if="totalArticles > pageSize" style="margin-top: 40px; text-align: center;">
      <a-pagination
        v-model:current="currentPage"
        :total="totalArticles"
        :pageSize="pageSize"
        show-less-items
        @change="handlePageChange"
      />
    </div>

    <a-empty 
      v-if="hasSearched && articles.length === 0" 
      description="哎呀，没有搜到相关的秘籍~ 换个词试试？" 
      style="margin-top: 40px;" 
    />

  </div>
</template>