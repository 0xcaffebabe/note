# C语言

C 语言是一种通用的、面向过程式的计算机程序设计语言。1972 年，为了移植与开发 UNIX 操作系统，丹尼斯·里奇在贝尔电话实验室设计开发了 C 语言。

C 语言是一种广泛使用的计算机语言，它与 Java 编程语言一样普及，二者在现代软件程序员之间都得到广泛使用。

当前最新的C语言标准为 C11 ，在它之前的C语言标准为 C99

## 类型运算符与表达式

### 变量

> 变量名的开头必须是字母或下划线，不能是数字

> 变量名中的字母是区分大小写的

> 变量名绝对不可以是C语言关键字

> 变量名中不能有空格

C语法形式|数据存放位置|说明
-|-|-
int x=10;static int y =10;|.data|初始化的全局变量或静态变量
void foo(){int x=10;}|寄存器、栈|局部变量
register int x =10;|寄存器、栈|被register关键字修饰的变量
calloc(256);|堆|申请的堆内存
int x =0;static int y;|.bss|初始值为0的全局或静态变量
foo("Hello,Geektime!");|.rodata|内联的长字符串
foo(100);|.text|内联的数字值

### 数据类型及长度

类型             | 存储大小  | 值范围
-------------- | ----- | -------------------------------------------
char           | 1字节   | -128到127或0到255
unsigned char  | 1字节   | 0到255
signed char    | 1字节   | -128到127
int            | 2或4字节 | -32,768到32,767或-2,147,483,648到2,147,483,647，取决于平台架构
unsigned int   | 2或4字节 | 0到65,535或0到4,294,967,295
short          | 2字节   | -32,768到32,767
unsigned short | 2字节   | 0到65,535
long           | 4字节   | -2,147 ,483,648到2,147,483,647
unsigned long  | 4字节   | 0到4,294,967,295

在 C 语言中，整型变量本身还需区分它们的“符号性（signedness）”，符号性上的区别有利于程序对某些特定的场景需求进行优化

### 常量

1. 字符常量：用单引号括起来的单个字符，是一种整型常量
2. 常量表达式：在编译时就能被完全计算的表达式，包括基本的算术表达式、逻辑表达式等
3. 枚举常量

使用 const 关键字修饰的变量定义语句，无法在后续的程序中修改其对应或指针指向的值。因此，我们更倾向于称它们为只读变量

在 C 语言中，像是数组长度定义、switch，都只能使用常量表达式，而不能使用只读变量

### 声明

### 算术运算符

名称          | 运算符号 | 举例
----------- | ---- | ------------
加法运算符       | +    | 2+10=12
减法运算符       | -    | 10-3=7
乘法运算符       | *    | 2*10=20
除法运算符       | /    | 30/10=3
求余运算符(模运算符) | %    | 23%7=2
自增运算符       | ++   | int a =1;a++
自减运算符       | --   | int a =1;a--

### 关系运算符与逻辑运算符

符号   | 意义   | 举例     | 结果
---- | ---- | ------ | --
`>`  | 大于   | 10>5   | 1
`>=` | 大于等于 | 10>=10 | 1
`<`  | 小于   | 10<5   | 0
`<=` | 小于等于 | 10<=10 | 1
==   | 等于   | 10==5  | 0
!=   | 不等于  | 10!=5  | 1

符号 | 意义  | 举例   | 结果
-- | --- | ---- | ---
&& | 逻辑与 | 0&&1 | 0
`  || `    | 逻辑或 | 0` || `1 | 1
!  | 逻辑非 | !0   | 1

#### 类型转换

- 自动转换
- 强制转换

## 函数与程序结构

### 函数的基本知识

- 函数的定义形式

```c
返回值类型 函数名（参数声明表）{
    声明和语句
}
```

### 函数调用

当一个函数被调用时，传递给它的实际参数应该按照怎样的顺序进行求值，这在 C 标准中并没有被明确规定,当运行使用不同编译器编译得到的二进制可执行文件时，可能会得到不同的计算结果

```c
int n = 1; 
printf("%d %d %d", n++, n++, n++);
```

### 外部变量

### 作用域规则

### 头文件

### 静态变量

```c
static int a;
```

### 寄存器变量

```c
register int x;
```

register变量将放在机器的寄存器中

### 程序块结构

### 初始化

外部变量和静态变量都将被初始化为0

### 递归

### C预处理器

- 文件包含

  ```c
  #include "文件名"
  #include <文件名>
  ```

- 宏替换

  ```c
  #define a b
  ```

  不会替换字符串中的内容

  - 带参数的宏
  - `#undef`
  - 双井号嵌套

- 条件包含
  ```c
  #ifndef HDR
  #define HDR
  #endif
  ```

### 可变参数

```c
#include <stdio.h>
#include <stdarg.h>
void print_sum(int count, ...) {
  int sum = 0;
  va_list ap;
  va_start(ap, count); 
  for (int i = 0; i < count; ++i)
    sum += va_arg(ap, int);
  va_end(ap);
  printf("%d\n", sum);
}
int main(void) {
  print_sum(4, 1, 2, 3, 4);
  return 0;
}
```

