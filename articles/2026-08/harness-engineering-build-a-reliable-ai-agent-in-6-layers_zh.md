文档分段 1/2：

Post
Ichigo
@iiiichigo_chan
驾驭工程：用六层结构构建可靠的 AI 智能体

更好的提示词只能改善一次回答。

更好的驾驭框架能改善每一次运行。

如果你的智能体能够推理，但仍然忘记约束、选错工具、跳过验证，或一直循环直到预算耗尽，那么问题不全在模型。

模型周围的环境定义不够明确。

本指南为你提供一个实用的六层驾驭框架，可应用于编码、研究、支持或运维智能体。

到本文结束时，你将拥有：

- 任务契约
- 上下文编译器
- 带权限的工具网关
- 持久化状态
- 证据门控
- 追踪与恢复循环

不是又一个巨型提示词，而是智能体的操作系统。

为什么现在这很重要

2026 年 2 月，OpenAI 描述了一个内部产品，该产品由零行手工编写的代码构建而成。

五个月后，仓库中约有 100 万行代码和约 1500 个合并的拉取请求。OpenAI 估计，该产品的构建时间约为手工开发所需时间的十分之一。

有趣之处并不在于 Codex 能写代码。

而在于人类工程师在让这些代码变得有用之前，必须在 Codex 周围构建什么。

他们早期的进展缓慢，因为环境定义不明确。智能体缺乏工具、内部结构、可观察的反馈和可执行的规则。当它失败时，有用的问题不是“我们如何让提示词听起来更有力？”而是：

缺少什么能力，我们如何让智能体能够理解并强制执行？

这就是驾驭工程。

模型提供概率推理。

驾驭框架将这种推理转化为受控执行。

```plaintext
模型
提出下一个动作

驾驭框架
选择上下文
授权工具
存储状态
收集证据
执行限制
从失败中恢复
```

提示词是系统的一个输入。

它不是系统本身。

最小可行驾驭框架

一个有用的驾驭框架不需要二十个服务或一个多智能体集群。

它需要明确处理六项工作。

1. 将请求转化为契约

自然语言请求是灵活的。生产任务不能如此。

在模型行动之前，驾驭框架应将请求转化为一个有界任务对象：

```yaml
task_id: feature_042
goal: 向分析仪表板添加 CSV 导出功能

inputs:
 - issue.md
 - repository
 - design/export-flow.png

constraints:
 - 保持公共 API 不变
 - 不更改数据库模式
 - 不添加新依赖

deliverable:
 type: pull_request

done_when:
 - 测试通过
 - 类型检查通过
 - 导出的 CSV 与测试夹具匹配
 - UI 截图通过审查

escalate_when:
 - 似乎需要更改模式
 - 同一原因导致测试连续失败三次
 - 请求的行为与现有产品规则冲突
```

这可以防止静默的任务替换。

没有契约，智能体可能会解决一个更简单的问题版本，并自信地宣布成功。

契约还为驾驭框架提供了客观的评估依据。“看起来不错”不是停止条件。“所有四项检查都通过”才是。

2. 编译上下文，而不是倾倒上下文

上下文是有限的注意力预算。

常见错误是注入一切：完整对话、每个工具结果、所有项目文档，以及一份 1000 行的指令文件。

更多的上下文并不自动意味着更多的理解。

OpenAI 的实用规则很简单：给智能体一张地图，而不是一本手册。Anthropic 也推荐同样的总体方向：保持上下文高信号，并仅在需要时检索额外信息。

构建一个上下文编译器，只组装当前步骤所需的内容：

```typescript
function buildContext(task, state) {
 return [
 load("AGENTS.md"), // 小型项目地图
 load(task.relevantProductSpec), // 任务特定规则
 load(task.relevantArchitecture), // 局部边界
 summarize(state.completedSteps), // 紧凑历史
 state.openRisks,
 state.currentArtifacts
 ];
}
```

使用渐进式披露：

```plaintext
AGENTS.md
 -> 架构索引
 -> 产品规则
 -> 任务特定指南
 -> 确切文件和证据
```

根指南告诉智能体知识在哪里。

工具仅在相关内容变得相关时才检索更深层的材料。

对话不应是你的数据库，系统提示词也不应是你的文件柜。

3. 在模型和每个工具之间放置网关

模型可以请求一个动作。

驾驭框架决定该动作是否有效、被允许且安全执行。

```typescript
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
```

每个工具都需要：

- 一个明确的目的
- 一个无歧义的架构
- 一个受限的权限边界
- 一个可预测的成功响应
- 一个结构化的失败响应
- 一个超时

工具结果应返回模型可以推理的观察结果，而不是无界的终端输出墙。

```json
{
 "status": "failed",
 "tool": "run_tests",
 "reason": "2 个快照不匹配",
 "evidence": [
 "artifacts/home-mobile-before.png",
 "artifacts/home-mobile-after.png"
 ],
 "retryable": true
}
```

好的工具设计减少了模型必须猜测的决策数量。

糟糕的工具设计将每个动作变成另一个推理问题。

4. 将记忆外部化为持久化状态

长时间运行的智能体最终会遇到上下文限制、崩溃、重启，或将工作移交给另一个智能体。

如果关键状态只存在于转录中，运行就是脆弱的。

将工作状态持久化到模型之外：

```json
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
```

分别存储四种记忆：

```plaintext
事实 稳定的项目知识
决策 此任务期间做出的选择
状态 当前运行现在的位置
教训 应改变未来运行的失败
```

这种区分很重要。

临时工具输出应在总结后消失。架构决策应在每次上下文重置后保留。反复出现的失败教训应成为规则或测试。

