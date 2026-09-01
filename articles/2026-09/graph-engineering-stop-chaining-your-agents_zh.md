文章
seeco
@seeconvm
图工程（Graph Engineering）：停止链接你的智能体（Agents）

我所见过的几乎每一个多步骤智能体（agent）都是一个队列。第一步，第二步，第三步，每一步都彬彬有礼地等待上一步完成。而一旦你仔细观察，大约有一半的步骤其实根本无需等待。

它们不做路由，不做拆分，不并行运行任何任务。它们只是排成一列，一个头、一个上下文、一次只处理一件事，直到上下文窗口被填满，智能体（Agent）便悄然忘记了自己最初要做的事。

这是没人会为你明说的部分。一个提示词（prompt）就是一个句子。一个循环就是一个周期。一个运行框架（harness）是你的智能体所站立的平台。但工作本身的形状——什么在什么之前运行，什么可以同时运行，什么真正必须等待其他所有部分——这个形状就是一个图（graph）。节点（Nodes）负责思考。边（Edges）传递结果。

Claude Code已直接提供构建这些图（graphs）的工具：动态工作流（workflows）。Claude编写一个纯JavaScript编排脚本，然后启动一个协同工作的子 Agent（subagents）集群来执行它。协调过程本身不消耗任何模型Token（tokens），因为协调由代码完成，而非另起对话。

这是我用来将单文件 Agent 转换为一个能跨集群扇出、自我核查发现、并达成单个 Agent 无法企及的结果的图的 14 步路线图。

一目了然

1. 节点（Node）是作业。边（Edge）是流动的内容。

2. 你的线性脚本其实已经是一个图，只是一个糟糕的图而已。

3. 每个节点（node）都会获得一个契约。

4. 每个边（edge）都必须定义数据契约（data contract）。

5. 使用parallel()进行扇出。

6. 仅在必须时，在屏障（barrier）处进行扇入。

7. 菱形模式：拆分、执行、合并。

8. 使用条件语句为运行时（runtime）处的边进行路由。

9. 在边（Edge）上放置验证器。

10. 隔离节点，使故障保持局部化。

11. 添加一个循环，但使其能够收敛。

12. 在各节点间对模型进行分层。

13. 拓扑（Topology）是你的成本与你的延迟（latency）。

14. 让Claude为你绘制图。

01. 节点与边，或为什么“然后”不是依赖

一个图恰好包含两部分，理清这两部分就能消除大部分困惑。

节点（Node）是工作的一个单元。一个智能体（Agent）、一个有界任务、一个输入、一个输出。

边（Edge）是一种依赖关系。它表示此节点的输出会成为彼节点的输入。这便是其完整定义。

几乎所有人都会犯的一个错误，是把“然后”当作一条边（Edge）。在“总结这个文件，然后告诉我天气”这句话中，根本没有任何边。天气信息并不依赖于文件总结。这是两个互不关联的节点（Node），却被一个线性脚本毫无道理地强行串联在一起。

要提出的问题。在你的 Agent 中，对于每一个“然后”：下一步真的读取了上一步的输出吗？如果没有，那里就不存在边（Edge），而等待则是纯粹的浪费。

plaintext
Draw it as boxes and arrows. A box is one agent()
call. An arrow is a variable that leaves one call's
return and enters another call's prompt. If you cannot
draw the arrow, if no variable crosses, those two boxes
are independent. That independence is the thing you are
going to spend the rest of this article exploiting.
02. 你的线性脚本是退化图

当你将一个智能体（Agent）描述为“执行 A，然后 B，然后 C，然后 D”时，你其实已经画了一张图。你画出的是可用图中最糟糕的一种：一条单一的、不分叉的链，其中每个节点（Node）都恰好有一条入边（Edge）和一条出边。

它能运行。但它运行缓慢，且故障严重，因为链式结构毫无冗余可言。如果 C 停滞，D 将永远不会发生，A 产出的所有内容都会阻塞在上游，无处可去。

