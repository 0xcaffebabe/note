# Less

Less 是一门 CSS 预处理语言，它扩展了 CSS 语言，增加了变量、Mixin、函数等特性，使 CSS 更易维护和扩展

## CSS弊端

- 冗余度高
- 没有计算能力
- 不方便维护扩展，不利于复用

## 安装

```shell
npm install -g less
```

## 使用

- 变量定义与使用

```less
// 必须有@为前缀
// 不能包含特殊字符
// 不能以数字开头
// 大小写敏感
@color: pink;

div {
    background-color: @color;
}
```

- 样式嵌套

```less
.header {
    width: 200px;
    a {
        color: white;
    }
}
// 如果遇见 （交集|伪类|伪元素选择器） ，利用&进行连接
.header {
    width: 200px;
    &:hover {
        color: white;
    }
}
```

- 运算

任何数字、颜色或者变量都可以参与运算。就是Less提供了加（+）、减（-）、乘（*）、除（/）算术运算

```less
@width: 10px + 5;
// 对颜色进行运算
div {
    border: @width solid red+2;
}
// 对宽度运算
div {
    width: (@width + 5) * 2;
}
```

对于两个不同的单位的值之间的运算，运算结果的值取第一个值的单位