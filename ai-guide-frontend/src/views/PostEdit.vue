<template>
  <div class="edit-container">
    <div class="back-nav" @click="router.back()">
      <ArrowLeftOutlined class="mr-2" /> 返回上一页
    </div>

    <a-card class="edit-card">
      <h1 class="page-title">编辑帖子</h1>

      <a-spin :spinning="loading">
        <a-form layout="vertical" :model="form" @submit.prevent="submit">
          <a-form-item label="标题" required>
            <a-input v-model:value="form.title" size="large" placeholder="给你的帖子起个标题" />
          </a-form-item>

          <a-form-item label="标签" required>
            <a-select
              v-model:value="form.tags"
              mode="tags"
              placeholder="选择或输入相关领域"
              style="width: 100%"
            >
              <a-select-option value="ChatGPT">ChatGPT</a-select-option>
              <a-select-option value="提示词">提示词</a-select-option>
              <a-select-option value="Midjourney">Midjourney</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="内容" required>
            <a-textarea v-model:value="form.content" :rows="12" placeholder="支持 Markdown 语法..." />
          </a-form-item>

          <div class="ai-actions">
            <div class="ai-tip">AI 辅助写作</div>
            <a-space :size="8">
              <a-button type="primary" class="ai-btn" :loading="aiPolishing" :disabled="loading" @click="aiPolish">AI 润色</a-button>
              <a-button class="ai-btn" :loading="aiSummarizing" :disabled="loading" @click="aiSummarize">生成摘要</a-button>
            </a-space>
          </div>

          <div class="hint">
            修改后会重新进入审核流程，通过后才会展示给其他用户。
          </div>

          <div class="actions">
            <a-button @click="router.back()">取消</a-button>
            <a-button type="primary" :loading="submitting" :disabled="loading" @click="submit">提交修改</a-button>
          </div>
        </a-form>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { message } from 'ant-design-vue'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const submitting = ref(false)
const aiPolishing = ref(false)
const aiSummarizing = ref(false)

const form = reactive({
  title: '',
  content: '',
  tags: [] as string[]
})

const currentUserId = computed(() => {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.userId || payload.id
  } catch {
    return null
  }
})

const fetchForEdit = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    message.warning('请先登录后再编辑')
    router.push('/login')
    return
  }

  try {
    const res = await axios.get(`http://localhost:3000/api/posts/${route.params.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!currentUserId.value || String(res.data.author) !== String(currentUserId.value)) {
      message.error('无权编辑他人帖子')
      router.back()
      return
    }

    form.title = res.data.title || ''
    form.content = res.data.content || ''
    form.tags = Array.isArray(res.data.tags) ? res.data.tags : []
  } catch (error: any) {
    message.error(error.response?.data?.message || '无法加载可编辑内容')
    router.back()
  } finally {
    loading.value = false
  }
}

const submit = async () => {
  if (!form.title.trim() || !form.content.trim()) {
    message.warning('标题和内容不能为空')
    return
  }

  const token = localStorage.getItem('token')
  if (!token) {
    message.warning('请先登录后再编辑')
    router.push('/login')
    return
  }

  submitting.value = true
  try {
    const res = await axios.put(
      `http://localhost:3000/api/posts/${route.params.id}`,
      { title: form.title, content: form.content, tags: form.tags },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    message.success(res.data?.message || '修改已提交')
    router.push(`/post/${route.params.id}`)
  } catch (error: any) {
    message.error(error.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

const requireToken = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    message.warning('请先登录后再使用 AI 功能')
    router.push('/login')
    return null
  }
  return token
}

const aiPolish = async () => {
  const token = requireToken()
  if (!token) return
  if (!form.content.trim()) {
    message.warning('请先写点内容再润色')
    return
  }
  aiPolishing.value = true
  try {
    const res = await axios.post(
      'http://localhost:3000/api/ai/post/polish',
      { text: form.content },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    form.content = res.data.text
    message.success('已完成润色')
  } catch (e: any) {
    message.error(e.response?.data?.message || '润色失败')
  } finally {
    aiPolishing.value = false
  }
}

const aiSummarize = async () => {
  const token = requireToken()
  if (!token) return
  if (!form.content.trim()) {
    message.warning('请先写点内容再生成摘要')
    return
  }
  aiSummarizing.value = true
  try {
    const res = await axios.post(
      'http://localhost:3000/api/ai/post/summary',
      { text: form.content },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const summary = String(res.data.summary || '').trim()
    if (!summary) {
      message.error('摘要生成失败')
      return
    }
    const hasSummary = /^\s*摘要[:：]/m.test(form.content)
    if (hasSummary) {
      message.info('已检测到摘要段落，请手动替换')
      return
    }
    form.content = `摘要：\n${summary}\n\n---\n\n${form.content}`
    message.success('已生成摘要并插入到正文顶部')
  } catch (e: any) {
    message.error(e.response?.data?.message || '生成摘要失败')
  } finally {
    aiSummarizing.value = false
  }
}

onMounted(fetchForEdit)
</script>

<style scoped>
.edit-container {
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
}

.back-nav {
  display: inline-flex;
  align-items: center;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 16px;
  transition: color 0.3s;
}

.back-nav:hover { color: #10b981; }

.edit-card {
  border-radius: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 16px 0;
  color: #111827;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.ai-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 12px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
}

.ai-tip {
  color: #6b7280;
  font-size: 12px;
}

.ai-btn {
  border-radius: 10px;
}

.ai-btn.ant-btn-primary {
  background-color: #10b981;
  border-color: #10b981;
}

.ai-btn.ant-btn-primary:hover {
  background-color: #34d399;
  border-color: #34d399;
}

.hint {
  margin: 8px 0 16px;
  color: #6b7280;
  font-size: 13px;
}
</style>