这里第一个真正的技巧是重绘链路。拿出你的线性 Agent，遍历每一条边，并用步骤 01 的问题来审视它。实践中你会发现，有两三条边根本不传输数据。它们存在，仅仅是因为你当时恰好按那个顺序输入了指令。

切断那些箭头，链条就会横向坍缩成某种更宽广的形态：几个可以同时运行的独立节点，共同汇聚到一个需要它们所有结果的节点。

03. 为每个节点赋予契约

你无法推理的节点，就是无法并行的节点。修复之道在于一个契约：有界输入、有界输出、恰好一项任务。

节点的输入是显式传入的内容，而非从其恰好所在的某个共享窗口中隐式获取。输出则具有明确的结构，最好经过验证，这样下一个节点就能直接消费，无需猜测。

在工作流（workflow）中，你通过一个模式（schema）来强制执行这一点。当你向Claude传递一个带有附加JSON schema 的 agent() 调用时，它所创建的子 Agent（subagent）将被迫返回经过验证的结构化数据。验证发生在底层的工具调用（tool call）层，因此Claude在数据不匹配时会重试，而不是交给你需要解析并祈祷其正确的自由文本。

json
// A node with a real contract: bounded in, validated
out, one job.
const FINDING = {
 type: 'object',
 additionalProperties: false,
 properties: {
 title: { type: 'string' },
 url: { type: 'string' },
 impact: { type: 'string', enum: ['high', 'medium',
'low'] },
 },
 required: ['title', 'url', 'impact'],
};

const result = await agent(source.prompt, {
 label: `research:${source.key}`,
 schema: FINDING, // forces validated
structured output
 agentType: 'general-purpose',
});
// result is now a shape the next node can trust, not
free text.

这就是一个可接入图（Graph）的节点Claude与仅在人工阅读其输出时才工作的节点之间的全部区别。

04. 边也是数据契约

一条边（Edge）并非“A 之后是 B”，而是关于其上传输内容的一种约定：A 产出这种数据结构，B 则是为消费这种数据结构而构建的。用数据的名称来命名边，而非其顺序，会让两件事变得简单得多。

你可以立即判断一条边是否真实存在，即数据是否真的会跨过它流动。而且只要接口形状保持不变，你就可以在不触及图其余部分的情况下，替换两端中的任意一个节点。

实际上，边（Edge）存在于普通的JavaScript中。在扇出（Fan-out）与综合（Synthesis）之间的规约步骤——展平、去重、过滤——不过是操作节点（Node）所返回数据结构的普通代码。

无需 Agent。这是用图思维带来的一个静默胜利：人们耗费大量模型 Token 去做的事情，其实只是一个 Edge，而 Edge 是免费的。

json
// Tempting: spawn an agent to "combine the results.
"Don't.
// If combining means flatten and dedupe, that is flatMap
plus a Set.
// Deterministic, instant, zero tokens.
const flat = collected.flatMap((c) => c.items);
const clean = [...new Map(flat.map((i) => [i.url, i])).
values()];

将 Agent 留给判断。而非管道铺设。一张每条边都是 Agent 的图，不过是在为其自身接线支付租金。

05. 使用parallel()进行扇出

这步操作是让其他所有环节得以运行的关键。当你拥有 N 个独立节点、N 个需要检查的数据源、N 个需要审查的文件、N 条需要审计的路径时，你不会将它们串联起来。

你指示Claude将它们分发出去并同时运行。在一个parallel()工作流中：Claude接收一个 thunk 数组，为每个 thunk 启动一个子 Agent， 并发运行它们，然后将结果数组交还给你。

两个细节使其变得稳健。首先，parallel()是一个屏障，因此它在返回前会等待每个 thunk，并且下一阶段始终会看到完整的集合。其次，抛出异常的 thunk 会解析为 null，而不是导致整个批次失败，因此一个不稳定的智能体不会拖垮整个运行。

在输出时总是使用 .filter(Boolean)。 并发（Concurrency）的上限约为你的核心数，溢出会排队，因此你可以交给它一百个 thunk，它们最终都会完成，只是每次只处理少量。

