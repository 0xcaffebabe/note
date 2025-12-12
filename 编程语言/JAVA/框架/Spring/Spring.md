# Spring核心原理

## 1. 依赖注入（DI）原理

### 1.1 依赖注入的核心概念

依赖注入（Dependency Injection，DI）是一种重要的设计模式，实现了控制反转（Inversion of Control，IoC）原则。它将对象的创建和对象间的依赖关系管理交给外部容器来完成，而不是由对象自己创建或查找其依赖项。

在传统的编程模式中，一个对象需要使用另一个对象时，通常会直接在代码中创建被依赖对象的实例，或者通过工厂方法获取其实例。这种模式导致了代码模块之间的强耦合。

依赖注入则将这种控制权反转，被依赖对象的实例不再由使用方直接创建，而是由外部容器在运行时动态注入。这种方式实现了对象之间的解耦，使得系统更易于维护和扩展。

### 1.2 控制反转（IoC）原则

控制反转是依赖注入的核心思想，即将对象创建和管理的控制权从代码内部转移到外部容器。在没有IoC的情况下，对象控制自己依赖的创建；在IoC模式下，对象被动接收其依赖项。

### 1.3 依赖注入的实现原理

依赖注入通过以下机制实现：

1. **解耦合机制**：将依赖关系从硬编码转移到配置，通过抽象（接口或抽象类）定义依赖关系，容器负责解析依赖关系并注入适当的实例。

2. **依赖查找与依赖注入**：
   - 依赖查找：容器创建对象，对象通过容器查找其依赖
   - 依赖注入：容器创建对象并主动将依赖注入到对象中

3. **注入方式**：依赖注入通常有以下几种实现方式：
   - 构造器注入：通过对象的构造函数注入依赖
   - 属性注入（Setter注入）：通过对象的setter方法注入依赖
   - 字段注入：通过注解直接注入到对象字段
   - 接口注入：通过特定接口方法注入依赖

### 1.4 Spring框架中的依赖注入实践

Spring框架是依赖注入模式的典型实现，在其IoC容器中提供了完整的依赖注入机制。

#### 1.4.1 Spring中依赖注入的配置方式

Spring提供了多种配置依赖注入的方式：

**注解配置**：Spring通过`@Autowired`注解实现自动依赖注入：
```java
@Component
public class Cup {
    private Tea tea;

    @Autowired
    public Cup(Tea tea) {
        this.tea = tea;
    }
}
```

Spring还提供了其他相关注解：
- `@Resource`：JSR-250标准注解
- `@Inject`：JSR-330标准注解
- `@Qualifier`：解决自动装配歧义性问题

**Java代码配置**：
```java
@Configuration
public class Config {
    @Bean 
    public Cup cup(Tea tea) {
        return new Cup(tea);
    }
    
    @Bean
    public Tea tea() {
        return new Tea();
    }
}
```

**XML配置**：
```xml
<bean name="tea" class="wang.ismy.spring.Tea"/>
<bean name="cup" class="wang.ismy.spring.Cup">
    <constructor-arg ref="tea"/>
</bean>
```

#### 1.4.2 Spring的自动装配机制

Spring的自动装配机制（Autowiring）是其依赖注入实现的重要特性：

**组件扫描**：Spring通过`@ComponentScan`注解实现组件自动扫描和注册：
```java
@ComponentScan(basePackages = "wang.ismy.spring")
public class Config {}
```

通过`@Component`、`@Service`、`@Controller`、`@Repository`等注解将组件标记为Spring管理的Bean。

**解决歧义性**：当存在多个相同类型的Bean时，Spring提供了解决歧义性的机制：
- `@Primary`：指定首选Bean
- `@Qualifier`：通过名称限定特定Bean
- 自定义注解：结合`@Qualifier`创建语义化注解

#### 1.4.3 Spring的依赖注入生命周期

Spring框架详细定义了Bean的生命周期，其中依赖注入是关键环节：

1. 实例化：根据配置信息创建Bean实例
2. 属性填充：设置属性值和依赖注入
3. 初始化：调用初始化方法（如`@PostConstruct`、`InitializingBean.afterPropertiesSet()`）
4. 使用：Bean可以被使用
5. 销毁：Bean销毁时调用销毁方法（如`@PreDestroy`、`DisposableBean.destroy()`）

#### 1.4.4 Spring的扩展机制

Spring提供了多个扩展点来增强依赖注入功能：

**BeanPostProcessor**：允许在Bean初始化前后进行自定义处理：
```java
@Component
public class MyBeanPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        // 初始化前处理
        return bean;
    }
    
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        // 初始化后处理
        return bean;
    }
}
```

#### 1.4.5 Spring循环依赖的解决

