---
tags: ['kubernetes', '容器化', '云原生', '微服务', '分布式系统', '运维', '架构设计']
---

# Kubernetes

## 一、Kubernetes 的本质

### 1. Kubernetes 的核心命题

在抽离所有技术细节之后，Kubernetes 要解决的本质问题只有一个：

> **如何在不确定的基础设施之上，可靠地运行确定的应用意图？**

更抽象地说：

* 应用期望是稳定的
* 运行环境是动态的
* Kubernetes 的使命是：
  **在动态世界中维持稳定意图**

---

### 2. Kubernetes 的哲学基础

Kubernetes 的设计基于四个根本思想：

| 思想       | 含义                   |
| -------- | -------------------- |
| 声明式      | 描述“要什么”，而不是“怎么做”     |
| 控制器模型    | 通过不断对比期望状态与实际状态来修正系统 |
| 资源抽象     | 用统一的 API 描述一切        |
| 基础设施即资源池 | 屏蔽底层节点差异             |

---

### 3. Kubernetes 的抽象公式

从认知高度，可以把 Kubernetes 抽象为：

```
用户意图（YAML）  
   ↓
API Server（期望状态存储）  
   ↓
控制器模型（Reconciliation Loop）  
   ↓
调度 + 执行  
   ↓
最终运行态
```

---

## 二、Kubernetes 的统一认知模型

### 1. 三层统一架构

Kubernetes 可以被简化为三层模型：

```
+-----------------------------+
|        API & 资源层         |
|  Pod / Service / Deployment |
+-----------------------------+
|         控制层              |
| Controller + Scheduler      |
+-----------------------------+
|         执行层              |
| kubelet + CRI + CNI        |
+-----------------------------+
```

* **API 层**：统一表达意图
* **控制层**：维持系统收敛
* **执行层**：把抽象变为现实

---

### 2. 控制器模型：Kubernetes 的心脏

一切 Kubernetes 组件都遵循同一范式：

```go
for {
    actual := getActualState()
    desired := getDesiredState()
    if actual != desired {
        makeThemEqual()
    }
}
```

这就是 Kubernetes 最核心的第一性原理：

> **期望状态驱动的自动化收敛系统**

---

## 三、架构：从宏观到微观

### 1. 控制平面（Control Plane）

控制平面的本质是：

> 一个分布式意图处理系统

| 组件                 | 本质职责 |
| ------------------ | ---- |
| API Server         | 意图网关 |
| etcd               | 状态之源 |
| Scheduler          | 资源决策 |
| Controller Manager | 状态收敛 |

---

#### （1）API Server：唯一入口

* 所有组件只与 API Server 通信
* 构成“单一真相源”
* 提供：

  * 认证
  * 授权
  * 审计
  * 资源变更通知

**本质：**

> API Server = Kubernetes 的“大脑皮层”

---

#### （2）etcd：状态中枢

* 保存所有期望状态
* 使用 Raft 算法保证一致性

本质公式：

```
Kubernetes 的可靠性 ≈ etcd 的可靠性
```

---

#### （3）Scheduler：资源调度器

调度本质：

> 在资源池中寻找最合适的节点

逻辑模型：

```
未调度 Pod  
   ↓
过滤可用节点  
   ↓
打分  
   ↓
绑定节点
```

---

#### （4）Controller Manager：系统稳定器

负责让系统：

> 从“实际状态” → “期望状态”

---

### 2. 执行平面（Node）

#### （1）Kubelet

本质：

> “节点上的执行代理”

* 把 Pod 描述变为真实容器
* 负责：

  * 生命周期
  * 健康检查
  * 卷挂载

---

#### （2）kube-proxy

本质：

> Service 网络规则控制器

真正转发流量的是：

* iptables
* ipvs

kube-proxy 的定位：

> 不是代理，而是“规则编程器”

---

#### （3）CRI / CNI / CSI

| 接口  | 抽象目的  |
| --- | ----- |
| CRI | 运行时解耦 |
| CNI | 网络解耦  |
| CSI | 存储解耦  |

体现 Kubernetes 的核心设计思想：

> 一切皆可插拔

---

## 四、对象模型：Kubernetes 的语言

### 1. Pod —— 最小运行单元

**本质定义：**

> Pod = 一个逻辑主机

* 共享：

  * Network Namespace
  * UTS Namespace
  * 存储卷

容器与 Pod 的关系：

| 比喻层       | 对应 |
| --------- | -- |
| Pod       | 机器 |
| Container | 进程 |

---

### 2. Service —— 稳定入口

Service 的本质：

> 为动态 Pod 集合提供稳定访问点

三大功能：

* 虚拟 IP
* 负载均衡
* 服务发现

---

### 3. Deployment —— 无状态管理器

本质：