json
phase('Research');

// Nine sources, nine agents, all at once.
const raw = await parallel(
 SOURCES.map((s) => () =>
 agent(s.prompt, {
 label: `research:${s.key}`,
 phase: 'Research',
 schema: ITEM_SCHEMA, // each node returns
validated JSON
 agentType: 'general-purpose',
 }),
 ),
);

const collected = raw.filter(Boolean); // drop nulls
from failed agents

扇出操作存在于代码中，由Claude编写，而非发生在模型对话中。Claude自身的上下文窗口从不同时容纳九个来源。每个子Agent（Subagent）携带自己的上下文，最终只有答案返回。这正是工作流（Workflow）能够扩展到数十或数百个子Agent而不淹没会话的原因，并且编排层不产生额外成本，因为它不是Claude的又一次思考回合。

06. 屏障处的扇入

扇出（Fan-out）本身毫无意义，除非有东西将其汇聚。扇入（Fan-in）就是你的边收敛的节点——在那里，一个智能体（Agent）或一段代码能同时看到所有上游结果，并执行真正需要完整结果集的操作：跨源去重、按影响排序、若全部返回为空则提前退出。

那正是屏障（Barrier）使其物理运行时间（Wall-clock time）开销物有所值之处。

保持图高效运行的原则是：仅当某个阶段确实需要同时处理所有先前结果时才使用屏障（Barrier）。跨所有来源的去重（Deduping）就符合这一条件。

json
// The edge: plain JS, no agent, zero tokens.
const flat = collected.flatMap((c) => c.items);
log(`Collected ${flat.length} items`);

phase('Curate');
// The barrier node: needs the WHOLE set to dedupe and
rank.
const curated = await agent(
 `Dedupe and rank these by impact:\n${JSON.stringify
(flat)}`,
 { phase: 'Curate', schema: CURATED_SCHEMA },
);

仅仅展平列表并不构成屏障（Barrier），而是一条边（Edge），应内联处理。判断标准极其简单：如果你先并行执行，然后进行一次转换，再并行执行，并且中间的转换没有跨项依赖，那么你本应使用一个流水线（pipeline）并完全跳过屏障。

07. 菱形模式：拆分、工作、合并

将扇出（fan-out）和扇入（fan-in）结合在一起，你就得到了每个严肃的Agent 图（agent graph）的核心工作马拓扑：菱形。

一个节点拆分任务，多个节点并行执行，一个节点合并结果。这就是市场扫描、依赖审计、代码审查、研究报告背后的共同模式。只需替换数据源与提示词（prompts），同一套骨架便能适配所有这些场景。

这种经典模式值得牢记：扇出、规约、合成。扇出以获取广度。用简单代码规约以压缩信息。最终由一个 Agent 合成以写出答案。

一旦你能看清那颗钻石，你就不会再问「如何让我的 Agent 执行更多步骤」，而是开始问「在哪里拆分，在哪里合并」。第二个问题才是真正能实现规模化扩展的关键。

08. 运行时使用条件路由 Edge

并非所有图都是固定的。有时，你选择哪条边取决于某个节点发现了什么。一个路由器（router）节点会检查结果，然后决定激活哪条下游路径：对工单进行分类，然后分支到正确的处理器。检查差异大小，然后执行快速审查或启动全面审计。

在工作流中，这仅仅是基于节点经过验证的输出所执行的JavaScript if 或 switch 操作，因为你的控制流就存在于代码之中。

json
// Router node: an agent classifies, code picks the edge.
const { severity } = await agent(`Classify this diff's
risk:\n${diff}`, {
 schema: {
 type: 'object',
 properties: { severity: { type: 'string', enum:
['low', 'high'] } },
 required: ['severity'],
 },
});

let review;
if (severity === 'high') {
 // heavy path: full parallel audit
 review = await parallel(FILES.map((f) => () => agent
(`Audit ${f}`)));
} else {
 // light path: one quick pass
 review = await agent(`Quick review of ${diff}`);
}

