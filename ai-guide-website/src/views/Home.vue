<script setup lang="ts">
import { Bot, Zap, Coffee, BookOpen, Briefcase, Smile } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
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
  <div style="text-align: center; padding: 20px 0;">
    
    <div style="margin-bottom: 24px;">
      <Bot :size="64" color="#10b981" />
    </div>
    
    <a-typography-title :level="1" style="font-weight: 900; margin-bottom: 24px;">
      不再害怕，<span style="color: #10b981;">轻松驾驭 AI</span>
    </a-typography-title>
    
    <a-typography-paragraph style="font-size: 18px; color: #666; max-width: 600px; margin: 0 auto 40px; line-height: 1.8;">
      这里没有复杂的算法和晦涩的代码。我们只讲大白话，提供直接能用的模板，核心目标只有一个：<strong>帮你提早下班，享受生活。</strong>
    </a-typography-paragraph>

    <a-space size="large" style="margin-bottom: 80px;">
      <router-link to="/article/hello-ai">
        <a-button type="primary" size="large" style="background-color: #10b981; border-color: #10b981; border-radius: 8px; height: 50px; padding: 0 30px; font-size: 16px;">
          <template #icon><Zap :size="18" style="margin-right: 6px; vertical-align: -4px;"/></template>
          开始第一课
        </a-button>
      </router-link>
      <a-button size="large" style="border-radius: 8px; height: 50px; padding: 0 30px; font-size: 16px;">
        <template #icon><Coffee :size="18" style="margin-right: 6px; vertical-align: -4px;"/></template>
        先随便逛逛
      </a-button>
    </a-space>

    <a-divider style="font-size: 20px; color: #333; font-weight: bold;">探索适合你的 AI 玩法</a-divider>

    <a-row :gutter="[24, 24]" style="margin-top: 40px; text-align: left;">
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

  </div>
</template>