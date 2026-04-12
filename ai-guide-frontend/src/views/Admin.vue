<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import type { Article } from '../types/index'

const router = useRouter()

// 登录状态与鉴权
const isAuthorized = ref(false)
const secretKey = ref('')
const token = ref('') 

const checkAuth = async () => {
  try {
    const res = await axios.post('http://localhost:3000/api/login', {
      password: secretKey.value
    })
    token.value = res.data.token
    isAuthorized.value = true
    message.success('口令正确，欢迎站长！')
    fetchArticles()
    fetchUgcPosts()
  } catch {
    message.error('警告：口令错误！')
    secretKey.value = ''
  }
}

const authHeader = () => ({ headers: { Authorization: `Bearer ${token.value}` } })

const handleError = (error: any, fallbackMsg: string) => {
  if (error.response?.status === 401) {
    isAuthorized.value = false
    token.value = ''
    message.warning('登录已过期，请重新验证口令')
  } else {
    message.error(fallbackMsg)
  }
}

// 官方文章管理
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

// UGC 核心管理逻辑 (分拣)
const activeTab = ref('ugc') 
const allAdminPosts = ref<any[]>([])
const loadingUgc = ref(false)

// 分拣 1：审核收件箱
const ugcInbox = computed(() => {
  return allAdminPosts.value.filter(p => p.status !== 'rejected')
})

// 分拣 2：回收站
const rejectedPosts = computed(() => {
  return allAdminPosts.value.filter(p => p.status === 'rejected')
})

const fetchUgcPosts = async () => {
  loadingUgc.value = true
  try {
    const res = await axios.get('http://localhost:3000/api/posts/admin/list', authHeader())
    allAdminPosts.value = res.data
  } catch (error) {
    handleError(error, '获取审核列表失败')
  } finally {
    loadingUgc.value = false
  }
}

const handleReview = async (id: string, status: string) => {
  try {
    await axios.put(`http://localhost:3000/api/posts/admin/${id}/status`, { status }, authHeader())
    message.success(status === 'approved' ? '✅ 已批准发布' : '🚫 已打回拒绝')
    fetchUgcPosts() 
  } catch (error) {
    handleError(error, '操作失败')
  }
}

const calculateRemainingDays = (date: string) => {
  if (!date) return 30
  const rejectedTime = new Date(date).getTime()
  const now = new Date().getTime()
  const daysPassed = Math.floor((now - rejectedTime) / (1000 * 60 * 60 * 24))
  return Math.max(0, 30 - daysPassed)
}

// 预览弹窗
const isPreviewVisible = ref(false)
const currentPreviewPost = ref<any>(null)

const handlePreview = (record: any) => {
  currentPreviewPost.value = record
  isPreviewVisible.value = true
}