这正是确定性从缺陷转变为特性的关键之处。路由器的决策可以由Claude提供支持，由一个子 Agent 进行分类。路由逻辑是Claude编写的代码，因此对于相同的分类，它每次的执行路径都完全一致。

你获得的是Claude在节点处的判断，以及脚本在边上的可靠性。不会出现“Claude今天决定跳过审计”这种意外，因为跳过审计必须被显式写入图中，而它并没有。

09. 在边缘部署验证器

图表的真正杠杆作用不在于你能获得更多的 Agent。而在于你可以围绕它们构建结构以产生置信度。

一个验证节点（verifier node）位于边（edge）上，在结果被允许传递给下游之前，它唯一的工作就是试图否决这个发现。如果它经受住了考验，就通过；如果失败，就永远不会出现在你的答案中。

三种值得掌握的模式：

- 对抗性验证。针对每项发现，生成 N 个独立的怀疑者提示其进行反驳，仅当多数怀疑者未能推翻时才保留该发现。

- 多视角验证。为每个验证器分配独立的审查维度：正确性、安全性、可复现性。因为这种多样性能够捕获 N 个相同检查永远无法发现的故障模式。

- 评审团。从不同角度生成 N 次尝试，并行评审为其打分，从优胜者中综合，同时整合次优方案的最佳部分。

这正是让一个真实团队能够移植Bun运行时的模式——将对抗性代码审查直接内置于循环之中。

10. 隔离节点，使单点故障影响局部化

在链式结构中，故障会级联传播。C 挂了，D 就永远不会运行，整个流程随之停止。而在图结构中，故障应当被限制在其所在的节点内。

这部分已经成真了：在parallel()中抛出异常的 thunk 会解析为 null，因此八个良好的 Agent 仍然返回结果，而那个有问题的 Agent 则会被过滤掉。你的 .filter(Boolean) 就是隔离机制。设计每一个扇入（fan-in）时，都应允许输入缺失，而不是假设输入集完整。

更隐蔽的故障是节点之间相互踩踏。当智能体并行写入文件时，它们会发生冲突。

解决方案是隔离：工作树。每个 Agent 在自己的 git worktree 中运行，在沙箱（sandbox）中完成工作，最后进行干净合并。仅当节点真正并行写入时才采用此方案。它是针对特定拓扑的保险装置，而非每次运行都需支付的默认税负。

11. 增加循环，但确保其收敛

有时，直到你身陷其中，才意识到任务规模有多大。未知规模的发现。就像进行一次漏洞排查，发现一个 Bug 就会暴露三个新的。这就需要一个循环，一条受控的边（Edge）回连到一个更早的节点（Node）。

危险显而易见。一个永不收敛的循环就是无限循环，会不断生成 Agent，直到耗尽你的预算。

趋同的模式是“循环直至干涸”：持续生成发现者（finders），直到连续 K 轮都没有新发现才停止。而决定成败的细节——几乎所有人都会在第一次搞错——是去重比对的对象。

基于所有已见内容进行去重，而不仅仅是已确认的结果。否则，被拒绝的发现会每轮重现，循环永不停歇，你实际上是在构建一台永远为重新发现相同死胡同付费的机器。

json
const seen = new Set(); const confirmed = []; let dry = 0;

while (dry < 2) { // stop after 2
empty rounds
 const found = (await parallel(
 FINDERS.map((f) => () => agent(f.prompt, { schema:
BUGS }))
 )).filter(Boolean).flatMap((r) => r.bugs);

 const fresh = found.filter((b) => !seen.has(key(b)));
 if (!fresh.length) { dry++; continue; } // nothing
new, closer to dry
 dry = 0;
 fresh.forEach((b) => seen.add(key(b))); // dedupe vs
SEEN, not confirmed

 // diverse lens verify: every fresh finding earns its
place
 const judged = await parallel(fresh.map((b) => () =>
 parallel(['correctness', 'security', 'repro'].map
((lens) => () =>
 agent(`Judge "${b.desc}" via ${lens}. Real?`, {
schema: VERDICT })))
 .then((v) => ({ b, real: v.filter(Boolean).filter
((x) => x.real).length >= 2 }))
 ));

 confirmed.push(...judged.filter((v) => v.real).map((v)
=> v.b));
}
12. 在节点间对模型进行分层部署

