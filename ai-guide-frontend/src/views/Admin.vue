<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import axios from 'axios'

const isAuthorized = ref(false)
const secretKey = ref('')

const checkAuth = () => {
  // 这里设置你的专属站长密码，比如我设为 "ai2026"
  if (secretKey.value === 'ai2026') {
    isAuthorized.value = true
    message.success('口令正确，欢迎站长归来！')
  } else {
    message.error('警告：口令错误，你是谁？！')
    secretKey.value = ''
  }
}

// 表单的数据载体
const formState = reactive({
  id: '',         // 对应 markdown 文件名
  title: '',      // 文章大标题
  desc: '',       // 列表页简介
  categoryId: 'basic', // 默认分类
  author: '站长'    // 默认作者
})

const isSubmitting = ref(false)

// 点击发布按钮时触发的函数
const onFinish = async () => {
  isSubmitting.value = true
  try {
    // 📞 向我们刚刚写的后端 POST 接口发送数据
    await axios.post('http://localhost:3000/api/articles', formState)
    
    // 弹出炫酷的成功提示
    message.success('🎉 文章已成功录入云端数据库！首页已更新！')
    
    // 清空表单，方便发下一篇
    formState.id = ''
    formState.title = ''
    formState.desc = ''
  } catch (error) {
    message.error('发布失败，是不是后端没开？')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
    <a-card v-if="!isAuthorized" style="max-width: 400px; margin: 100px auto; text-align: center; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1);">
      <h2 style="margin-bottom: 24px; font-weight: bold;">🕵️‍♂️ 站长身份验证</h2>
      <a-input-password 
        v-model:value="secretKey" 
        size="large" 
        placeholder="请输入站长专属口令" 
        @pressEnter="checkAuth" 
        style="margin-bottom: 24px;"
      />
      <a-button type="primary" size="large" block @click="checkAuth" style="border-radius: 8px;">
        解锁控制台
      </a-button>
    </a-card>

    <div v-else>
    <div style="margin-bottom: 32px; text-align: center;">
      <h1 style="font-size: 32px; font-weight: bold; color: #1f2937;">🚀 站长控制台</h1>
      <p style="color: #6b7280;">在这里将新文章的数据录入 MongoDB 云端</p>
    </div>

    <a-card style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <a-form 
        :model="formState" 
        layout="vertical"
        @finish="onFinish"
      >
        <a-form-item 
          label="文章英文 ID (对应 md 文件名，如：chatgpt-tips)" 
          name="id" 
          :rules="[{ required: true, message: '请输入文章 ID！' }]"
        >
          <a-input v-model:value="formState.id" size="large" placeholder="不要加 .md 后缀" />
        </a-form-item>

        <a-form-item 
          label="文章标题" 
          name="title" 
          :rules="[{ required: true, message: '请输入标题！' }]"
        >
          <a-input v-model:value="formState.title" size="large" placeholder="吸引人的标题..." />
        </a-form-item>

        <a-form-item 
          label="文章列表简介" 
          name="desc"
          :rules="[{ required: true, message: '请输入简介！' }]"
        >
          <a-textarea v-model:value="formState.desc" :rows="3" size="large" placeholder="一两句话概括这篇文章的亮点..." />
        </a-form-item>

        <div style="display: flex; gap: 16px;">
          <a-form-item label="所属分类" name="categoryId" style="flex: 1;">
            <a-select v-model:value="formState.categoryId" size="large">
              <a-select-option value="basic">零基础入门</a-select-option>
              <a-select-option value="work">打工人提效</a-select-option>
              <a-select-option value="life">生活小助手</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="作者" name="author" style="flex: 1;">
            <a-input v-model:value="formState.author" size="large" />
          </a-form-item>
        </div>

        <a-form-item style="margin-top: 24px; margin-bottom: 0;">
          <a-button 
            type="primary" 
            html-type="submit" 
            size="large" 
            block 
            :loading="isSubmitting"
            style="height: 48px; font-size: 16px; border-radius: 8px;"
          >
            🔥 确认录入云端数据库
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
    </div>
  </div>
</template>