可变参数是通过编译器在编译时，将参数的值拷贝到栈内存中，并通过 va_list 结构体来对这块栈内存进行访问

## 流程控制

### goto

goto 是通过汇编指令 jmp 实现的，这种方式下的执行流程转移仅能够发生在当前程序运行所在的某个具体函数中。相对地，程序无法做到从某个函数体的执行中途，直接将其执行流转移到其他函数的内部，称之为本地跳转

```c
L1:
if (n == 1) goto L1;
```

```nasm
.L2:
  cmp     DWORD PTR [rbp-4], 1
  jne     .L3
  jmp     .L2
```

对应的有非本地跳转，其可以在一个函数内部跳转到另外一个函数内部去，非本地跳转的原理是通过保存恢复函数的调用上下文来实现的

## 指针

### 指针与地址

```c
p = &c; // p为指向c的指针
y = *p; // 现在y的值的c的值
```

取地址符是通过汇编指令 lea 来实现的，而从指针中读取数据，是通过 mov 命令来实现的。

```nasm
lea     rax, [rbp-16]
mov     QWORD PTR [rbp-8], rax

mov     rax, QWORD PTR [rbp-8]
mov     eax, DWORD PTR [rax]
mov     DWORD PTR [rbp-12], eax
```

### 指针与函数参数

```c
void swap(int *x,int *y){
    int tmp = *x;
    *x = *y;
    *y = tmp;
}
```

### 指针与数组

数组本质也是一个指针

但是指针是一个变量，数组名不是一个变量

### 地址算术运算

当对指针进行加法、减法、递增、递减运算时，编译器实际上是以当前指针所指向值对应的某个固定长度为单位，对指针中存放的地址值进行相应调整的

- 相同类型指针之间的赋值运算
- 同整数间的加减法运算
- 指向相同数组的两个指针减法或比较运算
- 将指针赋值为0

### 字符串与指针
```c
void reverse(char *s,int n){
    if (n<0){
        return;
    }
    putchar(*(s+n));
    reverse(s,--n);
}
```

### 指针数组以及指向指针的指针

```c
char *sa[20];
```

```c
int main(){
    int x;
    int *xp = &x;
    int **xpp = &xp;

    **xpp=15;
    printf("%d",x);
}
```

### 多维数组
```c
int a[i][j];
```

### 指针数组的初始化

### 指针与多维数组

```c
char *s[]={"123","321","1111"};
```

### 命令行参数

```c
int main(int argc,char *s[]){return 0;}
```

### 指向函数的指针

```c
int fun(int a) {
  return a+6;
}
void fun1(int (*f)(int)) {
  printf("%d \n", (*f)(48))
}
int main(int args, char *args[]) {
  fun1(&fun);
  return 0;
}
```

### 复杂声明

## 结构

### 基本知识

```c
struct{
    int x;
    int y;
} point;

struct poinit p;
p.x=1;
```

### 结构与函数

- 结构指针

  ```c
  struct point *pp;
  (*pp).x=5;
  y = pp->x;
  ```

### 结构数组

```c
struct poinit ps[20];
```

### 结构指针

为了内存读取效率，成员字段在栈内存中都满足自然对齐的要求，编译器会插入额外的“填充字节”，来动态调整结构对象中各个字段对应数据的起始位置

```c
struct Foo {
  char *p;  // 8 bytes.
  char c;  // 1 bytes.
  // (padding): 7 bytes.
};
```



### 自引用结构

```c
struct{
    int x;
    int y;
    struct point *p;
} poinit;
```

### 表查找

### 类型定义

```c
typedef char* String
String s = "123";
```

### 联合

```c
union ut{
    char a;
    int b;
    long c;
}u;

u.c=1L;
u.b=2;
```

在该结构内的所有数据字段，都将会联合起来共享同一块内存区域

```nasm
mov     QWORD PTR [rbp-8], 1
mov     DWORD PTR [rbp-8], 2
```

### 位字段

## 字符串

```c
char strA[] = "Hello!";  
char* strB = "Hello!";
strA[1] = 'c'; // normal
strB[1] = 'c'; // Segmentation fault
```

使用数组和指针形式定义的字符串，其底层的数据引用方式会有所区别。其中数组方式会将字符串数据从 .rodata 中拷贝到其他位置（比如栈内存），因此修改这些数据不会改变存在于原始 .rodata 中的副本。而使用常量指针形式定义的数组，该指针会直接引用位于 .rodata 中的字符串数据

## 多线程

```c
// C11 引入的标准库
#include <threads.h>
#include <stdio.h>
int run(void *arg) {
  thrd_t id = thrd_current();  // 返回该函数运行所在线程的标识符；
  printf((const char*) arg, id);
  return thrd_success;
}
int main(void) {
  thrd_t thread;
  int result;
  // 创建一个线程；
  thrd_create(&thread, run, "Hello C11 thread with id: %lu.\n");
  if (thrd_join(thread, &result) == thrd_success) {
    // 等待其他线程退出；
    printf("Thread returns %d at the end.\n", result);  
  }  
  return 0;
}
```

### 原子操作

- C11 提供的名为 stdatomic.h 的头文件

