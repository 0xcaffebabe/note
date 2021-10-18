# 响应式布局

响应式需要一个父级做为布局容器，来配合子级元素来实现变化效果。

原理就是在不同屏幕下，通过媒体查询来改变这个布局容器的大小，再改变里面子元素的排列方式和大小，从而实现不同屏幕下，看到不同的页面布局和样式变化

## Bootstrap

### 布局容器

- container：两边留白

  - 响应式布局的容器 固定宽度
  - 大屏 ( >=1200px) 宽度定为 1170px
  - 中屏 ( >=992px) 宽度定为 970px
  - 小屏 ( >=768px) 宽度定为 750px
  - 超小屏 (100%)

- container-fluid

  - 百分百宽度
  - 占据全部视口（viewport）的容器

### 栅格系统

- 按照不同屏幕划分为1~12 等份
- 行（row） 可以去除父容器作用15px的边距
- xs-extra small：超小； sm-small：小； md-medium：中等； lg-large：大；
- 列（column）大于 12，多余的"列（column）"所在的元素将被作为一个整体另起一行排列
- 每一列默认有左右15像素的 padding
- 可以同时为一列指定多个设备的类名，以便划分不同份数 例如 class="col-md-4 col-sm-6"

栅格嵌套

```html
<!-- 列嵌套
简单理解就是一个列内再分成若干份小列
 -->
 <div class="col-sm-4">
    <div class="row">
         <div class="col-sm-6">小列</div>
         <div class="col-sm-6">小列</div>
    </div>
</div>
```

列偏移

```html
<div class="row">
    <div class="col-lg-4">1</div>
    <!-- 向右偏移四个列 -->
    <div class="col-lg-4 col-lg-offset-4">2</div>
</div>
```

列排序

```html
<!-- 列排序 -->
<div class="row">
    <!-- 向右移动8个单位 -->
    <div class="col-lg-4 col-lg-push-8">左侧</div>
    <!-- 向左移动4个单位 -->
    <div class="col-lg-8 col-lg-pull-4">右侧</div>
</div>
```

响应式工具

使用这些工具类可以方便的针对不同设备展示或隐藏页面内容

![202001220830](/assets/202001220830.jpg)

visible-* 可达到相反的效果

## [文档](https://v3.bootcss.com/)

