---
tags: ['前端']
---

# Angular

## 基本概念

### 组件

```ts
// product-list.component.ts
import { Component } from '@angular/core';
import { products } from '../products';

@Component({
  selector: 'app-product-list', // 标识组件
  // 模板及样式文件路径
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent {
  // 可被在模板中使用的变量
  products = products;

  // 可被在模板中被调用的方法
  share() {
    window.alert('The product has been shared!');
  }
  show(name: string) {
    window.alert('this is ' + name)
  }
  desory(name: string) {
    window.alert('destory ' + name)
  }
}
```

```html
<!-- product-list.component.html -->
<h2>Products</h2>

<!-- 列表渲染 -->
<div *ngFor="let product of products">
  <h4>
    <!-- title属性渲染 click事件绑定 -->
    <a [title]="product.price" (click)="show(product.name)">{{
      product.name
    }}</a>
    <!-- 条件渲染 -->
    <p *ngIf="product.description">{{ product.description }}</p>
    <!-- 使用子组件 数据传递及事件触发 -->
    <app-product-alerts [product]="product" (notify)="desory(product.name)"></app-product-alerts>
  </h4>
</div>
```

### 路由

- 添加路径映射

```ts
// app.module.ts
@NgModule({
  imports: [
    RouterModule.forRoot([
      { path: 'product/:productId', component: ProductDetailComponent },
    ])
  ],
  ....
```

- 初始化时接收参数及渲染

```ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {

  product: string | undefined

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    const routeParams = this.route.snapshot.paramMap;
    this.product = routeParams.get('productId')!;
  }

}
```
