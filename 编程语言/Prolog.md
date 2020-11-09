# Prolog

- 事实
- 规则
- 查询

## 起步

```prolog
likes(wallace, cheese).
likes(grommit, cheese).
likes(wendolene, sheep).

friend(X,Y) : - \+(X = Y), likes(X, Z), likes(Y, Z).
```

前面三行定义事实 最后一行定义规则
