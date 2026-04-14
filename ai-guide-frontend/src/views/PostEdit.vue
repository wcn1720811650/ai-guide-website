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

.hint {
  margin: 8px 0 16px;
  color: #6b7280;
  font-size: 13px;
}
</style>
