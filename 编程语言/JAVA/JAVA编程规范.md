# JAVA编程规范

## 编码

### Integer缓存问题

>【强制】所有整型包装类对象之间值的比较，全部使用 equals 方法比较。
说明：对于 Integer var = ? 在 - 128 至 127 范围内的赋值，Integer 对象是在 IntegerCache.cache 产 生，会复用已有对象，这个区间内的 Integer 值可以直接使用 == 进行判断，但是这个区间之外的所有数据，都会在堆上产生，并不会复用已有对象，这是一个大坑，推荐使用 equals 方法进行判断

```java
Integer a = 100, b = 100, c = 150, d = 150;
System.out.println(a == b); // true
System.out.println(c == d); // false
```

直接创建包装类时，是通过`valueOf`方法来进行转换的，但是这个方法这里做了缓存，在某个区间内的同一个整数都会用同一个对象来表示

```java
if (i >= IntegerCache.low && i <= IntegerCache.high)
    return IntegerCache.cache[i + (-IntegerCache.low)];
return new Integer(i);
```

所以也就会造成上面那段代码的情况

同样，Long、Character、 Short 、Boolean都有这个问题

但是Boolean本来就取值范围就是true与false，所以这个包装类本身是使用了两个成员变量来缓存true与false

### 序列化

>【强制】当序列化类新增属性时，请不要修改 serialVersionUID 字段，以避免反序列失败；如果完全不兼容升级，避免反序列化混乱，那么请修改 serialVersionUID 值。
说明：注意 serialVersionUID 值不一致会抛出序列化运行时异常。

序列化的目的：**持久化、传输**

一些序列化方案

- 原生序列化
- Hessian 序列化
  - 跨语言的序列化方案
- Kryo 序列化
- JSON 序列化
  - json存在的一个问题是可能存在类型丢失

### 对象拷贝

>【推荐】慎用 Object 的 clone 方法来拷贝对象。
说明：对象 clone 方法默认是浅拷贝，若想实现深拷贝需覆写 clone 方法实现域对象的深度遍历式拷贝。

- java天生就对原型模式做了很好的支持，这个支持就是Object中的clone方法

 Object 的 clone 函数默认是浅拷贝

![202002171353](/assets/202002171353.jfif)

### 分层领域模型的使用

>【参考】分层领域模型规约
DO (Data Object): 此对象与数据库表结构一一对应，通过 DAO 层向上传输数据源对象。
DTO (Data Transfer Object): 数据传输对象，Service 或 Manager 向外传输的对象。
BO (Business Object): 业务对象，由 Service 层输出的封装业务逻辑的对象。
AO (Application Object): 应用对象，在 Web 层与 Service 层之间抽象的复用对象模型，极为贴 近展示层，复用度不高。
VO (View Object): 显示层对象，通常是 Web 向模板渲染引擎层传输的对象。Query: 数据查询对象，各层接收上层的查询请求。
注意超过 2 个参数的查询封装，禁止使用 Map 类来传输。

分成这么多层的一个重要原因就是要隔离变更，避免一个层的修改扩散到其他层

![202002171420](/assets/202002171420.jfif)

![202002171421](/assets/202002171421.jfif)

- 贫血模型

贫血模型是指领域对象里只有get和set方法（POJO），所有的业务逻辑都不包含在内而是放在Business Logic层

>【参考】不提倡在 DTO 中写逻辑，强制不要在 RPC 返回对象的 DTO 中封装逻辑。

```java
public class xxDTO{

// 各种属性

// 逻辑代码
 public boolean  canXXX(){ 
   // 各种判断
 }

}
```

### 属性映射

各种领域模型之间的转换是繁琐的

常用的一些工具类库：

- org.apache.commons.beanutils.BeanUtils#copyProperties
- org.springframework.beans.BeanUtils#copyProperties(java.lang.Object, java.lang.Object)
- `org.dozer.Mapper#map(java.lang.Object, java.lang.Class<T>)`
- net.sf.cglib.beans.BeanCopier#copy
- ma.glasnost.orika.MapperFacade#map(S, D)
- mapstruct

有些是通过反射的方式来进行属性复制，但这样会失去编译期检查的好处，更容易出错

### 过期处理

>接口过时必须加 @Deprecated 注解，并清晰地说明采用的新接口或者新服务是什么。
接口提供方既然明确是过时接口，那么有义务同时提供新的接口；作为调用方来说，有义务去考证过时方法的新实现是什么。