const reviewFromPreview = async (status: string) => {
  if (currentPreviewPost.value) {
    await handleReview(currentPreviewPost.value._id, status)
    isPreviewVisible.value = false
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
        <h1 style="font-size: 32px; font-weight: bold;">🛡️ AI 社区控制中心</h1>
      </div>

      <a-tabs v-model:activeKey="activeTab" type="card" size="large">
        
        <a-tab-pane key="ugc" tab="⚖️ 内容审核 (Inbox)">
          <a-card style="border-radius: 0 12px 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 40px;">
            <a-table 
              :dataSource="ugcInbox" 
              :columns="[
                { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
                { title: '作者', dataIndex: 'authorName', key: 'authorName' },
                { title: '状态', key: 'status' },
                { title: '风险警告', key: 'reports' },
                { title: '操作', key: 'action' }
              ]" 
              rowKey="_id"
              :loading="loadingUgc"
              bordered
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag :color="record.status === 'pending' ? 'warning' : 'success'">
                    {{ record.status === 'pending' ? '待审核' : '已通过' }}
                  </a-tag>
                </template>
                <template v-if="column.key === 'reports'">
                  <a-popover title="举报理由" v-if="record.reports?.length > 0">
                    <template #content>
                      <div v-for="(r, i) in record.reports" :key="i">{{ i+1 }}. {{ r.reason }}</div>
                    </template>
                    <a-tag color="red" style="cursor: pointer;">{{ record.reports.length }} 条举报</a-tag>
                  </a-popover>
                  <span v-else style="color: #9ca3af;">安全</span>
                </template>
                <template v-if="column.key === 'action'">
                  <a-button type="link" @click="handleReview(record._id, 'approved')" style="color: #10b981;">通过</a-button>
                  <a-button type="link" danger @click="handleReview(record._id, 'rejected')">拒绝</a-button>
                  <a-button type="link" @click="handlePreview(record)">预览</a-button>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="articles" tab="📝 官方管理">
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
            <a-divider />

            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">📚 官方文章库</h2>
            <a-table :dataSource="articles" :columns="articleColumns" rowKey="id" :loading="isLoadingTable" bordered>
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-button type="link" @click="handleEdit(record)">编辑</a-button>
                  <a-button type="link" danger @click="handleDelete(record)">删除</a-button>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>

        <a-tab-pane key="trash" tab="🗑️ 已拒绝内容">
          <a-card style="border-radius: 0 12px 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 16px; color: #6b7280; font-size: 13px;">
              💡 提示：被拒绝的内容将保留 30 天，逾期将自动彻底销毁。
            </div>
            <a-table 
              :dataSource="rejectedPosts" 
              :columns="[
                { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
                { title: '作者', dataIndex: 'authorName', key: 'authorName' },
                { title: '状态', key: 'status' },
                { title: '销毁倒计时', key: 'expiry' },
                { title: '操作', key: 'action' }
              ]" 
              rowKey="_id"
              :loading="loadingUgc"
              bordered
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag color="error">已打回</a-tag>
                </template>
                <template v-if="column.key === 'expiry'">
                  <span style="color: #ef4444; font-weight: 500;">
                    剩余 {{ calculateRemainingDays(record.rejectedAt) }} 天
                  </span>
                </template>
                <template v-if="column.key === 'action'">
                  <a-button type="link" @click="handleReview(record._id, 'approved')" style="color: #10b981;">恢复发布</a-button>
                  <a-button type="link" @click="handlePreview(record)">详情</a-button>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-tab-pane>

      </a-tabs>
    </div>

    <a-modal v-model:open="isPreviewVisible" title="🔍 内容详情" width="800px" :footer="null" destroyOnClose>
      <div v-if="currentPreviewPost" style="padding: 10px 0;">
        <h2 style="font-size: 22px; font-weight: bold; margin-bottom: 12px;">{{ currentPreviewPost.title }}</h2>
        <div style="display: flex; gap: 16px; margin-bottom: 16px; color: #6b7280;">
          <span>👤 作者：{{ currentPreviewPost.authorName }}</span>
          <a-tag :color="currentPreviewPost.status === 'pending' ? 'warning' : (currentPreviewPost.status === 'approved' ? 'success' : 'error')">
            {{ currentPreviewPost.status === 'pending' ? '待审核' : (currentPreviewPost.status === 'approved' ? '已通过' : '已拒绝') }}
          </a-tag>
        </div>
        <a-divider />
        <div style="white-space: pre-wrap; font-size: 15px; color: #374151; max-height: 50vh; overflow-y: auto;">
          {{ currentPreviewPost.content }}
        </div>
        <a-divider />
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <a-button @click="isPreviewVisible = false">关闭</a-button>
          <a-button danger @click="reviewFromPreview('rejected')" v-if="currentPreviewPost.status !== 'rejected'">拒绝</a-button>
          <a-button type="primary" style="background-color: #10b981; border-color: #10b981;" @click="reviewFromPreview('approved')" v-if="currentPreviewPost.status !== 'approved'">批准</a-button>
        </div>
      </div>
    </a-modal>

  </div>
</template>