>致力于帮助企业、用户和开发者将企业应用轻松微服务化上云，并实现对微服务应用的高效运维管理。其提供一站式开源微服务解决方案，融合SDK框架级、0侵入ServiceMesh场景并支持多语言

![](http://servicecomb.apache.org/assets/images/servicecomb-models.png)

# 设计思想

- 编程模型和通信模型分离，不同的编程模型可以灵活组合不同的通信模型。应用开发者在开发阶段只关注接口开发，部署阶段灵活切换通信方式；支持legacy系统的切换，legacy系统只需要修改服务发布的配置文件（或者annotation），而不需要修改代码。现阶段支持SpringMVC、JAX-RS和透明RPC三种开发方式。
- 内建API-first支持。通过契约规范化微服务开发，实现跨语言的通信，并支持配套的软件工具链（契约生成代码、代码生成契约等）开发，构建完整的开发生态。
- 定义了常用的微服务运行模型，将微服务从发现到交互过程中的各种容错手段都封装起来。该运行模型支持自定义和扩展。

# 注册中心

## 安装运行

```shell
docker pull servicecomb/service-center
docker run -d -p 30100:30100 servicecomb/service-center:latest
```


