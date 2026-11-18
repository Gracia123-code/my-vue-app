// 从 vue 工具包里引入 createApp（用于创建应用）
import { createApp } from 'vue'
// 引入我们的主页面组件 App.vue
import App from './App.vue'
// 引入 Element-Plus UI组件库及它的样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 引入路由配置（管理页面跳转）
import router from './router'

const app = createApp(App) // 创建了一个 Vue 应用

// 把我们下载好的工具和组件挂载到应用上
app.use(ElementPlus) // 启用 Element-Plus（让你能用各种漂亮按钮和输入框）
app.use(router)      // 启用路由（让你能切换页面）

// 把这个应用挂载到 index.html 的 #app 节点上
app.mount('#app')