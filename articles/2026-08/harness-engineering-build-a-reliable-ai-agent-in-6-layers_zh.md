文章
Ichigo
@iiiichigo_chan
Harness 工程（Harness Engineering）：在6层中构建可靠的AI 智能体（Agent）

一个更好的提示词（prompt）可以改善一个回答。

一个更优的运行框架（harness）能提升每次运行的效果。

如果你的智能体（AI Agent）能推理，却仍然会忘记约束条件、选错工具、跳过验证，或者在预算耗尽前一直循环——那么问题并不完全出在模型本身。

模型周围的环境定义不充分。

本指南为您提供一个实用的六层运行框架，可应用于编码、研究、支持或运维智能体。

届时你将：

任务契约
一个上下文编译器
一个受控的工具网关
持久化状态（state）
证据门控
一个trace与恢复循环

并非又一个巨型提示词，而是一个面向 Agent 的操作系统。

为何这至关重要

在 2026 年 2 月，OpenAI描述了一款完全由零手写代码构建的内部产品。

五个月后，该代码库已包含约一百万行代码和约 1,500 个已合并的拉取请求。OpenAI估算，该产品的构建时间约为手动开发所需时间的十分之一。

有趣的部分并非仅仅是Codex能够编写代码。

在代码变得有用之前，人类工程师不得不围绕Codex构建的就是这个。

他们的早期进展缓慢，是因为环境的定义不够明确。智能体缺乏工具、内部结构、可观测的反馈以及可执行的规则。当它失败时，有价值的问题不是“我们怎样让提示词听起来更强硬？”，而是：

缺失了什么能力，以及我们如何让智能体理解并强制执行它？

这便是 Harness 工程（Harness Engineering）。

该模型提供概率推理能力。

运行框架将这一推理转化为受控执行。

plaintext
MODEL
proposes the next action

HARNESS
selects context
authorizes tools
stores state
collects evidence
enforces limits
recovers from failure

提示词是系统的一个输入。

不是系统本身。

最小可行运行框架

一个好用的运行框架（Harness）不需要二十个服务或一个多智能体（multi-agent）群。

它需要明确处理六项作业。

1. 将请求转化为合约

自然语言请求是灵活的。生产任务则不是。

在模型执行动作之前，运行框架（Harness）应将请求转换为一个有界的任务对象：

yaml
task_id: feature_042
goal: Add CSV export to the analytics dashboard

inputs:
 - issue.md
 - repository
 - design/export-flow.png

constraints:
 - preserve the public API
 - do not change the database schema
 - do not add a new dependency

deliverable:
 type: pull_request

done_when:
 - tests pass
 - typecheck passes
 - exported CSV matches the fixture
 - UI screenshot passes review

escalate_when:
 - schema change appears necessary
 - tests fail three times for the same reason
 - requested behavior conflicts with an existing product rule

这能防止静默的任务替换。

没有明确的合同约束，Agent 可能会解决一个更简单版本的问题，并自信地宣布任务完成。

该契约也为运行框架（Harness）提供了客观的评估依据。"看起来不错" 不是停止条件，而 "全部四项检查通过" 才是。

2. 编译上下文而非倾倒它

上下文是一种有限的注意力预算。

常见的错误是注入所有内容：完整的对话、每个工具结果（tool result）、所有项目文档，以及一份 1,000 行的指令文件。

更多上下文并不自动意味着更多理解。

OpenAI的实践法则很简单：给智能体一张地图，而非一本手册。Anthropic 推荐了相同的大方向：保持上下文高信噪比，并仅在需要时检索额外信息。

构建一个上下文编译器，仅组装当前步骤所需的内容：

typescript
function buildContext(task, state) {
 return [
 load("AGENTS.md"), // small project map
 load(task.relevantProductSpec), // task-specific rules
 load(task.relevantArchitecture), // local boundaries
 summarize(state.completedSteps), // compact history
 state.openRisks,
 state.currentArtifacts
 ];
}

使用渐进式披露：

plaintext
AGENTS.md
 -> architecture index
 -> product rules
 -> task-specific guide
 -> exact files and evidence

根指南（root guide）为智能体（Agent）指明知识所在之处。

工具仅在相关时检索更深层次的材料。

对话不应成为你的数据库，而系统提示词（system prompt）也不应成为你的文件柜。

3. 在模型与每个工具之间放置一个网关

该模型可能会请求执行某个操作。

运行框架（Harness）会判断该操作是否有效、是否被允许以及是否可以安全执行。

typescript
async function handleToolRequest(request, run) {
 validateSchema(request);

 const decision = policy.authorize({
 tool: request.name,
 args: request.args,
 task: run.contract,
 risk: classifyRisk(request)
 });

 if (decision === "deny") {
 return observation("permission_denied");
 }

 if (decision === "approval_required") {
 return pauseForHumanApproval(request);
 }

 const result = await sandbox.execute(request);
 return normalizeObservation(result);
}

