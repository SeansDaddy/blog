---
category: AI Agent
title: Skill 好不好，不只看输出：触发精度才是那个被漏掉的维度
date: '2026-05-07'
tags: ['AI Agent', 'Skill开发', 'Evals', 'promptfoo', '方法论']
excerpt: 读了两篇 mager.co 的文章，关于 AI Skill 的评估，终于把「触发精度」和「输出质量」这两个维度区分清楚了。记录一下核心收获，以及对我们自己 Skill 开发的借鉴。
---

最近读了两篇 mager.co 的文章，正好形成一个系列：

- **第一篇**（2026-03-08）：Skill 的触发精度问题，Anthropic eval 系统
- **第二篇**（2026-02-26）：输出质量评估，promptfoo 完整指南

两篇读完，最核心的收获其实就一句话：**Skill 有两个完全独立的质量维度，混淆了就会出问题**。

## 两个维度，分别是什么

做 Skill 容易陷入一个盲区：以为把 SKILL.md 写好、调好 prompt 就够了。但实际上 Skill 有两个不同的质量维度：

| 维度 | 问题 | 业界工具 |
|---|---|---|
| **Output Quality** | Skill 被激活后，输出质量好不好？ | promptfoo |
| **Trigger Precision** | Claude 到底会不会**激活**这个 Skill？ | Anthropic skill-creator eval |

一个 Skill 可以 Output Quality 很好但 Trigger Precision 很烂——答案质量上乘，但从不被调用。也可以 Trigger Precision 很好但 Output Quality 很烂——每次都触发，但答案垃圾。两个维度必须都通过才能发版。

## 维度一：输出质量 → promptfoo

promptfoo 是评估 LLM 输出质量的行业标准工具，核心用法是这样的：

```yaml
# promptfooconfig.yaml
prompts:
  - file://SKILL.md
providers:
  - anthropic:claude-sonnet-4-7
tests:
  - vars:
      query: "How do I say 'Where is the bathroom?'"
    assert:
      - type: contains; value: "トイレ"
      - type: llm-rubric
        value: "Provides both Japanese phrase AND pronunciation"
```

`llm-rubric` 是一个 LLM 裁判，让另一个 LLM 来评判输出的质量。这是 promptfoo 最强大的功能。

断言分三层：

**第一层：确定性断言**（最快、最便宜）—— `contains`、`is-json`、`regex`。能写代码判断的就不用 LLM。

**第二层：JavaScript 断言**（自定义逻辑）—— 直接写 JS 验证 JSON 结构、长度、格式。

**第三层：Model-Graded 断言**（LLM 裁判）—— 真正需要语义判断的地方才用这个。

最优策略：先用确定性检查 → 再用 JS 验证结构 → 只在真正需要语义判断时才上 LLM graded，省 API 费用。

### 每次改动都跑回归

```bash
# 1. 锁定 baseline
npx promptfoo@latest eval --output results-baseline.json

# 2. 改 prompt

# 3. 重新跑，对比
npx promptfoo@latest eval --compare results-baseline.json
```

精度掉了就回滚。这是 TDD 的思路——先写测试，再改代码。只不过测试对象是 prompt。

## 维度二：触发精度 → Anthropic eval 系统

这是第一篇文章的核心，也是大多数 Skill 开发者完全忽视的维度。

问题的本质是：Claude Code 决定是否激活一个 Skill，只看 SKILL.md 的 YAML frontmatter 的 `description` 字段。这个 description 是路由信号，LLM 用它判断"这个 Skill 和用户当前问题是否相关"。

**description 写得太抽象，Skill 就不触发。**

### 触发数据集

```json
[
  { "query": "Design a card component for a music app", "should_trigger": true },
  { "query": "How should I style my primary CTA button?", "should_trigger": true },
  { "query": "Help me write a Node.js REST API", "should_trigger": false },
  { "query": "Fix this Python bug", "should_trigger": false }
]
```

目标：正例该触发就触发，负例不该触发就不触发。**9/13 是及格线。**

### 跑 eval

```bash
python skills/skill-creator/scripts/run_eval.py \
  --eval-set agents/eval-set.json \
  --skill-path ./skills/frontend-design \
  --runs-per-query 3 --verbose
```

底层逻辑很有意思：伪造 `.claude/commands/` 条目，对每个 query 跑 `claude -p <query>`，监听 Skill/Read tool calls，统计触发率。

### 常见 description 问题

文章里列了三个典型问题，很具体：

1. **没有动作动词** — "A frontend design agent" 描述的是身份，不是用户意图
2. **没有具体例子** — "aesthetic philosophy" 太抽象，Claude 不知道 Skill 处理 buttons/cards/forms
3. **没有负面空间** — 没明确边界，Claude 只能瞎猜

优化后的 description 是这样的：

```yaml
description: Use this skill for frontend UI design tasks — designing or
reviewing components (buttons, cards, forms, navbars, modals), specifying
CSS with concrete values, layout and spacing decisions, typography
selection, color systems, dark mode, and visual polish. Triggers on
"design a [component]", "how should I style...", "review my UI",
"make this look better"... NOT for backend logic, API design,
database schema, deployment, or server-side code.
```

祈使语气、具体组件名、触发短语、显式排除——四条原则。

### 自动迭代

`run_loop.py` 可以自动做这件事：eval → 改写 description → 再 eval → 通常 3-5 轮收敛。`--holdout 0.4` 把数据集拆成 60% 训练 + 40% 测试，防止过拟合。

文章里有一句话很到位：

> **Description 是超参数，不是元数据。** 就像 ML 里调 learning rate，你需要用真实路由行为来调 description，而不是凭感觉猜。

## 完整评估流程

```
Write skill
  → Quality eval（promptfoo）→ Output is good?
  → Trigger eval（run_eval）→ Right queries fire?
  → Iterate SKILL.md body      → Iterate description
```

两个维度独立验证，全部绿了才能发版。

## 对我们 Skill 开发的借鉴

我们的 skill-review-pipeline 做的是**静态检查**（YAML 格式、字段完整性、敏感信息），属于 Lint 层面。但这两篇文章揭示了一个更大的缺口：**行为测试**。

具体来说，我们的 Skill 缺三样东西：

**第一，Trigger eval 数据集。** 每个 Skill 已经有 `evals.json`（输出质量测试），但还缺一个 `trigger-eval-set.json`，定义应该触发和不应该触发的 query 列表。

**第二，Output quality 回归测试。** promptfoo 集成，每次改 SKILL.md 都跑一遍，精度降了就告警。

**第三，自动化迭代。** description 的 trigger precision 调优，目前是人工读 linter 报告手动改，应该有类似 `run_loop.py` 的自动优化循环。

三个问题都不难落地，最快一周能搭出 MVP。

---

来源：
- https://www.mager.co/blog/2026-03-08-claude-code-eval-loop/
- https://www.mager.co/blog/2026-02-23-promptfoo-llm-validation