一般来说，加了@Deprecated的接口，必须在该接口的注释上加上替换的新接口并说明废弃原因，变更之后要进行单元测试

### 空指针

>【强制】Object 的 equals 方法容易抛空指针异常，应使用常量或确定有值的对象来调用 equals。

>【推荐】防止 NPE，是程序员的基本修养，注意 NPE 产生的场景:
>
>返回类型为基本数据类型，return 包装数据类型的对象时，自动拆箱有可能产生 NPE。
>反例:public int f () { return Integer 对象}， 如果为 null，自动解箱抛 NPE。
>
>数据库的查询结果可能为 null。
>
>集合里的元素即使 isNotEmpty，取出的数据元素也可能为 null。
>
>远程调用返回对象时，一律要求进行空指针判断，防止 NPE。
>
>对于 Session 中获取的数据，建议进行 NPE 检查，避免空指针。
>
>级联调用 obj.getA ().getB ().getC (); 一连串调用，易产生 NPE。

>【强制】当 switch 括号内的变量类型为 String 并且此变量为外部参数时，必须先进行 null判断

异常类结构层次

![202002181339](/assets/202002181339.jfif)

java8 switch 支持的表达式

![202002181351](/assets/202002181351.jfif)

**预防**

![202002181344](/assets/202002181344.jfif)

### 枚举

>【参考】枚举类名带上 Enum 后缀，枚举成员名称需要全大写，单词间用下划线隔开。
说明: 枚举其实就是特殊的类，域成员均为常量，且构造方法被默认强制是私有。

>【推荐】如果变量值仅在一个固定范围内变化用enum类型来定义。

>【强制】二方库里可以定义枚举类型，参数可以使用枚举类型，但是接口返回值不允许使用枚举类型或者包含枚举类型的 POJO 对象。

接口返回值不允许使用枚举类型的原因是如果类库没有及时升级，在反序列化的时候当根据序列化数据序列相应枚举的话很可能找不到相应枚举。从而抛异常

### subList与asList

>【强制】ArrayList 的 subList 结果不可强转成 ArrayList，否则会抛出 ClassCastException 异 常，即 java.util.RandomAccessSubList cannot be cast to java.util.ArrayList。

>【强制】在 SubList 场景中，高度注意对原集合元素的增加或删除，均会导致子列表的遍历、增加、删除产生 ConcurrentModificationException 异常。

>【强制】使用工具类 Arrays.asList () 把数组转换成集合时，不能使用其修改集合相关的方法，它的 add/remove/clear 方法会抛出 UnsupportedOperationException 异常。

两个类的类结构层次

![202002181428](/assets/202002181428.jfif)

ArrayList的subList方法会返回一个list视图，对这个SubList的修改都会映射到原来的list

而Arrays.asList返回的arrays包下的ArrayList，这个类并没有重写add,remove等方法，所以修改时会抛出异常

### 注释

>【强制】所有类都必须添加创建者和日期。

>【强制】所有的枚举类型字段都必须有注释，说明每个数据项的用途。

>【推荐】代码修改的同时，注释也要进行相应的修改，尤其是参数、返回值、异常、核心逻辑等修改。

>【参考】特殊标记，请注明标记人与标记时间。

**注释的目的是让读者更快理解代码的含义**

### 可变参数

>【强制】相同参数类型，相同业务含义，才可以使用 Java 的可变参数，避免使用 Object 。说明:可变参数必须放置在参数列表的最后。(提倡同学们尽量不用可变参数编程)
正例: `public List<User> listUsers(String type, Long... ids) {...}`

为什么要可变参数？

变长参数适应了不定参数个数的情况，避免了手动构造数组，提高语言的简洁性和代码的灵活性

当可变参数与方法重载出现时，就有些令人混乱，但整体方法参数匹配流程是这样的：

![202002190949](/assets/202002190949.jfif)

### 集合去重

>【参考】利用 Set 元素唯一的特性，可以快速对一个集合进行去重操作，避免使用 List 的 contains 方法进行遍历、对比、去重操作。

原因：使用list的contains进行去重，时间复杂度为O(N^2)

>【强制】关于 hashCode 和 equals 的处理，遵循如下规则:
只要覆写 equals，就必须覆写 hashCode；因为 Set 存储的是不重复的对象，依据 hashCode 和 equals 进行判断，所以 Set 存储的对象必须覆写这两个方法；
如果自定义对象作为 Map 的键，那么必须覆写 hashCode 和 equals。说明：String 已覆写 hashCode 和 equals 方法，所以我们可以愉快地使用 String 对象作为 key 来使用。

