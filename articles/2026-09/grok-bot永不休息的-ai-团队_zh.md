Post
rari
@0xwhrrari
Grok Bot：永不休眠的AI团队

Grok 4.6 模型、持久化计算机、循环、图（graphs）、例程，以及支撑完成实际工作的智能体（agents）的审批系统

大多数人会像使用聊天机器人一样使用 Grok Bot

他们将创建一个 Bot

给出一个模糊的请求

连接他们拥有的每个账户

然后等待奇迹

这正是把一个始终在线的智能体（agent）变成始终在线的混乱源头的最快方式

Grok Bot 比另一个聊天界面更有意思

它为智能体提供持久化计算机、真实工具、持久化 context、周期性例程，以及可与之协调的其他智能体

Grok 4.6 提供推理能力

运行框架（harness）提供运行环境

该循环带来改进

图（graph）提供协调机制

而审批系统决定自治的边界

Elon Musk 将 Grok Bot 和 Grok 4.6 定位为同一轮发布的一部分

在修复早期 beta 中的基本问题，并于本周晚些时候发布 Grok 4.6 后，我们将扩大 Grok Bot beta 的范围。

- Elon musk

这种框架很重要

模型与 Bot 正作为一个智能体系统（Agent System）共同改进

https://x.com/i/web/status/2087224798078517251

产品不是模型

产品是围绕模型构建的操作系统

本文展示了如何正确设计这一系统

我会在 Substack 上发布关于AI智能体、工作流（workflows）和生产系统的实用拆解，欢迎在此订阅 newsletter
Grok Bot 改变了工作单元

聊天机器人返回一个答案

Bot 返回已完成的任务

这听起来像是一个很小的区别

它改变了整个架构

text
CHAT
request -> response -> session ends

BOT
goal -> inspect -> act -> verify -> continue -> deliver

Bot 可以保持浏览器会话处于打开状态

它可以跨网站和桌面工具运行

它可以创建和整理文件

它可以在终端中运行命令

它可以在存在API时使用连接器，而在不存在时使用computer use

即使合上笔记本电脑，它也能继续运行

它可以在第二天返回时，工作已经放在工具中——正如人类原本会将其留在那里一样

这才是真正的转变

输出不再是一段解释你应该做什么的文字

输出是已变更的 CRM、准备好的草稿、复现的 Bug、整理好的文件夹、更新后的电子表格或待审核队列

有用的抽象并不是“一个知道各种事情的AI”

它是“对结果负责的队友”
从可验证性出发，而不是追求炫技

第一次任务不应追求惊艳

它应当足够真实，能够产生实际影响；同时足够小巧，能在一分钟内完成验证

text
BAD FIRST JOB
"run my operations"

GOOD FIRST JOB
"open the latest support report, identify the three largest changes,
and leave a cited summary in the review folder"

这样你就能获得可见结果、一条便于检查的短路径，以及在 Bot 误解任务时的清晰失败信号。

信任应当与证据按相同顺序扩展

第一个有边界的任务

然后是一套可重复执行的例行流程

然后是一个 schedule 或 trigger

然后是 Bots 之间的交接

只有在此之后，系统才应获得更广泛的权限

Grok 4.6 是大脑，而不是完整的智能体

Grok 4.6 的训练从一开始就考虑了长时间运行的智能体（Agents）和多步骤知识工作

SpaceXAI 表示，该模型接受了更长时间的补充训练，在不同的 Agent Harness 中重新生成了 SFT 轨迹，并针对编码、知识工作、Web 开发、CAD 及其他工具环境进行了强化学习。

这很重要，因为长时任务的失败方式不同于单轮聊天

模型必须在多次行动中保持目标一致

它必须决定下一步检查什么

它必须在工具产生意外结果后完成故障恢复

它必须测试自己的工作，而不是把第一个看似合理的输出视为完成。

text
ONE-TURN INTELLIGENCE
understand -> answer

AGENTIC INTELLIGENCE
understand -> act -> observe -> update state -> act again

SpaceXAI 报告称，Grok 4.6 在智能体式（agentic）编码和知识工作评测中取得了更强的结果，包括 CursorBench、DeepSWE、FrontierCode、APEX-Agents 和 AA-Briefcase

