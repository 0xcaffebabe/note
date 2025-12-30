---
tags: ['前端开发', 'javascript引擎', '声明式编程', '组件化', '函数式编程']
---

# React

## 0. React 的第一性原理（Why React Exists）

### 0.1 React 要解决的本质问题

> **如何在状态不断变化的情况下，稳定、可预测、高性能地描述 UI？**

React 的核心假设：

```text
UI = f(state)
```

* UI 是状态的纯函数
* 开发者只关心“状态长什么样”
* 框架负责“如何更新 UI”

👉 React 的本质不是 DOM 库，而是一个 **UI 描述 + 调度系统**

---

### 0.2 React 的三层稳定架构

```
┌────────────────────────────┐
│ 表达层（What）             │ JSX / React Element
├────────────────────────────┤
│ 计算层（How to describe）  │ Component / Hooks
├────────────────────────────┤
│ 调度层（When & How apply） │ Fiber / Reconciliation / Commit
└────────────────────────────┘
```

这是理解 React 的**总心智模型**，后续所有概念都可以落在这三层中。

---

## 1. JSX：UI 描述语言（表达层）

### 1.1 JSX 的本质

> JSX 不是模板，也不是 HTML
> **JSX 是 UI 的结构化描述语言**

```jsx
<header className="App-header">
  <h1>main</h1>
</header>
```

其本质等价于：

```js
React.createElement(type, props, children)
```

无论 React 17 前后的实现如何变化，**不变的是：**

* JSX → React Element（不可变对象）
* Element = UI 的“快照描述”，不是组件实例

---

### 1.2 Element / Component / DOM 的边界

| 概念            | 本质             |
| ------------- | -------------- |
| JSX           | 语法糖            |
| React Element | UI 的结构化描述      |
| Component     | 生成 Element 的函数 |
| DOM           | Element 的物理投影  |

👉 **React 从不“操作 DOM”，它只比较描述**

---

### 1.3 JSX 的工程约束（为什么会踩坑）

* `return` 换行问题：
  👉 JSX 本质仍是 JavaScript 的表达式语法
* 组件首字母大写：
  👉 React 用**类型**区分 DOM Element 与 Component Element

---

## 2. 渲染与协调：描述如何变成现实（调度层）

## 2.1 两棵树模型

React 内部永远在处理两棵树：

```
旧 Element Tree
新 Element Tree
```

> React 不关心“你改了什么”，
> **它只比较“你现在想要什么”**

---

## 2.2 Reconciliation 的设计哲学

React Diff 的核心不是“最优”，而是：

> **在 O(n) 时间内，得到足够好的更新结果**

### 三条稳定原则

1. **类型决定命运**

   * 不同类型 → 整棵子树重建
2. **Key 决定身份**

   * Key 是元素的“社会身份”，不是索引
3. **顺序假设**

   * 默认假设列表是顺序稳定的

👉 这是**工程取舍**，不是算法缺陷。

---

## 3. Fiber：为什么 React 可以中断渲染

### 3.1 Fiber 的本质

> Fiber = **可中断的工作单元（Work Unit）**

* 每个 FiberNode = 一个组件或元素
* Fiber 构成一棵可遍历、可暂停的链表结构

---

### 3.2 Render Phase vs Commit Phase

| 阶段           | 特性        | 约束    |
| ------------ | --------- | ----- |
| Render Phase | 可中断 / 可重做 | 必须纯函数 |
| Commit Phase | 同步 / 不可中断 | 允许副作用 |

👉 这就是为什么：

* render / 函数组件 **不能有副作用**
* effect 被延迟执行

---

## 4. 组件模型：描述 UI 的计算单元（计算层）

## 4.1 组件的本质

> Component = `(props, state, context) → Element`

* 类组件：状态挂在实例上
* 函数组件：状态由 Hooks 外挂管理

---

## 4.2 数据流的第一性原则

### 单向数据流不是限制，而是治理手段

```
State → Props → Child
           ↑
        Callback
```

* 保证因果关系清晰
* 保证更新路径可追踪
* 为调试、并发、回放打基础

---

## 5. 生命周期：从“过程 API”到“阶段模型”

### 5.1 类组件生命周期的真实价值

