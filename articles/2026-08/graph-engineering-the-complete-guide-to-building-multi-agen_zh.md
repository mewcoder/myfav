文章
Lunar
@LunarResearcher
图工程（Graph Engineering）：构建多智能体（Multi-Agent） AI系统完全指南

大多数构建多智能体（Multi-Agent）AI系统的人都在错误的层面投入精力。

他们痴迷于提示词（prompts）、模型、工具、记忆（memory），以及他们能生成多少个智能体（agents）。

但一旦你拥有多个智能体（agent），最难的问题就不再是让单个 agent 变得更聪明。

它决定了工作本身应该如何流转。

哪些 Agent 可以同时运行？哪些实际上相互依赖？它们之间应该传输什么数据？结果在哪里汇聚？什么会被验证？当一个节点（node）失败时会发生什么？以及哪些操作在获得人工批准前必须保持不可执行？

该层有个名字：

图工程（Graph Engineering）。

一张图（graph）将一堆智能体（Agents）转变为一个系统。

而非：

A → B → C → D → E

你开始用节点（nodes）、依赖关系、并行分支、规约器（reducers）、验证关卡、循环、故障域和人工检查点来思考。

读完本指南，你将掌握如何设计多智能体系统（multi-agent systems），使其运行更快、成本更低、更易于调试，并且极难被欺骗。

如果你想获取更多关于AI智能体、工作流（workflows）以及类似系统的实用拆解，请订阅我的 Substack：@LunarResearcher
并在 X 上关注我：@LunarResearcher
1. 工作流（workflow）不是一份待办事项清单

浪费一个AI系统最简单的方式，就是将顺序与依赖混淆。

假设你的 workflow 如下：

检查定价
检查客户评论
检查产品文档
撰写一份市场简报

大多数人按顺序执行这四个步骤，因为它们就是按此顺序编写的。

但前三个不需要彼此。

它们只需要在第四步之前完成即可。

因此，真正的形态是：

latex
 pricing ──────┐
 │
reviews ──────────────────┼──→ market brief
 │
 docs ───────────────┘

那幅图比编号列表包含的工程信息更多。

重要的问题不是：

“接下来会怎样？”

它是：

“在此启动之前必须存在哪些信息？”

这一个问题立刻就能暴露出虚假的依赖关系。

如果任务 B 从不消费任务 A 生产出的任何成果，那么 A → B 就不是一个真正的依赖关系。

它只是在等待。

2. 图需要状态（state），而不仅仅是箭头

一旦人们发现并行智能体（Parallel Agents），通常会犯下一个错误：每个智能体都接收一个巨大的提示词（prompt）并返回一大段文本。

这在demo中是有效的。

它会在真实图（Graph）中崩溃。

一个有用的图需要显式状态。

不是“照搬前一个模型所说的内容。”

实际状态。

例如：

latex
ResearchFinding {
 claim
 evidence
 source
 confidence
 timestamp
}

现在，下一个节点并非在读取对话。

它正在读取一个对象。

这差异听起来微乎其微。实则不然。

结构化状态（Structured state）为你带来三方面优势：

1. 可替换性。
你可以替换一个工作进程（worker），而无需重写所有下游内容。

2. 可检查性。
你能精确看到进入和离开节点的内容。

3. 围绕模型的确定性。
模型在盒子内部仍可能是模糊的，但盒子周围的接口保持严格。

这就是停止构建一连串对话，转而构建一个系统的起点。

智能体能够即兴发挥。

该图不应。

3. 在添加另一个 Agent 之前，先执行依赖测试

对于工作流中的每一个环节，都有一个极其有效的测试方法：

什么确切的数据穿过这条箭头？

如果无法用一句话回答这个问题，那么这个边（edge）就值得怀疑。

错误答案：

“下一个智能体（Agent）应知晓前一个智能体（Agent）已完成。”

那是状态，不是依赖。

更好的答案：

评审员接收到研究者的主张、来源URL以及证据摘录。

现在，边（Edge）也有了意义。

你可以将此测试应用于几乎任何 workflow：

latex
review file A → review file B

什么会交叉？

无。

删除边。

latex
extract invoices → calculate total

