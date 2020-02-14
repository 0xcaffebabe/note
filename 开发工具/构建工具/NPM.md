>npm（全称 Node Package Manager，即“node包管理器”）是Node.js默认的、以JavaScript编写的软件包管理系统

# 初始化工程

```shell
npm init
```

# 安装模块

- 本地安装

```shell
npm install xxx
```

- 获取模块全局目录

```shell
npm root -g
```

- 全局安装

```shell
npm install xxx -g
```

- 批量安装

```shell
npm install # npm会根据package.json下载依赖
```

## 使用淘宝镜像

```shell
npm install -g cnpm --registry=http://registry.npm.taobao.org
```

# 运行

在package.json中定义

- dev：开发阶段
- build：构建编译
- lint：运行js代码检测