但基准测试分数并不能决定 Bot 可以打开哪个账户

它不会记住你的审批策略

它不会决定失败的分支应当重试（retry）、升级处理，还是停止。

它并不能保护发布按钮

这些职责属于模型周围的系统

https://x.com/i/web/status/2087562800982077492

发布顺序很重要

持久化智能体（Agent）会同时放大模型能力与模型错误

模型越智能，其运行边界就越重要

一个模型，三层控制层

理解 Grok Bot 最清晰的方式，是将模型与控制它的三层机制分开。

text
MODEL
Grok 4.6 reasons and proposes the next action

HARNESS
the computer, tools, context, state, permissions, and traces

LOOP
the evidence-driven cycle that improves one unit of work

GRAPH
the routing and handoffs that coordinate many Bots and routines

大多数薄弱的设置都会将模型与全部三层控制层塞进一个巨大的提示词（prompt）中

Prompt 描述角色、存储历史记录、发明工作流（workflow）、批准操作、检查输出，并决定是否重试

这会让每个故障看起来都像是提示词问题

这不是

如果 Bot 忘记了一项重要偏好，你就遇到了状态（state）问题

如果它打开了错误的工具，说明你存在路由问题

如果它发送了本应保持为草稿的内容，那么你就存在权限问题

如果它反复执行同一个失败的操作，你就遇到了循环问题

如果五个 Bot 不断询问你“谁应该做什么”，那你面对的就是一个图问题

更好的提示词（prompts）可以改进一次运行

更好的架构会改善未来的每次运行

Layer 1 / Harness 工程（Harness engineering）

Harness 是 Grok 4.6 行动于其中的世界

对 Grok Bot 而言，这个世界包括持久化云计算机、浏览器、文件系统、终端、已连接的应用、已保存的文件、记忆（memory）、例行任务、审批规则和活动历史。

一个好的运行框架（Harness）承担七项工作

text
1 DEFINE turn a request into a contract
2 SELECT expose only relevant context
3 ACT provide the right tools
4 REMEMBER preserve durable state
5 OBSERVE collect evidence
6 AUTHORIZE gate consequential actions
7 EXPLAIN record what happened
Give the Bot a job before giving it a task

不要以以下内容开头：

text
Help me with my business

从一个有边界的角色开始

text
name: Research Operator
owns: source collection and evidence packs
inputs:
 - topic brief
 - approved source list
 - previous research archive
outputs:
 - cited findings
 - contradiction log
 - open questions
may:
 - browse public sources
 - organize research files
 - draft summaries
must_ask_before:
 - messaging a person
 - purchasing access
 - publishing anything
done_when:
 - every factual claim has evidence
 - conflicts are surfaced
 - unresolved gaps are explicit

角色描述本身就是持久化基础设施

下一条消息仅包含当前任务

混淆这两者，会让 Bot 每天早上重新学习自己的工作

为其提供最小但实用的工具面ನ್ನಡ

更多访问权限并不会自动造就更好的智能体（Agent）

它会扩大故障面、】【

text
RESEARCH BOT
browser + drive + notes

FINANCE BOT
invoices + spreadsheet + accounting sandbox

PUBLISHING BOT
drafting workspace + asset folder
publish action behind approval

连接该角色所需的系统

不要连接整个公司，因为 Bot 可能稍后需要它

连接一次，按角色授权

Connections 是账户级基础设施

一旦连接了某项服务，同一账户下的其他 Bot 可能也能够通过该连接进行操作

这样可以让第二个 Specialist 更快启动

它还会让一次粗心的连接波及范围大于一个 Bot

text
ACCOUNT CONNECTION
Slack is available to the Grok Bot workspace

ROLE AUTHORITY
Research Bot may read #market-intel
Content Bot may create drafts in #content-review
Neither Bot may send external messages

集成回答了系统能够触达什么。

角色契约回答了这个 Bot 获准如何处理它

将这两项作为两个独立的决策处理

将工作存储在对话之外

消息用于协调

文件和结构化状态用于维持连续性

