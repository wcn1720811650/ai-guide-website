<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRouter } from 'vue-router' // 引入路由，用于预览帖子
import axios from 'axios'
import type { Article } from '../types/index'

const router = useRouter()

// 登录状态
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
    
    // 登录成功后，同时拉取官方文章和待审核 UGC
    fetchArticles()
    fetchUgcPosts()
  } catch {
    message.error('警告：口令错误！')
    secretKey.value = ''
  }
}

// 统一的鉴权 header
const authHeader = () => ({ headers: { Authorization: `Bearer ${token.value}` } })

// 统一的错误处理
const handleError = (error: any, fallbackMsg: string) => {
  if (error.response?.status === 401) {
    isAuthorized.value = false
    token.value = ''
    message.warning('登录已过期，请重新验证口令')
  } else {
    message.error(fallbackMsg)
  }
}


// 官方文章管理状态与逻辑 (保持不变)
const articles = ref<Article[]>([])
const isLoadingTable = ref(false)
const isSubmitting = ref(false)
const isEditing = ref(false)
const editingOriginalId = ref('')

const articleColumns = [
  { title: '文章ID', dataIndex: 'id', key: 'id' },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '分类', dataIndex: 'categoryId', key: 'categoryId' },
  { title: '阅读量', dataIndex: 'views', key: 'views' },
  { title: '操作', key: 'action' }
]

const formState = reactive({
  id: '', title: '', desc: '', content: '', categoryId: 'basic', author: '站长'
})

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

const onFinish = async () => {
  isSubmitting.value = true
  try {
    if (isEditing.value) {
      await axios.put(`http://localhost:3000/api/articles/${editingOriginalId.value}`, formState, authHeader())
      message.success('✅ 文章修改成功！')
    } else {
      await axios.post('http://localhost:3000/api/articles', formState, authHeader())
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

const handleEdit = (record: Article) => {
  isEditing.value = true
  editingOriginalId.value = record.id
  Object.assign(formState, record)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleDelete = (record: any) => {
  Modal.confirm({
    title: `确定要删除《${record.title}》吗？`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await axios.delete(`http://localhost:3000/api/articles/${record.id}`, authHeader())
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
  Object.assign(formState, { id: '', title: '', desc: '', content: '', categoryId: 'basic', author: '站长' })
}

// UGC 内容审核状态与逻辑
const activeTab = ref('ugc') // 默认展示 UGC 审核页
const ugcPosts = ref<any[]>([])
const loadingUgc = ref(false)

const ugcColumns = [
  { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true, width: 250 },
  { title: '作者', dataIndex: 'authorName', key: 'authorName' },
  { title: '状态', key: 'status', width: 100 },
  { title: '风险警告', key: 'reports', width: 120 },
  { title: '发布时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'action', width: 200 }
]

const fetchUgcPosts = async () => {
  loadingUgc.value = true
  try {
    const res = await axios.get('http://localhost:3000/api/posts/admin/list', authHeader())
    ugcPosts.value = res.data
  } catch (error) {
    handleError(error, '获取审核列表失败，请确认您具有管理员权限')
  } finally {
    loadingUgc.value = false
  }
}

const handleReview = async (id: string, status: string) => {
  try {
    await axios.put(`http://localhost:3000/api/posts/admin/${id}/status`, { status }, authHeader())
    message.success(status === 'approved' ? '✅ 已批准发布' : '🚫 已打回拒绝')
    fetchUgcPosts() // 刷新列表
  } catch (error) {
    handleError(error, '操作失败')
  }
}
</script>

<template>
  <div style="max-width: 1100px; margin: 0 auto; padding: 40px 20px;">
    
    <a-card v-if="!isAuthorized" style="max-width: 400px; margin: 100px auto; text-align: center; border-radius: 12px;">
      <h2 style="margin-bottom: 24px;">🕵️‍♂️ 站长身份验证</h2>
      <a-input-password v-model:value="secretKey" size="large" placeholder="请输入口令" @pressEnter="checkAuth" style="margin-bottom: 24px;" />
      <a-button type="primary" size="large" block @click="checkAuth">解锁控制台</a-button>
    </a-card>

    <div v-else>
      <div style="margin-bottom: 24px; text-align: center;">
        <h1 style="font-size: 32px; font-weight: bold;">🛡️ AI 社区后台控制中心</h1>
      </div>

      <a-tabs v-model:activeKey="activeTab" type="card" size="large">
        
        <a-tab-pane key="ugc" tab="⚖️ UGC 内容审核">
          <a-card style="border-radius: 0 12px 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 40px;">
            <a-table 
              :dataSource="ugcPosts" 
              :columns="ugcColumns" 
              rowKey="_id"
              :loading="loadingUgc"
              bordered
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag :color="record.status === 'pending' ? 'warning' : (record.status === 'approved' ? 'success' : 'error')">
                    {{ record.status === 'pending' ? '待审核' : (record.status === 'approved' ? '已通过' : '已拒绝') }}
                  </a-tag>
                </template>

                <template v-if="column.key === 'reports'">
                  <a-popover title="举报理由" v-if="record.reports && record.reports.length > 0">
                    <template #content>
                      <div v-for="(r, i) in record.reports" :key="i" style="max-width: 200px;">
                        {{ i+1 }}. {{ r.reason }}
                      </div>
                    </template>
                    <a-tag color="red" style="cursor: pointer;">{{ record.reports.length }} 条举报</a-tag>
                  </a-popover>
                  <span v-else style="color: #9ca3af;">安全</span>
                </template>

                <template v-if="column.key === 'createdAt'">
                  {{ new Date(record.createdAt).toLocaleString() }}
                </template>

                <template v-if="column.key === 'action'">
                  <a-button type="link" @click="handleReview(record._id, 'approved')" style="color: #10b981; padding: 0 8px;">保留</a-button>
                  <a-button type="link" danger @click="handleReview(record._id, 'rejected')" style="padding: 0 8px;">删除</a-button>
                  <a-button type="link" @click="router.push(`/post/${record._id}`)" target="_blank" style="padding: 0 8px;">预览</a-button>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="articles" tab="📝 官方文章管理">
          <div style="background: #fff; padding: 24px; border-radius: 0 12px 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 20px; font-weight: bold;">
                {{ isEditing ? '✏️ 修改文章' : '🚀 发布新文章' }}
              </h2>
            </div>
            
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

              <a-form-item style="margin-bottom: 32px;">
                <a-button type="primary" html-type="submit" :loading="isSubmitting" style="margin-right: 12px;">
                  {{ isEditing ? '保存修改' : '确认发布' }}
                </a-button>
                <a-button v-if="isEditing" @click="resetForm">取消编辑</a-button>
              </a-form-item>
            </a-form>

            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">📚 已发布文章管理</h2>
            <a-table 
              :dataSource="articles" 
              :columns="articleColumns" 
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
          </div>
        </a-tab-pane>

      </a-tabs>
    </div>
  </div>
</template>