生命周期不是为了“用”，而是为了**划分阶段**：

| 阶段         | 本质      |
| ---------- | ------- |
| Render     | 描述 UI   |
| Pre-Commit | 读取旧 DOM |
| Commit     | 应用变更    |
| Cleanup    | 释放资源    |

👉 Hooks 本质上是**对生命周期的函数化重构**

---

## 6. Hooks：函数组件的状态与副作用系统

## 6.1 Hooks 的第一性原理

> Hooks = **在函数执行过程中，为 Fiber 绑定状态单元**

关键约束来源：

* Hooks 以**链表**形式挂在 FiberNode 上
* 顺序即身份

👉 所有 Hooks 规则都来自这一事实

---

## 6.2 状态 Hooks 的分工模型

| Hook       | 解决的问题     |
| ---------- | --------- |
| useState   | 局部状态      |
| useReducer | 复杂状态机     |
| useRef     | 脱离渲染的可变容器 |

---

## 6.3 副作用 Hooks 的时间语义

| Hook            | 执行时机      | 用途      |
| --------------- | --------- | ------- |
| useLayoutEffect | DOM 更新后同步 | 布局测量    |
| useEffect       | 提交后异步     | IO / 订阅 |

👉 Effect 的存在，是为了**保护 Render Phase 的纯度**

---

## 6.4 useMemo / useCallback 的本质

> React 性能问题 ≠ 计算慢
> **而是“引用不稳定”**

* useMemo：缓存“值”
* useCallback：缓存“引用”

它们不是优化工具，而是**稳定性工具**

---

## 7. 组件复用与扩展机制

### 7.1 React.memo：渲染的幂等性保证

> memo = 声明式的 shouldComponentUpdate

前提：

* 组件必须是**纯函数**
* 副作用必须外置

---

### 7.2 高阶组件（HOC）

本质模式：**装饰器**

* 横切关注点（日志、权限、注入）
* 与 Hooks 的主要区别：

  * HOC 是结构级
  * Hooks 是逻辑级

---

## 8. 事件系统：一致性优先于原生行为

> React 合成事件的目标不是“更快”，
> 而是 **跨浏览器一致性 + 可控传播模型**

---

## 9. 应用状态管理：何时需要 Redux？

## 9.1 状态的分层治理模型

| 状态层级 | 工具       |
| ---- | -------- |
| 组件私有 | useState |
| 组件协作 | Props    |
| 跨层共享 | Context  |
| 全局业务 | Redux    |

👉 Redux 的核心价值不是“存状态”，而是：

* 可预测
* 可回溯
* 可观测

---

## 10. React 的长期演进方向（稳定认知）

### 不变的部分

* UI = f(state)
* 单向数据流
* 描述优先于命令

### 演进的部分

* Class → Function
* Sync → Concurrent
* Client → Server Components

---

## 11. 总结：React 的工程哲学

> React 是一套：
>
> * 用**函数描述 UI**
> * 用**调度管理复杂度**
> * 用**约束换取可维护性**
>   的系统

## 关联内容（自动生成）

- [/编程语言/JavaScript/Vue.md](/编程语言/JavaScript/Vue.md) 作为现代前端框架的代表，Vue 与 React 在「声明式」「响应式」「组件化」方面有着相似的理念，对比学习有助于深入理解前端框架的本质
- [/编程语言/JavaScript/JavaScript.md](/编程语言/JavaScript/JavaScript.md) React 的实现基础是 JavaScript，理解 JavaScript 的值模型、类型系统和语言特性对于掌握 React 的工作机制至关重要
- [/软件工程/架构/Web前端/Web前端.md](/软件工程/架构/Web前端/Web前端.md) React 是现代 Web 前端开发的重要组成部分，了解整个前端生态系统有助于理解 React 的定位和作用
- [/软件工程/架构/Web前端/前端工程化.md](/软件工程/架构/Web前端/前端工程化.md) React 项目的成功实施离不开前端工程化体系的支持，包括构建、部署、测试等环节
- [/编程语言/编程范式/函数式编程.md](/编程语言/编程范式/函数式编程.md) React 的设计理念深受函数式编程影响，特别是不可变数据和纯函数的概念在 Hooks 和组件设计中得到了广泛应用
