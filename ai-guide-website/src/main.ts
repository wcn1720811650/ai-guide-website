import { createApp } from 'vue'
import App from './App.vue'
import router from './router' 
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

const app = createApp(App)
app.use(Antd) // 使用 Ant Design
app.use(router)

app.mount('#app')