什么交叉？

发票金额。

保留边。

latex
generate three headlines → choose the strongest

什么东西交叉？

三个候选标题。

保持优势。

目标并非最大化并行（parallelism）。

目标是消除虚假的同步。

4. 并行并非免费

一旦人们意识到独立工作可以同时进行，往往会矫枉过正。

Twenty 工作进程（workers）变成两百。

两百变成两千。

图变得更宽了。

账单也会变得更宽。

并行性降低了物理运行时间（wall-clock time）。

它并不能神奇地减少工作量。

事实上，广泛的图（graphs）往往会带来新的成本：

更多重复的研究
更多相互冲突的输出
更多速率限制
更多合并压力
更多验证
在最终阶段提供更多上下文

因此，每个严肃的图都需要一个宽度预算。

可以将其想象为内存分配。

你不会仅仅因为数据库在技术上接受连接，就启动 500 个数据库查询。

不要仅仅因为你的运行时（runtime）在技术上能运行 500 个智能体（Agent）就那样做。

一个实用的规则：

仅当额外工作进程增加的覆盖范围超过其增加的协调成本时，才增加宽度。

五位研究人员从五个真正不同的角度进行探讨，这会是极好的。

五十名研究者用略有不同的提示词搜索同一主题，通常只是在制造噪音。

应该优化的单元不是“智能体数量”。

单位成本下的独立覆盖度很有用。

5. 关键路径（critical path）比总步骤数更重要

线性工作流之所以缓慢，是因为每个阶段的耗时是叠加的。

如果五个任务分别耗时：

latex
8s + 12s + 6s + 10s + 9s

您的工作流大约需要 45 秒。

如果其中四项任务相互独立，系统只需等待最慢的那项完成即可进行合并。

突然之间，重要的数字不再是总和。

这是关键路径（Critical Path）。

这改变了你解读工作流（Workflow）图的方式。

不要计数方框。

寻找从起点到终点的最长不可避免路径。

这条路径决定了延迟（latency）。

其余一切都是优化机会。

这就是为什么一个 40 节点图（Graph）能比一条 7 节点链（Chain）更快完成任务。

图的规模更大了。

关键路径更短。

6. 推理前先压缩

以下是智能体系统中最昂贵的架构错误之一：

latex
20 workers
 ↓
one giant synthesis prompt

所有原始输出被整合输入到最终模型中。

现在，最终的节点必须完成：

阅读所有内容
去重
解决格式问题
注意矛盾之处
对发现结果进行排序
推断缺失字段
那么写出答案

你已把你最聪明的模型变成了垃圾回收器。

不要那样做。

在综合之前放置一个规约器（reducer）。

规约器（Reducer）应当移除那些不需要判断的工作。

示例：

latex
deduplicate IDs
sort by timestamp
group by source
drop malformed records
count votes
normalize labels
remove exact duplicates

大部分内容都应该是纯代码。

别再搞又一个智能体了。

随后，你那昂贵的推理节点接收到的将是一组更小、更干净的数据集。

架构变为：

latex
workers
 ↓
deterministic reduce
 ↓
reasoning / synthesis

这是整个设计领域中最强大的成本优化之一。

利用模型处理歧义。

使用代码来搭建管道。

7. 验证应当是异步的

工作进程不因其捍卫自身答案而获得奖励。

这会产生确认压力。

相反，应为验证（Verification）设定一个不同的目标。

工作进程说：

“找到最强的答案。”

验证器显示：

“找出应拒绝此答案的原因。”

这不是同一项任务。

良好的验证是反身性的。

对于一个研究系统：

latex
WORKER:
Find evidence supporting or explaining the claim.

VERIFIER:
Try to falsify the claim.
Check the source.
Check the date.
Look for conflicting evidence.

对于代码：

latex
WORKER:
Implement the change.

VERIFIER:
Try to break it.
Run tests.
Inspect edge cases.
Look for regressions.

对于策略：

latex
WORKER:
Build the recommendation.

VERIFIER:
List conditions under which this recommendation fails.

验证器应有权终止输出。

否则就是装饰。

一个有用的图（Graph）不仅仅是创造更多候选方案。

