Post
rari
@0xwhrrari
Harness 工程（Harness Engineering）: 如何构建不会崩溃的AI 智能体（Agents）

多数人在智能体（agent）失败时，会直接修改提示词（prompt）。

然后他们更换了模型

接着他们增加了一个更大的上下文窗口（context window）

智能体仍然会遗忘决策

它仍然在使用错误的工具。

它仍然跳过验证。

它仍然卡在同一个循环里。

问题并不总是出在智能上。

问题在于其周围的环境。

那个环境就是运行框架（harness）

而设计它就是 Harness 工程

Anthropic 首席执行官 Dario Amodei 在阐述Claude Code是如何诞生时，直言不讳地说道

“当然，你需要一个接口，你需要一个运行框架来使用它们”
我在 Substack 上发布关于AI智能体、工作流（workflows）和生产系统的实用拆解，点击此处订阅通讯
模型只是推理引擎

一个模型可以建议下一步操作

它自身无法创建一个可靠的运行环境。

运行框架决定了模型能看到什么、能触碰什么、什么能在会话间持久化、什么算作证据，以及运行必须在何时停止。

text
MODEL
reasons and proposes actions

HARNESS
selects context
exposes tools
stores state
enforces permissions
checks results
records traces
recovers from failure

提示词是该系统内部的一个组件

模型是另一个

产品正是所有周边组件协同运作所诞生的成果

提示词工程（Prompt engineering）改进了指令

Harness 工程（Harness Engineering）改善了指令执行的条件
同一个模型可以成为一个完全不同的智能体（Agent）。

将相同的模型置于聊天框内，它便能回答问题。

将其置于一个具备终端访问、测试、浏览器工具、项目记忆（memory）、隔离工作树以及审查循环的代码库中，它便能交付软件。

权重未发生变化。

运行框架did

OpenAI在使用Codex构建以 Agent 为先的代码库时，也描述了相同的转变。

他们的早期进展缓慢，是因为环境定义不够充分，而非模型缺乏原始能力。

响应并非是告诉智能体要更努力尝试

它旨在追问缺少了何种能力，并使该能力既清晰可读又可强制执行。

“环境规格说明不足”

OpenAI，Harness 工程：在智能体优先的世界中利用Codex

这就是核心思想。

当智能体反复失败时，别再调整提示词里的形容词了

检查模型周围的系统

生产级运行框架（Harness）有七个核心职责
1. 将请求转化为契约

在 Agent 行动前，将请求转换为有界对象。

text
{
 "goal": "ship the feature",
 "inputs": ["issue", "repository", "design"],
 "output": "reviewable pull request",
 "constraints": ["no schema changes", "preserve public API"],
 "done_when": ["tests pass", "visual check passes", "review passes"]
}

契约可防止任务被静默重新定义

没有它，智能体可能完成一项不同的任务却依然宣称成功。

2. 为 Agent 提供地图

智能体需要项目知识

它们不需要在每个上下文窗口中包含所有文档

使用一个小型根指南来指示 Agent 应该查找的位置。

text
AGENTS.md
 -> architecture map
 -> testing map
 -> product rules
 -> security rules
 -> task-specific guides

一张地图保留上下文

一本厚重的手册吞噬了它

将详细知识保留在其管控的代码、工具或工作流（workflow）附近

仅在当前任务需要时才加载它

3. 在正确的环境中暴露正确的工具

工具访问不是一组按钮

它是模型与现实世界之间的接口

每个工具都需要有明确的用途、可预测的输出、显式的失败状态（state），以及一个权限边界（permission boundary）。

text
READ FILES allowed by default
RUN TESTS allowed inside sandbox
WRITE FILES allowed inside workspace
ACCESS NETWORK scoped by task
DEPLOY requires approval
DELETE DATA requires approval

好的工具能在模型有机会推理失误之前就消除歧义。

糟糕的工具迫使模型猜测发生了什么

4. 将记忆外化为持久状态

会话并非记录系统

将决策、产物、失败案例及潜在风险存储在上下文窗口之外

