---
tags: ['编程语言']
---

# C++

## 生命周期

- 编码
- 预处理：目的是文字替换，用到的就是各种预处理指令，比如 #include、#define、#if 等
- 编译
- 链接
- 运行

### 预处理阶段编程

```cpp
#include <iostream> // 可以包含任意的文件，只是编译器无法识别
// 避免头文件被多次包含
#ifndef _XXX_H_INCLUDED_
#define _XXX_H_INCLUDED_

...    // 头文件内容

#endif // _XXX_H_INCLUDED_

#ifdef AUTH_PWD                  // 检查是否已经有宏定义
#  undef AUTH_PWD                // 取消宏定义
#endif                           // 宏定义检查结束
#define AUTH_PWD "xxx"           // 重新宏定义

// 条件编译
#elif (NGX_LINUX)
#  include <ngx_linux.h>

#endif
```

### 编译阶段编程

属性：编译阶段的“标签”，用来标记变量、函数或者类

```cpp
[[deprecated("过时")]] // c++14 or later
//[[gnu::deprecated]] // c+11 or later
int old_func()
{
    //[[gnu::deprecated("I hate this")]]
    int value = 0;
    return value;
}

int main() {
  old_func();
  return 1;
}
```

静态断言：在编译阶段计算常数和类型，如果断言失败就会导致编译错误

```cpp
static_assert(1 != 1, "1 is 1");
```