它制造了一种选择压力（selection pressure），使得糟糕的候选者必须存活。

8. 在图运行前设计故障域

一个真正的图（Graph）假设节点（Node）将会发生故障。

并非因为你的系统不好。

因为分布式工作总会存在失败的环节。

一个请求超时了。

一个来源消失了。

工具返回格式错误的数据。

模型忽略了请求的格式。

工作进程（Worker）遭遇速率限制。

架构问题是：

当它消亡时，图的多少部分应随之一起消亡？

错误答案是：

“万物。”

每个节点都应位于一个具有明确策略的故障域（failure domain）内：

latex
ON FAILURE:
1. 重试（retry）一次
2. 使用回退（fallback）模型/工具重试
3. 返回结构化失败
4. 若法定人数仍然充足则继续
5. 仅当此节点为关键节点时阻塞

因此，即使一个研究员失败，一个包含十名研究员的图仍能生成有效的报告。

但最终输出应表明，仅有 9/10 项任务已完成。

这就是韧性与静默不完整之间的区别。

切勿隐藏缺失的工作。

优雅降级。

9. 人工审批（Human approval）是一种边类型

这是一个重要的转变。

大多数人将人类建模为另一个节点：

latex
AI → human → AI

那太模糊了。

人类通常并非在“执行工作”。

人类正在授权状态跨越边界。

这使得审批更接近于一个边缘条件。

示例：

latex
draft campaign
 ↓
quality checks
 ↓
[ HUMAN APPROVAL ]
 ↓
publish

发布节点在获得批准前应完全不可访问。

注意：

“模型被指示先提问。”

注：

“智能体（Agent）通常处于等待状态。”

该图应使不安全的状态转移变得不可能。

这在下游操作不可逆时尤为重要：

发送资金
部署代码
向客户发送电子邮件
删除数据
修改权限
对外发布

后果越严重，审批环节就越应被纳入架构设计，而非仅仅依赖提示词措辞。

10. 一些规则应当被固化

Agent 系统是优化机器。

这意味着他们最终会发现捷径。

如果“成功”意味着更快地交付，系统可能会削弱审查。

如果“成功”意味着获得更多潜在客户，它可能会放宽筛选标准。

如果“成功”意味着完成更多工单，系统可能会对“已解决”的定义变得过于宽松。

因此，部分规则应当置于优化循环之外。

将它们视为冻结的约束。

示例：

latex
never publish without approval
never cite a source that was not opened
never mark a test as passed unless it executed
never exceed the spend cap
never modify production credentials

这些不是给智能体的建议。

它们是图上的约束。

弱边界内的智能优化器会更快变得危险。

智能优化器置于强力边界内，方能更快发挥价值。

11. 观察图，而非对话

聊天记录是分布式系统的糟糕仪表盘。

一旦工作流（Workflow）变为图结构（Graph-shaped），你就需要图结构的度量指标。

有用的那些出奇地简单。

关键路径延迟

最长的依赖链有多长？

这揭示了实际等待开销所在之处。

节点故障率

哪些工作进程失败最频繁？

这能捕获脆弱的工具和糟糕的提示词。

重试率

一个在每个节点重试四次后才“成功”的图，并不健康。

验证器淘汰率

如果验证器拒绝 0% 的输出，它可能毫无用处。

如果它拒绝了 80%，你的 Worker 可能缺乏明确的界定。

扇出（Fan-out）效率

多少并行工作进程（Worker）产出了独特且有用的信息？

这是您的信噪比。

压缩率

在最终合成之前，会移除多少原始材料？

如果 200 个输出最终产生 18 个有用发现，那么规约器（Reducer）就在完成有价值的工作。

人工干预率

哪些环节仍需人工介入以保障系统运行？

这些就是你们的下一个架构目标。

一旦你跟踪了这些指标，改进系统就会变得容易得多。

你已不再基于直觉微调 Prompt。

你正在优化一台机器。

12. 值得了解的五种图形态

你不需要一个包含五十种模式的模式库。

这五个要素涵盖了大量令人意想不到的实际工作。

1. Fork / Join

latex
 A
 ↙ ↓ ↘
 B C D
 ↘ ↓ ↙
 E

