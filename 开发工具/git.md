# GIT
## 初始化仓库
```shell
$ git init
Initialized empty Git repository in /root/git/.git/
```
## 配置信息
```shell
# root @ DESKTOP-HAEPUAD in ~/git on git:master o [10:59:06]
$ git config --global user.name my

# root @ DESKTOP-HAEPUAD in ~/git on git:master o [11:05:12]
$ git config --global user.email 715711877@qq.com
```
**配置默认编辑器**
```shell
git config core.editor vim
```
## 查看状态
```shell
$ git status
On branch master

Initial commit

Untracked files:
  (use "git add <file>..." to include in what will be committed)

        code

nothing added to commit but untracked files present (use "git add" to track)
```
## 添加所有文件到缓存区
```shell
$ git add .
```
## 提交所有更改
```shell
$ git commit -a -m "first commit"
[master (root-commit) 33ea758] first commit
 1 file changed, 1 insertion(+)
 create mode 100644 code
```
## 查看提交日志
```shell
$ git log
```
## 回滚到某一次提交
```shell
$ git reset --hard 33ea7586bfe2d14e9ddbe9b07c5653159541338c
HEAD is now at 33ea758 first commit
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

