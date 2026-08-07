Compaction is where coding agents go to die. You can't hand your harness a `/goal` and go to sleep if it lobotomizes itself every 40 minutes.

For an agent to upgrade to a harness, it has to do three things alone: manage its own context, survive a restart, and hold onto decisions with nobody there to correct it. Most agents do zero of the three.

Let me walk you through everything we at Mastra have learned over the last few months about how to go from a naive agent loop to a powerful harness that can run for hours:

-   **Thread persistence** — close the terminal mid-task, reopen, and the conversation comes back with the same mode, model, token count, and memory settings
-   **Live task lists** — a persistent to-do list the agent writes, updates, and checks before declaring itself done
-   **Interrupt / queue / steer** — type over a running task, queue a follow-up, or abort and redirect, because the conversation is an open channel, not a function call
-   **Tools that pause for humans** — askUser and plan approval, with a plain-text fallback so the same agent runs headless in CI
-   **Plan → build handoff** — approve a plan and the harness auto-switches modes, read-only planning into execution
-   **The approval chain** — an ordered rule chain (per-tool deny → YOLO → session grants → category policy → ask) deciding what runs
-   **Subagents** — isolated for unbiased review, or forked to keep the prompt cache warm
-   **Crash recovery / multi-surface** — two terminals on one thread without stepping on each other

Time to build a long running coding agent from first principles. Let's go!

## [What are coding agents?![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/01.svg)](#what-are-coding-agents)

A coding agent is an LLM in a loop with access to tools that allow it to read files, run commands, edit code, and then use the result of the action to choose the next step.

Coding agents run along a spectrum of autonomy, and most modern tools support both autonomous and supervised behaviors. These are the two modes you'll normally see with agents:

-   **Interactive mode.** You stay in the loop, watching each step and steering as you go. This is the default in IDE-embedded tools like Cursor, Windsurf, and Cline, and it's also how Claude Code behaves when you run it attached to a terminal.
-   **Headless mode.** You hand off a goal and collect a diff or pull request with nobody watching. Claude Code, OpenAI Codex, and Google Jules all run this way, and Cursor's background agents do too.