text
{
 "job_id": "launch_042",
 "owner": "campaign_bot",
 "status": "awaiting_approval",
 "artifacts": ["brief.md", "copy-v3.md", "creative-02.png"],
 "evidence": ["source-pack.json", "qa-report.md"],
 "decisions": ["use enterprise angle", "exclude unverified claim"],
 "blocked_by": ["human_publish_approval"]
}

下一个 Bot 应继承工作的状态

不是对三十条消息线程的有损摘要

共享计算机既是功能，也是安全边界

这是大多数人都会忽略的细节

你的 Bots 可以协作，因为它们共享同一台用户作用域持久化计算机（user-scoped persistent computer）

它们可以共享文件、浏览器会话和应用登录状态

每个 Bot 都可以拥有自己的屏幕并行工作

但这些屏幕并不是彼此独立的安全边界

如果共享计算机上存在一个登录会话，则将其视为该账户下的每个 Bot 都可用

text
SHARED COMPUTER
 |-> shared browser sessions
 |-> shared files
 |-> shared app logins
 |-> separate Bot screens

NOT
 |-> isolated secrets per Bot
 |-> isolated trust zones per Bot

这让交接变得容易得多

这也意味着，仅靠角色描述无法实现强隔离

如果两个 Bot 确实需要不同的信任级别，请分离底层账户、环境或凭证

不要把礼貌的指令与安全控制混为一谈

移交登录信息，但绝不移交密码

云端计算机在没有干净API的软件上最有用。

Bot 可以持续导航，直到遇到认证墙；随后暂停本次运行，并将屏幕交给你

你直接在该会话内部进行身份验证

控制权返回后，Bot 从相同的状态继续运行

text
BOT OPENS TOOL
 |
 v
LOGIN REQUIRED -> HUMAN AUTHENTICATES -> SESSION RESUMES
 |
 v
 BOT CONTINUES

PASSWORD IN CHAT -> NEVER

Bot 接收的是经过身份验证的会话，而不是写入对话中的凭证

这种区分至关重要，因为聊天是协调界面，而不是秘密存储库

记忆让协作成为可能

隔离限制爆炸半径

你需要知道你的架构正在购买哪一种
根据可逆性划定审批线

最佳审批策略不应基于任务规模

它取决于该操作能否安全撤销

text
FINISH WITHOUT ASKING
research
summarize
classify
draft
organize
prepare
stage
simulate

PARK FOR APPROVAL
send
publish
purchase
transfer money
delete or overwrite
change permissions
modify production
accept legal terms

一次良好的运行应以所有可逆步骤完成、所有不可逆步骤清晰就绪而结束

text
{
 "completed": [
 "researched 42 accounts",
 "ranked 10 prospects",
 "drafted 10 messages"
 ],
 "sent": 0,
 "published": 0,
 "waiting_for_approval": [
 "send outreach batch",
 "update production CRM"
 ]
}

Bot 不应因为未来某一步需要审批，就在 10% 处返回

它应完成其余 90%，展示拟执行的确切操作，并在边界处停止

这就是自治性保持实用、却不至于鲁莽失控的方式

Harness 定义了 Bot 可以进入的世界

该循环定义了工作继续之前必须完成的事项

Layer 2 / Agent 循环工程 (Loop Engineering)

一个始终在线的 Bot 需要反馈闭环

但“持续尝试直到成功”并不是一个循环

这是一笔没有上限、却对应着未定义结果的预算

生产级 Agent 循环需要五项要素

text
TARGET what success means
EVIDENCE how the result is checked
FEEDBACK the exact gap
BOUND how many retries are allowed
ESCALATION what happens when retries fail

有用的模式很简单

text
for (let attempt = 1; attempt <= 3; attempt += 1) {
 const artifact = await grokBot.execute(contract, state)
 const evidence = await verify(artifact, contract.doneWhen)

 if (evidence.pass) {
 return stageForApproval(artifact, evidence)
 }

 state.failures.push({
 attempt,
 gap: evidence.gap,
 repair: evidence.recommendedRepair
 })
}

return escalateToHuman(state)

模型选择如何修复局部缺口

Harness 决定是否允许再次尝试

