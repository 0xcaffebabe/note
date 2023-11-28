# 系统级 IO

## 磁盘IO工作机制

### 标准IO

![屏幕截图 2020-09-28 131213](/assets/屏幕截图%202020-09-28%20131213.png)

数据写入高速页缓存 应用就认为写入已经完成 此时操作系统再异步写入磁盘或者调用sync强制写入

### 直接IO

![屏幕截图 2020-09-28 131400](/assets/屏幕截图%202020-09-28%20131400.png)

DBMS就采用的此种方式读写数据

这种方式如果访问的数据不在应用缓存中 则每次都需要访问磁盘

### 同步IO

只有当数据被成功写入磁盘方法才会返回 一般用在对数据安全性较高的场景

### 异步IO

读数据写数据不会阻塞 读数据调用之后会马上返回 应用需要通过轮询等方式来询问数据是否就绪以获取

### 内存映射IO

![屏幕截图 2020-09-28 132039](/assets/屏幕截图%202020-09-28%20132039.png)

将内存中的一块区域与磁盘中的文件关联起来 将应用对内存的访问映射为对磁盘的访问

## 同步异步 阻塞非阻塞

组合方式|性能分析
-|-
同步阻塞|最常用的一种用法，使用也是最简单的，但是IO性能一般很差，CPU大部分处于空闲状态
同步非阻塞|提升IO性能的常用手段，就是将IO的阻塞改成非阻塞方式，尤其在网络IO是长连接同时传输数据也不是很多的情况下，提升性能非常有效。这种方式通常能提升/O性能，但是会增加CPU消耗，要考虑增加的IO性能能不能补偿CPU的消耗，也就是系统的瓶颈是在IO上还是在CPU上
异步阻塞|这种方式在分布式数据库中经常用到，例如，在一个分布式数据库中写一条记录，通常会有一份是同步阻塞的记录，还有2~3份备份记录会写到其他机器上，这些备份记录通常都采用异步阻塞的方式写I/O。异步阻塞对网络O能够提升效率，尤其像上面这种同时写多份相同数据的情况
异步非阻塞|这种组合方式用起来比较复杂，只有在一些非常复杂的分布式情况下使用，集群之间的消息同步机制一般用这种IO组合方式。如Cassandra的Gossip通信机制就采用异步非阻塞的方式它适合同时要传多份相同的数据到集群中不同的机器，同时数据的传输量虽然不大却非常频繁的情况。这种网络IO用这种方式性能能达到最高

异步与非阻塞虽然能能提高IO性能 但是线程数量的增加会增加CPU的消耗 并且会导致设计复杂度的上升

## UNIX IO

通过将设备映射为一个文件来操作设备

- 打开文件 内核返回一个非负整数 叫做描述符
  - shell创建的进程都有三个文件 0 1 2 分别是标准输入 标注输出 错误输出
- 改变当前文件位置 应用程序可以显式通过seek设置当前文件偏移量
- 读写文件 读文件时 程序读到一个EOF 代表文件已经读完
- 关闭文件 应用完成对文件的访问 通知内核关闭这个文件 描述符会被回收

文件类型：

- 普通文件
- 目录
- 套接字

### 打开和关闭

```c
int open(char *filename,int flags,mode_t mode);
int close(int fd);

int fd;
fd = open("foo.txt", O_RDONLY, 0);
close(fd);
/*
O_RDONLY 只读
O_WRONLY 只写
O_RDWR 可读可写

第二个参数还可以配合：

| O_CREAT 如果文件不存在 那就创建空文件
| O_TRUNC 如果文件存在 那就清空这个文件
| APPEND 写操作以追加的方式

第三个参数代表了新文件的访问权限
*/
```

## 读写文件

```c
ssize_t read(int fd,void *buf,size_t n);
// 最多复制buf的n个字节到fd 返回-1代表出错 返回0代表eof
ssize_t write(int fd,const void *buf,size_t n);
// 最多复制buf的n个字节到fd

// 在 x86-64 size_t 为unsigned long
// ssize_t 为 long
```

## RIO包

自动处理 EOF 终端读取文本行 socket读取等

- 无缓冲的输入输出函数 直接将内存与文件之间传送数据 没有应用缓存

```c
ssize_t rio_readn(int fd, void *usrbuf, size_t n);
ssize_t rio_writen(int fd, void *usrbuf, size_t n);
```

- 带缓冲的输入函数 拥有应用级缓存

```c
void rio_readinitb(rio_t *rp, int fd); 
ssize_t	rio_readnb(rio_t *rp, void *usrbuf, size_t n);
ssize_t	rio_readlineb(rio_t *rp, void *usrbuf, size_t maxlen);
```

```c
#include "csapp.h"
#include "csapp.c"

// 读取标准输入写到标准输出
void main(){
  int n;
  rio_t rio;
  char buf[100];

  Rio_readinitb(&rio, STDIN_FILENO);
  while((n = Rio_readlineb(&rio, buf, 100)) != 0){
    Rio_writen(STDOUT_FILENO, buf, n);
  }
}
```

rio_read 是核心函数 语义同Linux read函数

## 读取文件元数据

```c
int Stat(const char *filename,struct stat *buf);
int fstat(int fd,struct stat *buf);
```

```c
struct stat stat;
char *fileName = "foo.txt";
Stat(fileName, &stat);
if (S_ISREG(stat.st_mode)) printf("普通文件");
if (S_ISDIR(stat.st_mode)) printf("目录");

if (stat.st_mode & S_IRUSR) printf("可以访问");
else printf("无法访问");
```

## 读取目录内容

```c
DIR *opendir(const char *name);
struct dirent*readdir(DIR *dirp);
```

```c
#include <sys/types.h>
#include <dirent.h>
#include <stdio.h>
#include <errno.h>
#include <stdlib.h>
#include <csapp.h>
#include <csapp.c>

int main(){
    DIR *streamp;
    struct dirent *dep;

    //调用函数返回DIR* 指针
    streamp = opendir("./");

    //设置错误号为0
    errno = 0;

    //不断调用readdir函数, 然后打印结构中的文件名和inode, inode是long类型
    while ((dep = readdir(streamp)) != NULL) {
        printf("Found file: %s, INODE is %ld\n", dep->d_name, dep->d_ino);
    }
    //循环结束后检查错误号
    if (errno != 0) {
        printf("readdir error");
    }

    closedir(streamp);
    exit(0);
}
```

## 共享文件

![](/assets/20233917726.png)

![](/assets/20233917840.png)

## IO重定向

```c
int dup2(int ofd,int nfd);
```

![](/assets/20233917924.png)

## C语言标准IO

标准IO库将一个打开的文件看做一个流 某种意义上这个流式全双工的

你可以在这个流上读写 所以在进行读或写后 必须执行一些操作 切换流的模式 才能进行另外一种操作 所以socket编程不适合用标准IO库 而是使用RIO

- 如果有可能 就使用标准IO
- 不要使用scanf readline等读二进制文件

## IO调优

### 磁盘IO

- 缓存
- 优化磁盘管理系统
- RAID

### [TCP网络优化](/计算机网络/运输层.md#Linux%20内核%20TCP%20相关参数)

### 网络IO

- 减少网络交互的次数
- 减少网络传输数据量的大小
- 减少编码转换