并非每个节点都需要使用你最强大的模型。图（Graph）以一种单一智能体（Agent）永远无法做到的方式，让这一点变得显而易见：一些节点是有界且重复的——提取此字段，分类此工单。另一些则承载真正的判断——综合报告，裁决结果。

将无聊的节点运行在更廉价的模型上，并将宝贵的 Token 投入到真正需要判断力的地方。

在工作流中，每个子 Agent Claude生成时都会继承你的会话模型，除非脚本覆盖了它，因此默认情况下，一个大规模的运行会完全按照你的会话层级进行计费。单次 agent() 调用上的模型选项会告诉Claude仅将该特定节点路由到其他地方。

在大规模运行前检查 /model，然后让Claude将扇出（fan-out）中重复的节点路由到更便宜的模型，同时保持顶部的合并节点不变。这是将一个消耗token的图转变为经济高效方案的关键杠杆，且完全无需改动其结构。

13. 拓扑决定你的成本与延迟

图的形状并非装饰。它是你在物理运行时间上能施加的最大杠杆。几乎让所有人栽跟头的选择，就是parallel()与pipeline()之间的抉择。

平行屏障parallel()会让所有节点等待最慢的一个完成后，下一阶段才能开始。而流水线pipeline()则让每个项目独立地流经所有阶段，没有屏障，因此项目 A 可以在第 3 阶段，而项目 B 仍在第 1 阶段。快速项目能提前完成，无需空等慢速项目。

默认采用pipeline()。仅当某个阶段确实需要一次性获取所有先前结果时，才使用屏障（Barrier）：例如跨集合去重、基于总量的提前退出，或是需要将一个发现与其他所有结果进行对比的 Prompt。

“代码更整洁”和“各阶段感觉分离”并非理由。屏障延迟是真实存在、可测量的、被浪费的时间。分离并不等同于同步。

Shape



当需要时



你需要付出什么代价




链



每个步骤确实读取上一步的输出。



最慢的可能运行，一次停顿就会导致全局崩溃




parallel()扇出



N 个独立作业，下一阶段需要全部完成



每个人都等待最慢的节点。




pipeline()



N个独立作业流经相同的阶段



几乎什么都没有，这就是你的默认设置。




Diamond



广度优先，然后给出一个合并后的答案



一处屏障，在合并时生成




条件式



路径取决于节点发现了什么



分支前的分类调用




循环



你不知道这项工作的规模有多大。



如果它永不收敛，将导致花费失控

14. 让Claude绘制图

最后一步是：停止为无法预先规划的任务手动绘制图（Graph）。

通过动态工作流，你描述目标，然后Claude自己编写编排脚本：分解任务、选择扇出策略、生成一个协调的子 Agent 集群，最后合成结果。最终你会得到一个为**本次**运行量身定制的图（Graph），而不是一个你希望它能适用的固定图。

有三种入口方式。

在你的提示词（Prompt）中说出 workflow 一词，Claude就会为任务生成一个。

运行一个已保存或打包的图。/deep-research 是一个正在生产环境中运行的真实图：涉及范围界定、并行搜索、获取、对抗性验证和综合。这正是本文文章所描述的精确骨架。

开启 ultracode，然后Claude会为会话中每个实质性任务规划一个工作流（workflow）。当一次运行效果良好时，按 s 将其脚本保存到 .claude/workflows/ 目录下。现在，它便实现了版本控制，可通过名称重新运行，并且成为一个任何克隆此仓库的人都能启动的 Agent 图（Agent Graph）。

plaintext
> Run a workflow to audit every route under src/routes/
for missing auth.
 Spawn one agent per route file, then verify each
 finding before reporting.