这种分离可以防止同一个模型悄无声息地扩大自身的 Token 预算

将演示转化为例行程序

Grok Bot 可以观察一个 workflow，将路径保存为例程，并按需或按计划再次运行它

这比凭记忆写出完美的自动化规范更强大

最佳的第一个例行程序是

至少每周重复一次
分布在两个或更多 Tool 中
足够稳定，可以用于演示
易于通过可见结果进行验证
在最终步骤之前均可逆
text
BAD FIRST ROUTINE
"run my entire company"

GOOD FIRST ROUTINE
"every morning, collect yesterday's support issues, group duplicates,
draft a priority summary, and leave it in the team document by 8 AM"

手动运行，并让 Bot 监视其中

修正边（edge）情况

只有结果正确后，才保存该 routine

然后添加一个日程

不要让一个不清晰的流程自动化得更快

请先澄清这一点

Grok Bot 提供了两种有用的方式来唤醒已保存的路径

text
SCHEDULE
run at a known time
example: weekday briefing at 07:00

TRIGGER
run when the environment changes
example: new lead arrives, document changes, support alert appears

计划表让 Bot 准时

一个 trigger 使其具备响应能力

两者都应指向同一个经过测试的例程，而不是每次触发时都重新发明一套 workflow

最强的触发指令通常紧跟在一次成功运行之后

text
"This result is correct. Save the path as a routine.
Run it whenever a new launch brief appears in the intake folder.
Keep every external action behind approval."
Make verification independent of the first answer

绝不要用一个含糊的 prompt 同时进行生成和审批

text
WEAK
create the report and make sure it is good

STRONG
BUILDER creates the report
CHECKER tests it against an explicit rubric
HARNESS decides whether the result may continue
For code, verification can be tests and a clean diff
For visual work, it can be a screenshot and a checklist
For research, it can be source coverage, contradiction checks, and claim-to-evidence mapping
For operations, it can be counts before and after the change

循环应该推进，因为证据发生了变化

并不是因为 Bot 仍然感到乐观

现在，一个 Bot 已经能够可靠地完成一项边界明确的工作

下一个问题是如何协调多个作业，同时不让人类成为路由器

Layer 3 / 图工程（Graph engineering）

一个 Bot 就是一个循环

一组 Bots 是一个 Graph

当多个智能体（Agents）可以同时工作时，路由的重要性就超过了提示词（Prompt）工程】【。

text
USER
 |
 v
CHIEF OF STAFF
 |-> RESEARCH
 |-> OPERATIONS
 |-> BUILD
 |-> REVIEW
 |-> DISTRIBUTION
 |
 v
HUMAN APPROVAL

主管不需要亲自完成每项工作

它负责接收、任务拆解、路由、共享优先级、状态管理和升级处理

专业人员负责其职责范围内的工作

群组线程应接收一个目标，而不是预先编写的任务列表

text
TASK LIST
the human already decomposed the entire project
the Bots only execute instructions

OBJECTIVE
the Chief decomposes the result
specialists claim the work they own
the graph exposes dependencies and gates

如果人类仍然必须在各个 Bot 之间复制每份产物、为每一步分配任务，并告知每位专家何时开始，那么这个系统就没有在进行协调。

它是一个聊天窗口集合

雇用专家，而不是个性。

不要创建五个都是“智能助手”的 Bot

创建五个清晰的所有权边界

text
chief_of_staff:
 owns: intake, routing, deadlines, escalation

researcher:
 owns: sources, evidence, contradictions

builder:
 owns: implementation and artifacts

checker:
 owns: tests, policy, completion evidence

operator:
 owns: updates inside approved tools

专业化可减少上下文污染

它还能让故障责任清晰可追溯

当通才产出糟糕的工作时，你无法判断问题究竟出在研究、执行、验证，还是权限上

当某个 specialist 失败时，你知道该修复哪份契约

传递所有权，而不是 transcripts

最糟糕的多智能体系统（multi-agent system）会将完整对话复制到每个智能体中

更好的系统会传递一份精简的交接数据包

