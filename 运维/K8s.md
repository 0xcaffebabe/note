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

## 服务

是一种为一组功能相同的 pod 提供单一不变的接入点的资源

![屏幕截图 2020-09-10 190129](/assets/屏幕截图%202020-09-10%20190129.png)

- 创建

```yml
apiVersion: v1
kind: Service
metadata:
  name: kubia
spec:
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: kubia
```

### 服务间的发现

- 通过环境变量

```sh
kubectl exec kubia-9knkg -- env
```

- 通过DNS

域名：kubia.default.svc.cluster.local

如果在同一命名空间下 直接使用 kubia即可

### Endpoint

暴露一个服务的 IP 地址和端口的列表

```sh
kubectl get endpoints kubia
```

### 暴露服务给外部

- NodePort：每个集群节点都会在节点上打开一个端口 将在该端口上接收到的流量重定向到基础服务

```java
apiVersion: v1
kind: Service
metadata:
  name: kubia-nodeport
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30123
  selector:
    app: kubia
```

通过nodeip:30123 访问

- 负载均衡器将流量重定向到跨所有节点的节点端口。客户端通过负载均衡器的 IP 连接到服务

```yml
apiVersion: v1
kind: Service
metadata:
  name: kubia-loadbalancer
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: kubia
```

通过externalip:一个随机端口访问

- Ingress 只需要 一 个公网 IP 就能为许多服务提供访问

启用：

```sh
minikube addons enable ingress
```

### 就绪探针

- 创建

```yaml
# kubia-rc.yaml
    spec:
      containers:
      - name: kubia
        image: luksa/kubia
        readinessProbe:
          exec:
            command:
            - ls
            - /var/ready # 该文件存在 容器才被认为就绪
```

### 服务故障排除

- 确保从集群内连接到服务的集群IP
- 服务的集群IP 是虚拟IP, 是无法ping通的
- 如果已经定义了就绪探针， 请确保 它返回成功；否则该pod不会成为服务的一部分
- 确认某个容器是服务的 一 部分
- 检查是否连接到服务公开的端口，而不是目标端口
- 尝试直接连接到podIP以确认pod正在接收正确端口上的 连接
- 法通过pod的IP 访问应用， 请确保应用不是仅绑定 到本地主机

## 卷

卷是 pod 的 一 个组成部分， 因此像容器 一 样在 pod 的规范中定义

![屏幕截图 2020-09-12 112125](/assets/屏幕截图%202020-09-12%20112125.png)
![屏幕截图 2020-09-12 112142](/assets/屏幕截图%202020-09-12%20112142.png)

### 在容器之间共享数据

emptyDir：pod被删除时 卷的内容就会丢失

- 创建

```yml
apiVersion: v1
kind: Pod
metadata:
  name: fortune
spec:
  containers:
  - image: luksa/fortune
    name: html-genrator
    volumeMounts:
    - name: html
      mountPath: /var/htdocs
  - image: nginx:alpine
    name: web-server
    volumeMounts:
    - name: html # 使用html卷
      mountPath: /usr/share/nginx/html # 挂载到容器的位置
      readOnly: true
    ports:
    - containerPort: 80
      protocol: TCP
  volumes: # 创建一个卷
  - name: html
    emptyDir: {}
```

gitRepo：以git仓库文件填充目录文件

```yml
apiVersion: v1
kind: Pod
metadata:
  name: gitrepo-volume-pod
spec:
  containers:
  - image: nginx:alpine
    name: web-server
    volumeMounts:
    - name: html
      mountPath: /usr/share/nginx/html
      readOnly: true
    ports:
    - containerPort: 80
      protocol: TCP
  volumes:
  - name: html
    gitRepo:
      repository: https://github.com/luksa/kubia-website-example.git
      revision: master
      directory: .
```

### 访问工作节点文件

hostPath 卷指向节点文件系统上的特定文件或目录

### 持久化存储

- gce持久盘
- aws弹性块存储
- nfs卷

### 持久卷

![屏幕截图 2020-09-12 140458](/assets/屏幕截图%202020-09-12%20140458.png)
![屏幕截图 2020-09-12 144057](/assets/屏幕截图%202020-09-12%20144057.png)

- 创建持久卷

```yml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mongodb-pv
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
    - ReadOnlyMany
  persistentVolumeReclaimPolicy: Retain
  hostPath:
    path: /tmp/mongodb
```

- 创建持久卷声明

```yml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-pvc
spec:
  resources:
    requests:
      storage: 1Gi
  accessModes:
  - ReadWriteOnce
  storageClassName: "" # 动态持久卷
```

- 容器使用持久卷

```yml
# ...
  volumes:
  - name: mongodb-data
    persistentVolumeClaim:
      claimName: mongodb-pvc
```

### 动态持久卷

- 创建StorageClass

```yml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast
provisioner: k8s.io/minikube-hostpath
parameters:
  type: pd-ssd
```

声明是通过名称引用它的 方便之处主要是在不同集群之间移植

![屏幕截图 2020-09-12 150052](/assets/屏幕截图%202020-09-12%20150052.png)

## 参数配置

通过定义传递参数：

```yml
  - image: luksa/fortune:args
    args: ["2"]
```

使用环境变量：

```yml
- image: luksa/fortune:env
  env:
  - name: INTERVAL
    value: "30"
```

### ConfigMap

类似于配置中心：

![屏幕截图 2020-09-13 142528](/assets/屏幕截图%202020-09-13%20142528.png)

- 创建

```sh
kubectl create configmap fortunes-config --from-literal=sleep-interval=25
```

- 单个环境变量使用

```yml
  - image: luksa/fortune:env
    env:
    - name: INTERVAL
      valueFrom:
        configMapKeyRef:
          name: fortunes-config
          key: sleep-interval
```

- 一次传递所有环境变量

```yml
  - image: luksa/fortune:env
    env:
    envFrom:
    - prefix: CONFIG_
    configMapRef:
      name: fortunes-config
    args: ["${CONFIG_xxx}"] # 传递到命令行
```

- 挂载到卷

```yml
volumes:
- name: config
  configMap:
    name: configmap
```

- 更新配置

```sh
kubectl edit configmap xxx
```

### Secret

存储与分发敏感信息

- 创建

```sh
 kubectl create secret generic fortune-https --from-file=https.key
```

- 挂载卷使用

```yml
- image: xxx
  volumeMounts:
  - name: keys
    mountPath: /etc/nginx/keys/
volumes:
- name: keys
  secret:
    secretName: fortune-https
```

- 环境变量使用

```yml
env:
- name: FOO_SECRET
  valueFrom:
    secretKeyRef:
      name: fortune-https
      key: name
```

## pod 元数据访问

### Downward API

![屏幕截图 2020-09-13 152325](/assets/屏幕截图%202020-09-13%20152325.png)

通过环境变量：

```yml
env:
- name: POD IP
  valueFrom:
    fieldRef:
      fieldPath: status.podIP
- name: CONTAINER CPU REQUEST MILLICORES
  valueFrom:
    resourceFieldRef:
      resource: requests.cpu
      divisor: lm
```

通过卷：

```yml
volumes:
- name: downward
  downwardAPI:
    items:
    - path: "podName"
      fieldRef:
        fieldPath: metadata.name
```

![屏幕截图 2020-09-13 153906](/assets/屏幕截图%202020-09-13%20153906.png)

### 使用 K8S API 服务器

REST API：

- 启动kubectl proxy

```sh
curl http://localhost:8001/apis/batch/v1/jobs
```

在 pod 内部使用

客户端API
