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
5	| 配置文件
8	| 系统管理员可以使用的管理指令

#### info

作用同man

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

### 目录配置

Filesystem Hierarchy Standard (FHS) 规定了 Linux 的目录结构：

- /：root，根目录
- /usr：unix software resource，所有系统默认软件都会安装到这个目录
- /var：variable，存放系统或者程序运行过程中的数据文件