text
{
 "from": "researcher",
 "to": "writer",
 "objective": "draft the launch analysis",
 "artifacts": ["evidence-pack.json", "outline.md"],
 "decisions": ["focus on persistent agents"],
 "constraints": ["no unverified performance claims"],
 "open_questions": ["confirm enterprise availability"],
 "next_gate": "fact_check"
}

制品承载着细节

交接会携带状态

线程承载着讨论

不要要求一个巨大的上下文窗口（context window）同时承担这三种角色

仅并行处理相互独立的工作

多个 Bot 同时运行并不会自动带来速度提升

图需要真正的独立性

text
 -> COMPANY SOURCES ---
REQUEST -> DECOMPOSE -> PRODUCT TESTING ----> SYNTHESIZE
 -> EXPERT POSTS -------
 -> COMPETITOR MAP -----

如果一个分支需要另一个分支的输出，就保留这种依赖关系

如果不满足，就删除该边

然后，仅在下一步决策需要完整集合时才进行合并

目标不是追求最大的并行（parallelism）

目标是将不必要的等待降至最低

当这些路径以角色、权力和节奏的形式持续存在时，图就变成了一个组织

当图（Graph）成为组织

Grok Bot 让创建更多智能体（Agents）变得轻松

这并不意味着更多智能体（Agents）总能改进系统

在某个阶段，架构不再像软件，而开始像一家公司

每个团队都需要

text
OWNERSHIP who is responsible for the result
INTERFACES what moves between roles
AUTHORITY which actions each role may take
CADENCE when recurring work runs
ESCALATION which decisions return to the human
AUDIT how the system proves what happened

能够向另一个 Bot 发送消息的 Bot，并不会自动实现协作

它只是已连接的

当所有权与交接规则明确时，协调就会出现

text
CONNECTION
Bot A can message Bot B

COORDINATION
Bot A knows when Bot B owns the next step,
what evidence must be passed,
and which gate follows the handoff
A practical one-person company graph

对于单人运营者，一个实用的初始团队可能如下所示

text
YOU
 |
 v
CHIEF OF STAFF
 |-> RESEARCH BOT
 | output: cited evidence pack
 |
 |-> CONTENT BOT
 | output: draft + asset brief
 |
 |-> REVIEW BOT
 | output: fact/style/format report
 |
 |-> DISTRIBUTION BOT
 output: staged posts + schedule
 |
 v
YOU APPROVE PUBLICATION

首领只接收一个目标

它会拆解工作

它会将每个部分路由给对应的专家

它跟踪共享截止时间

它不会亲自重写每个产物

只有在需要你的判断或身份的决策环节，才会将你纳入其中

那不是提示词工程（prompt engineering）。

它是编码为图的管理机制

Grok Bot 的十步操作系统

最好的起点不是第一天就创建十个 Bot

先构建一个可靠的任务，再围绕证据扩展系统

前面的章节描述了该架构

这就是构建它的顺序

1. 从一项真实且反复发生的工作开始

选择你已经在做的事情

结果应当清晰可见且易于判断

text
GOOD
prepare the weekly competitor report
reconcile new invoices
triage the support inbox
reproduce new product bugs

BAD
make me more productive
grow the company
handle everything
2. 用一句话定义角色

如果一个角色需要六个互不相关的动词，就拆分它

text
"Own weekly competitor monitoring and deliver a cited change report"
3. 在执行前定义完成标准
text
done_when:
 - all approved sources checked
 - every change linked to evidence
 - duplicates merged
 - uncertain claims marked
 - report saved in the correct folder
4. 仅连接该角色所需的工具

当真实的阻塞任务证明确有必要时，再添加访问权限

不要预先授权假设性工作

如果某个连接在账户范围内共享，必须在角色契约和审批策略中明确记录这一点

5. 演示一次该 workflow

向 Bot 展示跨越各类工具的真实路径

解释你作出每项判断的原因

更正同一线程中的首个输出

最佳 Demo 应具备以下特征：可重复、多 Tool、稳定且可进行视觉核验

6. 将成功路径保存为例程

该例行流程应包含输入、输出位置、验证、调度和审批边界

text
routine: weekly_competitor_scan
trigger:
 type: schedule
 value: monday 06:00