至于这条，则是因为有些数据结构比较两个元素相同时是先进行hashcode比较，然后才是equals

### 线程池

>【强制】创建线程或线程池时请指定有意义的线程名称，方便出错时回溯。

- 实现ThreadFactory接口

newThread方法中传入一个Runnable，可以在创建线程的时候指定线程名字，最后访问这个线程

>【强制】线程资源必须通过线程池提供，不允许在应用中自行显式创建线程

创建一个线程耗费的代价是很大的

>【强制】线程池不允许使用 Executors 去创建，而是通过 ThreadPoolExecutor 的方式，这 样的处理方式让写的同学更加明确线程池的运行规则，规避资源耗尽的风险。

线程池处理任务的流程：

1. 如果线程池中小于 corePoolSize 个执行的线程，则新建线程将当前任务作为第一个任务来执行
2. 如果任务成功入队，我们仍然需要 double-check 判断是否需要往线程池中新增线程（因为上次检查后可能有一个已经存在的线程挂了）或者进入这段函数时线程池关闭了
3. 如果不能入队，则创建一个新线程。如果失败，我们就知道线程池已经被关闭或已经饱和就需要调用拒绝策略来拒绝当前任务

为什么不能用Executors？

Execotors的newFixedThreadPool中创建线程池使用的阻塞队列是LinkedBlockingQueue，这个队列是无限大的（int的最大值），这样任务可能会不断入队，从而导致资源耗尽

### 退出虚拟机

- 平台相关的一些方法：kill...
- 调用System.exit方法
- 所有非守护线程运行完毕

### 条件语句

>表达分支时，如果非要使用 if ()…else if ()…else… 方式表达逻辑，避免后续代码维护困难，不允许超过三层。
>如果超过 3 层可以使用卫语句、策略模式、状态模式等来实现。
>其中卫语句代码逻辑优先考虑失败、异常、中断、退出等直接返回的情况

**卫语句**

如果某个条件极其罕见，就应该单独检查该条件，并在条件为真时立即从函数中返回。这样的单独检查常常被称为 “卫语句”。

卫语句要不就从函数中返回，要不就抛出一个异常

```java
if (condition1){
  return true;
}
if (condition2 && condition3){
  return false;
}
//...
```

## 异常

>【强制】异常不要用来做流程控制，条件控制。

>【强制】有 try 块放到了事务代码中，catch 异常后，如果需要回滚事务，一定要注意手动回滚事务。

如果由于 “吞掉” 了接口的异常，有些业务异常中包含的错误原因，无法传给上层再封装给前端，可能会造成出错后用户懵逼

实际开发中，一般都不会吞掉异常，遇到 “吞掉” 异常的场景要慎重思考是否合理

>【参考】特别注意循环的代码异常处理的对程序的影响

循环体的代码抛出异常会导致后续的所有代码都无法执行，所以要注意在循环外或者循环内进行捕捉，具体看业务场景

>【建议】要理解好受检异常和非受检异常的区别，避免误用

通常开发中自定义的业务异常（BusinessException）属于非受检异常

如果定义的受检异常，则一旦异常发生变更，则依赖该层的所有上层全都要发生变更

>【建议】努力使失败保持原子性

对参数进行检查，对不满足的条件抛出适当的异常

> 【建议】如果忽略异常，请给出理由

## 日志

>【强制】应用中不要直接使用日志系统的 API，而是应该依赖日志架构 SLF4J 中的 API，使用门面模式的日志架构，有利于维护各个类的日志处理方式统一。

>【强制】日志至少要保留 15 天，因为有些异常具备以 "周" 为频次的特点。

>【强制】避免重复打印日志，浪费磁盘空间，务必在 log4j.xml 中设置 additivity =false。

>【强制】异常信息应该包括两类信息：案发现场信息和异常堆栈信息。

### 目的

打印日志的主要目的是为了监测系统状态、方便测试、方便排查问题

### slf4j

SLF4J 的全称为： The Simple Logging Facade for Java

### 日志级别

**ERROR** 日志的使用场景是：影响到程序正常运行或影响到当前请求正常运行的异常情况。比如打开配置失败、调用二方或者三方库抛出异常等

**WARN** 日志 的使用场景是：不应该出现，但是不影响程序正常运行，不影响请求正常执行的情况。如找不到某个配置但是使用了默认配置，比如某些业务异常

