# Kubernetes

>Kubernetes（常简称为K8s）是用于自动部署、扩展和管理容器化（containerized）应用程序的开源系统

![屏幕截图 2020-09-07 145646](/assets/屏幕截图%202020-09-07%20145646.png)

## 架构

![屏幕截图 2020-09-07 145831](/assets/屏幕截图%202020-09-07%20145831.png)

master：用于控制集群

- API服务器：外部访问入口
- Scheduler：调度应用（为应用分配工作节点）
- Controller Manager：执行集群级别的功能
- etcd：存储集群配置的分布式数据存储

工作节点：运行用户部署应用的节点

- 容器运行时：Docker 或者其他容器
- Kubelet：与API服务器通信 管理当前节点的容器
- kube-proxy:负责组件之间的负载均衡

## 优点

- 简化部署
- 充分利用硬件
- 健康检查 自修复
- 自动扩容

## 在K8S中运行应用

根据描述信息生成对应的pod 在pod中运行容器

K8S会保证集群中的容器数量实例 在容器死亡时 会启动新容器替补

K8S 在运行时可根据需求动态调整副本数量

通过kube-proxy能进行服务连接动态切换

### 本地运行K8S

- 安装minikube
- 安装kubectl

```sh
minikube start \
--image-mirror-country=cn \
--registry-mirror='https://t9ab0rkd.mirror.aliyuncs.com' \
--image-repository='registry.cn-hangzhou.aliyuncs.com/google_containers'
```

### 部署第一个应用

```sh
kubectl  run  kubia  --image=luksa/kubia  --port=8080  # 创建容器运行
kubectl get pods # 获取pod
kubectl get rc
kubectl port-forward kubia 8080:8080 # 开启端口转发
kubectl get pods -o wide # 查看应用在哪个节点
kubectl scale rc kubia --replicas=3 # 水平扩容
```

![屏幕截图 2020-09-08 140428](/assets/屏幕截图%202020-09-08%20140428.png)

逻辑架构：

![屏幕截图 2020-09-08 142015](/assets/屏幕截图%202020-09-08%20142015.png)

- RC用来确保始终有pod运行
- 使用http服务来完成外部请求到pod的映射

## pod

一组紧密相关的容器 独立的逻辑机器

![屏幕截图 2020-09-08 135241](/assets/屏幕截图%202020-09-08%20135241.png)

一 个 pod 中的所有容器都在相同的 network 和 UTS 命名空间下运行

每个 pod 都有自己的 IP 地址， 并且可以通过这个专门的网络实现 pod
之间互相访问

pod的使用：

- 倾向于单个pod单个容器

### 使用yml创建pod

```yml
apiVersion: v1
kind: Pod
metadata:
  name: kubia-manual
  labels:
    env: test # 指定一个标签
spec:
  nodeSelector: # 选择特定标签的节点
    super: "true"
  containers:
  - image: luksa/kubia
    name: kubia
    ports:
    - containerPort: 8080
      protocol: TCP
```

```sh
kubectl create -f kubia-manual.yaml
kubectl logs kubia-manual # 查看日志
```

### 标签

```sh
kubectl get po --show-labels
kubectl label po kubia-manual createtion_method=manual # 修改标签
kubectl label node minikube super=true
kubectl get po -l createtion_method=manual # 根据标签筛选
```

### 注解

注解也是键值对

```sh
kubectl annotate pod kubia-manual wang.ismy/name="cxk"
```

### 命名空间

命名空间简单为对象划分了一个作用域

```sh
kubectl get ns
kubectl get po -n kube-system # 获取命名空间下的pod

kubectl create namespace custom-namespace # 创建命名空间
kubectl create -f kubia-manual.yaml -n custom-namespace # 指定命名空间
```

### 停止与移除

```sh
kubectl delete po kubia-manual # 根据名字删除
```

## 副本机制

k8s 会保证 pod 以及 容器的健康运行

### 存活探针

当存活探针探测失败 容器就会重启

- 创建

```yml
apiVersion: v1
kind: Pod
metadata:
  name: kubia-liveness
spec:
  containers:
  - image: luksa/kubia-unhealthy
    name: kubia
    livenessProbe: # 存活探针
      httpGet: # 返回2xx 或者 3xx就代表活着
        path: /
        port: 8080
```

### ReplicationController

创建和管理一个pod的多个副本

![屏幕截图 2020-09-09 164430](/assets/屏幕截图%202020-09-09%20164430.png)

- 创建

```yml
apiVersion: v1
kind: ReplicationController
metadata:
  name: kubia
spec:
  replicas: 3
  selector:
    app: kubia
  template:
    metadata:
      labels:
        app: kubia
    spec:
      containers:
      - name: kubia
        image: luksa/kubia
        ports:
        - containerPort: 8080
```

控制器通 过 创建 一 个新的替代pod来响应pod的删除操作

通过更改标签的方式来实现rc与pod的关联

- 扩容

```sh
kubectl scale rc kubia --replicas=10
```

- 删除

```sh
kubectl delete rc kubia
```

### ReplicaSet

ReplicaSet 会 替代 rc

rs 的pod 选择器的表达能力更强

- 创建

```yml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: kubia
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kubia
  template:
    metadata:
      labels:
        app: kubia
    spec:
      containers:
      - name: kubia
        image: luksa/kubia
```

### DaemonSet

由DaemonSet 创建的pod 会绕过调度程序 会在所有集群节点上运行（或者也可以通过指定`nodeSelector`在其他节点运行）

![屏幕截图 2020-09-09 191240](/assets/屏幕截图%202020-09-09%20191240.png)

- 创建

```yml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: ssd-monitor
spec:
  selector:
    matchLabels:
      app: ssd-monitor
  template:
    metadata:
      labels:
        app: ssd-monitor
    spec:
      nodeSelector:
        disk: ssd
      containers:
      - name: main
        image: luksa/ssd-monitor
```

### Job

允许运行 一 种 pod, 该 pod 在内部进程成功结束时， 不重启容器。

- 创建

```yml
apiVersion: batch/v1
kind: Job
metadata:
  name: batch-job
spec:
  completions: 5 # 运行pod数
  parallelism: 2 # 并行运行数
  template:
    metadata:
      labels:
        app: batch-job
    spec:
      restartPolicy: OnFailure
      containers:
      - name: main
        image: luksa/batch-job
```

### CronJob

- 创建

```yml
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: cron-job
spec:
  schedule: "0,15,30,45 * * * *"
  jobTemplate:
    spec:
      template:
        metadata:
          labels:
            app: batch-job
        spec:
          restartPolicy: OnFailure
          containers:
          - name: main
            image: luksa/batch-job
```