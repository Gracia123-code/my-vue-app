import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import Cart from '../views/Cart.vue'
import Order from '../views/Order.vue'
import Manage from '../views/Manage.vue'
import Register from '../views/Register.vue'       // 注册页
import GoodsDetail from '../views/GoodsDetail.vue' // 商品详情页
import Profile from '../views/Profile.vue'         // 个人中心页

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },          // 注册
  { path: '/home', component: Home },
  { path: '/goods/:id', component: GoodsDetail },      // 商品详情（带商品ID参数）
  { path: '/cart', component: Cart },
  { path: '/order', component: Order },
  { path: '/profile', component: Profile },            // 个人中心
  { path: '/manage', component: Manage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router