output: /reports/competitors/YYYY-MM-DD.md
verify:
 - source links open
 - changes are newer than previous report
 - every claim maps to evidence
approval:
 - publishing requires human approval
7. 在引入自治能力之前添加检查器

不要因为某个例程成功过一次，就提升它的权限

多运行几次

将输出与相同的评分标准进行比较

8. 限制重试次数并定义升级机制
text
retry twice for transient tool failure
repair once for failed schema
ask the human when evidence conflicts
stop when cost or time budget is reached
9. 仅在出现瓶颈时添加专门 Agent

当共享 context 变得嘈杂时，将研究与写作分离

当自审能力变弱时，将检查与构建拆分开

当权限边界不一致时，将操作与分析拆分开来

图应当源于真实压力增长

并非出于显得老练的愿望

10. 每周审计系统

始终运行的自动化会悄然腐化

站点会变化

凭证过期

例行流程会漂移

偏好设置变更

弱输出可能连续数天重复，却无人察觉

向每个 Bot 索取每周收据

text
{
 "routine": "weekly_competitor_scan",
 "runs": 4,
 "passed": 3,
 "required_human_repair": 1,
 "average_runtime_minutes": 18,
 "repeated_failures": ["source login expired"],
 "recommendation": "keep"
}

然后自行抽查一个产物

Bot 可以总结其历史记录

它不应成为自身历史的唯一裁判

对每个例行流程，提出三个令人不适的问题

text
Did it run when it should have run
Was the output actually correct
Would I notice if this routine disappeared tomorrow

如果第三个问题的答案是否定的，就删除或重新设计该例程

目标不是积累自动化能力

目标是在不积累隐性故障的前提下移除工作

自治阶梯

不要从第一条消息直接跳到无人值守运行

通过有证据支撑的等级晋升 Bot

text
LEVEL 0 OBSERVE
Bot watches the workflow and produces no changes

LEVEL 1 PREPARE
Bot researches, drafts, classifies, and stages reversible work

LEVEL 2 EXECUTE WITH APPROVAL
Bot completes the path but parks consequential transitions

LEVEL 3 RUN BY SCHEDULE OR TRIGGER
Bot starts without a prompt and returns a receipt

LEVEL 4 COORDINATE SPECIALISTS
Chief routes work across Bots and escalates only judgment

层级之间的移动应要求提供证明

text
promotion_gate:
 minimum_clean_runs: 5
 verification_pass_rate: 1.0
 unresolved_side_effects: 0
 rollback_tested: true
 approval_policy_tested: true
 receipt_complete: true

这会构建出一个凭借表现赢得自治权的系统，而不是因为demo曾经看起来不错就直接获得自治权。

当例行任务发生降级时，将其下移一层

Autonomy 是一种运行时（runtime）特权

不是永久性的人格特征

值得复用的三种生产模式

一旦 Bot 通过稳定、干净的运行获得自治能力，以下是最值得优先构建的系统

模式 1 / Overnight research desk
text
SCHEDULE -> SCOUT -> SOURCE CHECK -> CLUSTER -> BRIEF -> MORNING REVIEW

Scout 仅搜索已批准的路径

Source Checker 会拒绝不受支持的声明

Cluster Bot 合并重复项

Brief Bot 编写执行摘要

人类在早晨收到一个紧凑的审查队列

模式 2 / Bug 复现与修复
text
ISSUE -> REPRODUCE -> CAPTURE EVIDENCE -> FILE TICKET
 |-> DEBUG -> TEST -> REVIEW

第一个 Bot 负责复现

它捕获确切的步骤、日志、屏幕截图和环境信息

只有在那之后，调试 Bot 才会收到该案例

这可以防止构建器去修复臆想中的故障

Pattern 3 / 具有公共门槛的内容系统
text
IDEA -> RESEARCH -> DRAFT -> FACT CHECK -> ASSET BUILD -> FINAL PACKAGE
 |
 v
 HUMAN PUBLISH GATE

每个可逆步骤都会自动完成

未经批准，任何公开内容都不得离开系统

人只需审核一个 package，而不是管理五个 Bots

