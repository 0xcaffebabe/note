![批注 2019-09-09 193656](/assets/批注%202019-09-09%20193656.png)

# GIT

## 整体流程

![](https://img-blog.csdn.net/20160530090454193?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

## 初始化仓库

```shell
git init
```

## 配置信息

```shell
git config --global user.name my
git config --global user.email 715711877@qq.com
```

**配置默认编辑器**

```shell
git config core.editor vim
```

## 查看状态

```shell
git status
```

## 添加所有文件到缓存区

```shell
git add .
```

## 提交所有更改

```shell
git commit -a -m "first commit"
```

## 查看提交日志

```shell
$ git log
```

## 回滚到某一次提交

```shell
git reset --hard 33ea7586bfe2d14e9ddbe9b07c5653159541338c
```

## 添加远程仓库

```shell
$ git remote add origin https://github.com/cjp715711877/test.git
```

## 推送到远程仓库

```shell
$ git push -u origin master
```

## 克隆仓库

```shell
$ git clone https://github.com/996icu/996.ICU.git
```

## 分支

- 开启一条新分支

```shell
$ git branch x
```

- 切换分支

```shell
git checkout x
```

- 分支合并

```shell
git merge x
```

# 推送到远程仓库

- 生成ssh密钥

```shell
ssh-keygen -t rsa
```

- 添加远程仓库地址

```shell
git remote add origin git@github.com:0xcaffebabe/repo1.git
```

- 推送

```shell
git push -u origin master
```

# 搭建Git私服

- 安装git
- 初始化服务器本地仓库

```shell
git --bare init /home/git/first
```

- 设置远程仓库地址

```shell
git remote add origin ssh://root@my-pc/home/git/first
```

- 推送

```shell
git push --set-upstream origin master
```

## 从远程仓库下载源码

```shell
git clone ssh://root@my-pc/home/git/first
```

