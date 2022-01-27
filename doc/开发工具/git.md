# GIT

Git属于分布式版本控制系统

![批注 2019-09-09 193656](/assets/批注%202019-09-09%20193656.png)

## 整体流程

![2020318102131](/assets/2020318102131.png)

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

## 工作流

![批注 2020-03-18 103355](/assets/批注%202020-03-18%20103355.png)

- 把文件的修改添加到暂存区

```shell
git add .
```

- 把暂存区的修改提交到当前分支，提交之后暂存区就被清空了

```shell
git commit
```

-  使用当前分支上的修改覆盖暂存区

```shell
git reset -- files
```

- 将某个分支的操作添加到某个分支

```sh
git rebase branch1 branch2 # 1 添加的分支 2 被添加的分支
```

-  使用暂存区的修改覆盖工作目录

```shell
git checkout -- file
```

- 直接把所有文件的修改添加到暂存区然后执行提交

```shell
git commit -a
```

- 取出最后一次修改，可以用来进行回滚操作

```shell
git checkout HEAD -- files
```

- 将一些提交添加到当前分支

```sh
git cheery-pick hash1 hash2 hash3...
```

- 交互式rebase

```sh
git rebase -i HEAD~4 # 通过UI界面的方式调整提交记录顺序
```

## 查看提交日志

```shell
git log
```

## 回滚到某一次提交

```shell
git reset --hard 33ea7586bfe2d14e9ddbe9b07c5653159541338c # 通过将HEAD指向某一提交记录实现
git revert ... # 通过创建一个新提交记录实现
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

HEAD 指针指向当前分支指针

![批注 2020-03-18 103706](/assets/批注%202020-03-18%20103706.png)

- 新建分支

新建一个指针指向时间线的最后一个节点，并让 HEAD 指针指向新分支

![批注 2020-03-18 103810](/assets/批注%202020-03-18%20103810.png)

```shell
git branch x
```

- 切换分支

```shell
git checkout x
```

每次提交只会让当前分支指针向前移动，而其它分支指针不会移动

![批注 2020-03-18 103915](/assets/批注%202020-03-18%20103915.png)

- 分支合并

合并分支也只需要改变指针即可

![批注 2020-03-18 103957](/assets/批注%202020-03-18%20103957.png)

```shell
git merge x
```

### 冲突

两个分支都对同一个文件的同一行进行了修改，在分支合并时就会产生冲突

Git 会使用 <<<<<<< ，======= ，>>>>>>> 标记出不同分支的内容，只需要把不同分支中冲突部分修改成一样就能解决冲突

### Fast forward

快进式合并"（fast-farward merge），会直接将 master 分支指向合并的分支，这种模式下进行分支合并会丢失分支信息，也就不能在分支历史上看出分支信息

## 储藏（Stashing）

在一个分支上操作之后，如果还没有将修改提交到分支上，此时进行切换分支，那么另一个分支上也能看到新的修改。这是因为所有分支都共用一个工作区的缘故

使用

```shell
git stash
```

这个命令将当前分支的修改储藏起来，此时工作区就是干净的，可以切换到其他分支

## 推送到远程仓库

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

## 搭建Git私服

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

## 一些坑

- 检出错误

```
ssh: connect to host xxx.com port 22: Connection refused
```

确定是否有权限

- 切换邮箱提交错误

新的账户没有提交权限，然而你在新的账户上有了一次提交，此时代码推不上去，切换回原邮箱依然提示推不上去

此时，需要回滚撤销此次提交，切回有权限的邮箱重新提交并推送

- 切分支错误

拉取新分支时，一定要注意检查父分支

- 提前合并到master

如果相关代码没有准备好，提前将代码合并到master，会引发错误

- merge冲突

此时一定要慎之又慎，来处理冲突

- 一个分支干多件事

如果一个分支干多件事，测试代码没有覆盖，很容易出bug

- 及时合并到master

开发周期较长时，要及时合并到master，避免最后大量冲突

## 分支管理策略

### Git Flow

![GitFlow概览](/assets/202212233314.svg)

分支      | 说明                                          | 是否允许多条
------- | ------------------------------------------- | ------
master  | 存储最近发布到生产环境的代码 只允许从其他分支合并 不允许直接修改           | ×
develop | 包含所有要发布到下一个版本的代码                            | ×
feature | 特性分支，用来开发功能 开发完成 则合并到develop                | √
release | 基于develop创建，完成后合并到master和develop            | √
hotfix  | 修复生产环境紧急的问题 从master拉出来 修复完合并到master和develop | √

### GitHub Flow

- Pull Request

![Github Flow 流程图](/assets/202212233640.png)

#### Pull Request 与 Merge Request

这两种方式本质上是一样的，都是利用了git merge来合并两个分支。

[同步fork过来的仓库与源仓库](https://github.com/selfteaching/the-craft-of-selfteaching/issues/67)：

方法1：

```sh
git remote add upstream 源仓库 # 添加源仓库
git fetch upstream # 同步源仓库的内容
git reset --hard upstream/main # 将本地仓库设置为源仓库的内容
git push -f # 将本地内容推送到远程仓库
```

方法2：

在 Github 删除后重新 fork
