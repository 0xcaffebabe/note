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

### 列化

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