> 版本化的副本控制器

```
Deployment
   ↓
ReplicaSet
   ↓
Pod
```

---

### 4. StatefulSet —— 状态化管理器

解决两个问题：

| 维度   | 含义     |
| ---- | ------ |
| 拓扑状态 | 编号顺序   |
| 存储状态 | 独立 PVC |

---

### 5. DaemonSet / Job / CronJob

| 对象        | 场景本质   |
| --------- | ------ |
| DaemonSet | 节点守护进程 |
| Job       | 一次性任务  |
| CronJob   | 定时任务   |

---

## 五、网络模型

Kubernetes 网络的第一性原理：

> 任何 Pod 可以无 NAT 直连任何 Pod

---

### 核心抽象

* CNI 插件负责实现
* Service 提供稳定入口
* Ingress/Gateway 提供南北向流量

---

## 六、存储模型

Kubernetes 存储的核心理念：

> 存储与计算解耦

抽象层级：

```
Pod
  ↓
PVC（声明）
  ↓
PV（资源）
  ↓
StorageClass（策略）
```

---

## 七、安全模型

Kubernetes 安全的三个维度：

| 维度 | 机制             |
| -- | -------------- |
| 身份 | ServiceAccount |
| 权限 | RBAC           |
| 隔离 | NetworkPolicy  |

---

## 八、可观测性模型

现代运维三件套：

| 能力      | 实现            |
| ------- | ------------- |
| Metrics | Prometheus    |
| Logging | EFK/ELK       |
| Tracing | OpenTelemetry |

---

## 九、运维方法论

### 1. 资源管理原则

* 明确 requests
* 合理 limits
* 依赖 QoS

---

### 2. 发布策略

| 模式   | 场景   |
| ---- | ---- |
| 滚动更新 | 常规发布 |
| 蓝绿发布 | 大版本  |
| 金丝雀  | 灰度   |

---

### 3. 高可用设计

* 控制平面多实例
* etcd 集群
* 无状态优先

---

## 十、最佳实践原则

### 应用设计原则

* 面向失败设计
* 无状态优先
* 可观测优先

---

### 运维实践原则

* 不使用 latest
* 充分利用探针
* 日志 stdout 化

---

## 十一、Kubernetes 的边界

Kubernetes 不是什么：

* 不是应用框架
* 不是中间件
* 不是监控系统

它是：

> **分布式应用的运行时平台**

---

## 十二、技术演进趋势

* Ingress → Gateway API
* iptables → eBPF
* 手工运维 → GitOps
* 单集群 → 多集群

---

## 关联内容（自动生成）

- [/操作系统/容器化.md](/操作系统/容器化.md) 容器化技术是Kubernetes的基础，提供了轻量级虚拟化和应用打包的能力
- [/运维/Docker.md](/运维/Docker.md) Docker是主流的容器技术，Kubernetes基于容器技术进行应用编排和管理
- [/软件工程/微服务/微服务.md](/软件工程/微服务/微服务.md) 微服务架构是Kubernetes的主要应用场景之一，Kubernetes为微服务提供了理想的运行环境
- [/软件工程/架构/系统设计/云原生.md](/软件工程/架构/系统设计/云原生.md) 云原生是Kubernetes的核心设计理念，Kubernetes是实现云原生架构的关键技术
- [/软件工程/微服务/ServiceMesh/ServiceMesh.md](/软件工程/微服务/ServiceMesh/ServiceMesh.md) Service Mesh是微服务通信的解决方案，与Kubernetes结合提供更强大的服务治理能力
- [/中间件/web中间件/Nginx.md](/中间件/web中间件/Nginx.md) K8s中的Ingress Controller（如nginx-ingress）实现了与Nginx类似的负载均衡和流量管理功能
- [/中间件/数据库/redis/哨兵.md](/中间件/数据库/redis/哨兵.md) Kubernetes的高可用架构设计，提供了另一种分布式系统高可用的实现思路
- [/数据技术/任务调度系统.md](/数据技术/任务调度系统.md) 涉及CronJob定时任务机制、Job与CronJob在Kubernetes中的调度实现
- [/数据技术/数据运维.md](/数据技术/数据运维.md) K8s作为云原生应用的编排系统，其提供的资源调度、弹性伸缩、健康检查等能力为数据应用的运维提供了新的模式，是云原生数据运维的重要基础设施
- [/编程语言/JAVA/框架/SpringBoot.md](/编程语言/JAVA/框架/SpringBoot.md) Spring Boot 与 Kubernetes 原生集成，支持蓝绿发布、滚动升级与金丝雀策略
- [/编程语言/JAVA/高级/注解.md](/编程语言/JAVA/高级/注解.md) Kubernetes资源定义中也使用注解来存储元数据，与Java注解在概念上有相似之处
