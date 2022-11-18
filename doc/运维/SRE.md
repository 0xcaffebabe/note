# SRE

- 体系化

![20221118163214](/assets/20221118163214.webp)

- MTBF，Mean Time Between Failure，平均故障时间间隔
- MTTR，Mean Time To Repair， 故障平均修复时间
  - MTTI (Mean Time To Identify，平均故障发现时间)，也就是从故障实际发生，到我们真正开始响应的时间。这个过程可能是用户或客服反馈、舆情监控或者是监控告警等渠道触发的
  - MTTK (Mean Time To Know,平均故障认知时间)，更通俗一点，可以理解为我们常说的平均故障定位时间。这个定位指的是root cause,，也就是根因被定位出来为止
  - MTTF (Mean Time To Fix，平均故障解决时间)，也就是从知道了根因在哪里，到我们采取措施恢复业务为止。这里采取的手段就很多了，比如常见的限流、降级、熔断，甚至是重启
  - MTTV (Mean Time To Verify，平均故障修复验证时间)，就是故障解决后，我们通过用户反馈、监控指标观察等手段，来确认业务是否真正恢复所用的时间。

SRE只有一个目标：提升 MTBF，降低 MTTR

## [可用性](/软件工程/架构/系统设计/可用性.md)目标

衡量维度：

- 时间维度：Availability = Uptime / (Uptime + Downtime)
- 请求维度：Availability = Successful request / Total request

这两种算法最后都会落脚到“几个 9”上

需要考虑：

- 成本因素：越高的可用需要越高的投入，要先考虑 ROI（回报率）
- 业务容忍度：对于越核心的系统，容忍度越低
- 系统当前的稳定状况：定一个合理的标准比定一个更高的标准会更重要
