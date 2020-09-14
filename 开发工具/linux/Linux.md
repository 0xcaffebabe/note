# Linux

## 基本概念及操作

### 求助

#### man

man 是 manual 的缩写，将指令的具体信息显示出来

```shell
man date
```

代号|	类型
-|-
1	| 用户在 shell 环境中可以操作的指令或者可执行文件
2 | 内核可调用的函数与工具库
3 | 函数库
4 | 设备文件说明
5	| 配置文件
6 | 游戏
7 | 协议
8	| 系统管理员可以使用的管理指令

#### doc

/usr/share/doc目录下存放了软件的使用说明

### 关机

#### who

```shell
who # 查看在线的用户
```

#### sync

```shell
sync # 关机之前需要强制内存中的数据同步到磁盘
```

#### shutdown

```
# shutdown [-krhc] 时间 [信息]
-k ： 不会关机，只是发送警告信息，通知所有在线的用户
-r ： 将系统的服务停掉后就重新启动
-h ： 将系统的服务停掉后就立即关机
-c ： 取消已经在进行的 shutdown
```

### 重启

```sh
reboot
```

### PATH

环境变量，用来声明可执行文件的路径，路径之间用 : 分隔

```
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin
```

#### sudo

允许一般用户执行只有root用户才能执行的命令，只有在/etc/sudoers中配置的用户才能执行

### 包管理工具

- RPM：Redhat Package Manager，YUM基于RPM
- DPKG：基于 Debian 操作系统的 DEB 软件包管理工具

### 发行版

Linux发行版指的Linux内核及各种应用软件的集成版本

### VIM

三个模式

![批注 2020-03-03 194041](/assets/批注%202020-03-03%20194041.png)

- 一般指令模式（Command mode）：VIM 的默认模式，可以用于移动游标查看内容
- 编辑模式（Insert mode）：按下 "i" 等按键之后进入，可以对文本进行编辑
- 指令列模式（Bottom-line mode）：按下 ":" 按键之后进入，用于保存退出等操作

### GNU

GNU的目标是创建一套完全自由的操作系统，称为 GNU，其内容软件完全以 GPL 方式发布

- 以任何目的运行此程序的自由
- 再复制的自由
- 改进此程序，并公开发布改进的自由

## 磁盘

### 磁盘接口

- IDE

（ATA）全称 Advanced Technology Attachment，接口速度最大为 133MB/s，因为并口线的抗干扰性太差，且排线占用空间较大，不利电脑内部散热，已逐渐被 SATA 所取代

![202033194510](/assets/202033194510.jpg)

- SATA

全称 Serial ATA，也就是使用串口的 ATA 接口，抗干扰性强，且对数据线的长度要求比 ATA 低很多，支持热插拔等功能。SATA-II 的接口速度为 300MiB/s，而 SATA-III 标准可达到 600MiB/s 的传输速度。SATA 的数据线也比 ATA 的细得多，有利于机箱内的空气流通，整理线材也比较方便

![202033194618](/assets/202033194618.jpg)

- SCSI

全称是 Small Computer System Interface（小型机系统接口），SCSI 硬盘广为工作站以及个人电脑以及服务器所使用，因此会使用较为先进的技术，如碟片转速 15000rpm 的高转速，且传输时 CPU 占用率较低，但是单价也比相同容量的 ATA 及 SATA 硬盘更加昂贵

![202033194731](/assets/202033194731.jpg)

- SAS

Serial Attached SCSI是新一代的 SCSI 技术，和 SATA 硬盘相同，都是采取序列式技术以获得更高的传输速度，可达到 6Gb/s。此外也通过缩小连接线改善系统内部空间等

![202033194821](/assets/202033194821.jpg)

### 磁盘文件名

在Linux，硬件都被当成一个文件

- IDE 磁盘：/dev/hd[a-d]
- SATA/SCSI/SAS 磁盘：/dev/sd[a-p]

## 分区

### 分区表

- MBR

MBR 中，第一个扇区最重要，里面有主要开机记录（Master boot record, MBR）及分区表（partition table），其中主要开机记录占 446 bytes，分区表占 64 bytes

分区表只有 64 bytes，最多只能存储 4 个分区，这 4 个分区为主分区（Primary）和扩展分区（Extended）。其中扩展分区只有一个，它使用其它扇区来记录额外的分区表，因此通过扩展分区可以分出更多分区，这些分区称为逻辑分区

