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

+ 按照不同屏幕划分为1~12 等份
+ 行（row） 可以去除父容器作用15px的边距
+ xs-extra small：超小； sm-small：小；  md-medium：中等； lg-large：大；
+ 列（column）大于 12，多余的“列（column）”所在的元素将被作为一个整体另起一行排列
+ 每一列默认有左右15像素的 padding
+ 可以同时为一列指定多个设备的类名，以便划分不同份数  例如 class="col-md-4 col-sm-6"

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

 <!-- 列偏移
 使div2向右偏移四个列
  -->
<div class="row">
    <div class="col-lg-4">1</div>
    <div class="col-lg-4 col-lg-offset-4">2</div>
</div>

## CSS样式和组件

```
1\. 全局CSS样式：
    * 按钮：class="btn btn-default"
    * 图片：
        *  class="img-responsive"：图片在任意尺寸都占100%
        *  图片形状
            *  <img src="..." alt="..." class="img-rounded">：方形
            *  <img src="..." alt="..." class="img-circle"> ： 圆形
            *  <img src="..." alt="..." class="img-thumbnail"> ：相框
    * 表格
        * table
        * table-bordered
        * table-hover
    * 表单
        * 给表单项添加：class="form-control" 
2\. 组件：
    * 导航条
    * 分页条
3\. 插件：
    * 轮播图
```
