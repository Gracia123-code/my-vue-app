<!-- ================= 首页（商品列表） ================= -->
<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <div class="header">
      <h2>校园二手交易市场</h2>
      <div class="user-actions">
        <span style="margin-right: 20px;">欢迎你，{{ userInfo.nickname || userInfo.username }}</span>

        <!-- 个人中心按钮（所有登录用户都可见） -->
        <el-button type="info" plain @click="$router.push('/profile')">个人中心</el-button>

        <!-- 管理中心按钮：只有商家(1)或管理员(2)才显示 -->
        <el-button v-if="userInfo.role === 1 || userInfo.role === 2" type="warning" plain @click="$router.push('/manage')">
          管理中心
        </el-button>

        <el-button type="success" plain @click="$router.push('/cart')">我的购物车</el-button>
        <el-button type="primary" plain @click="$router.push('/order')">我的订单</el-button>
        <el-button type="danger" plain @click="logout">退出登录</el-button>
      </div>
    </div>

    <!-- 轮播图区域（有数据才显示） -->
    <div v-if="bannerList.length > 0" class="banner">
      <el-carousel height="240px">
        <el-carousel-item v-for="b in bannerList" :key="b.id">
          <img :src="getImage(b.imgUrl)" class="banner-img" />
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 搜索与排序区域 -->
    <div class="search-bar">
      <el-input v-model="searchName" placeholder="搜索商品名称" style="width: 300px; margin-right: 10px;" clearable @keyup.enter="fetchGoods" />
      <el-button type="primary" @click="fetchGoods">搜索</el-button>

      <span style="margin-left: 30px; margin-right: 10px;">排序：</span>
      <el-radio-group v-model="sortBy" @change="fetchGoods">
        <el-radio-button value="default">最新发布</el-radio-button>
        <el-radio-button value="price_asc">价格从低到高</el-radio-button>
        <el-radio-button value="price_desc">价格从高到低</el-radio-button>
        <el-radio-button value="sales">销量优先</el-radio-button>
        <el-radio-button value="goodRate">好评率优先</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 店铺筛选提示（从商品详情"进店逛逛"跳转过来时显示） -->
    <div v-if="shopId" class="shop-filter-tip">
      <span>正在查看该店铺的商品</span>
      <el-button size="small" @click="clearShopFilter">清除店铺筛选</el-button>
    </div>

    <!-- 商品列表展示区域 -->
    <div class="goods-list">
      <el-empty v-if="goodsList.length === 0" description="暂无商品，快去发布吧~" />

      <el-row :gutter="20">
        <!-- 每个商品占 6/24 的宽度，一行显示4个 -->
        <el-col :span="6" v-for="item in goodsList" :key="item.id" style="margin-bottom: 20px;">
          <!-- 点击整张卡片跳转到商品详情页 -->
          <el-card :body-style="{ padding: '0px' }" shadow="hover" class="goods-card" @click="$router.push(`/goods/${item.id}`)">
            <img :src="getImage(item.imgUrl)" class="image" @error="e => (e.target.src = 'https://via.placeholder.com/200x200?text=加载失败')" />
            <div style="padding: 14px;">
              <h3 class="goods-name">{{ item.goodsName }}</h3>
              <p class="goods-price">
                ￥{{ item.sellPrice }}
                <span class="origin">￥{{ item.originalPrice }}</span>
              </p>
              <p class="goods-meta">
                <span class="shop">🏪 {{ item.shopName || '未知店铺' }}</span>
                <span v-if="item.goodRate != null" class="rate">好评率 {{ item.goodRate }}%</span>
              </p>
              <p class="goods-meta">销量: {{ item.sales }} | {{ item.oldDegree }}</p>
              <!-- @click.stop 阻止冒泡，避免点到按钮时同时触发跳转 -->
              <el-button type="primary" size="small" style="width: 100%;" @click.stop="addToCart(item.id)">
                加入购物车
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 分页控件 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pageNum"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="fetchGoods"
      />
    </div>
  </div>
