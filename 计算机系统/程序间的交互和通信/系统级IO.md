# UNIX IO

- 打开文件
- 改变当前文件位置
- 读写文件
- 关闭文件

# 文件

- 普通文件
- 目录
- 套接字

## 路径名

- 绝对
- 相对

# 打开和关闭文件

```c
int open(char *filename,int flags,mode_t mode);
int close(int fd);
```

# 读写文件

```c
ssize_t read(int fd,void *buf,size_t n);

ssize_t write(int fd,const void *buf,size_t n);
```

# RIO包

- 无缓冲的输入输出函数
- 带缓冲的输入函数

# 读取文件元数据

```c
int stat(const char *filename,struct stat *buf);
int fstat(int fd,struct stat *buf);
```

# 读取目录内容

```c
DIR *opendir(const char *name);
struct dirent*readdir(DIR *dirp);
```

# 共享文件

![](https://upload-images.jianshu.io/upload_images/7380023-7ccfa65788df8862.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/611/format/webp)

![](https://upload-images.jianshu.io/upload_images/7380023-e55086007ac99201.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/535/format/webp)

# IO重定向

```c
int dup2(int ofd,int nfd);
```

![](https://images.cnblogs.com/cnblogs_com/mydomain/201107/201107032229433652.png)

## NIO

![批注 2020-06-18 143426](/assets/批注%202020-06-18%20143426.png)

![批注 2020-06-18 143440](/assets/批注%202020-06-18%20143440.png)

![批注 2020-06-18 143959](/assets/批注%202020-06-18%20143959.png)

![批注 2020-06-18 144854](/assets/批注%202020-06-18%20144854.png)