Linux把分区当成文件，分区文件的命名方式为：磁盘文件名 + 编号，例如 /dev/sda1。注意，逻辑分区的编号从 5 开始

- GPT

扇区是磁盘的最小存储单位，旧磁盘的扇区大小通常为 512 bytes，而最新的磁盘支持 4 k。GPT 为了兼容所有磁盘，在定义扇区上使用逻辑区块地址（Logical Block Address, LBA），LBA 默认大小为 512 bytes

### 开机检测程序

BIOS是开机的时候计算机执行的第一个程序，这个程序知道开机的磁盘，读取磁盘的第一个扇区的开机记录（MBR），通过MBR执行开机管理程序，开机管理程序加载操作系统的核心文件

MBR提供以下功能：选单、载入核心文件以及转交其它开机管理程序。转交这个功能可以用来实现多重引导，只需要将另一个操作系统的开机管理程序安装在其它分区的启动扇区上，在启动开机管理程序时，就可以通过选单选择启动当前的操作系统或者转交给其它开机管理程序从而启动另一个操作系统

## 文件系统

一个分区通常只能格式化成一个文件系统，但使用磁盘阵列技术可以将一个分区格式化为多个文件系统

### 组成

- inode：一个文件占用一个inode，记录文件的属性和此文件占用的block编号
  - 具体包含：权限、拥有者、容量、时间、文件特性等信息
  - 每个 inode 大小均固定为 128 bytes (新的 ext4 与 xfs 可设定到 256 bytes)
- block：用来存放文件内容，一个文件可以占用多个block
  - 不同block大小会限制单个文件和文件系统的最大大小
- superblock：记录文件系统的整体信息，如容量、格式
- block bitmap：一个记录block占用情况的图

![20203320634](/assets/20203320634.png)

### 文件读取

- Ext2

先根据inode查询出所有block，然后再把block里的文件内容读出来

- FAT

这种文件系统没有inode，每个block就像一个链表，存储着下一个block的编号

### 磁盘碎片

指一个文件的block过于分散，磁盘读取时磁头移动距离过大

### 目录

一个目录最少分配一个inode与一个block，block记录了目录下所有文件的inode以及文件名

### 日志

ext3/ext4 文件系统引入了日志功能，可以利用日志来修复文件系统

### 挂载

利用目录作为文件系统的进入点

### 目录配置

Filesystem Hierarchy Standard (FHS) 规定了 Linux 的目录结构：

- /：root，根目录
- /usr：unix software resource，所有系统默认软件都会安装到这个目录
- /var：variable，存放系统或者程序运行过程中的数据文件

## 文件

### 文件属性

```
drwxr-xr-x 4 my   my   4096 Mar  4 12:04 ./
```

- drwxr-xr-x：文件类型及权限，第一位为文件类型自动，后9位位文件权限自动
  - d：目录
  - -：文件
  - l：链接文件
  - 9 位的文件权限字段中，每 3 个为一组，共 3 组，每一组分别代表对文件拥有者、所属群组以及其它人的文件权限
  - rwx分布表示可读(readable),可写(writeable),可执行(executeable)
- 3：链接数
- my：文件拥有者
- my：所属群组
- 4096：文件大小
- Mar  4 12:04：最后修改时间
  - modification time (mtime)：文件的内容更新就会更新；
  - status time (ctime)：文件的状态（权限、属性）更新就会更新；
  - access time (atime)：读取文件时就会更新。

### 文件与目录的基本操作

- ls

列出文件或者目录的信息，目录的信息就是其中包含的文件

```
# ls [-aAdfFhilnrRSt] file|dir
-a ：列出全部的文件
-d ：仅列出目录本身
-l ：以长数据串行列出，包含文件的属性与权限等等数据
```

- cd

更换当前目录

```
cd [相对路径或绝对路径，如果不填默认是~]
```

- mkdir

```
# mkdir [-mp] 目录名称
-m ：配置目录权限
-p ：递归创建目录
```

- rmdir

删除空目录

```
rmdir [-p] 目录名称
-p ：递归删除目录
```

- touch

更新文件时间或者建立新文件

```
# touch [-acdmt] filename
-a ： 更新 atime
-c ： 更新 ctime，若该文件不存在则不建立新文件
-m ： 更新 mtime
-d ： 后面可以接更新日期而不使用当前日期，也可以使用 --date="日期或时间"
-t ： 后面可以接更新时间而不使用当前时间，格式为[YYYYMMDDhhmm]
```