</template>

<!-- ================= 首页逻辑 ================= -->
<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { getImage, authHeaders, getUserInfo } from '../utils'

const router = useRouter()
const route = useRoute()
const searchName = ref('')      // 搜索关键字
const sortBy = ref('default')   // 排序方式
const shopId = ref(null)        // 当前店铺筛选（从地址栏 ?shopId= 读取）
const goodsList = ref([])       // 商品列表
const bannerList = ref([])      // 轮播图列表
const userInfo = ref({})        // 当前登录用户信息

const pageNum = ref(1)          // 当前页码
const pageSize = 20             // 每页数量
const total = ref(0)            // 商品总条数（分页用）

// 拉取商品列表（带搜索、排序、分页）
const fetchGoods = async () => {
  try {
    const res = await axios.get('/api/goods/list', {
      params: {
        pageNum: pageNum.value,
        pageSize: pageSize,
        goodsName: searchName.value,
        sortBy: sortBy.value,
        shopId: shopId.value
      }
    })
    if (res.data.code === 200) {
      // 后端返回的是 MyBatis-Plus 的分页对象，包含 records（数据）和 total（总数）
      goodsList.value = res.data.data.records
      total.value = res.data.data.total
    }
  } catch (error) {
    ElMessage.error('获取商品列表失败，请检查后端是否启动')
  }
}

// 拉取首页轮播图
const fetchBanner = async () => {
  try {
    const res = await axios.get('/api/banner/list')
    if (res.data.code === 200) bannerList.value = res.data.data
  } catch (error) {
    // 轮播图加载失败不影响商品列表，静默处理即可
  }
}

// 加入购物车
const addToCart = async (goodsId) => {
  if (!localStorage.getItem('token')) {
    ElMessage.warning('请先登录！')
    router.push('/login')
    return
  }
  try {
    const res = await axios.post('/api/cart/add', null, {
      params: { goodsId, buyNum: 1 },
      headers: authHeaders()
    })
    if (res.data.code === 200) ElMessage.success('已成功加入购物车！')
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '加入失败')
  }
}

// 退出登录
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  ElMessage.success('已退出登录')
  router.push('/login')
}

// 清除店铺筛选
const clearShopFilter = () => {
  shopId.value = null
  fetchGoods()
}

onMounted(() => {
  userInfo.value = getUserInfo() // 读本地缓存的用户信息
  // 从地址栏读取店铺ID（从商品详情"进店逛逛"跳转过来）
  if (route.query.shopId) shopId.value = Number(route.query.shopId)
  fetchGoods()
  fetchBanner()
})
</script>

<!-- ================= 首页样式 ================= -->
<style scoped>
.home-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.banner { margin-bottom: 20px; border-radius: 8px; overflow: hidden; }
/* contain：图片完整显示（等比缩放，不裁剪），两侧留白用浅灰底填充 */
.banner-img { width: 100%; height: 240px; object-fit: contain; background-color: #f0f2f5; display: block; }
.search-bar { display: flex; align-items: center; margin-bottom: 20px; background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.goods-card { cursor: pointer; }
.image { width: 100%; height: 200px; object-fit: cover; background-color: #eee; }
.goods-name { margin: 0; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.goods-price { color: #ff4d4f; font-size: 20px; font-weight: bold; margin: 10px 0; }
.goods-price .origin { color: #999; font-size: 12px; text-decoration: line-through; margin-left: 5px; font-weight: normal; }
.goods-meta { color: #999; font-size: 12px; margin-bottom: 10px; }
.goods-meta .shop { color: #666; margin-right: 10px; }
.goods-meta .rate { color: #e6a23c; }
.shop-filter-tip { display: flex; align-items: center; gap: 10px; background: #fff; padding: 12px 15px; border-radius: 8px; margin-bottom: 15px; color: #666; }
.pagination { display: flex; justify-content: center; margin-top: 20px; }
</style>
