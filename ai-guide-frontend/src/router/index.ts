import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
// 引入页面组件
import Home from '../views/Home.vue'
import Article from '../views/Article.vue'
import ArticleList from '@/views/ArticleList.vue'
import Admin from '@/views/Admin.vue'
import NotFound from '@/views/NotFound.vue'
import Register from '@/views/Register.vue'
import Login from '@/views/Login.vue'
import Community from '@/views/Community.vue'
import PostDetail from '../views/PostDetail.vue'
import PostEdit from '../views/PostEdit.vue'
import MyFavorites from '../views/MyFavorites.vue'
import UserProfile from '../views/UserProfile.vue'
// 🌟 重点在这里：声明 routes 是一个 RouteRecordRaw 类型的数组
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/category/:id',
    name: 'Category',
    component: ArticleList
  },
  {
    path: '/article/:id', 
    name: 'Article',
    component: Article
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/community',
    name: 'Community',
    component: Community
  },
  {
    path: '/post/:id',
    name: 'PostDetail',
    component: PostDetail
  },
  {
    path: '/post/:id/edit',
    name: 'PostEdit',
    component: PostEdit
  },
  {
    path: '/my-favorites',
    name: 'MyFavorites',
    component: MyFavorites
  },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: UserProfile
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