- cp

复制文件

```
cp [-adfilprsu] source destination
-a ：相当于 -dr --preserve=all
-d ：若来源文件为链接文件，则复制链接文件属性而非文件本身
-i ：若目标文件已经存在时，在覆盖前会先询问
-p ：连同文件的属性一起复制过去
-r ：递归复制
-u ：destination 比 source 旧才更新 destination，或 destination 不存在的情况下才复制
--preserve=all ：除了 -p 的权限相关参数外，还加入 SELinux 的属性, links, xattr 等也复制了
```

- rm

删除文件

```
# rm [-fir] 文件或目录
-r ：递归删除
-i: 删除前询问
-f：强制删除
```

- mv

移动文件

```
# mv [-fiu] source destination
# mv [options] source1 source2 source3 .... directory
-f ： force 强制的意思，如果目标文件已经存在，不会询问而直接覆盖
```

### 修改权限

```
# chmod [ugoa]  [+-=] [rwx] dirname/filename
- u：拥有者
- g：所属群组
- o：其他人
- a：所有人
- +：添加权限
- -：移除权限
- =：设定权限
```

```shell
# 为所有人添加可执行权限
chmod a+x test.sh
```

### 默认权限

文件的默认权限是-rw-rw-rw- ，没有可执行权限

目录的默认权限是drwxrwxrwx

### 目录权限

文件名不是存储在一个文件的内容中，而是存储在一个文件所在的目录中。因此，拥有文件的 w 权限并不能对文件名进行修改

目录存储文件列表，一个目录的权限也就是对其文件列表的权限。因此，目录的 r 权限表示可以读取文件列表；w 权限表示可以修改文件列表，具体来说，就是添加删除文件，对文件名进行修改；x 权限可以让该目录成为工作目录，x 权限是 r 和 w 权限的基础，如果不能使一个目录成为工作目录，也就没办法读取文件列表以及对文件列表进行修改了

### 链接

```
# ln [-sf] source_filename dist_filename
-s ：默认是实体链接，加 -s 为符号链接
-f ：如果目标文件存在时，先删除目标文件
```

![批注 2020-03-05 090613](/assets/批注%202020-03-05%20090613.png)

#### 实体链接

实体链接直接链接了源文件的inode

不能跨越文件系统、不能对目录进行链接

```
ln my.link test.sh
```

#### 符号链接

符号链接指向的是文件，如果原始文件被删除，符号链接就打不开了

```
ln -s test.sh symbol.link
```

### 获取内容

- cat

取得文件内容

```
# cat [-AbEnTv] filename
-n ：打印出行号，连同空白行也会有行号，-b 不会
```

- tac

从最后一行开始打印

- more

可以一页一页查看文件内容

- less

比more多了一个向前翻页的功能

- head

取得文件的前几行

```
# head [-n number] filename
-n ：后面接数字，代表显示几行的意思
```

- tail

head的反向操作，取得后几行

- od

以字符或者十六进制的形式显示二进制文件

### 指令与文件搜索

- which

```
# which [-a] command
-a ：将所有指令列出，而不是只列第一个
```

```sh
which -a ssh
```

- whereis

文件搜索，只搜索几个特定的目录

```
# whereis [-bmsu] dirname/filename
```

- locate

可以用关键字或者正则表达式进行搜索文件

locate 使用 /var/lib/mlocate/ 这个数据库来进行搜索，它存储在内存中，并且每天更新一次，所以无法用 locate 搜索新建的文件。可以使用 updatedb 来立即更新数据库

```
# locate [-ir] keyword
-r：正则表达式
```

- find

可以使用文件的属性和权限进行搜索

```
# find [basedir] [option]
example: find . -name "shadow*"
```

与时间有关的选项：

```
-mtime  n ：列出在 n 天前的那一天修改过内容的文件
-mtime +n ：列出在 n 天之前 (不含 n 天本身) 修改过内容的文件
-mtime -n ：列出在 n 天之内 (含 n 天本身) 修改过内容的文件
-newer file ： 列出比 file 更新的文件
```

![2020359306](/assets/2020359306.png)

与文件拥有者和所属群组有关的选项：

```
-uid n
-gid n
-user name
-group name
-nouser ：搜索拥有者不存在 /etc/passwd 的文件
-nogroup：搜索所属群组不存在于 /etc/group 的文件
```

