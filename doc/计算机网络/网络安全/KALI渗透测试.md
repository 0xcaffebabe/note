# KALI渗透测试

## 渗透测试种类

- 白盒测试
- 黑盒测试

## 方法论

渗透测试方法论有许多，著名的有OWASP(开放式web应用安全项目)

- ISSAF(信息系统安全评估框架)

### OSSTMM(开源安全测试方法论)

- 盲测
- 双盲测
- 灰盒测试
- 双灰盒测试
- 串联测试
- 逆向测试

## 信息收集

- 域名注册信息

```shell
# 并不止局限于使用命令行whois程序
whois -h whois.crsnic.net "domain google.com"
```

## DNS记录分析

![](https://wangbinyq.github.io/images/dns/dns%20record.png)

- 查询dns地址

```shell
host -a ismy.wang
```
- 使用dig达到同样的效果

```shell
dig ismy.wang any
```

### 路由信息

```shell
traceroute ismy.wang
tcptraceroute ismy.wang
```

### 搜索引擎

- 善用搜索引擎搜索相关主机的邮箱或者用户名

## 目标识别

## 主机识别

- ping


- arping

```shell
arping 192.168.43.1 # 局域网主机识别
```

- fping

```shell
fping -g 192.168.43.0/24 # 扫描局域网主机
```

- hping3
- nping
- nbtscan

### 操作系统识别

- 被动式识别
  - p0f
- 主动式
  - nmap

## 服务枚举

### nmap

- 扫描目标指定
  - 普通点分十进制(192.168.1.1)
  - CIDR标记法(192.168.1.0/24)
  - 十进制ip区间(192.168.1.1-255)
  - 多个ip(ip1,ip2)

- 扫描方式
  - sT：会进行三次握手
  - sS:只会进行一次握手
  - sN,sF,sX:通过判断目标有无回应确定端口状态
  - sM:同上
  - sA:判断是否有防火墙过滤
  - sW:窗口扫描
  - sI:通过僵尸网络

- 端口选项
  - p:端口范围
  - F:快速扫描
  - r:顺序扫描

- 时间选项
  - T:指定扫描模式

- 服务版本识别

```shell
nmap -sV 192.168.43.0/24
```

- 强力选项A
  - 会开启服务版本识别，操作系统识别，脚本扫描，路由追踪

### nbtscan

可以扫描主机netbios信息

>NetBIOS，为网上基本输入输出系统（英语：Network Basic Input/Output System）的缩写，它提供了OSI模型中的会话层服务，让在不同计算机上运行的不同程序，可以在局域网中，互相连线，以及分享数据。严格来说，NetBIOS不是一种网上协议，而是应用程序接口（API

```shell
nbtscan 192.168.43.1-254
```

### snmap枚举

- onesixtyone
- snmpcheck

### VPN枚举

## 漏洞映射

- 本地漏洞
- 远程漏洞

### 漏洞分类

- 设计类
- 实施类
- 运营类

### 工具

- OpenVAS
  - OpenVAS是功能齐全的漏洞扫描程序
- Cisco分析工具

### 模糊分析工具

- 通过发送有问题的数据来检测问题

### SNMP分析

### SMB分析

### web程序分析

## 社会工程

- 冒名顶替
- 利益交换

### 工具

- SET

## 漏洞利用

### exploit资料库

- 发布了部分已知漏洞的利用方法

### 工具 metasploit

- exploit 漏洞利用模板
- payload 包含恶意程序的有效载荷
- shell
  - bind shell
  - reverse shell
  - meterpreter

## 权限提升

- 横向提权
- 纵向提权

### 本地漏洞利用

### 密码攻击

#### 离线攻击工具

- hash-identifier
- Hashcat
- RainbowCrack
- samdump2
- john
- Ophcrack
- Crunch

#### 在线破解工具

- CeWL
- Hydra
- Medusa

### 网络欺骗工具

- DNSChef
  - 可以伪造假DNS应答地址
- arpspoof
- Ettercap
  - 截取会话与密码

### 网络嗅探器

- Dsniff
  - 密码捕获
- tcpdump
- Wireshark
- 

## 访问维护

### 操作系统后门

- Cymothoa
- Intersect
- Meterpreter后门

### 隧道工具

- dns2tcp
- iodine
- ncat
- proxychains
- ptunnel
- socat
- sslh
- stunnel4

### web后门

- WeBaCoo
  - 通信采用了cookie
- weevely
- php meterpreter