text
{
 "task_id": "task_042",
 "current_step": "verify_ui",
 "artifacts": ["build.zip", "report.md", "screenshot.png"],
 "decisions": ["keep existing schema"],
 "failures": ["mobile overflow at 390px"],
 "pending": ["human approval"]
}

下一次会话应继承工作的状态，而非对对话的有损复述。

这就是 AI 智能体（AI Agent）在上下文重置、崩溃和交接中存活下来的方式

5. 在添加自治能力之前先添加传感器

智能体无法修正其无法观察到的事物。

测试、代码检查、截图、日志、指标以及模式（schema）验证器，将模糊的质量转化为可验证的证据。

text
CODE -> tests + type checks + lint
UI -> render + screenshot + visual inspection
RESEARCH -> source check + contradiction check
DATA -> schema + range + freshness checks

该模型创建了一个工件。

环境产生关于该构件的证据。

运行框架（Harness）判断这些证据是否足以继续。

6. 在模型之外强制执行权限

模型可以推荐一项操作。

运行框架必须授权它

text
MODEL SUGGESTS -> POLICY CHECKS -> TOOL EXECUTES

这种分离在操作代价高昂、不可逆或涉及他人时最为重要。

不要让同一个概率系统既负责制定计划、批准风险，又负责执行副作用。

7. 记录链路追踪并进行本地恢复

每次运行都应留下可读的轨迹

text
request
selected context
tool calls
state changes
verification results
retries
cost
final artifact
rollback point

没有追踪，故障便成谜

通过轨迹，故障成为下一次 Harness 改进的输入

指令应当成为基础设施

大多数团队将重要规则以散文形式记录。

智能体读取它们

最终忽略了一个

更强大的模式是将重要规则编码两次。

首先，作为指导，智能体可以理解

那么，作为一种机械式检查，智能体无法绕过

text
GUIDE
"UI code may not query the database directly"

CHECK
lint fails when UI imports the repository layer

该指南解释了原因

该检查强制实施边界

这将一次过去的失败转化为永久性的系统改进。

下一个 Agent 不需要记住该事件

Harness 记忆为它

循环属于运行框架（Harness）。

长时间运行的工作需要迭代。

但“不断重试直到成功”不是一个控制系统

一个有用的循环具备证据、有限重试、预算和升级路径。

text
for (let attempt = 1; attempt <= 3; attempt += 1) {
 const artifact = await build(state)
 const evidence = await verify(artifact)

 if (evidence.pass) return artifact

 state.failures.push(evidence.gap)
 state.repair = evidence.repair
}

return requestHumanReview(state)

模型应决定如何修复本地间隙

运行框架应决定是否允许再次尝试。

Anthropic 在其关于长时间运行智能体（AI Agent）的工作中也得出了类似的结论。

结构化制品在不同会话间保持连续性，而独立的评估器为构建者提供具体反馈，而非让其自我认可。

"找到最简单的解决方案，仅在需要时才增加复杂度"

Anthropic，面向长期应用开发的 Harness 设计
故障应促使系统升级

大多数人修复当前输出

运行框架工程师修复特定类别的故障。

text
MISSING CONTEXT -> add a map or retrieval rule
WRONG TOOL -> improve tool description or routing
BAD OUTPUT -> add a validator or stronger contract
REPEATED LOOP -> add a retry cap and escalation
UNSAFE ACTION -> add a permission gate
LOST DECISION -> store it in durable state
UNKNOWN FAILURE -> add tracing and evidence capture

即时补丁修复了一次运行。

运行框架（Harness）的改进提升了每一次运行。

这就是复合优势。

优秀的运行框架将智能体的错误转化为基础设施
分离大脑、双手与历史

一个可靠的智能体（AI Agent）在将三个组件分离时更容易推理。

text
BRAIN
the model that reasons

HANDS
the sandbox and tools that act

HISTORY
the append-only record of what happened

如果沙箱（sandbox）崩溃，历史记录依然存在。

若模型发生变更，工具与策略依然保持可检查性

如果任务恢复执行，新的会话可以从制品（artifacts）和轨迹（traces）中重建状态。

