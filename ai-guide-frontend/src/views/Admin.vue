<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import axios from 'axios'

// 🔒 密码锁逻辑
const isAuthorized = ref(false)
const secretKey = ref('')
const checkAuth = () => {
  if (secretKey.value === 'ai2026') { // 你的密码
    isAuthorized.value = true
    message.success('口令正确，欢迎站长！')
    fetchArticles() // 解锁后立刻去拉取最新数据表！
  } else {
    message.error('警告：口令错误！')
    secretKey.value = ''
  }
}

// 📊 表格数据和状态
const articles = ref([])
const isLoadingTable = ref(false)
const isSubmitting = ref(false)

// 标识当前是在“发布新文章”还是在“修改旧文章”
const isEditing = ref(false) 
const editingOriginalId = ref('') // 记住正在修改的文章原本的 ID

// 定义表格的列
const columns = [
  { title: '文章ID (英文)', dataIndex: 'id', key: 'id' },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '分类', dataIndex: 'categoryId', key: 'categoryId' },
  { title: '阅读量', dataIndex: 'views', key: 'views' },
  { title: '操作', key: 'action' } // 这一列用来放按钮
]

// 📝 表单数据
const formState = reactive({
  id: '', title: '', desc: '', categoryId: 'basic', author: '站长'
})

// 🔍 查：拉取所有文章列表
const fetchArticles = async () => {
  isLoadingTable.value = true
  try {
    const res = await axios.get('http://localhost:3000/api/articles')
    articles.value = res.data.articles
  } catch (error) {
    message.error('获取文章列表失败')
  } finally {
    isLoadingTable.value = false
  }
}

// 提交表单（智能判断是 新增 还是 修改）
const onFinish = async () => {
  isSubmitting.value = true
  try {
    if (isEditing.value) {
      // ✏️ 修改模式：调用 PUT 接口
      await axios.put(`http://localhost:3000/api/articles/${editingOriginalId.value}`, formState)
      message.success('✅ 文章修改成功！')
    } else {
      // ➕ 新增模式：调用 POST 接口
      await axios.post('http://localhost:3000/api/articles', formState)
      message.success('🎉 新文章发布成功！')
    }
    
    // 成功后：清空表单、退出编辑模式、刷新下方的表格
    resetForm()
    fetchArticles()
  } catch (error) {
    message.error('操作失败，请检查后端')
  } finally {
    isSubmitting.value = false
  }
}

// 点击表格里的“编辑”按钮
const handleEdit = (record: any) => {
  isEditing.value = true
  editingOriginalId.value = record.id // 记住要修改谁
  // 把表格里的数据填充到上面的表单里
  Object.assign(formState, {
    id: record.id,
    title: record.title,
    desc: record.desc,
    categoryId: record.categoryId,
    author: record.author
  })
  window.scrollTo({ top: 0, behavior: 'smooth' }) // 自动滚回网页顶部填表
}

// 点击表格里的“删除”按钮
const handleDelete = (record: any) => {
  Modal.confirm({
    title: `确定要彻底删除《${record.title}》吗？`,
    content: '删除后无法恢复，且需要手动删除本地的 .md 文件！',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await axios.delete(`http://localhost:3000/api/articles/${record.id}`)
        message.success('🗑️ 删除成功！')
        fetchArticles() // 刷新表格
      } catch (error) {
        message.error('删除失败')
      }
    }
  })
}

// 取消编辑，清空表单
const resetForm = () => {
  isEditing.value = false
  editingOriginalId.value = ''
  Object.assign(formState, { id: '', title: '', desc: '', categoryId: 'basic', author: '站长' })
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