当一个对象依赖的对象间接或直接又依赖其本身时，就是循环依赖。

针对于这种依赖情况，对于属性注入或者方法注入，Spring通过先创建对象实例，后填充其属性的方式来解决循环依赖，但对于通过构造器注入的情况，Spring则无法解决。

![202153193741](/assets/202153193741.svg)

![202153193815](/assets/202153193815.svg)

### 1.5 依赖注入的优势与挑战

#### 1.5.1 优势

1. **解耦合**：降低模块间的耦合度，便于模块独立开发和测试
2. **可测试性**：便于使用Mock对象进行单元测试
3. **可维护性**：依赖关系通过配置管理，修改更加灵活
4. **复用性**：组件不依赖具体实现，可以灵活替换

#### 1.5.2 挑战

1. **复杂性**：配置文件或注解可能变得复杂
2. **性能**：容器初始化和依赖解析可能带来性能开销
3. **学习曲线**：需要理解和掌握容器的工作原理

## 2. AOP（面向切面编程）原理

### 2.1 AOP 核心概念

AOP（Aspect-Oriented Programming，面向切面编程）是一种编程范式，它旨在将横切关注点（如日志记录、安全检查、事务管理等）与业务逻辑分离。AOP通过在程序执行过程中动态地将这些横切关注点织入到目标对象中，实现对核心业务逻辑的增强，而无需修改原有代码。

AOP的核心概念包括：
- **通知（Advice）**：定义了在特定连接点执行的代码，包括前置通知、后置通知、返回通知、异常通知和环绕通知。
- **连接点（Joinpoint）**：程序执行过程中能够插入切面的特定点，如方法调用或异常抛出。
- **切点（Pointcut）**：定义了哪些连接点会被通知的表达式，用于匹配连接点。
- **切面（Aspect）**：通知和切点的结合，定义了何时、何地、如何进行增强。
- **引入（Introduction）**：为现有类添加新方法或字段。
- **织入（Weaving）**：将切面应用到目标对象的过程，可以在编译时、类加载时或运行时进行。

### 2.2 AOP 实现原理

AOP的实现原理基于动态代理技术，主要有两种方式：
1. **JDK动态代理**：基于接口实现类的代理，使用`java.lang.reflect.Proxy`创建代理对象。
2. **CGLIB动态代理**：基于类继承的代理，使用字节码生成库创建目标类的子类。

在Spring框架中，AOP通过以下机制实现：
- `AbstractAutoProxyCreator`：实现了`BeanPostProcessor`接口，在Bean初始化后通过动态代理方式创建代理对象。
- `AopProxy`：Spring的代理创建接口，包含JDK动态代理和CGLIB动态代理两种实现。

### 2.3 通知类型详解

AOP提供了多种类型的通知：
- **前置通知（Before Advice）**：在连接点之前执行，但无法阻止连接点的执行。
- **后置通知（After Advice）**：在连接点执行后执行，无论连接点是否成功执行。
- **返回通知（After Returning Advice）**：在连接点成功执行后执行。
- **异常通知（After Throwing Advice）**：在连接点抛出异常时执行。
- **环绕通知（Around Advice）**：包围连接点，在连接点前后都可以执行，并可以控制是否继续执行连接点。

### 2.4 切点表达式

切点表达式定义了哪些连接点会被拦截，通常使用AspectJ的切点表达式语言：
- `execution()`：用于匹配方法执行连接点。
- `within()`：限定匹配特定类型内的连接点。
- `this()`和`target()`：匹配AOP代理对象或目标对象为指定类型的连接点。
- `@annotation()`：匹配带有指定注解的连接点。

## 3. 事务管理原理

### 3.1 [事务核心特性（ACID）](/中间件/数据库/数据库系统/事务管理/事务.md#ACID)

### 3.2 事务隔离级别

事务的隔离级别定义了事务之间的隔离程度，从低到高分为：
- **未提交读（Read Uncommitted）**：一个事务可以读取另一个事务未提交的数据，可能产生脏读、不可重复读和幻读。
- **提交读（Read Committed）**：一个事务只能读取另一个事务已提交的数据，可以防止脏读，但可能出现不可重复读和幻读。
- **可重复读（Repeatable Read）**：在同一个事务内，多次读取同一数据的结果是一致的，可以防止脏读和不可重复读，但可能出现幻读（MySQL的InnoDB引擎通过MVCC和间隙锁防止了幻读）。
- **串行化（Serializable）**：最高的隔离级别，所有事务依次执行，完全避免了并发问题，但性能最低。

### 3.3 事务传播行为

