# Kubernetes

>Kubernetes（常简称为K8s）是用于自动部署、扩展和管理容器化（containerized）应用程序的开源系统

## 特点

- 轻量级
- 开源
- 弹性伸缩
- 负载均衡

## 架构

![屏幕截图 2020-08-11 122543](/assets/屏幕截图%202020-08-11%20122543.png)

- etcd：键值对数据库，保存了整个集群的重要信息；

![屏幕截图 2020-08-11 122855](/assets/屏幕截图%202020-08-11%20122855.png)

- apiserver：所有服务访问的统一入口
- controller manager：负责维护集群的状态，比如故障检测、自动扩展、滚动更新等；
- scheduler：负责资源的调度，按照预定的调度策略将Pod调度到相应的机器上；
- kubelet：负责维护容器的生命周期，同时也负责Volume（CSI）和网络（CNI）的管理；
- kube-proxy负责为Service提供cluster内部的服务发现和负载均衡；
- Container runtime负责镜像管理以及Pod和容器的真正运行（CRI）；

### 其他插件

- CoreDNS：集群中的一个域名解析系统
- Dashboard：BS结构访问体系
- Ingress Controller ：七层代理
- Fedetation：跨集群统一管理
- Prometheus：监控
- ELK：日志收集

### Pod

- RC RS

Replicat ionController用来确保容器应用的副本数始终保持在用户定义的副本数，即如果
有容器异常退出，会自动创建新的Pod来替代;而如果异常多出来的容器也会自动回收。
在新版本的Kubernetes 中建议使用ReplicaSet 来取代Replicat ionControlle
ReplicaSet跟Rep1 icat ionController没有本质的不同，只是名字不一样，并且
ReplicaSet支持集合式的selector
虽然ReplicaSet可以独立使用，但- -般还是建议使用Deployment 来自动管理
ReplicaSet，这样就无需担心跟其他机制的不兼容问题(比如ReplicaSet 不支持
rolling -update但Deployment 支持)

- deployment

定义Deployment来创建Pod和Rep1 icaSet
滚动升级和回滚应用
扩容和缩容
暂停和继续Deployment

- HPA

Horizontal Pod Autoscaling 仅适用于Deployment 和ReplicaSet ，在V1版本中仅支持根据Pod
的CPU利用率扩所容，在v1alpha 版本中，支持根据内存和用户自定义的metric 扩缩容

- StatefulSet

*稳定的持久化存储，即Pod重新调度后还是能访问到相同的持久化数据，基于PVC来实现
*稳定的网络标志，即Pod 重新调度后其PodName 和HostName 不变，基于Headless Service
(即没有Cluster IP的Service )来实现
*有序部署，有序扩展，即Pod是有顺序的，在部署或者扩展的时候要依据定义的顺序依次依次进
行(即从0到N-1,在下一个Pod运行之前所有之前的Pod必须都是Running 和Ready状态)，
基于init containers 来实现
*有序收缩，有序删除(即从N-1到0)

- DaemonSet

DaemonSet确保全部(或者-一些) Node上运行- 一个Pod的副本。当有Node 加入集群时，也会为他们
新增一个Pod。当有Node 从集群移除时，这些Pod也会被回收。删除DaemonSet 将会删除它创建
的所有Pod
使用DaemonSet 的一些 典型用法:
*运行集群存储daemon， 例如在每个Node. 上运行 glusterd、 ceph。
*在每个Node. 上运行日志收集daemon， 例如fluentd、logstash。
*在每个Node. 上运行监控daemon, 例如Prometheus Node Exporter

- job Cronjob

Job负责批处理任务，即仅执行-次的任务，它保证批处理任务的-一个或多个Pod成功结束
Cron Job管理基于时间的Job， 即:

.在给定时间点只运行一-次
*周期性地在给定时间点运行

- 服务发现