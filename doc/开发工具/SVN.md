# SVN

## 概念

- repository（源代码库）:源代码统一存放的地方
- Checkout（检出）:当你手上没有源代码的时候，你需要从repository checkout一份
- Commit（提交）:当你已经修改了代码，你就需要Commit到repository
- Update (更新):当你已经Checkout了一份源代码， Update一下你就可以和Repository上的源代码同步，你手上的代码就会有最新的变更

## 生命周期

- 创建版本库：一个集中的空间，用于存放开发者所有的工作成果
- 检出（checkout）：类似于git clone
- 更新（update）:git push
- 提交(commit)
- 复查变化(status)
- 回滚提交(revert)
- 解决冲突(merge)

## 启动

```sh
svnadmin create /opt/svn/rp1 # 创建版本库
```

配置

```conf
# /opt/svn/rp1/conf/authz
[/]
admin = rw
```
```conf
# /opt/svn/rp1/conf/passwd
[users]
admin = admin
```
```conf
# /opt/svn/rp1/conf/svnserver.conf
[general]
anon-access = none
auth-access = write
password-db = passwd
authz-db = authz
```

## 检出

```sh
svn checkout svn://localhost/ --username=admin
```

## 提交

```sh
svn status # 检查目前版本跟踪文件情况
svn add readme.md # 添加文件到暂存区
svn commit -m "first commit"
```

## 冲突解决

当发生冲突时 无法进行commit 必须进行update解决冲突后再次commit

```sh
root@my-win:~/svn# svn commit -m "kkk commit"
Sending        readme.md
Transmitting file data .done
Committing transaction...
svn: E160028: Commit failed (details follow):
svn: E160028: File '/readme.md' is out of date
root@my-win:~/svn# svn update
Updating '.':
C    readme.md
Updated to revision 2.
Summary of conflicts:
  Text conflicts: 1
Conflict discovered in file 'readme.md'.
Select: (p) postpone, (df) show diff, (e) edit file, (m) merge,
        (mc) my side of conflict, (tc) their side of conflict,
        (s) show all options: mc
Resolved conflicted state of 'readme.md'
Summary of conflicts:
  Text conflicts: 0 remaining (and 1 already resolved)
```

## 版本回退

```sh
svn revert readme.md # 回退某一文件
```

## 查看

```sh
svn log # 输出历史日志信息
svn diff -r 1 readme.md # 输出与版本号为1diff的文件内容
svn cat -r 1 readme.md # 查看某一特定版本的文件内容
svn list svn://localhost/ # 输出版本库文件列表
```
