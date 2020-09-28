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

![屏幕截图 2020-09-28 143547](/assets/屏幕截图%202020-09-28%20143547.png)

异步与非阻塞虽然能能提高IO性能 但是线程数量的增加会增加CPU的消耗 并且会导致设计复杂度的上升

## UNIX IO

- 打开文件
- 改变当前文件位置
- 读写文件
- 关闭文件

## 文件

- 普通文件
- 目录
- 套接字

### 路径名

- 绝对
- 相对

## 打开和关闭文件

```c
int open(char *filename,int flags,mode_t mode);
int close(int fd);
```

## 读写文件

```c
ssize_t read(int fd,void *buf,size_t n);

ssize_t write(int fd,const void *buf,size_t n);
```

## RIO包

- 无缓冲的输入输出函数
- 带缓冲的输入函数

## 读取文件元数据

```c
int stat(const char *filename,struct stat *buf);
int fstat(int fd,struct stat *buf);
```

## 读取目录内容

```c
DIR *opendir(const char *name);
struct dirent*readdir(DIR *dirp);
```

## 共享文件

![](https://upload-images.jianshu.io/upload_images/7380023-7ccfa65788df8862.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/611/format/webp)

![](https://upload-images.jianshu.io/upload_images/7380023-e55086007ac99201.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/535/format/webp)

## IO重定向

```c
int dup2(int ofd,int nfd);
```

![](https://images.cnblogs.com/cnblogs_com/mydomain/201107/201107032229433652.png)

## IO调优

### 磁盘IO

- 缓存
- 优化磁盘管理系统
- RAID

### TCP网络

![屏幕截图 2020-09-28 142915](/assets/屏幕截图%202020-09-28%20142915.png)
![屏幕截图 2020-09-28 142926](/assets/屏幕截图%202020-09-28%20142926.png)

### 网络IO

- 减少网络交互的次数
- 减少网络传输数据量的大小
- 减少编码转换