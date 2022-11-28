
# WebAssembly

- 一种基于堆栈式虚拟机的二进制指令集

对于可以应用在诸如 i386、X86-64 等实际存在的物理系统架构上的指令集，我们一般称之为 ISA（Instruction Set Architecture，指令集架构）。而对另外一种使用在虚拟架构体系中的指令集，我们通常称之为 V-ISA，也就是 Virtual（虚拟）的 ISA，JVM 跟 WASM 都属于后者

## 模块组成

每一个不同的 Section 都描述了关于这个 Wasm 模块的一部分信息。而模块内的所有 Section 放在一起，便描述了整个模块在二进制层面的组成结构

### Type Section

存放了 Wasm 模块使用到的所有函数类型（签名）

### Start Section

通过这个 Section，我们可以为模块指定在其初始化过程完成后，需要首先被宿主环境执行的函数

### Global Section

主要存放了整个模块中使用到的全局数据（变量）信息

### Custom Section

主要用来存放一些与模块本身主体结构无关的数据，比如调试信息、source-map 信息等等

### Import Section 和 Export Section

Import 定义了所有从外界宿主环境导入到模块对象中的资源，这些资源将会在模块的内部被使用，能够在 Wasm 模块之间，以及 Wasm 模块与宿主环境之间共享代码和数据

Export 可以将一些资源导出到虚拟机所在的宿主环境中

### Function Section 和 Code Section

Function Section 存放了模块内每个函数对应的函数类型，即具体的函数与类型对应关系；而在 Code Section 中存放的则是每个函数的具体定义，也就是实现部分

### Table Section 和 Element Section

目前 Table Section 的作用并不大，你只需要知道我们可以在其对应的 Table 结构中存放类型为 “anyfunc” 的函数指针，并且还可以通过指令 “call_indirect” 来调用这些函数指针所指向的函数

通过 Element Section，我们便可以为 Table Section 所描述的 Table 对象填充实际的数据

### Memory Section 和 Data Section

Memory Section 可以描述一个 Wasm 模块内所使用的线性内存段的基本情况，比如这段内存的初始大小、以及最大可用大小等等

使用 Data Section 为线性内存段填充实际的二进制数据

### 魔数和版本号

开头的前四个字节分别为 “（高地址）0x6d 0x73 0x61 0x0（低地址）”

四个字节对应的 ASCII 可见字符为 “asm”

接下来的四个字节，用来表示当前 Wasm 二进制文件所使用的 Wasm 标准版本号，版本号1即为 0x0 0x0 0x0 0x1

## 数字类型

Wasm 将其模块内部所使用到的数字值分为以下三种类型：

1. uintN（N = 8 / 16 / 32） 表示了一个占用 N 个 bit 的无符号整数。该整数由 N/8 个字节组成，并以小端模式进行存储
2. varuintN（N = 1 / 7 / 32） 使用 Unsigned LEB-128 编码，具有 N 个 bit 长度的可变长无符号整数
3. varintN（N = 7 / 32 / 64） 表示的是使用 Signed LEB-128 编码，具有 N 个 bit 长度的可变长有符号整数

## WAT

- WebAssembly 可读文本格式

一种与 Wasm 字节码格式完全等价，可用于编码 Wasm 模块及其相关定义的文本格式

```wasm
(func $factorial (; 0 ;) (param $0 i32) (result i32)
 (local $1 i32)
 (local $2 i32)
 (block $label$0
  (br_if $label$0
   (i32.eqz
    (get_local $0)
   )
  )
  (set_local $2
   (i32.const 1)
  )
  (loop $label$1
   (set_local $2
    (i32.mul
     (get_local $0)
     (get_local $2)
    )
   )
   (set_local $0
    (tee_local $1
     (i32.add
      (get_local $0)
      (i32.const -1)
     )
    )
   )
   (br_if $label$1
    (get_local $1)
   )
  )
  (return
   (get_local $2)
  )
 )
 (i32.const 1)
)
```

### S表达式

求值会从最内层的括号表达式开始，类似于Lisp

### Flat-WAT

平铺即通过“嵌套”与“小括号”的方式指定了各个表达式的求值顺序

```wasm

(func $factorial (param $0 i32) (result i32)
 block $label$0
  local.get $0
  i32.eqz
  br_if $label$0
  local.get $0
  i32.const 255
  i32.add
  i32.const 255
  i32.and
  call $factorial
  local.get $0
  i32.mul
  i32.const 255
  i32.and
  return
 end
 i32.const 1)
```

### 模块结构

```wasm

(module
 (table 0 anyfunc)
 (memory $0 1)
 (export "memory" (memory $0))
 (export "factorial" (func $factorial))
 ...
)
```

### 相关工具

- wasm2wat：该工具主要用于将指定文件内的 Wasm 二进制代码转译为对应的 WAT 可读文本代码
- wat2wasm：该工具的作用恰好与 wasm2wat 相反。它可以将输入文件内的 WAT 可读文本代码转译为对应的 Wasm 二进制代码
- wat-desugar：该工具主要用于将输入文件内的，基于 “S- 表达式” 形式表达的 WAT 可读文本代码“拍平”成对应的 Flat-WAT 代码