记忆不是“保存整个聊天记录”。

记忆是保留继续正确所需的最小信息集。

5. 让证据成为完成的门槛

模型产生工件。

环境产生关于该工件的证据。

驾驭框架决定证据是否充分。

```typescript
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
```

首先使用确定性检查：

```plaintext
代码 测试 + 类型 + 代码检查 + 依赖规则
UI 渲染 + 截图 + 交互回放
研究 来源覆盖 + 引用匹配 + 矛盾检查
数据 架构 + 范围 + 新鲜度 + 对账
支持 策略检查 + PII 检查 + 审批边界
```

然后使用基于模型的审查器来处理需要判断的工作。

制作方与检查方不应拥有完全相同的激励。一个写出答案的模型仍然可以审查它，但一个拥有不同指令和全新上下文的独立验证者更难被欺骗。

自主性只应在证据质量同步提升时扩展。

6. 记录运行过程并从确切失败中恢复

没有追踪记录，失败就变成了一个故事。

有了追踪记录，它就变成了一个可复现的测试用例。

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

然后在重试前对失败进行分类：

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

不要盲目地用更情绪化的提示词重新运行相同的环境。

修复缺失的能力，重新运行确切失败的案例，并让修复永久生效。

最好的护栏系统会不断累积。

一次失败能改进每一次未来的运行。

一个实用的权限阶梯

模型不应批准自己的高风险操作。

将提议、授权和执行分开：

plaintext
模型提议
 ↓
策略授权
 ↓
工具执行
 ↓
护栏系统记录结果

一个简单的初始策略：

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

不要对每个任务都施加最大程度的限制。

阅读公开文档和删除客户记录不应走相同的审批路径。

让控制与后果相匹配。

最小可用的项目结构

你可以在不使用框架的情况下构建第一个版本：

plaintext
agent-harness/
├── AGENTS.md # 小型地图，而非百科全书
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

文件夹名称并不重要。

职责分离才是关键。

按此顺序构建

不要从多代理集群开始。

从能证明自身工作的最小循环开始。

第 1 步 — 定义“完成”

编写契约和两到三个决定成功与否的检查。

第 2 步 — 封装一个工具

为它提供模式、超时、权限规则和结构化结果。

第 3 步 — 持久化一个状态文件

存储已完成的步骤、决策、产物、未解决的风险和下一步行动。

第 4 步 — 添加一条恢复路径

当检查失败时，返回确切的证据并允许一次有边界的修复尝试。

第 5 步 — 保存追踪记录

记录加载了哪些上下文、运行了哪些工具、发生了什么变化、哪些检查通过以及运行停止的原因。

第 6 步 — 将重复失败转化为基础设施

每个反复出现的错误都应变成以下四种事物之一：

plaintext
text
更清晰的地图
更好的工具
更严格的权限
新的测试

只有在这之后，你才应该增加更多的自主性、更多的工具或更多的代理。

护栏工程不是什么

它不是一份 5000 行的系统提示词。

它不是把能连接到的每个工具都交给代理。

它不是永远存储原始记录并称之为记忆。

它不是为没有客观验收标准的工作添加一个审查代理。

它不是反复重试直到某次随机运行看起来不错。

它不是把人类从每个决策中移除。

护栏系统的存在是为了把人类注意力花在判断重要的地方，并将其余部分自动化。

最重要的指标

不要优化生成的令牌数、工具调用次数或启动的任务数。

优化：

plaintext
被接受的输出
----------------
人工审查分钟数

这个比率捕捉了护栏系统应该做的事情：将模型能力转化为有用的、可审查的工作，而不在输出过程中消耗同等的人力。

真正的转变

提示词工程问的是：

我应该告诉模型什么？

上下文工程问的是：

模型现在应该知道什么？

护栏工程问的是：

什么系统能让模型行动、证明其工作、恢复并安全改进？

模型会不断变化。

你的护栏系统是你的操作知识不断累积的地方。

构建契约。

编译上下文。

管控工具。

持久化状态。

要求证据。

将失败转化为基础设施。

这就是一个有能力的模型如何成为一个可靠的代理。

感谢阅读。

如果你喜欢这篇文章，请关注 @iiiichigo_chan

延伸阅读

OpenAI — 护栏工程：在代理优先的世界中利用 Codex (https://openai.com/index/harness-engineering/)
OpenAI — 展开 Codex 代理循环 (https://openai.com/index/unrolling-the-codex-agent-loop/)
Anthropic — AI 代理的有效上下文工程 (https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
Anthropic — 为 AI 代理编写有效的工具 (https://www.anthropic.com/engineering/writing-tools-for-agents)
2:18 · 2026年8月30日
1.2万
浏览量
6
38
196
349
Lunar
@LunarResearcher
8月29日
模型获得了关注，但护栏系统决定了代理是否真正有效
1
261
Dainer
@Dainer_Jun
20小时
我觉得应该加一个人工审批阶段？
69
Routekit Shell
@RoutekitShell
23小时
累积的部分对我来说是关键。失败不应该只是成为下一次运行的“更多上下文”。它应该成为适当的持久化产物：一个测试、契约、权限、状态转换、检索规则等。

当失败改变系统时，护栏系统才会变得更好 显示更多
27
登录或注册 X

看看正在发生什么，加入对话

继续使用手机号
继续使用 Apple
继续使用 Google
或
使用用户名或邮箱登录
相关人物
Ichigo
@iiiichigo_chan
关注
条款
·
隐私
·
Cookie
·
无障碍
·
广告信息
·
更多
© 2026 X Corp.
扫码获取应用