[Mastra Code](https://code.mastra.ai/ "Visit https://code.mastra.ai/") leans more towards autonomous behavior. It is also harder to build because an agent you walk away from has to manage its own context, survive a restart, and hold onto your earlier decisions with nobody in the loop to correct them.

## [Why a naive agent loop fails![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/02.svg)](#why-a-naive-agent-loop-fails)

The naive version of the agent loop appends each message and tool result to a growing array, then sends the entire array to the model on each turn. It works for a demo, but the same cannot be said for production. Here are three ways an agent loop fails without a user ever noticing.

### [1\. Context rot![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/03.svg)](#1-context-rot)

By default, raw history grows with every tool call and response. As stale results, superseded edits, and intermediate reasoning accumulate, the signal density of the context drops. The model has to read more text for less useful information.

What makes this dangerous is that nothing errors out, so the model keeps answering well past the useful signal. And longer context windows can't solve this because an agent performing a task on 180k useless tokens will significantly underperform an agent performing the same task with around 40k high-quality tokens.

### [2\. Lossy compaction![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/04.svg)](#2-lossy-compaction)

The usual response to context rot is compaction. The agent waits until context nears the limit, summarizes everything, and replaces the raw history with the summary.

On paper, this seems to work, but this summary drops the exact wording of a requirement, any specific instructions you provided, or any edge cases you flagged earlier.

This is a common bug that plenty of Claude Code users have described as well.

_[Source](https://www.reddit.com/r/ClaudeCode/comments/1qzo3xj/claude_code_does_not_review_your_active_plan/ "Visit https://www.reddit.com/r/ClaudeCode/comments/1qzo3xj/claude_code_does_not_review_your_active_plan/")_

A session reads sharply worse right after the compaction boundary, and the agent starts contradicting decisions it made before the summary.

### [3\. Stateless sessions![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/05.svg)](#3-stateless-sessions)

The third failure shows up between sessions. With no thread storage, every session starts at zero, and prior decisions and file-level context are lost.

So you have to paste context into a `CLAUDE.md` file and re-explain the architecture each time you start a new one, which turns _you_ into the agent's memory.

Across all these issues, the agent never stops producing output, so nothing crashes to warn you.

## [The harness architecture![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/06.svg)](#the-harness-architecture)

A well-engineered harness solves these problems well enough. I say well enough because they are not completely solved yet. But considering the limitations of our current LLM architecture, a harness gets us as close to functional agents as we can today.

Harness is the layer around the agent loop that handles the conversation-as-channel, two stages of event translation, and a single render-ready display state. It also adds tools that pause the agent for human input, session and thread persistence, observational memory in case of Mastra, and an approval chain.

The loop and the wrapper remain separated. You can pick different models, modes, auth types, and more, rather than baking it into the core.

## [How Mastra's harness structures conversations![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/07.svg)](#how-mastras-harness-structures-conversations)

The harness treats a conversation as a channel that stays open rather than a function it calls once and waits on.

**A plain function call behaves like one HTTP request**. You send a request, the model streams a response, the connection closes, and nothing is left to hold once it returns.

**A channel behaves like a WebSocket or a pub/sub topic that stays open**. The harness connects to a conversation thread once, and from then on, it pushes messages in and receives everything the agent emits back, run after run.

The harness gets back a **subscription** that hands over the stream of chunks, the ID of the active run, and the controls to abort or unsubscribe.

The stream carries everything the agent emits on that thread, for as long as the thread exists. A pub/sub topic sits underneath it, and that is what keeps the connection open after any single run finishes.

By sending a message, you're publishing onto that open channel. And several clients can subscribe to the same thread at once, so a terminal and a web view follow the same conversation together.

Keeping the conversation open this way makes four things possible that a one-shot call cannot do.

-   **You can interrupt**. Type something while the agent is mid-task, and it folds into the running work without stopping it.
-   **You can queue a follow-up**. Say what comes next while the agent is still busy, and the harness holds the message, then sends it the moment the current run ends.
-   **You can steer.** Tell the agent to stop and do something else, and the harness drops the current run, clears anything queued, and starts fresh.
-   **It also survives a crash.** Because the conversation lives on the thread and not in the running process, you can quit, reopen, re-attach to the same thread, and pick up where you left off.

Those four behaviors are why the open-channel design earns its extra plumbing. Every layer above it leans on this same backbone.

## [Converting raw model output into structured events![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/08.svg)](#converting-raw-model-output-into-structured-events)

A subscription, as discussed above, hands you raw provider chunks. The job of turning that stream into something stable falls to `processStreamChunk`. It maps every raw chunk type to one clean, semantic harness event.

A renamed field, a split chunk type, or a new streaming phase touches that function alone and nothing else downstream. The same function also handles values you should not show on screen as-is. For example, when a tool reads an API key, you don't want the raw secret printed in the transcript.

So a tool can attach a display transform to its result, which is a second, display-only version of the value. The actual value still gets saved to the message and sent to the model. The secret/sensitive data renders as •••••• while the tool runs on the real key.

## [Reducing events to a single display state![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/09.svg)](#reducing-events-to-a-single-display-state)

The events we talk about are simply a stream of individual updates from both the user and the agent. And the UI should not have to assemble them by replaying these events one by one.

So the harness folds every event into a single object using a reducer.

The object it builds is a display state that holds everything a screen needs to draw one frame: whether the agent is working, the message being written, which tools are running, any pending approvals or questions, subagent activity, memory progress, the files that changed, and the live task list.

A renderer then asks one question: "What does the world look like right now?" It reads the object and draws. It never parses raw events.

There are two ways to listen, depending on what you need.

-   `subscribe(listener)` gives you every event, in order, with nothing merged. That suits logging and analytics, where you want the full record.
-   `subscribeDisplayState(listener)` gives you merged snapshots of the latest state. That suits a terminal or web UI that only cares about the current frame.

### [Batching the redraws![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/10.svg)](#batching-the-redraws)

Snapshots need merging because a streaming agent emits hundreds of events a second, roughly one per chunk of text. Redrawing the terminal on each one would swamp it.

The `DisplayStateScheduler` handles this. It batches ordinary updates inside a 250ms window, with a hard 500ms ceiling. Bursts collapse into a few redraws a second, and the ceiling guarantees the screen still refreshes during a long stream.

Some events cannot wait in that batch. Anything that blocks a human jumps the queue: a tool asking for approval, a suspended tool, a question, a plan waiting to be approved, the agent starting or finishing, and any change of thread, mode, or model.

For example, when the agent asks "Can I run this command?", that prompt has to appear the instant it happens, not up to half a second later. So those events flush immediately.

Every flush also runs the snapshot through `cloneDisplayState`, which deep-copies the maps, dates, and nested data. A subscriber can hold onto a frame and trust it won't change underneath it when the next event arrives.

## [How tools pause the agent and request human input![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/11.svg)](#how-tools-pause-the-agent-and-request-human-input)

A tool can hit pause during execution. From the model's side, nothing special happens. It just calls a tool that is taking a while to return. Underneath, the harness is holding that tool open until you answer.

This runs over a back-channel. Before each run, the harness attaches a small object to the tool's context, a private line back to the harness that the model never sees.

Through this line, a tool can draw a prompt on screen, register a question or a plan approval, read and update the harness state, and reach the thread identity and the abort signal.

That back-channel is optional on purpose. For example, if the same tool runs in a CI pipeline with no harness around it, it falls back to a plain-text path and keeps working instead of crashing.

### [Asking a question with `askUser`![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/12.svg)](#asking-a-question-with-askuser)

The `askUserTool` shows the mechanism most clearly. Here's a snippet from our codebase.

```
export const askUserTool = createTool({
  id: 'askUser',
  description: 'Ask the user a question and wait for their response. ...',
  inputSchema: z.object({ /* question, options, selectionMode */ }),
  execute: async ({ question, options, selectionMode }, context) => {
    const harnessCtx = context?.requestContext?.get('harness') as HarnessRequestContext | undefined;
 
    // No harness callbacks present? Degrade to plain text instead of blocking.
    if (!harnessCtx?.emitEvent || !harnessCtx?.registerQuestion) {
      return { content: `[Question for user]: ${question}`, isError: false };
    }
 
    const questionId = `q_${++questionCounter}_${Date.now()}`;
 
    const answer = await new Promise<HarnessQuestionAnswer>((resolve, reject) => {
      const signal = harnessCtx.abortSignal;
      // ... wire `signal` to reject() so Ctrl-C cancels the wait cleanly ...
      harnessCtx.registerQuestion!({ questionId, resolve });                          // park a resolver
      harnessCtx.emitEvent!({ type: 'askQuestion', questionId, question, options }); // draw the prompt
    });
 
    return { content: `User answered: ${formatQuestionAnswer(answer)}`, isError: false };
  },
});
```

The tool registers a callback with the harness, emits an event so the UI can draw the prompt, then waits on a Promise that won't resolve until you answer.

Once you answer, the UI calls the agent with your reply. The harness finds the stored callback, fires it, the Promise resolves, and the tool returns its result. The loop picks up exactly where it paused.

The wait is wired to the abort signal, so Ctrl-C cancels it cleanly instead of leaving a tool hung forever. And the plain-text fallback means the same agent can run in a headless pipeline that has nobody to ask.

### [Handing off a plan![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/13.svg)](#handing-off-a-plan)

The `submitPlan` tool reuses the callback-and-Promise mechanism, registering a plan approval and emitting `planApprovalRequired`.

```
export const submitPlanTool = createTool({
  id: 'submitPlan',
  description: 'Submit a completed implementation plan for user review. ... On approval, the system automatically switches to the default mode so you can implement.',
  inputSchema: z.object({ /* title, plan (markdown) */ }),
  execute: async ({ title, plan }, context) => {
    const harnessCtx = context?.requestContext?.get('harness') as HarnessRequestContext | undefined;
 
    // Same plain-text fallback as askUser when no harness is attached.
    if (!harnessCtx?.emitEvent || !harnessCtx?.registerPlanApproval) {
      return { content: `[Plan submitted for review]\n\nTitle: ${title || 'Implementation Plan'}\n\n${plan}`, isError: false };
    }
 
    const planId = `plan_${++planCounter}_${Date.now()}`;
 
    const result = await new Promise<{ action: 'approved' | 'rejected'; feedback?: string }>((resolve, reject) => {
      const signal = harnessCtx.abortSignal;
      // ... wire `signal` to reject() so Ctrl-C cancels the wait cleanly ...
      harnessCtx.registerPlanApproval!({ planId, resolve });                          // park a resolver
      harnessCtx.emitEvent!({ type: 'planApprovalRequired', planId, title, plan }); // render the plan
    });
 
    if (result.action === 'approved') {
      return { content: 'Plan approved. Proceed with implementation following the approved plan.', isError: false };
    }
    // Rejected: hand the feedback back so the model can revise and resubmit.
    const feedback = result.feedback ? `\n\nUser feedback: ${result.feedback}` : '';
    return { content: `Plan was not approved. The user wants revisions.${feedback}`, isError: false };
  },
});
```

When the plan is approved, the harness switches to build mode and waits for the stream to come fully to rest before taking any next steps. That handoff moves the agent out of read-only planning and into execution, with no overlap between the two runs.

### [The task tools![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/14.svg)](#the-task-tools)

The task tools all operate on a single task list held in the harness's display state. Those three mutate that list:

-   `taskWrite` replaces it wholesale, while `taskUpdate` and `taskComplete` change individual tasks by ID
-   Every mutation emits a `taskUpdated` event that keeps the rendered to-do list current as the agent works
-   `taskCheck` is read-only, reading the same list back to confirm everything is finished before the agent wraps up. Two design choices in that machinery are worth drawing out.

```
export function assignTaskIds(tasks: TaskItemInput[], previousTasks: TaskItemSnapshot[] = []): TaskItemSnapshot[] {
  const usedIds = new Set<string>();
  const contentOccurrences = new Map<string, number>();
  const omittedContentCounts = new Map<string, number>();
  const explicitTaskIds = new Set(tasks.map(task => task.id).filter((id): id is string => Boolean(id)));
  const reusablePreviousIds = new Map<number, string>();
  for (const task of tasks) {
    if (!task.id) {
      omittedContentCounts.set(task.content, (omittedContentCounts.get(task.content) ?? 0) + 1);
    }
  }
  tasks.forEach((task, index) => {
    if (task.id || omittedContentCounts.get(task.content) !== 1) return;
    const previousMatches = previousTasks.filter(
      previous => previous.content === task.content && !explicitTaskIds.has(previous.id),
    );
    if (previousMatches.length === 1) {
      reusablePreviousIds.set(index, previousMatches[0]!.id);
    }
  });
 
  const reservedIds = new Set([...explicitTaskIds, ...reusablePreviousIds.values()]);
  return tasks.map((task, index) => {
    const contentOccurrence = (contentOccurrences.get(task.content) ?? 0) + 1;
    contentOccurrences.set(task.content, contentOccurrence);
 
    const fallbackId = createDeterministicTaskId(task, contentOccurrence);
    const reusablePreviousId = reusablePreviousIds.get(index);
    // If the model repeats an explicit ID in the same write, keep the first one
    // and mint/reuse a stable fallback for the duplicate instead of failing the whole list.
    const requestedId = task.id && !usedIds.has(task.id) ? task.id : undefined;
    const id =
      requestedId ??
      (reusablePreviousId && !usedIds.has(reusablePreviousId)
        ? reusablePreviousId
        : makeUniqueTaskId(fallbackId, usedIds, reservedIds));
    usedIds.add(id);
    return {
      id,
      content: task.content,
      status: task.status,
      activeForm: task.activeForm,
    };
  });
}
```

### [Subagents: isolation or cache reuse![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/15.svg)](#subagents-isolation-or-cache-reuse)

The harness offers two routes for subagents.

**The non-forked route** starts a brand-new agent with its own instructions and a limited tool set. Its harness context carries no thread ID, so none of the parent's history or observations reach it. That isolation is the point when you want an unbiased reader the parent's reasoning shouldn't sway. For example, a "review this code for bugs" subagent does better work when it hasn't already read the parent arguing why the code is correct.

**The forked route** trades that isolation for the provider's prompt cache. It clones the parent thread and runs on the parent agent, so the model sees the exact conversation it just processed, and the cache stays warm, which is cheaper and faster.

To keep that safe, the fork leaves every tool's schema identical, so the request still matches the cache, and swaps only what the blocked tools actually do at runtime. For example, a forked subagent that tries to spawn its own subagent or edit the shared task list hits a stub that returns a notice and goes no further. The clone is also tagged `forkedSubagent: true`, so it stays out of the user's thread list.

### [Sessions, modes, and thread persistence![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/16.svg)](#sessions-modes-and-thread-persistence)

A mode is just a saved setup for the agent.

Each one has a name, an optional label and color, a default model, and the agent it runs. Build, Plan, and Fast are all modes. When you switch modes, the harness stops whatever is running, remembers the model you were using in the mode you are leaving, moves you to the new mode, and brings back the model you last used there. So if Build is set to one model and Plan to another, you can flip between them all day, and each one stays on its own model. You never have to pick again.

All of this is saved with the conversation itself, not with the running program, which is why it survives a restart. The conversation remembers which mode you are in, which model each mode uses, how many tokens you have spent, and your memory settings, like which models do the summarizing and at what point they kick in.

So you can close the terminal in the middle of a task, open it again later, go back to the same conversation, and find everything exactly where you left it.

A conversation can also be open in two places at once, say two terminal windows. To stop them from stepping on each other, the harness locks it, taking the new lock before it lets go of the old one, and undoing the swap if that fails. Two windows can never both think they own the same conversation.

When you go to pick a model, the harness builds the list for you. It starts with the built-in providers, adds any models you have configured yourself, and checks which ones you are actually logged into, looking at your environment variables and your saved credentials. It remembers that list for ten seconds, so opening the menu again does not re-check every provider.

### [Tool approval![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/17.svg)](#tool-approval)

Every tool call resolves to one of three outcomes before it runs: allow, deny, or ask. And the harness arrives at that verdict by walking an ordered chain of rules in which the first match wins, so the sequence of the checks is itself the policy.

A per-tool deny comes first and functions as an absolute block that nothing downstream can reopen, which is what lets you fence off a single dangerous command, no matter how permissive everything else becomes.

```
private resolveToolApproval(toolName: string): PermissionPolicy {
  const state = this.state as Record<string, unknown>;
  const rules = this.getPermissionRules();
  const toolPolicy = rules.tools[toolName];
  if (toolPolicy === 'deny') return 'deny';        // 1. per-tool deny, a hard block
  if (state.yolo === true) return 'allow';         // 2. YOLO auto-approves anything not denied above
  if (toolPolicy) return toolPolicy;               // 3. explicit per-tool allow/ask
  if (this.sessionGrantedTools.has(toolName)) return 'allow'; // 4. session tool grant
  const category = this.getToolCategory({ toolName });
  if (category) {
    if (this.sessionGrantedCategories.has(category)) return 'allow'; // 5. session category grant
    const categoryPolicy = rules.categories[category];
    if (categoryPolicy) return categoryPolicy;     // 6. explicit per-category allow/ask
  }
  return 'ask';                                    // 7. default to ask
}
```

Only once a call survives that gate does YOLO mode get its say, auto-approving anything not already denied.

Failing that, the harness consults the explicit policy you've set for the tool itself, then the tools you happened to approve earlier in the session, and finally the tool's category (read, edit, execute, mcp, or other) against both your session-level grants and your standing category policy, before falling through to simply asking you when nothing along the way has spoken.

## [Observational memory![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/18.svg)](#observational-memory)

You may have noticed the lossy compaction when Claude Code (or other coding agents) sessions hit the context window limits. To solve this problem, we designed an observational memory (OM) layer in the Mastra Code harness.

OM is an LLM summarizer that activates at certain customizable thresholds (40k tokens by default), and converts the long exchange into something much smaller (100 to 1500 tokens), clears the context, and replaces it with the observer-summarized tokens. This saves much of the information across longer sessions compared to pure compaction.

The harness holds the thresholds, the model choices, the failure policy, and the on-screen translation of memory events. The summarizing itself lives in the memory package.

There's also a reflection layer that kicks in when observational memory hits a customizable threshold and summarizes the observation log.

### [How the observational memory architecture works behind the scenes![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/19.svg)](#how-the-observational-memory-architecture-works-behind-the-scenes)

There are two models at work here.

-   **An observer model** that reads the conversation and writes down structured observations: the decisions, facts, and state changes.
-   **A reflector model** that compresses those observations once they pile up, merging them while keeping things like completion markers and dates.

And the main agent you have a conversation with reads three layers:

-   The recent raw messages up to the context limit
-   The observation log
-   The reflections

The full uncompressed history is never retained to bloat context. We want to try and hand over as much high-signal context to the agent as possible throughout the session.

For example, instead of carrying forty turns of raw tool output, the agent sees the last few messages word-for-word, a short log along the lines of "we chose Postgres, the build passes, the auth file is off-limits," and a compressed summary above that. The decisions survive as decisions, not as a paraphrase buried in a summary.

### [What sets observational memory off![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/20.svg)](#what-sets-observational-memory-off)

While the observer is designed to start at 40k tokens by default, it runs a little ahead of the threshold, at 20% intervals, so the observations are usually ready before the limit is hit. When the limit arrives, the work is already done, and the harness swaps in the result.

For example, I set the observation threshold to 3k tokens and asked to read a doc that was around 4.2k tokens. The observer took over and compressed the context from 4.2k to 0.1k tokens.

OM can also fire after an idle period, and in auto mode, it picks the idle timeout based on the provider to match how long each one keeps a prompt cache warm.

For example, about 5 minutes for Anthropic, an hour for DeepSeek and OpenAI, about two hours for Groq, and 24 hours for Google Gemini. OM also fires on a provider switch. A new provider cannot reuse the previous cache, so it is better handed a compact, compressed picture than a long raw history.

If, for any reason, the observer or the buffering step fails, the harness aborts the run rather than continuing on a corrupted picture of the session.

## [How Mastra Code compares to Claude Code and OpenAI Codex![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/21.svg)](#how-mastra-code-compares-to-claude-code-and-openai-codex)

These are the things you touch in a normal day with a coding agent. Competitor behavior shifts from release to release, so read the other two columns as a snapshot rather than a spec.

The task

Mastra Code

Claude Code

OpenAI Codex

Run a long session without quality dropping

Distills the conversation in the background as it goes, so the agent keeps a dense working memory and never hits a single summarize-and-discard step

Waits until context is nearly full, then summarizes the whole history and replaces it with that summary

Waits until context is nearly full, then summarizes the whole history and replaces it with that summary

Pick up where you left off

Reopen the thread, and it comes back mid-task with the same mode, model, memory thresholds, and token count

Re-run with `--continue` to resume the last session or `--resume` to pick one from a list, and a `CLAUDE.md` file re-feeds your project context each time

Resume a past session from the CLI, and an `AGENTS.md` file supplies your project context on each run

Steer the agent mid-task

Type over a running task to fold a note in, queue the next message for when it finishes, abort and redirect, or quit and pick the thread back up later

Interrupt the running turn and send a new instruction

Interrupt the running turn and send a new instruction

Approve or block what it runs

An ordered rule chain decides each call, with allow or deny set per tool or per whole category, plus one switch to auto-approve everything in a sandbox

Asks for permission before risky actions, and you build up an allowlist so trusted commands stop asking

Pick an approval mode from suggest (approve each change), to auto-edit (edits files, asks before running commands), to full-auto (runs unattended in a sandbox)

Pick the model

One picker across providers, a different model per mode, swapped with a single line of config

Anthropic models only

OpenAI models only

Build on it yourself

Fully open source, both the harness library and the CLI, so you can ship your own agent on top of it

Closed source

The CLI is open source.

## [The built-in modes![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/22.svg)](#the-built-in-modes)

Mastra Code ships four modes plus a thinking control, each tuned for a different kind of task.

-   **Build** is the default mode and has full tool access. It runs simple tasks right away and hands multi-step tasks a live task list. It runs on `anthropic/claude-opus-4-6`.
-   **Plan** is read-only. It produces a structured plan in a fixed shape: an Overview, a Complexity Estimate (size, risk, dependencies), ordered Steps (file, change, why), and a Verification checklist. Then it submits the plan for approval, running on `openai/gpt-5.2-codex`. Approving the plan auto-switches the harness into Build. That is the handoff described earlier, now triggered from the mode itself.
-   **Fast** drops the planning phase for speed. It answers general programming questions from training knowledge and only reads the project's code when a question is project-specific. It runs on `cerebras/zai-glm-4.7`.
-   **YOLO** stands for "You only live once," and it's basically the one mode where your agent can auto-approve any command, access any directory, and never ask for permission until a task is complete or it fails. It's usually good for hobby projects or codebases where broken code won't cost anything.

Across all modes, you have the model's thinking level that stays constant. For instance, if you want your Claude Opus model not to think too long about the actions it takes, you can set the thinking to off by using `/settings` or `/think` with values from `off` through `low`, `medium`, `high`, and `xhigh`.

## [Extending and configuring the harness![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/23.svg)](#extending-and-configuring-the-harness)

Fortunately, many harnesses are open source, so you can always customize with any additional features or plugins you may need for your personal use case.

There are some features that are available by default in the harness, like MCP servers, skills, and plugins to extend your agent. For anything beyond these built-in options, you can update the harness code to include your features.

### [MCP servers![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/24.svg)](#mcp-servers)

Model Context Protocol is a system designed by Anthropic to easily add new features, access to additional tools and different data sources to the harness, without changing a single line of code.

With MCP, you just add a JSON snippet to the MCP server config files of the harness you are using with the required bearer tokens. Once done, your agent is ready to access these new data sources or use additional tools.

Take the Slack MCP, for example. If you want to access your Slack messages, you can add the Slack MCP to the global config and query your conversations from the coding agent without rewriting any part of the harness whatsoever.

### [Skills![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/25.svg)](#skills)

A skill is a markdown file that hands the agent persistent, reusable instructions for one task pattern. It captures the knowledge that would otherwise live in my head and get retyped every session. For example, the project's conventions, the steps of a recurring workflow, and constraints like "always regenerate the generated client, never edit it by hand."

Writing one removes that re-context work for every session after it. I usually draft a skill with the agent's help, by running a task once and asking it to write down what it learned.

## [Wrapping up![](./anatomy-of-a-harness-building-a-coding-agent-that-can-run-fo/26.svg)](#wrapping-up)

Stepping back from the complexity, here are a few things you're sure to see across any agent harness:

-   **The conversation is a channel** you stay subscribed to, not a function you call once, and that is what makes the agent interruptible, steerable, and able to resume after a restart.
-   **Raw model output is translated into clean events** and then folded into a single snapshot, so any UI just reads the snapshot instead of parsing the stream.
-   **Tools can pause and wait for a human** over a back channel, and they fall back to plain text when no one is there to answer.
-   **Session state lives on the thread,** so closing the terminal keeps the mode, the model, the token count, and the memory settings.

The same architecture fits any agent that needs to be interruptible, durable, and shown across more than one surface, whether that is a support agent, a research agent, or an ops agent. Mastra packages it as a reusable Harness class so you can build on it directly.
