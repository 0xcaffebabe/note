---
tags: ['前端']
---

# Angular

cli：

```sh
npm install -g @angular/cli
```

## 组件

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

## 路由

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

## 管理数据

- 定义 service

```ts
// cart.service.ts
import { Injectable } from '@angular/core';

@Injectable(
  {providedIn: 'root'}
)
export class CartService {

  items: string[] = []

  constructor() { }

  add(item: string) {
    this.items.push(item);
    console.log(this.items)
  }

  getItems(): string[] {
    return this.items
  }

}
```

- 在其他组件注入service

```ts
constructor(
    private route: ActivatedRoute,
    private cartService: CartService
) { }
```

- 在组件内使用

```ts
addToCart(){
  this.cartService.add(this.product!)
}
```

## 表单输入

```ts
// app.module.ts
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
@NgModule({
  imports:      [ BrowserModule, ReactiveFormsModule ],
  declarations: [ AppComponent],
  bootstrap:    [ AppComponent ]
})
```
```ts
export class AppComponent  {
 loginForm: FormGroup;

  constructor(
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }
  ...
```
```html
<form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <div class="form-group">
          <input type="email" class="form-control" formControlName="username" required placeholder="username: name@example.com">
      </div>
      <div class="form-group">
          <input type="password" class="form-control" formControlName="password" required placeholder="password: admin123">
      </div>
      <button type="submit" [disabled]="!loginForm.valid" class="btn btn-primary btn-block">Login</button>
</form>
```