**INFO** 日志的使用场景是：需要了解的普通信息，比如接口的参数和返回值，异步任务的执行时间和任务内容等

**DEBUG** 日志的使用场景是：所有调试阶段想了解的信息。比如无法进行远程 DEBUG 时，添加 DEBUG 日志在待研究的函数的某些位置打印参数和中间数据等

**TRACE** 日志 的使用场景是：非常详细的系统运行信息，比如某个中间件读取配置，启动完成等

>【推荐】在自测或提测之后上线前一定要注意 warn 级别以上的日志，特别是 error 日志

 ERROR 日志专门输出到一个 error.log 文件。调试时通过 `tail -f error.log` 随时监控出现的错误日志

### 日志打印

> 【强制】在日志输出时，字符串变量之间的拼接使用占位符的方式

因为 String 字符串拼接会使用 StringBuilder 的 append () 方式，有一定的性能损耗。使用占位符可以有效提高性能

>【强制】不要用 System.out.println 代替日志框架

该函数底层使用了 java.io.PrintStream#println(java.lang.Object) 内部使用了同步代码块，非常影响性能

>【强制】不要打印敏感信息，如果需要打印可以考虑对敏感信息脱敏处理

>【推荐】除非业务需要，尽量不要打印大文本 (含富文本)。如果要打印可以截取前 M 个字符

果同步打印大文本日志非常影响性能,很多大文本对排查问题帮助不大，打印该信息的意义不大，因此尽量避免打印该内容或只截取一部分关键信息

#### 该在哪里打印日志

>【推荐】用切面或 Filter 在 dubbo 或 Controller 层做切面来打印调用的参数、返回值和响应时间以及捕捉和打印异常日志

>【推荐】在依赖的二方或三方接口的参数、返回值和异常处打印日志

>【推荐】 在接收消息的地方打印日志

>【推荐】 在定时任务的开始和结束的地方

>【推荐】 在异步任务的开始和结束的地方

>【推荐】面向测试打印日志

### 在没有日志的情况下排查问题

- Alibaba Java 诊断利器 Arthas

启动之后可以监控某个JAVA进程的返回值、抛出的异常、入参等

### 错误的日志形式

- e.printStackTrace()
- 参数类型错误导致占位符不生效
- 打印导致的空指针异常

## 单元测试

### 单元测试与集成测试

集成测试运行通常更慢，很难编写，很难做到自动化，需要配置，通常一次测试的东西过多，并且集成测试会使用真实的依赖，而单元测试则把被测试的单元和其依赖隔离，以保证单元测试的高度稳定，还可以轻易控制和模拟被测试单元的行为方面

### 重要性

- 更早发现BUG
- 重构时有保障

### 方法

- 单元测试的传统方法

![202002201211](/assets/202002201211.jfif)

- 测试驱动开发（Test-Driven Development, TDD）

![202002201212](/assets/202002201212.jfif)

### 优秀的单元测试

- 被检验的函数或类的逻辑行为满足预期功能
-  AIR 原则
   - 自动执行
   - 保持彼此独立
   - 可以重复执行
- 编写容易，运行快速

### 构造数据

- 手动
- 半自动
  - 依赖开发工具插件或者外部数据源
- 自动
  - java-faker 和 easy-random

#### java-faker

能生成具体有意义的字符串

#### easy-random

easy-random 可以轻松构造复杂对象，支持定义对象中集合长度，字符串长度范围，生成集合等

### 对哪些代码写单测

- 数据访问层

一般要设置自动回滚。除此之外，还可以整合H2等内存数据库来对数据访问层代码进行测试

- 服务层

一般要依赖 mock 工具，将服务的所有依赖都 mock 掉

- 工具类

因为工具类一般在服务内共用，如果有 BUG，影响面很大，很容易造成线上问题或故障。一般需要构造正常和边界值两种类型的用例，对工具类进行全面的测试，才可放心使用

### 单元测试的结构

**准备阶段（Given）** 主要负责创建测试数据、构造mock 方法的返回值，准备环节的编码是单元测试最复杂的部分。需要注意的是 Mockito 库中以 when 开头的函数其实是在准备阶段

**执行阶段（When）** 一般只是调用测试的函数，此部分代码通常较短

**验证阶段（Then）** 通常验证测试函数的执行的结果、 准备阶段 mock 函数的调用次数等是否符合预期

### 命名

不要将太多描述放到测试函数命名中，应该放到函数的注释中