将其用于研究、审计、批量分析、竞争分析。

2. 升级阶梯

latex
cheap check
 ↓ uncertain?
medium check
 ↓ still uncertain?
strong model / human

当大多数情况简单，但少数需要昂贵推理时，请使用它。

3. 锦标赛

latex
candidate 1 ─┐
candidate 2 ─┼→ judges → winner
candidate 3 ─┘

用它来处理文案、设计方案、计划、代码方案和假设。

4. 映射 → 规约 → 验证 → 合成

latex
many workers
 ↓
normalize + dedupe
 ↓
attack weak findings
 ↓
final answer

用于决策级研究与大规模综述。

5. 有界发现循环（Bounded Discovery Loop）

latex
search
 ↓
new findings?
 ↓ yes
verify → add to seen → search again

stop after:
- 连续 N 轮无新发现
- 最大花费
- 最大时间

当你不确定问题规模有多大时，可以使用它。

预算是拓扑（topology）的一部分。

没有停止规则的循环，称不上架构。

这是一个泄露。

13. 一个你几乎可以粘贴到任何Agent 框架（agent framework）中的图规约

在你编写代码之前，先像这样描述系统：

latex
GOAL:
What must exist at the end?

INPUT STATE:
What structured data enters the graph?

PARALLEL WORK:
Which tasks are truly independent?

EDGE DATA:
What exact information crosses each dependency?

REDUCER:
What can be normalized, deduplicated, ranked, or filtered with code?

VERIFICATION:
What independent test can reject weak output?

FAILURE POLICY:
What retries?
What fallback?
What can fail without killing the run?

BUDGET:
Maximum agents?
Maximum tokens/cost?
Maximum wall-clock time?

HUMAN GATE:
Which irreversible actions require approval?

OUTPUT:
What exact schema or artifact is returned?

那个规范比先写二十条提示词更有价值。

因为提示词优化节点。

该规范优化了系统。

14. 何时不该构建图

图如此强大，以至于人们开始在所有地方使用它们。

不要。

适用单智能体（Single Agent）的场景：

任务很小。
每一步都真正依赖于前一步。
你仍在探索这个问题。
协调成本超过工作本身
你需要一个连贯的视角，而非广泛的覆盖。
人类希望控制每一个中间步骤。

图（Graph）换来的是宽度、隔离性与控制流。

它并不能自动购买品味。

它不会自动带来真相。

它不会自动让薄弱的任务定义变得更好。

有时，一个配备了合适工具的优秀智能体（Agent）就是正确的架构。

关键在于，并非所有事物都需被绘制为图。

关键在于识别：何时一条界限在人为地限制那些本就非线性进行的工作。

真正的转变

第一代AI工作流是提示词工程（prompt engineering）。

随后，迎来了工具使用（tool use）。

然后循环。

现在，更困难的技能是编排。

不是“如何让模型更聪明？”

但是：

什么可以同时运行？
什么状态应该共享？
什么永远不应该共享？
什么会被验证？
当一个工作进程死亡时会发生什么？
什么被允许继续运行？
成本在哪里会爆炸？
人类在哪里仍然掌握着关键？

这就是执行任务的AI与能够掌管流程的AI系统之间的区别。

更多智能体并非解决方案。

更好的拓扑结构。

如果你读到了这里：

收藏此页。
关注 @LunarResearcher
关注我的 Substack
关注我的私人 Telegram 频道
20:45 · 2026年8月8日
143.5万
视图
16
72
400
1261
cursor
@Cursor0P
8月11日
@pangram 是由AI生成的吗？
2
2
2689
瓦伦丁
@martynov014
8月8日
又一份由 lunar🤝 出品的硬核指南。
1
1
5964
mo saadat
@mosaadat
8月11日
@readwise 保存
1
1
716
登录或注册 X

了解最新动态，加入讨论

继续使用手机
继续关注 Apple
使用 Google 继续
或
使用用户名或邮箱登录
相关人物
Lunar
@LunarResearcher
关注
当前热门
术语
·
隐私
·
Cookies
·
无障碍访问
·
广告信息
·
更多
© 2026 X Corp.
扫码获取应用
