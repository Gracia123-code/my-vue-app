<template>
  <!-- router-view 是一个占位符。你访问哪个网址，这里就显示哪个页面 -->
  <router-view></router-view>
</template>

<style>
/* 去除浏览器默认的边距，让页面铺满全屏 */
body {
  margin: 0;
  padding: 0;
  background-color: #f5f7fa;
}
</style>