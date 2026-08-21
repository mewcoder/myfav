大多数人通过 [App](https://developers.openai.com/codex/app)、[命令行界面](https://developers.openai.com/codex/cli) 或 [IDE 扩展](https://developers.openai.com/codex/ide) 认识 Codex。这些体验很重要，但它们只是使用同一底层系统的少数几种方式。

[开源 Codex harness](https://github.com/openai/codex) 为所有这些体验提供支撑。它帮助模型收集上下文、推理任务、使用工具、在配置的边界内操作、请求批准并推进工作。

这改变了开发者可以构建的东西。无需要求每个团队将其工作迁移到一个通用编码助手，你可以将代理引入围绕实际工作设计的软件中：工程工作流、运营仪表板、安全调查、客户支持控制台，或为一个专业团队构建的内部应用。

## 可复用的部分是代理循环

一个有能力代理不仅仅是一个提示和模型响应。它需要一种方式来理解任务、随时间维护上下文、检查相关信息、调用工具、暴露进度、处理失败、必要时请求人工批准，并返回有用的结果。

那个周边的执行系统就是 harness。

Harness 设计可以实质性地改变结果：在 [ARC-AGI-3](https://openai.com/index/how-two-settings-tripled-our-arc-agi-3-scores/) 上，保留推理和上下文压缩将 GPT-5.6 Sol 的分数从 13.3% 提升到 38.3%，同时将输出 token 减少了六倍。

我们构建 Codex harness 来管理对话状态、流式执行、使用工具、强制执行配置的沙箱和批准策略，并跨轮次推进工作。通过 [Codex app-server](https://developers.openai.com/codex/app-server)，我们通过文档化的客户端协议暴露这些能力：应用可以创建线程、启动轮次、接收事件并处理批准请求。

如果你正在构建需要代理的软件，你可以从 Codex 开始，而不是发明一个新的运行时，然后决定周边应用应该拥有什么。

## 开发者可以检查和适应的开放 harness

因为 harness 是开源的，你可以检查应用和模型之间的层，理解其行为，并调整集成以适配你的产品。

这让开发者能够控制那些使代理适配其产品的部分：

-   The interface. 团队可以保留其现有的仪表板、编辑器、队列、地图、记录和批准流程，而不是将每次交互强制塞入一个通用的聊天窗口。
    
-   Context and tools. 应用可以暴露对特定工作流重要的系统、文档、数据和操作，包括应用拥有的 [MCP services](https://developers.openai.com/codex/extend/mcp)。
    
-   Operational boundaries. 宿主应用可以决定代理运行的位置、它可以访问哪些文件或工具、哪些操作需要批准、工作如何被观察，以及结果如何返回到记录系统。
    

我们将 [Codex CLI](https://developers.openai.com/codex/cli)、[app-server](https://developers.openai.com/codex/app-server) 和 [官方 Codex SDK](https://developers.openai.com/codex/codex-sdk) 作为开源组件发布。我们的 [开源组件指南](https://developers.openai.com/codex/open-source) 列出了可用的内容以及每个组件的位置。

开源层是 harness 和集成面；模型访问和托管服务保持独立。

## 选择合适的集成层

基于 Codex 构建并不要求每个用例都使用相同的集成。

-   对于脚本、CI 任务或一次性后台任务，[codex exec](https://developers.openai.com/codex/non-interactive-mode) 可以运行有边界的代理工作流并返回结构化输出。
    
-   对于需要启动、恢复或流式传输 Codex 任务的应用代码，[官方 Codex SDK](https://developers.openai.com/codex/codex-sdk) 提供了直接的编程接口。
    

有关可运行的示例，请参阅 [Codex SDK 文档](https://learn.chatgpt.com/docs/codex-sdk)。

当代理本身就是产品的一部分时，使用 Codex app-server。它让你的应用连接到本地 Codex 进程，保持对话打开、流式传输事件、中断工作、暴露工具并响应批准请求。SDK 简化了常见的编程工作流；app-server 让产品团队直接控制生命周期和用户体验。

## 围绕工作流构建软件

最有趣的机会不是用不同的徽标复制 Codex app，而是构建反映特定个人或团队已有工作方式的软件：

安全分析师可能需要一个调查队列、最近警报、受影响的服务，以及在开具修复工单前的批准步骤。支持工程师可能需要账户历史、产品日志、内部文档和草稿响应。产品团队可能想要一个任务板，将问题移动到就绪状态即启动一个限定范围的实现工作流。

在每个示例中，接口都是体验的重要部分。它告诉代理用户正在查看什么，为其提供正确的工具，并为用户提供一个审查后续发生事项的地方。

![架构图，展示了应用拥有的接口、业务上下文和同意；Codex app-server 代理循环和沙箱执行；以及应用拥有的 MCP 数据和操作。](https://developers.openai.com/images/blog/codex-platform-agent-stack.webp)

图 1. 你的应用拥有产品上下文、业务规则和工具；Codex app-server 提供代理循环和沙箱执行。

## 示例：Relay

我们构建了 Relay 作为基于 Codex app-server 的示例运营应用。它将一个代理放置在虚构的货运仪表板旁边，将其连接到应用拥有的 MCP 工具，并在重新预订货运之前要求人工批准。

用户不是从零开始编写提示。他们选择一批货运并点击诸如 **Compare recovery** 的操作。应用提供相关上下文，Codex 检索最新的示例运营数据，代理解释可用选项，任何有实质影响的写入都需要批准。

然后，Codex 可以使用应用的 MCP 工具来获取当前数据，然后再推荐——或者，在批准后，执行——某个操作。当工具更改底层记录时，应用刷新其业务视图。Harness 处理代理循环、对话状态、流式活动和工具交互；产品继续拥有其仪表板、记录和控件。

Relay 使用虚构的种子数据，但集成模式是通用的。相同的模式可以支撑事件响应、账户操作、研究工作流，或其他代理应在现有产品体验内工作的应用。

![Relay 货运运营仪表板，显示异常队列、货运详细信息和调查延迟货运的 Codex 代理。](https://developers.openai.com/images/blog/codex-platform-relay-operations.webp)

图 2. Relay 将 Codex 嵌入货运运营仪表板，具有应用拥有的 MCP 工具和针对关键操作的人工批准。

## 开发者正在构建什么

这种模式已经出现在公开实现中：

-   [
    
    GitHub and JetBrains
    
    ](https://github.blog/changelog/2026-07-07-codex-as-agent-provider-and-agentic-enhancements-in-jetbrains-ides/)
    
    将 Codex 引入现有的 IDE 工作流。
    
-   [
    
    Cisco
    
    ](https://blogs.cisco.com/ai/from-an-idea-to-a-live-app-on-cisco-in-minutes)
    
    在 Cisco Cloud Control 内的 App Builder 中使用 Codex SDK。
    
-   [
    
    Thrive Holdings and Crete
    
    ](https://openai.com/index/building-self-improving-tax-agents-with-codex/)
    
    在税务准备工作流中使用 Codex，该工作流融合了从业者的反馈。他们的试点处理了 7,000 份申报表，并将准备时间减少了约三分之一。
    

这些示例不仅限于工程：相同的模式适用于调查客户问题的支持团队、协调工作流的运营团队、分诊事件的安全团队、研究账户的销售团队和开发活动的营销团队。在每种情况下，应用提供上下文、工具和批准，而 Codex 为底层代理循环提供动力。

## 超越显而易见之处构建

对于许多类型的工作，关键上下文都基于 dashboard、timeline、map、document 或 system record。这些视图的存在并非为了好看：它们正是人们实际理解现状、做出决策并保持掌控的方式。

我们所面临的机遇，并不是用通用的聊天框取代这些界面，而是通过为它们引入一个能够理解工作、调查恰当上下文、提出下一步行动建议并执行已批准操作的 agent，从而让它们变得更强大。

Codex app、CLI 和 IDE 扩展展示了该 harness 能做什么。通过将 harness 开源，我们为开发者提供了一种检视这些能力、将其集成并适配到自身产品和 workflows 中的方式。

如果你想基于 Codex harness 进行构建，请从 [open-source Codex repository](https://github.com/openai/codex) 开始，然后选择适合你产品的集成方式：非交互式任务选用 [codex exec](https://developers.openai.com/codex/non-interactive-mode)，程序化 agent 工作流选用 [Codex SDK](https://developers.openai.com/codex/codex-sdk)，或者需要持久对话、流式事件与审批处理的应用选用 [Codex app-server](https://developers.openai.com/codex/app-server)。