与文件权限和名称有关的选项：

```
-name filename
-size [+-]SIZE：搜寻比 SIZE 还要大 (+) 或小 (-) 的文件。这个 SIZE 的规格有：c: 代表 byte，k: 代表 1024bytes。所以，要找比 50KB 还要大的文件，就是 -size +50k
-type TYPE
-perm mode  ：搜索权限等于 mode 的文件
-perm -mode ：搜索权限包含 mode 的文件
-perm /mode ：搜索权限包含任一 mode 的文件
```

## 压缩与打包

### 压缩指令

- gzip

使用 zcat、zmore、zless 来读取压缩文件的内容

```
$ gzip [-cdtv#] filename
-c ：将压缩的数据输出到屏幕上
-d ：解压缩
-t ：检验压缩文件是否出错
-v ：显示压缩比等信息
-# ： # 为数字的意思，代表压缩等级，数字越大压缩比越高，默认为 6
```

- bzip2

使用bzcat、bzmore、bzless、bzgrep读取压缩文件的内容

```
$ bzip2 [-cdkzv#] filename
-k ：保留源文件
```

- xz

查看命令：xzcat、xzmore、xzless、xzgrep

### 打包

压缩指令只能对一个文件进行压缩，打包能够将多个文件打包成一个大文件

- tar

```
-z ：使用 zip；
-j ：使用 bzip2；
-J ：使用 xz；
-c ：新建打包文件；
-t ：查看打包文件里面有哪些文件；
-x ：解打包或解压缩的功能；
-v ：在压缩/解压缩的过程中，显示正在处理的文件名；
-f : filename：要处理的文件；
-C 目录 ： 在特定目录解压缩。
```

一些范例

使用方式|	命令
-|-
打包压缩|	tar -jcv -f filename.tar.bz2 要被压缩的文件或目录名称
查 看	|tar -jtv -f filename.tar.bz2
解压缩|	tar -jxv -f filename.tar.bz2 -C 要解压缩的目录

## Bash

通过Shell来请求内核提供服务，Bash是Shell的一种

### 特性

- 命令历史
- 命令文件补全
- 命令别名
- shell脚本
- 通配符

### 变量操作

```sh
# 变量赋值
x=abc
# 输出变量
echo $x # 输出 abc
x="环境变量 = $PATH" # 输出 环境变量 = /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin
x='x$PATH' # 单引号内不会进行变量替换 它会输出 x$PATH
version=$(uname -r) # 将指令执行结果赋值给变量
```

```
$ declare [-aixr] variable
-a ： 定义为数组类型
-i ： 定义为整数类型
-x ： 定义为环境变量
-r ： 定义为 readonly 类型
```

### 指令搜索顺序

- 以绝对或相对路径来执行指令，例如 /bin/ls 或者 ./ls ；
- 由别名找到该指令来执行；
- 由 Bash 内置的指令来执行；
- 按 $PATH 变量指定的搜索路径的顺序找到第一个指令来执行。

### 数据流重定向

重定向指的是使用文件代替标准输入、标准输出和标准错误输出

有一个箭头的表示以覆盖的方式重定向，而有两个箭头的表示以追加的方式重定向

1	|代码|	运算符
-|-|-
标准输入 (stdin)|	0|	< 或 <<
标准输出 (stdout)|	1|	> 或 >>
标准错误输出 (stderr)|	2|	2> 或 2>>

```sh
ls &> result # 将ls的所有输出都定向到result文件
```

## 管道指令

将一个命令的标准输出作为另一个命令的标准输入

```shell
ll | cat -n # 将ll的结果作为cat的输入
```

### 提取指令

- cut

```
$ cut
-d ：使用分隔符对每行进行分割
-f ：经过 -d 分隔后，使用 -f n 取出第 n 个区间
-c ：以字符为单位取出区间
```

```sh
last | cut -d ' ' -f 1 # 取出登录的用户
```

### 排序指令

- sort

```
$ sort [-fbMnrtuk] [file or stdin]
-f ：忽略大小写
-b ：忽略最前面的空格
-M ：以月份的名字来排序，例如 JAN，DEC
-n ：使用数字
-r ：反向排序
-u ：相当于 unique，重复的内容只出现一次
-t ：分隔符，默认为 tab
-k ：指定排序的区间
```

```sh
last | cut -d ' ' -f 1 | sort # 对登录用户进行排序
```

- uniq

