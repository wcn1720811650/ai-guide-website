<script setup lang="ts">
import { ref, watchEffect, watch, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { marked } from 'marked'

const route = useRoute()
const articleData = ref<any>(null)
const isLoading = ref(true)
const notFound = ref(false)

// 把数据库里的 Markdown 字符串转成 HTML
const renderedContent = computed(() => {
  if (!articleData.value?.content) return ''
  return marked(articleData.value.content)
})

const addCopyButtons = () => {
  const blockquotes = document.querySelectorAll('.markdown-body blockquote')
  blockquotes.forEach((bq) => {
    if (bq.querySelector('.copy-btn')) return

    const btn = document.createElement('button')
    btn.textContent = '📋 复制提示词'
    btn.className = 'copy-btn'
    btn.onclick = () => {
      const clone = bq.cloneNode(true) as HTMLElement

      // 删掉标题行和复制按钮
      const firstP = clone.querySelector('p:first-child')
      if (firstP) firstP.remove()
      const copyBtn = clone.querySelector('.copy-btn')
      if (copyBtn) copyBtn.remove()

      // 把 <ol><li> 手动拼成 "1. 文字" 格式
      clone.querySelectorAll('ol').forEach((ol) => {
        const items = ol.querySelectorAll('li')
        const lines = Array.from(items).map((li, i) => `${i + 1}. ${li.textContent?.trim()}`)
        // 用纯文字节点替换整个 ol
        const textNode = document.createTextNode(lines.join('\n'))
        ol.replaceWith(textNode)
      })

      const text = clone.textContent?.trim() || ''
      navigator.clipboard.writeText(text)
      btn.textContent = '✅ 已复制！'
      setTimeout(() => { btn.textContent = '📋 复制提示词' }, 2000)
    }
    bq.appendChild(btn)
  })
}

watchEffect(async () => {
  const id = route.params.id as string
  if (!id) return

  isLoading.value = true
  articleData.value = null
  notFound.value = false

  try {
    const res = await axios.get(`http://localhost:3000/api/articles/${id}`)
    articleData.value = res.data
  } catch (error: any) {
    if (error.response?.status === 404) {
      notFound.value = true
    }
  } finally {
    isLoading.value = false
  }
})

watch(renderedContent, async () => {
  await nextTick()
  addCopyButtons()
})


</script>

<template>
  <div>
    <a-breadcrumb style="margin-bottom: 24px;">
      <a-breadcrumb-item><router-link to="/">首页</router-link></a-breadcrumb-item>
      <a-breadcrumb-item v-if="articleData">{{ articleData.title }}</a-breadcrumb-item>
    </a-breadcrumb>

    <div style="background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #f0f0f0;">

      <a-spin :spinning="isLoading">

        <!-- 文章元信息 -->
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

        <!-- 正文：直接渲染 HTML -->
        <div 
          v-if="renderedContent"
          class="markdown-body"
          v-html="renderedContent"
        />

        <!-- 正文为空（文章存在但没填 content） -->
        <a-empty
          v-else-if="!isLoading && articleData && !renderedContent"
          description="这篇文章还没有正文内容，请去后台编辑添加。"
          style="margin: 60px 0;"
        />

        <!-- 404 -->
        <a-empty
          v-else-if="notFound"
          description="哎呀，这篇文章找不到了~"
          style="margin: 60px 0;"
        />

      </a-spin>
    </div>
  </div>
</template>

<style>
.markdown-body h1 { font-size: 28px; font-weight: bold; margin-top: 32px; margin-bottom: 16px; color: #1f2937; }
.markdown-body h2 { font-size: 24px; font-weight: bold; margin-top: 28px; margin-bottom: 12px; color: #1f2937; }
.markdown-body h3 { font-size: 20px; font-weight: bold; margin-top: 24px; margin-bottom: 10px; color: #374151; }
.markdown-body p  { font-size: 16px; line-height: 1.8; color: #4b5563; margin-bottom: 16px; max-width: 70ch; }
.markdown-body strong { color: #111827; }
.markdown-body code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 14px;
  color: #e11d48;
}
.markdown-body pre {
  background: #1f2937;
  color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
}
.markdown-body pre code {
  background: none;
  color: inherit;
  padding: 0;
}
.markdown-body ul, .markdown-body ol {
  padding-left: 24px;
  margin-bottom: 16px;
  color: #4b5563;
  line-height: 1.8;
}
.markdown-body blockquote {
  background: #f0fdf4;
  border-left: 4px solid #10b981;
  border-radius: 8px;
  padding: 16px 20px;
  margin: 24px 0;
  color: #374151;
  position: relative;
}

.markdown-body blockquote strong:first-child {
  display: block;
  font-size: 16px;
  margin-bottom: 12px;
  color: #065f46;
}

.markdown-body blockquote .copy-btn {
  display: block;
  margin-top: 12px;
  padding: 6px 14px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.markdown-body blockquote .copy-btn:hover {
  background: #059669;
}
</style>