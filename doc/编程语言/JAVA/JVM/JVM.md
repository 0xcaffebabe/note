# JVM

- 系统虚拟机
- 软件虚拟机

![批注 2020-07-10 083948](/assets/批注%202020-07-10%20083948.png)

JVM是一种规范

JDK14:<https://docs.oracle.com/javase/specs/jvms/se14/jvms14.pdf>

## 常见JVM实现

- Hotspot
- Jrockit
- J9

越过操作系统的虚拟机：

- LiquidVM
- azul zing

其他：

- Apache Harmony
- Android Dalvik
- Microsoft JVM

### 未来的趋势

- GraalVM：将这些语言的源代码（例如JavaScript）或源代码编译后的中间格式（例如LLVM字节码）通过解释器转换为能被Graal VM接受的中间表示
- Graal编译器：新一代即时编译器
- Native化：提前编译
- 功能越来越多：监控 调试
- 语法特性持续增强

## JDK JRE JVM

![批注 2020-07-10 090055](/assets/批注%202020-07-10%20090055.png)

## JVM 体系结构

![202010510539](/assets/202010510539.png)

- 类加载器
- 内存区
- 执行引擎

基于栈的架构：

- 平台无关 不同的平台寄存器各不相同
- 基于栈的寄存器指令更加紧凑

执行引擎的架构：

![屏幕截图 2020-10-05 103533](/assets/屏幕截图%202020-10-05%20103533.png)

执行引擎的执行过程：

![屏幕截图 2020-10-05 105134](/assets/屏幕截图%202020-10-05%20105134.png)

方法调用：

执行方法调用指令时 会创建一个新栈帧 这个栈帧会存储传递过来的参数

## 编译JDK

- 安装依赖库

```sh
apt install libfreetype6-dev
apt install libcups2-dev
apt install libx11-dev libxext-dev libxrender-dev libxrandr-dev libxtst-dev libxt-dev
apt install libasound2-dev
apt install libffi-dev
apt install autoconf
```

- 准备一个目标JDK-1的bootstrap jdk

```sh
sudo apt-get install openjdk-11-jdk
```

- 编译前配置与检查

```sh
bash configure --enable-debug --with-jvm-variants=server
```

- 开始编译

```sh
make images
```