Anthropic 的托管智能体架构通过会话（session）、运行框架（harness）和沙箱（sandbox）将这种分离显式化。

https://x.com/i/web/status/2041927687460024721

重要的不是供应商

这就是该架构

推理引擎不应同时充当文件系统、权限系统、记忆数据库和审计日志。

为每次运行生成变更收据

当智能体完成时，不要只保留最终输出。

保留一份简明的生成记录，用以解释输出是如何产生的。

text
{
 "context_sources": ["issue", "repo_map", "design_spec"],
 "policy_version": "v12",
 "model_route": "complex_coding",
 "tools_used": ["shell", "browser", "tests"],
 "tests": { "passed": 42, "failed": 0 },
 "human_corrections": 1,
 "retries": 2,
 "cost_usd": 3.84,
 "accepted_artifact": "pr_1842",
 "rollback_point": "commit_7f3a"
}

这使得模型升级变得可比较。

它使得回归可归因

这使得审计成为可能。

它能防止最终答案掩盖了一个破裂的流程。

从最小的闭环运行框架（Harness）开始

运行框架工程（Harness Engineering）并不意味着在首个任务之前构建一个平台。

从最小的可观察、可验证、可恢复的系统入手。

text
LEVEL 0
prompt + model

LEVEL 1
project guide + tools

LEVEL 2
structured state + tests + bounded loop

LEVEL 3
permissions + traces + recovery + human gates

仅当任务复杂度增加时才提升层级。

一个低风险的小任务可能只需要一个提示词和一次审核。

一次持续六小时、能编辑文件、访问网络并创建拉取请求的编码运行，需要一个真正的运行框架（Harness）。

运行框架（Harness）应小于其所控制的故障域（Failure Domain）。

运行框架工程检查清单

在将真实任务托付给智能体之前，先问

text
[ ] Is success defined before execution begins
[ ] Can the agent find the right project knowledge without loading everything
[ ] Does every tool have a clear contract and failure state
[ ] Is execution isolated from production systems
[ ] Are important decisions stored outside the conversation
[ ] Does every risky transition have evidence
[ ] Are irreversible actions protected by approval
[ ] Does every loop have a retry cap and budget
[ ] Can the run resume after interruption
[ ] Can you explain every tool call and state change
[ ] Does failure update a guide, test, tool, or policy
[ ] Can the final artifact be rolled back

如果几个答案是否定的，那么一个更强大的模型也无法让系统变得可靠。

它只会让失败的代价更加高昂。

真正的转变

提示词工程（Prompt Engineering）告诉模型应该做什么

上下文工程（Context engineering）决定模型看到什么内容

Harness 工程构建模型运行的世界。

text
PROMPT -> instruction
CONTEXT -> working view
HARNESS -> operating system
LOOP -> local improvement
GRAPH -> coordination

该模型可能在下个月更换。

工具、测试、状态、策略与追踪记录能够持续改进。

这就是为什么持久优势正从提示词（Prompt）转移到其周围的系统之中。

最优秀的构建者不仅会问哪个模型最聪明，

他们将询问，究竟是哪种环境让这种智能变得可靠。

那就是 Harness 工程

如果你读到这里了

-> 订阅我的 Substack

-> 加入我的 Telegram

-> 收藏本文，以便在构建下一个 Agent 时参考这份清单

-> 关注 @0xwhrrari 以获取更多 Agent 系统的实用解析

21:00 · 2026年8月29日
50.3万
视图
40
65
486
1213
Olivia Parker
@Patrici6009533
8月29日
同一模型，不同轨道。这就是整个产品。
1
2
1540
arle
@arle0x
8月29日
一如既往地精彩拆解，rari！
1
1
2221
Yarchi
@undefinedKi
8月29日
好文章，兄弟。
1
1
582
登录或注册 X

查看实时动态，加入讨论

继续使用手机。
继续关注苹果公司
通过 Google 继续
或者
使用用户名或邮箱登录
相关人员
rari
@0xwhrrari
关注
当下热门
术语
·
隐私
·
Cookies
·
可访问性
·
广告信息
·
更多
© 2026 X Corp.
扫码获取应用
