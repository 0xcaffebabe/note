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