```c
_Atomic long counter = 0;  // 定义一个原子类型全局变量，用来记录线程的累加值；

atomic_fetch_add_explicit(&counter, 1, memory_order_relaxed);  // 使用原子加法操作；
```

函数名|功能描述
-|-
atomic_flag_test_and_set|将一个atomic_flag的值置为真，并返回旧值
atomic_flag_clear|将一个atomic_flag的值设为假
atomic_init|初始化一个已经存在的原子对象
atomic is lock free|检测指定对象是否是lock-free的
atomic_exchange|原子地交换两个值
atomic_compare_exchange_weak|比较并原子地交换两个值（允许伪失败）
atomic_compare_exchange_strong|比较并原子地交换两个值
atomic_signal_fence|在线程和信号处理程序之间建立内存栅栏
atomic_thread_fence|在线程之间建立内存栅栏

### 条件变量

```c
cnd_t cond;  // 定义一个条件变量；
int done = 0;

// 等待
mtx_lock(&mutex); 
while (done == 0) {
  cnd_wait(&cond, &mutex);  // 让当前线程进入等待队列；
}
mtx_unlock(&mutex);

// 通知
mtx_lock(&mutex); 
done = 1;
cnd_signal(&cond);  // 通知等待中的线程；
mtx_unlock(&mutex); 
```

### 线程本地变量

```c
_Thread_local int counter = 0;
```


## 输入与输出

### 标准输入输出

- getchar
- putchar

### 格式化输出-printf

字符   | 参数类型;输出形式
---- | ------------------------------------------------------------
d,i  | int类型;十进制数
o    | int类型;无符号八进制数(没有前导0 )
x, X | int类型;无符号十六进制数(没有前导0x或0X ), 10~15分别用abcdef或ABCDEF表示
u    | int类型;无符号十进制数
c    | int类型;单个字符
s    | char *类型;顺序打印字符串中的字符，直到遇到'\0'或已打印了由精度指定的字符数为止
f    | double类型;十进制小数[- ] mdddddd,其中d的个数由精度指定(默认值为6 )
e, E | double类型; [-]mdddd e +xx或[ - ]mddddd E土比，其中d的个数由精度指定(默认值为6 )
g，G  | double类型;如果指数小于-4或大于等于精度，则用各e或8E格式输出，否则用8f格式输出。尾部的0和小数点不打印
P    | void *类型;指针(取决于具体实现)
%    | 不转换参数;打印一个百分号%

### 变长参数表

```c
void pr(int a,...){
  va_ list ap;
  int i;
  va_ start(ap,a);
  
  for(i=0;i<5;i++){
    printf( "%d" ,va_ arg(ap,int));
  }
  va_ end(ap);
}
int main(int argc,char *args[]){
  pr(1,2,3,4,5,6);
}

```

### 格式化输入-scanf

转换字符指定对输人字段的解释。对应的参数必须是指针，这也是C语言通过值调用语义所要求的

字符 | 输人数据;参数类型
-- | -----------------------------------------------------------------------------
d  | 十进制整数; int*类型
i  | 整数; int*类型，可以是八进制(以0开头)或十六进制(以0x或0x开头)
o  | 八进制整数(可以以0开头，也可以不以0开头) ; int *类型
u  | 无符号十进制整数; unsigned int* 类型
x  | 十六进制整数(可以0x或0X开头，也可以不以0x或0X开头) ; int *类型
C  | 字符; char *类型， 将接下来的多个输人字符(默认为1个字符)存放到指定位置。该转换规范通常不跳过空白符。如果需要读人下一个非空白符，可以使用%1s

### 文件访问

```c
int main(int argc,char *args[]){
  FILE *fp;
  FILE *fp1;
  char c;
  fp = fopen(" . /reverse1.c" ,"aw");
  fp1 = fopen("./reverse.c","r") ;
  while((c=fgetc(fp1)) != EOF){
    fputc(c,fp);
  }
  fputs("test",fp);
  fclose(fp);
  fclose(fp1);
}
```

### 错误处理

- stdout
- stderr

### 行输入和行输出

- fgets
- fputs

### 其他函数

## UNIX系统接口

### 文件描述符

>内核（kernel）利用文件描述符（file descriptor）来访问文件。 文件描述符是非负整数。 打开现存文件或新建文件时，内核会返回一个文件描述符。 读写文件也需要使用文件描述符来指定待读写的文件。

### 低级IO-read/write

标准的 IO 一般会使用所在平台的低级 IO 接口来实现。而低级 IO 则通过调用操作系统内核提供的系统调用函数，来完成相应的 IO 操作

在 x86-64 平台上，系统调用通过 syscall 指令来执行。而在基于该平台的 Unix 与类 Unix 系统上，系统调用函数的执行会使用寄存器 rdi、rsi、rdx、r10、r8、r9 来进行参数的传递，rax 寄存器则用于传递系统调用 ID，以及接收系统调用的返回值

### open creat close unlink

### 随机访问-lseek

### 信号处理

```c
void sigHandler(int sig) {
  printf("Signal %d catched!\n", sig);
  exit(sig);
}

signal(SIGFPE, sigHandler);
```