去除重复数据

```
$ uniq [-ic]
-i ：忽略大小写
-c ：进行计数
```

```sh
last | cut -d ' ' -f 1 | sort |uniq -c # 统计用户登录次数
```

### 双向输出重定向

- tee

```sh
cat my.link  |tee result # 同时将输出输出到屏幕和result文件
```

### 字符转换指令

- tr

对字符替换

```sh
last | tr '[0-9]' '*' # 把数字替换成*
```

- col

将tab转换为空格

- expand

将 tab 转换一定数量的空格，默认是 8 个

## 正则表达式

### grep

globally search a regular expression and print，使用正则表示式进行全局查找并打印。

```
$ grep [-acinv] [--color=auto] 搜寻字符串 filename
-c ： 统计匹配到行的个数
-i ： 忽略大小写
-n ： 输出行号
-v ： 反向选择，也就是显示出没有 搜寻字符串 内容的那一行
--color=auto ：找到的关键字加颜色显示
```

```sh
last |grep 'pts/[0-9]' # 找出pts登录的
```

### printf

```sh
printf '%10s \n'  $(last |grep 'pts/[0-9]') # 格式化输出，非管道命令，需要通过$()进行数据传递
```

### awk

awk 每次处理一行，处理的最小单位是字段，每个字段的命名方式为：$n，n 为字段号，从 1 开始，$0 表示一整行

```sh
last -n 5 | awk '{print $1 "\t" $3}' # 最近5个登录的用户及ip
```

## 进程管理

### 查看进程

- ps

```sh
ps -l # 查看自己的进程
ps aux # 查看系统所有进程
```

- pstree

```sh
pstree -A # 查看所有进程树
```

- top

```sh
top -d 2 # 2秒刷新一次查看进程
```

### 进程状态

状态|	说明
-|-
R|	running or runnable (on run queue) 正在执行或者可执行，此时进程位于执行队列中。
D|	uninterruptible sleep (usually I/O) 不可中断阻塞，通常为 IO 阻塞。
S|	interruptible sleep (waiting for an event to complete) 可中断阻塞，此时进程正在等待某个事件完成。
Z|	zombie (terminated but not reaped by its parent) 僵死，进程已经终止但是尚未被其父进程获取信息。
T|	stopped (either by a job control signal or because it is being traced) 结束，进程既可以被作业控制信号结束，也可能是正在被追踪。

![批注 2020-03-05 104504](/assets/批注%202020-03-05%20104504.png)

### SIGCHLD 

子进程改变了它的状态时（停止运行，继续运行或者退出），有两件事会发生在父进程中：

- 得到 SIGCHLD 信号；
  - 子进程发送的 SIGCHLD 信号包含了子进程的信息，比如进程 ID、进程状态、进程使用 CPU 的时间等
- waitpid() 或者 wait() 调用会返回
  - 在子进程退出时，它的进程描述符不会立即释放，这是为了让父进程得到子进程信息，父进程通过 wait() 和 waitpid() 来获得一个已经退出的子进程的信息。

#### wait

父进程调用 wait() 会一直阻塞，直到收到一个子进程退出的 SIGCHLD 信号，之后 wait() 函数会销毁子进程并返回

#### waitpid

作用和 wait() 完全相同，但是多了两个可由用户控制的参数 pid 和 options。

pid 参数指示一个子进程的 ID，表示只关心这个子进程退出的 SIGCHLD 信号。如果 pid=-1 时，那么和 wait() 作用相同，都是关心所有子进程退出的 SIGCHLD 信号。

options 参数主要有 WNOHANG 和 WUNTRACED 两个选项，WNOHANG 可以使 waitpid() 调用变成非阻塞的，也就是说它会立即返回，父进程可以继续执行其它任务

### 孤儿进程

父进程退出，而它的一个或多个子进程还在运行，那么这些子进程将成为孤儿进程

孤儿进程将被 init 进程（进程号为 1）所收养，并由 init 进程对它们完成状态收集工作

### 僵尸进程

一个子进程的进程描述符在子进程退出时不会释放，只有当父进程通过 wait() 或 waitpid() 获取了子进程信息后才会释放。如果子进程退出，而父进程并没有调用 wait() 或 waitpid()，那么子进程的进程描述符仍然保存在系统中，这种进程称之为僵尸进程

如果产生大量僵尸进程，将因为没有可用的进程号而导致系统不能产生新的进程