<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import axios from 'axios'
import type { Article } from '../types/index'

// 🔒 登录状态
const isAuthorized = ref(false)
const secretKey = ref('')
const token = ref('') // 存 JWT token

const checkAuth = async () => {
  try {
    const res = await axios.post('http://localhost:3000/api/login', {
      password: secretKey.value
    })
    token.value = res.data.token
    isAuthorized.value = true
    message.success('口令正确，欢迎站长！')
    fetchArticles()
  } catch {
    message.error('警告：口令错误！')
    secretKey.value = ''
  }
}

// 统一的鉴权 header，避免每次手写
const authHeader = () => ({ headers: { Authorization: `Bearer ${token.value}` } })

// 统一的错误处理，判断是否 token 过期
const handleError = (error: any, fallbackMsg: string) => {
  if (error.response?.status === 401) {
    isAuthorized.value = false
    token.value = ''
    message.warning('登录已过期，请重新验证口令')
  } else {
    message.error(fallbackMsg)
  }
}

// 表格和表单状态（不变）
const articles = ref<Article[]>([])
const isLoadingTable = ref(false)
const isSubmitting = ref(false)
const isEditing = ref(false)
const editingOriginalId = ref('')
const columns = [
  { title: '文章ID', dataIndex: 'id', key: 'id' },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '分类', dataIndex: 'categoryId', key: 'categoryId' },
  { title: '阅读量', dataIndex: 'views', key: 'views' },
  { title: '操作', key: 'action' }
]
const formState = reactive({
  id: '', title: '', desc: '', content: '', categoryId: 'basic', author: '站长'
})

// 读取（不需要 token，是公开接口）
const fetchArticles = async () => {
  isLoadingTable.value = true
  try {
    const res = await axios.get('http://localhost:3000/api/articles')
    articles.value = res.data.articles
  } catch {
    message.error('获取文章列表失败')
  } finally {
    isLoadingTable.value = false
  }
}

// 新增 / 修改
const onFinish = async () => {
  isSubmitting.value = true
  try {
    if (isEditing.value) {
      await axios.put(
        `http://localhost:3000/api/articles/${editingOriginalId.value}`,
        formState,
        authHeader() // 👈
      )
      message.success('✅ 文章修改成功！')
    } else {
      await axios.post('http://localhost:3000/api/articles', formState, authHeader()) // 👈
      message.success('🎉 新文章发布成功！')
    }
    resetForm()
    fetchArticles()
  } catch (error) {
    handleError(error, '操作失败，请检查后端')
  } finally {
    isSubmitting.value = false
  }
}

// 编辑（只是填表单，不发请求，不变）
const handleEdit = (record: Article) => {
  isEditing.value = true
  editingOriginalId.value = record.id
  Object.assign(formState, record)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 删除
const handleDelete = (record: any) => {
  Modal.confirm({
    title: `确定要删除《${record.title}》吗？`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await axios.delete(
          `http://localhost:3000/api/articles/${record.id}`,
          authHeader() // 👈
        )
        message.success('🗑️ 删除成功！')
        fetchArticles()
      } catch (error) {
        handleError(error, '删除失败')
      }
    }
  })
}

const resetForm = () => {
  isEditing.value = false
  editingOriginalId.value = ''
  Object.assign(formState, { id: '', title: '', desc: '',content:'', categoryId: 'basic', author: '站长' })
}
</script>

<template>
  <div style="max-width: 1000px; margin: 0 auto; padding: 40px 20px;">
    
    <a-card v-if="!isAuthorized" style="max-width: 400px; margin: 100px auto; text-align: center; border-radius: 12px;">
      <h2 style="margin-bottom: 24px;">🕵️‍♂️ 站长身份验证</h2>
      <a-input-password v-model:value="secretKey" size="large" placeholder="请输入口令" @pressEnter="checkAuth" style="margin-bottom: 24px;" />
      <a-button type="primary" size="large" block @click="checkAuth">解锁控制台</a-button>
    </a-card>

    <div v-else>
      <div style="margin-bottom: 32px; text-align: center;">
        <h1 style="font-size: 32px; font-weight: bold;">
          {{ isEditing ? '✏️ 修改文章' : '🚀 发布新文章' }}
        </h1>
      </div>

      <a-card style="border-radius: 12px; margin-bottom: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <a-form :model="formState" layout="vertical" @finish="onFinish">
          <div style="display: flex; gap: 16px;">
            <a-form-item label="文章英文 ID" name="id" style="flex: 1;" :rules="[{ required: true, message: '必填' }]">
              <a-input v-model:value="formState.id" :disabled="isEditing" placeholder="如：chatgpt-tips" />
            </a-form-item>
            <a-form-item label="所属分类" name="categoryId" style="flex: 1;">
              <a-select v-model:value="formState.categoryId">
                <a-select-option value="basic">零基础入门</a-select-option>
                <a-select-option value="work">打工人提效</a-select-option>
                <a-select-option value="life">生活小助手</a-select-option>
              </a-select>
            </a-form-item>
          </div>

          <a-form-item label="文章标题" name="title" :rules="[{ required: true, message: '必填' }]">
            <a-input v-model:value="formState.title" />
          </a-form-item>
          
          <a-form-item label="文章列表简介" name="desc" :rules="[{ required: true, message: '必填' }]">
            <a-textarea v-model:value="formState.desc" :rows="2" />
          </a-form-item>

          <a-form-item label="文章正文（Markdown 格式）" name="content">
            <a-textarea 
              v-model:value="formState.content" 
              :rows="16" 
              placeholder="在这里用 Markdown 写文章正文，例如：## 标题&#10;&#10;正文内容..."
              style="font-family: monospace; font-size: 14px;"
            />
          </a-form-item>

          <a-form-item style="margin-bottom: 0;">
            <a-button type="primary" html-type="submit" :loading="isSubmitting" style="margin-right: 12px;">
              {{ isEditing ? '保存修改' : '确认发布' }}
            </a-button>
            <a-button v-if="isEditing" @click="resetForm">取消编辑</a-button>
          </a-form-item>
        </a-form>
      </a-card>

      <a-card title="📚 已发布文章管理" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <a-table 
          :dataSource="articles" 
          :columns="columns" 
          rowKey="id"
          :loading="isLoadingTable"
          bordered
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-button type="link" @click="handleEdit(record)">编辑</a-button>
              <a-button type="link" danger @click="handleDelete(record)">删除</a-button>
            </template>
          </template>
        </a-table>
      </a-card>

    </div>
  </div>
</template>