每个工具都需要：

一个明确的目的
一个无歧义的模式（schema）
一个有范围限定的权限边界（permission boundary）
一个可预测的成功响应
结构化故障响应
一个超时（timeout）

工具结果应返回模型能够推理的观察，而非无限制的终端输出墙。

json
{
 "status": "failed",
 "tool": "run_tests",
 "reason": "2 snapshot mismatches",
 "evidence": [
 "artifacts/home-mobile-before.png",
 "artifacts/home-mobile-after.png"
 ],
 "retryable": true
}

良好的工具设计能减少模型需要猜测的决策数量。

糟糕的工具设计会将每一次操作都变成新的推理难题。

4. 将记忆（memory）外化为持久化状态

长时间运行的智能体（agents）最终会触及上下文限制、崩溃、重启，或将工作移交给另一个 agent。

如果关键状态仅存在于对话记录中，该次运行将十分脆弱。

在模型之外持久化工作状态：

json
{
 "task_id": "feature_042",
 "status": "verifying",
 "current_step": "mobile_visual_check",
 "completed": [
 "implementation",
 "unit_tests",
 "desktop_visual_check"
 ],
 "decisions": [
 "reuse existing export endpoint",
 "preserve current date format"
 ],
 "artifacts": [
 "export.csv",
 "desktop-after.png"
 ],
 "open_risks": [
 "mobile toolbar may overflow at 390px"
 ],
 "next_action": "render mobile viewport"
}

独立存储四种记忆：

plaintext
FACTS stable project knowledge
DECISIONS choices made during this task
STATE where the current run is now
LESSONS failures that should change future runs

这种区分很重要。

临时的工具输出应在被摘要后消失。架构性决策应在每次上下文重置后得以保留。从重复发生的故障中汲取的教训，应转化为一条规则或一个测试用例。

记忆并非“保存整个对话”。

记忆是保留继续正确运行所需的最小信息集。

5. 让证据成为完成的守门人

模型生成了一个制品。

环境会生成关于该制品的证据。

运行框架会判断证据是否充分。

typescript
async function verify(artifact, contract) {
 const evidence = await Promise.all([
 runTests(),
 runTypecheck(),
 validateOutputSchema(artifact),
 renderAndCaptureScreenshots(),
 checkScope(contract.constraints)
 ]);

 const failed = evidence.filter(check => !check.passed);

 if (failed.length === 0) return { status: "accept", evidence };
 if (canRepairLocally(failed)) return { status: "retry", failed };
 return { status: "escalate", failed };
}

优先使用确定性检查：

plaintext
text
CODE tests + types + lint + dependency rules
UI render + screenshot + interaction replay
RESEARCH source coverage + citation match + contradiction check
DATA schema + range + freshness + reconciliation
SUPPORT policy check + PII check + approval boundary

然后，对于需要判断力的工作，使用基于模型的评审器。

制作者与核查者不应拥有完全相同的激励机制。一个生成答案的模型仍可自行审查其输出，但配备不同指令且拥有全新上下文的独立验证者更难以被欺骗。

自主性只应在证据质量同步提升时才得以扩展。

6. 记录运行过程并从确切故障点恢复

没有 Traces，故障就成了一段无从考证的故事。

借助 Trace，它就成了一个可复现的测试用例。

记录：

json
{
 "run_id": "run_2026_08_29_0142",
 "contract_version": "3",
 "model_route": "reasoning-large",
 "context_sources": ["AGENTS.md", "docs/export.md"],
 "tool_calls": 17,
 "state_changes": 6,
 "verification": {
 "passed": 4,
 "failed": 1
 },
 "retries": 1,
 "cost_usd": 2.84,
 "stop_reason": "human_approval_required",
 "rollback_point": "git:9cf31d2"
}

在重试前先对故障进行分类：

typescript
switch (failure.type) {
 case "missing_context":
 updateProjectMap(failure.source);
 break;
 case "bad_tool_contract":
 improveToolSchema(failure.tool);
 break;
 case "missing_guardrail":
 addPolicyCheck(failure.action);
 break;
 case "weak_verification":
 addRegressionTest(failure.example);
 break;
 default:
 escalateWithEvidence(failure);
}

不要仅仅用一个更情绪化的提示词盲目地重新运行相同的环境。

修复缺失的能力，重新运行完全相同的失败案例，并使修复永久生效。

最优秀的运行框架（Harness）具有复合效应。

一次失败，改进后续每一次运行。

一个实用的权限阶梯

模型不应批准其自身的风险行为。

分离提议、授权和执行：

plaintext
MODEL PROPOSES
 ↓
POLICY AUTHORIZES
 ↓
TOOL EXECUTES
 ↓
HARNESS RECORDS THE RESULT

一个简单的起始策略：

