import { createApp } from 'vue'
import App from './App.vue'
import router from './router' 
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';


import axios from 'axios'
import { message } from 'ant-design-vue'

// ==========================================
// 🛡️ Axios 全局响应拦截器：专门处理 Token 过期
// ==========================================
axios.interceptors.response.use(
  (response) => {
    // 如果后端正常响应，直接放行
    return response;
  },
  (error) => {
    // 🌟 如果后端返回 401 (未授权 / Token 过期)
    if (error.response && error.response.status === 401) {
      // 1. 弹出警告提示
      message.error('登录状态已过期，请重新登录！');
      
      // 2. 清理前端残留的“假票根”
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      
      // 3. 强制把用户踢回登录页
      router.push('/login');
    }
    
    return Promise.reject(error);
  }
)

const app = createApp(App)
app.use(Antd) // 使用 Ant Design
app.use(router)

app.mount('#app')