最浪费时间的故障模式

1. 一名通才负责一切

其记忆中充斥着不相关的偏好

它的线程将变得无法审计

它的权限范围会变得比任何单项任务所需的都更广泛

2. Bot 接收任务，但没有完成定义

它会在某个看似合理的结果处停止

你期待的是完整的内容

双方都认为对方表达得不清楚

3. 每个 Bot 都会接收完整的对话记录

Context 增长速度快于有用 State

旧指令会与当前工作竞争

交接内容会变成摘要的摘要

4. 共享计算机被误认为是隔离】【。

不同的 Bot 名称会形成视觉边界

它们不会创建凭证边界

5. 该循环没有硬停止机制

Bot 会用略有不同的措辞重试错误路径

成本上升，但信息并未增加

6. Checker 与 Builder 处于同一 context

相同的假设延续到了评审中

信心变成证据

7. 一切都在等待审批

Bot 变成了一个更慢的工作界面，而这些工作你仍然需要手动管理

8. 没有任何内容等待审批

系统可能在你看到计划之前，就已经代表你行事、花费资金、删除数据，或更改生产环境。

9. Routines 永远不会被删除

系统中充斥着技术上能够运行、实际上却毫无价值的自动化任务

最佳自动化组合并不是最大的

它是那种一旦移除，每个例行流程都会被人察觉缺失的版本

Grok Bot 发布检查清单

在让 Bot 通宵运行前，先问：

text
[ ] Does the Bot own one clear result
[ ] Is done defined before the run begins
[ ] Are inputs and output locations explicit
[ ] Does it have only the tools required for the job
[ ] Are secrets and shared sessions treated as account-wide access
[ ] Are logins handed off to the human instead of pasted into chat
[ ] Is durable state stored outside the conversation
[ ] Does every important claim or change produce evidence
[ ] Does every schedule or trigger call a previously tested routine
[ ] Are retries bounded by count, time, and cost
[ ] Are sending, publishing, purchases, deletion, permissions,
 production changes, and legal acceptance protected by approval
[ ] Can another Bot inherit the work through artifacts and a handoff packet
[ ] Does a Bot group receive one objective with explicit ownership boundaries
[ ] Can the system resume after interruption
[ ] Can you explain what happened without asking the same Bot to remember
[ ] Does the weekly audit remove weak routines

如果有多个答案为“否”，系统就还没有准备好实现更高程度的自治。

它已准备好迎接更好的 Harness

Grok Bot 的真正优势

Grok 4.6 是推理引擎

持久化计算机为其提供了可工作的环境
Harness 将访问转化为受控执行
循环会将错误转化为有针对性的修复
图将多个 Bot 组成一个团队

审批边界将身份与不可逆决策保留在人类手中

text
PROMPT tells the Bot what you want
CONTEXT tells it what matters now
HARNESS gives it a controlled world
LOOP makes one job improve
GRAPH coordinates many jobs
APPROVAL protects consequential transitions

大多数用户会问 Grok 4.6 是否比另一个模型更聪明

更好的问题是：围绕它构建的系统能否将智能转化为可靠的工作成果

因为智能体的未来，不会由能写出最令人印象深刻答案的模型决定

最终胜负将由这样的系统决定：它能完成任务、证明发生了什么，并知道何时停止。

这就是 Grok Bot 背后的系统

如果你读到了这里

-> 订阅我的 Substack

-> 加入我的 Telegram

-> 收藏本文，构建下一个智能体（Agent）时即可使用这份检查清单

-> 关注 @0xwhrrari

21:00 · 2026年9月3日
15.3 万
视图
8
14
81
195
cristal💎
@0xCristal
9月3日
优秀的文章

想引用它
1
1
122
reira
@reiraxbt
9月3日
精彩的文章 <3
1
1
157
slash1s
@slash1sol
9月3日
新的 alpha 文章，谢谢，兄弟。
1
1
145
登录或注册 X

查看最新动态，加入讨论

继续使用手机
继续使用 Apple
使用 Google 继续
Continue with Google
或
使用用户名或电子邮件登录
相关人员
rari
@0xwhrrari
关注
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