事务的传播行为定义了多个事务方法之间如何共享事务上下文：
- **PROPAGATION_REQUIRED**：必须运行在事务中，如果没有事务则创建新事务（默认行为）。
- **PROPAGATION_SUPPORTS**：支持当前事务，如果没有则非事务执行。
- **PROPAGATION_MANDATORY**：必须运行在事务中，如果没有则抛出异常。
- **PROPAGATION_REQUIRES_NEW**：创建新事务，挂起当前事务。
- **PROPAGATION_NOT_SUPPORTED**：不支持事务，挂起当前事务。
- **PROPAGATION_NEVER**：不支持事务，如果有事务则抛出异常。
- **PROPAGATION_NESTED**：嵌套事务，使用保存点机制。

### 3.4 事务实现方式

事务的实现方式包括：
1. **编程式事务**：通过编程方式管理事务，如使用`TransactionTemplate`。
2. **声明式事务**：通过配置或注解方式管理事务，无需编写事务管理代码。

## 4. Spring 核心组件的实现机制

### 4.1 Spring AOP 实现机制

Spring框架通过以下组件实现AOP：
- `AbstractAutoProxyCreator`：实现了`BeanPostProcessor`接口，在Bean实例化后，通过动态代理的方式为Bean创建代理对象。
- `AopProxy`：Spring中的代理创建接口，目前有两种实现方式：
  1. JDK动态代理：如果Bean实现了接口，会使用这种方式，性能较好。
  2. CGLIB动态代理：如果Bean没有实现接口，会使用这种方式。

Spring支持多种配置方式来定义切面：
- 注解配置：使用`@Aspect`、`@Pointcut`、`@Before`、`@After`等注解。
- XML配置：通过`<aop:config>`、`<aop:aspect>`等标签配置。
- 编程方式：通过实现Spring的AOP接口进行编程配置。

### 4.2 Spring 事务实现机制

Spring事务管理的核心机制包括：
- `PlatformTransactionManager`：Spring事务管理的顶级接口。
- `TransactionAspectSupport`：事务切面的核心支持类，处理事务的开启、提交和回滚。
- `TransactionSynchronizationManager`：管理事务同步状态。

声明式事务的实现原理：
1. 通过`@EnableTransactionManagement`启用事务管理。
2. Spring通过AOP自动为标注`@Transactional`的方法创建代理对象。
3. 在方法执行前开启事务，执行目标方法，根据执行结果决定提交或回滚事务。
4. 在`TransactionAspectSupport.invokeWithinTransaction`方法中根据传播行为决定如何处理事务。

编程式事务通过`TransactionTemplate`实现，提供了一种更简洁的事务管理方式。

### 4.3 事务属性

事务可以通过多种属性进行配置：
- **read-only**：指定事务是否为只读，默认为false。
- **isolation**：指定事务的隔离级别，默认使用数据库的默认隔离级别。
- **propagation**：指定事务的传播行为。
- **timeout**：指定事务超时时间，默认为-1（永不超时）。
- **rollback-for**：指定异常时回滚的异常类型。
- **no-rollback-for**：指定异常时不回滚的异常类型。

## 5. 三大核心概念的关系与整合

Spring框架的三大核心概念——依赖注入（DI）、面向切面编程（AOP）和事务管理——彼此之间有着紧密的联系：

1. **DI 与 AOP**：DI容器负责创建对象及其依赖关系，AOP通过动态代理在DI容器创建对象后对其进行增强，即AOP建立在DI的基础之上。

2. **DI 与 事务管理**：事务管理本身作为一项功能也通过DI容器进行配置和管理，事务管理器作为Bean被注入到需要的地方。

3. **AOP 与 事务管理**：Spring的声明式事务管理是通过AOP实现的，通过在方法执行前后添加事务控制代码，而不需要修改业务逻辑代码。

## 6. 最佳实践

### 6.1 依赖注入最佳实践

1. **使用构造器注入**：确保对象创建时所有必需的依赖都已提供
2. **依赖于抽象而非实现**：使用接口或抽象类作为依赖
3. **合理使用注解**：在配置简便性和清晰性之间找到平衡

### 6.2 AOP 最佳实践

1. **合理定义切面**：避免过度使用AOP，仅对横切关注点使用切面。
2. **切点表达式优化**：使用精确的切点表达式，避免不必要的性能开销。
3. **性能考虑**：注意AOP对性能的影响，特别是对高频调用方法的拦截。

### 6.3 事务最佳实践

1. **合理选择传播行为**：根据业务需求选择合适的事务传播行为。
2. **避免事务失效**：注意内部方法调用不会触发事务（因为AOP代理机制）。
3. **异常处理**：正确配置回滚异常类型，确保在必要时能够正确回滚。
4. **隔离级别选择**：根据业务需求选择合适的事务隔离级别，在一致性和性能之间找到平衡。