• Claude wrote an orchestration script · launching in
background...
 /workflows > auth-audit · running
 ✓ Scope 1/1 2.1k tok · 4s
 ✓ Fan-out 18/18 one agent per route file
 ○ Verify 11/18 3-vote skeptics per finding...
 ○ Synthesize 0/1 waiting on verify
 session stays responsive, keep working while the fleet
runs
Six Graphs Worth Building This Week

- 对所有路由进行安全扫描。每个路由文件分配一个子 Agent（Subagent），各自搜寻缺失的鉴权检查，随后由一个验证器（Verifier）流程确认每项发现后再写入报告。其广度是单个上下文窗口（Context Window）无法容纳的。

- 一份使用 /deep-research 引用的报告。Claude将你的问题拆分为不同的角度，并行执行搜索，去重来源，然后在落笔之前，用三个持怀疑态度的投票者对每一项主张进行对抗性验证。

- 一个模块的移植逐文件进行。将Bun的上限，缩减到你的仓库规模。Claude将翻译工作分配到各个文件，并在每个文件上运行测试套件作为关卡，然后将失败项循环回来，同时由对抗性审查来捕捉单次遍历可能会放行的错误。

- 对代码差异的对抗性审查。Claude根据差异大小路由：小改动进行一次快速审查，大改动则触发完整的并行审计，审查员从不同视角切入，然后由评审小组综合给出结论。

- 按计划执行生态系统扫描。保存一次，永久运行。Claude并行检查多个来源：版本发布、博客、讨论，在屏障处按影响力排序，并生成摘要。版本控制位于 .claude/workflows/ 目录下，可通过名称直接启动。

- 一个规模未知的发现任务。你完全不知道其中存在多少缺陷。Claude会并行运行多个查找器，将每个新发现与已知的所有结果进行去重，验证幸存的项，并持续循环，直到连续两轮都没有发现新内容。

为什么这其实至关重要

每一个步骤都指向同一个底层事实：你的智能体的天花板几乎从不是模型本身，而是你交付给它的工作形态。

链式架构迫使单一上下文承载所有内容，一次故障导致全局停滞，每一个快速步骤都必须等待最慢的那个。而图式架构将上下文分布到整个集群中，在节点处隔离故障，并为你提供可信赖的结构化保障：节点上的 Schema 验证、边上的验证器，以及始终以相同方式运行的路由逻辑。

而编排层就是代码。这是人们常低估的部分。在十八个智能体之间的协调不消耗任何模型 Token，因为脚本并非对话。

这里真正重要的是什么

如果只从这篇文章中记住三点：砍掉不携带数据的箭头，默认使用pipeline()而非屏障，以及去重时针对所有见过的内容，而非仅针对已确认的内容。

仅这三项就能让您的智能体（Agent）运行更快、成本更低，且远比在队列中增加另一个步骤更难被破坏。

线性智能体（Linear Agent）从来不是能力的上限。它只是每个人最先想到的形态，因为它符合我们打字的方式：一行字、一个脑袋、一次只处理一件事。

提示词工程师提出问题，架构师绘制图谱。

那么，你现在构建的是哪种 Agent：一条线，还是一个图？

如果你已经读到了这里，那么这个主题的内容远不止十四个步骤和几个代码块那么简单。

@seeconvm 是我持续进行分解的地方。

敬请期待更多内容。

17:41 · 2026年8月14日
58.4万
视图
5
21
162
507
beamnxw ./
@beamnxw
8月14日
这个技能现在必须掌握。
2
1812
HMICsource
@HMICsource
8小时
精彩的拆解。拖垮我整个图的节点，不是那些宕机的节点，而是那些等待人工干预而陷入休眠的节点。

幽灵工单。没有错误，没有超时。只是“挂起等待操作员审核”。

图没有崩溃。它只是安静了下来。

门一松，漏洞就来。
28
登录或注册 X

查看正在发生的事件并加入讨论

继续使用手机
继续使用 Apple
通过 Google 继续
或
使用用户名或邮箱登录
相关人士
seeco
@seeconvm
关注
术语表
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
扫描获取应用