yaml
permissions:
 read_files:
 mode: automatic

 write_workspace:
 mode: automatic
 requires:
 - isolated_workspace
 - diff_recorded

 send_message:
 mode: approval_required
 requires:
 - final_content_preview

 deploy_production:
 mode: approval_required
 requires:
 - tests_pass
 - rollback_ready

 delete_data:
 mode: approval_required
 requires:
 - exact_targets
 - recovery_plan

不要为每个任务都施加最大阻力。

阅读公开文档与删除客户记录，不应走同一条审批流程。

将控制与结果相匹配。

最小实用项目结构

你可以无需框架构建此项目的首个版本。

plaintext
agent-harness/
├── AGENTS.md # small map, not an encyclopedia
├── contracts/
│ └── task.schema.json
├── context/
│ ├── architecture.md
│ ├── product-rules.md
│ └── security.md
├── tools/
│ ├── registry.json
│ └── permissions.yaml
├── state/
│ ├── current.json
│ └── decisions.md
├── checks/
│ ├── verify.ts
│ └── regression-cases/
├── runs/
│ └── traces.jsonl
└── lessons/
 └── harness-updates.md

文件夹名称无关紧要。

职责分离确实如此。

按此顺序构建

不要从一群开始。

从最小的、能够证明其自身工作成果的循环开始。

步骤 1 — 定义“完成”

编写契约以及两到三个用于判定成功的检查点。

步骤 2 — 封装一个工具

赋予它一个 schema、一个 timeout、一条 permission rule 以及一个结构化结果。

步骤 3 — 持久化状态文件

存储已完成步骤、决策、产物、开放风险及下一步行动。

步骤 4 — 添加一条恢复路径

当检查失败时，返回确切的证据，并允许一次有限的修复尝试。

步骤 5 — 保存 Trace

记录加载的上下文、执行的工具、变更内容、通过的检查项，以及运行停止的原因。

第 6 步 — 将反复发生的故障转化为基础设施

每个重复出现的错误都应该转化为以下四种产物之一：

plaintext
text
a clearer map
a better tool
a stricter permission
a new test

只有在此时，你才应该增加更多的自主性、更多的工具，或更多的智能体。

什么是 Harness 工程所不涵盖的

它不是一个 5000 行的系统提示词（System Prompt）。

并非为智能体（Agent）提供所有可连接的工具。

它不是永远存储原始转录记录并将其称为记忆。

这并非在没有明确验收标准的工作中添加一个评审智能体。

直到某一次随机运行看起来不错才停止重试。

而且，这并非要将人类从每一个决策中剔除。

一个运行框架（Harness）的存在，是为了将人类注意力投入到需要判断力的地方，并将其余部分自动化。

最重要的指标

不要优化生成的Token（tokens）、发起的tool calls或已启动的任务数量。

优化目标：

plaintext
accepted outputs
----------------
human review minutes

这个比率体现了运行框架（Harness）的应有之义：将模型能力转化为有用、可审查的成果，且无需在产出过程中消耗同等的人力投入。

真正的转变

提示词工程（Prompt engineering）问道：

我该对模型说什么？

上下文工程（Context engineering）问道：

模型此刻应当知晓什么？

Harness 工程提出：

什么系统能让模型执行操作、证明其工作成果、安全恢复并持续改进？

模型将持续演进。

你的 Harness 是你的运行知识得以复利增长的地方。

构建契约。

编译上下文。

管控工具。

持久化状态。

需要证据。

将故障转化为基础设施。

这正是一个强大的模型转变为可靠的智能体（Agent）的路径。

感谢阅读。

如果你喜欢这篇文章，请关注 @iiiichigo_chan

延伸阅读

OpenAI — 运行框架工程：在智能体优先的世界中运用Codex (https://openai.com/index/harness-engineering/)
OpenAI — 深入解析Codex Agent 循环（agent loop） (https://openai.com/index/unrolling-the-codex-agent-loop/)
Anthropic — 面向AI智能体的高效上下文工程 (https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
Anthropic — 为AI智能体编写高效工具 (https://www.anthropic.com/engineering/writing-tools-for-agents)
2:18 · 2026年8月30日
1.2万
视图
6
38
196
349
Lunar
@LunarResearcher
8月29日
模型获得了关注，但运行框架决定了智能体是否真正有效工作。
1
261
Dainer
@Dainer_Jun
20小时
我认为应该添加一个人工审批（human approval）阶段？
69
Routekit Shell
@RoutekitShell
23小时
对我而言，复合积累的部分是关键。一次失败不应仅仅是下一次运行的“更多上下文”。它应成为合适的持久化制品：一个测试、一份契约、一项权限、状态转移（state transition）、一条检索规则等。

当故障改变展示方式时，运行框架会变得更好。
27
登录或注册 X

查看正在发生的事情并加入对话

继续使用手机
继续关注苹果
继续使用 Google
或
使用用户名或邮箱登录
相关人员
Ichigo
@iiiichigo_chan
关注
术语
·
隐私
·
Cookies
·
可访问性（Accessibility）
·
广告信息
·
更多
© 2026 X Corp.
扫描获取应用
