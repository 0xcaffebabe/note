# Clojure

- JVM Lisp方言

## 基本运算与函数调用

```clojure
(println (- 1))
(println (+ 1 1))
(println (+ 1 1 1)) ; 使用一个运算符运算
(println (+ 3.0 5)) ; 自动类型转换
(println (= 1 1 1)) 
(println (* 10 10))
(println (/ 6 3))
(println (class (/ 6 3)))
```

## 字符与字符串

```clojure
(println \a) ;; 字符
(println (str 1 2 \a)) ;; 转为字符串
```

## 布尔值与表达式

```clojure
(println (= 1 1))
(if (= 1 1) (println "hello world"))
```

0 和 "" 都代表true

## 数据结构

- 列表

Clojure 列表是代码

```clojure
;(println (1,2,3)) ; 错误
(println (list 1 2 3)) ; 生成一个列表
; 列表操作
(println (first (list 1 2 3)))
(println (last (list 1 2 3)))
(println (rest (list 1 2 3))) ; 除头元素
```

- 向量

```clojure
(println [1 2 3])
(println (first [1 2 3]))
(println (nth [1 2 3] 2))
(println (last [1 2 3]))
(println ([1 2 3] 2)) ; 向量也是一个函数 可以执行参数为2
```

- 集合

```clojure
(println #{1 2 3})
(def s #{1 2 3}) ; 集合赋值
(println (count s))
(println (sort s))
(println (sorted-set 3 1 2)) ; 创建一个有序集合
(println s 2) ; 判断元素是否在集合中
```

- 映射表

```clojure
(def suffix {"js" "javascript", "py" "python", "java" "java"})
(println (suffix "js"))
(println (merge {"js" 1, "java" 1} { "py" 1, "java" 1})) ; 合并 重复直接覆盖
(println (merge-with + {"js" 1, "java" 1} { "py" 1, "java" 1})) ; 合并 提供一个操作当重复时执行该操作
(println (assoc {"js" 1} "java" 1)) ; 增加KV
```

## 函数定义

```clojure
(defn say [] (println "hello world")) ; 定义
(say)
```

## 解构

```clojure
(defn center [[_ c _]] c)
(println (center [1,2,3])) ; 2

(println (let [[_ c _] [1 2 3]] c)) ;2
```

## 匿名函数

```clojure
; apply
(defn kiss [man] (println "kiss" man))
(apply kiss '("people")) ; 调用指定函数使用指定参数

; filter
(defn gt2 [i] (> i 2))
(println (filter gt2 [1 2 3])) ; 使用指定函数过滤元素
```

## 递归

- 使用传统方式

```clojure
(defn size [v]
  (if (empty? v)
    0
    (inc (size (rest v))))
)
(println (size [1 2 3])) 
```

- 使用loop和recur

```clojure
(defn size1 [v]
  (loop [l v, c 0]
    (if (empty? l)
      c
      (recur (rest l) (inc c))
    )
  )
)
(println (size1 [1 2 3]))
```

## 序列

一个与具体实现无关的抽象层

```clojure
; 测试
(println (some nil? [1 2 3]))
(println (every? number? [1 2 3]))

; 修改
(println (map (fn [x] (* x x)) [1 2 3 4]))
(println (filter (fn [x] (> x 2)) [1 2 3 4]))

; 列表解析
(def people ["蔡徐坤" "徐雪莉" "张无忌"])
(def object ["篮球" "蛋糕" "游戏"])
(println (for [x people, y object] (str x "喜欢" y)))
; 列表解析过滤
(println (for [x people, y object, :when(= y "篮球")] (str x "喜欢" y)))

; reduce
(println (reduce + [1 2 3 4]))
(println (reduce * [1 2 3 4]))

; 排序
(
  println 
  (
    sort-by (fn [x] (if (< x 0) (- x) x))
    [-1 2 3 -2 -6 -7]
  )
)
```

## 延迟计算

- 有穷序列

```clojure
(println (range 1 10)) ; [1,10)
(println (range 10)) ; [0,10)
```

- 无穷序列

```clojure
(println (take 3 (repeat 100))) ; 从无限重复100的序列取出3个
(println (take 5 (cycle ["徐工" "张无忌" "低修"]))) ; 从这个列表的无限循环取5个
(println (take 5 (interpose "和" (cycle ["徐工" "张无忌" "低修"])))) ; 元素之间加入分隔符
(defn sum [x] (+ x 1))
(println (take 100 (iterate sum 0))) ; 使用自定义函数
```

## 协议

- defrecord和protocol

## 宏

```clojure
(defmacro unless [test body]
  (list 'if(list 'not test) body)
) ; 定义宏

(unless (= 1 2) (println "done"))
```

## 并发

### 引用与事务

```clojure
; 引用
(def name (ref "cxk")) ; 定义
(println @name) ; 使用
(dosync (ref-set name "jntm")) ; 只能在事务(dosync)里面修改
(println @name)
```

### 原子

```clojure
(def person (atom "电影人")) ; 定义
(println person)
(reset! person "打工人") ; 设置新原子
(println person)
```

### 代理

```clojure
(defn calc [x] (* 2 2))
(def proxy (agent 1))
(send proxy calc) ; 让代理去调用函数
(println @proxy) ; 这里读取会很快返回 即使calc函数阻塞
```

### future

```clojure
; future 基本跟代理一样
(def result (future (Thread/sleep 1000) "got it"))
(println @result) ; 只有结果返回才能获取 否则就阻塞住了
```

## 核心优势

- 括号相比其他Lisp方言少
- 庞大的Java生态系统支持
- 限制了宏的部分能力
- 并发
- 延迟计算
- 列表即代码

## 不足

- 语法
  - 前缀表达式
  - 括号带来的可读性问题
- 学习曲线陡
- 在JVM上 受到了一些限制
