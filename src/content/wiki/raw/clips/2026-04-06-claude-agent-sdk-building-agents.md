---
title: "Building Agents with the Claude Agent SDK"
url: "https://claude.com/blog/building-agents-with-the-claude-agent-sdk"
clipped: 2026-04-06
pillar: ai
relevance: 5
fetch_status: full_text
visibility: public
---

# Building Agents with the Claude Agent SDK

## Core Philosophy

The Claude Agent SDK is built on a fundamental principle: **give Claude access to a computer**. The SDK enables agents to use tools programmers rely on daily—file manipulation, terminal commands, code execution, and iteration—transforming Claude into a general-purpose agent builder rather than just a coding tool.

As stated in the article: "The key design principle behind the Claude Agent SDK is to give your agents a computer, allowing them to work like humans do."

## The Agent Loop Architecture

The SDK implements a proven feedback cycle:

1. **Gather Context** - Search file systems, retrieve relevant information, and manage context windows through compaction
2. **Take Action** - Execute via tools, bash scripts, code generation, and external integrations
3. **Verify Work** - Evaluate output through rules, visual feedback, or LLM judgment

## Key Capabilities

**Context Management:**
- Agentic search using bash commands like `grep` and `tail`
- Semantic search for faster retrieval
- Subagent parallelization with isolated context
- Automatic context compaction for long-running agents

**Execution Tools:**
- Custom tool definitions for primary agent actions
- Bash/script access for flexible computer operations
- Code generation for complex, reusable operations
- Model Context Protocol (MCP) for standardized third-party integrations

**Verification Methods:**
- Rule-based feedback (linting, validation)
- Visual feedback through screenshots and renders
- LLM-as-judge evaluation for nuanced assessment

## Agent Use Cases

The SDK enables diverse applications:
- Financial portfolio analysis and investment evaluation
- Personal assistants managing calendars and travel
- Customer support systems handling ambiguous requests
- Research agents synthesizing information across documents

## Development Best Practices

The article emphasizes iterative improvement: examine agent failures carefully, audit whether it has appropriate tools, refine search APIs for clarity, add formal validation rules, and build representative test sets for ongoing evaluation.

**Wiki relevance**: 直接命中 build-for-models 與 human-ai-collaboration — Anthropic 官方的 Agent SDK 設計哲學文件，展示「給 AI 一台電腦」的核心理念，適合更新 one-person-team 和 build-for-models concept 頁
