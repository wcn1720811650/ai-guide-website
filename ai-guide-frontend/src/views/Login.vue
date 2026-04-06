<template>
    <div>
      <div>
        <a-card
          :body-style="{ padding: '40px 32px' }" style="border-color:#10b981"
        >
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 32px; color: #10b981; margin-bottom: 10px;">
              <UnlockOutlined v-if="loginMethod === 'account'" />
              <ScanOutlined v-else />
            </div>
            <h2>{{ loginMethod === 'account' ? '系统访问授权' : '微信扫码接入' }}</h2>
            <p style="color: #666;">验证身份，进入 AI 领航中枢</p>
          </div>
  
          <a-form
            v-if="loginMethod === 'account'"
            :model="formState"
            layout="vertical"
            @finish="handleLogin"
            class="tech-form"
          >
            <a-form-item
              label="用户名"
              name="username"
              :rules="[{ required: true, message: '请输入用户名' }]"
            >
              <a-input
                v-model:value="formState.username"
                size="large"
                placeholder="输入用户名"
              />
            </a-form-item>
  
            <a-form-item
              label="密码"
              name="password"
              :rules="[{ required: true, message: '请输入密码' }]"
            >
              <a-input-password
                v-model:value="formState.password"
                size="large"
                placeholder="输入密码"
              />
            </a-form-item>
  
            <div v-if="errorMessage" style="color: red; margin-bottom: 10px;">
              <span class="mr-2">⚠️</span> {{ errorMessage }}
            </div>
  
            <div v-if="successMessage" style="color: #10b981; margin-bottom: 10px;">
              <span class="mr-2">✅</span> {{ successMessage }}
            </div>
  
            <a-form-item class="mb-0">
              <a-button
                html-type="submit"
                :loading="isLoading"
                block
                size="large"
                class="login-btn"
              >
                <span v-if="isLoading">验证身份中...</span>
                <span v-else style="color: white;">启 动 登 录</span>
              </a-button>
            </a-form-item>
          </a-form>
  
          <div v-else style="display: flex; flex-direction: column; align-items: center; padding: 20px 0;">
            <div style="padding: 10px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); position: relative; margin-bottom: 20px;">
              <a-qrcode 
                :value="qrCodeContent" 
                :color="'#10b981'" 
                :size="180" 
                :status="qrStatus === 'EXPIRED' ? 'expired' : 'active'" 
                @refresh="fetchQRCode"
              />
              <div v-if="qrStatus === 'CONFIRMED'" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; z-index: 10;">
                <CheckCircleFilled style="color: #10b981; font-size: 40px; margin-bottom: 10px;" />
                <span style="font-weight: bold; color: #333;">授权成功</span>
              </div>
            </div>
  
            <a-button 
              v-if="qrStatus === 'WAITING'" 
              type="dashed" 
              size="small" 
              @click="simulatePhoneScan" 
            >
              [测试] 模拟手机扫码
            </a-button>
          </div>
  
          <div style="text-align: center; margin-top: 24px;">
            <div 
              @click="toggleLoginMethod" 
              style="cursor: pointer; color: #666; margin-bottom: 12px; transition: color 0.3s;"
              onmouseover="this.style.color='#10b981'"
              onmouseout="this.style.color='#666'"
            >
              <template v-if="loginMethod === 'account'">
                <ScanOutlined style="margin-right: 4px;" /> 切换微信扫码登录
              </template>
              <template v-else>
                <DesktopOutlined style="margin-right: 4px;" /> 切换账号密码登录
              </template>
            </div>
  
            <div>
              还没有注册？
              <router-link
                to="/register"
                style="color: #10b981;"
              >
                立即注册
              </router-link>
            </div>
          </div>
        </a-card>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, ref, onBeforeUnmount } from 'vue'
  import { useRouter } from 'vue-router'
  import axios from 'axios'
  // 引入必需的图标
  import { UnlockOutlined, ScanOutlined, DesktopOutlined, CheckCircleFilled } from '@ant-design/icons-vue' 
  
  const router = useRouter()
  
  // 控制当前显示的是账号登录还是微信扫码
  const loginMethod = ref('account') // 'account' | 'wechat'
  
  // =======================
  // 原有账号密码逻辑 (完全没动)
  // =======================
  const formState = reactive({
    username: '',
    password: ''
  })
  
  const errorMessage = ref('')
  const successMessage = ref('')
  const isLoading = ref(false)
  
  const handleLogin = async (values: any) => {
    errorMessage.value = ''
    successMessage.value = ''
    isLoading.value = true
  
    try {
      const res = await axios.post('http://localhost:3000/api/user/login', {
        username: values.username,
        password: values.password
      })
  
      const token = res.data.token
      const username = res.data.username
      localStorage.setItem('token', token)
      localStorage.setItem('username', username)
  
      successMessage.value = '身份验证通过，正在接入系统...'
  
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } catch (err: any) {
      errorMessage.value = err?.response?.data?.message || '服务器连接失败，请重试'
    } finally {
      isLoading.value = false
    }
  }
  
  // =======================
  // 新增：微信扫码逻辑
  // =======================
  const qrTicket = ref('')
  const qrCodeContent = ref('loading...')
  const qrStatus = ref('WAITING') 
  let pollingTimer: any = null
  
  const fetchQRCode = async () => {
    try {
      qrStatus.value = 'WAITING'
      const res = await axios.get('http://localhost:3000/api/user/wechat/qrcode')
      qrTicket.value = res.data.ticket
      qrCodeContent.value = res.data.content
      startPolling()
    } catch (error) {
      errorMessage.value = '获取二维码失败'
    }
  }
  
  const startPolling = () => {
    if (pollingTimer) clearInterval(pollingTimer)
    pollingTimer = setInterval(async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/user/wechat/status?ticket=${qrTicket.value}`)
        if (res.data.status === 'CONFIRMED') {
          clearInterval(pollingTimer)
          qrStatus.value = 'CONFIRMED'
          localStorage.setItem('token', res.data.token)
          localStorage.setItem('username', res.data.username)
          successMessage.value = '微信授权成功！'
          setTimeout(() => { router.push('/') }, 1500)
        } else if (res.data.status === 'EXPIRED') {
          clearInterval(pollingTimer)
          qrStatus.value = 'EXPIRED'
        }
      } catch (error) {
        clearInterval(pollingTimer)
      }
    }, 2000)
  }
  
  const simulatePhoneScan = async () => {
    try {
      await axios.post('http://localhost:3000/api/user/wechat/simulate-scan', { ticket: qrTicket.value })
    } catch (error) {
      errorMessage.value = '模拟扫码失败'
    }
  }
  
  // 切换登录方式
  const toggleLoginMethod = () => {
    loginMethod.value = loginMethod.value === 'account' ? 'wechat' : 'account'
    
    if (loginMethod.value === 'wechat') {
      fetchQRCode()
    } else {
      if (pollingTimer) clearInterval(pollingTimer)
    }
  }
  
  // 离开页面清除定时器
  onBeforeUnmount(() => {
    if (pollingTimer) clearInterval(pollingTimer)
  })
  </script>
  
  <style scoped>  
  /* 你的原生样式完全保留，一个字没动 */
  :deep(.ant-input:focus),
  :deep(.ant-input-affix-wrapper-focused) {
    border-color: #10b981 !important;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2) !important;
  }
  
  :deep(.ant-input:hover),
  :deep(.ant-input-affix-wrapper:hover) {
    border-color: rgba(16, 185, 129, 0.5) !important;
  }
  
  /* 登录按钮样式 */
  .login-btn {
    background-color: #10b981 !important;
    border-color: #10b981 !important;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
  }
  
  .login-btn:hover,
  .login-btn:focus {
    background-color: #34d399 !important;
    border-color: #34d399 !important;
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
    transform: translateY(-1px);
  }
  </style>