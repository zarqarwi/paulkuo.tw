---
title: "Anthropic Release Notes - April 2026: Advisor Tool & Agent SDK Updates"
url: "https://releasebot.io/updates/anthropic"
clipped: 2026-04-16
pillar: ai
relevance: 4
fetch_status: search_summary_only
visibility: public
---

Anthropic 2026 年 4 月最新更新整理：

**Advisor Tool（公開測試版）**：將「快速執行模型」與「高智能顧問模型」配對。執行模型在跑長時程 agentic workload 時，可以中途請顧問模型給策略指引。這是把「思考」與「行動」拆解的工程實踐。

**Claude Managed Agents（公開測試版）**：完全託管的 agent 執行環境，內建安全沙箱、工具、SSE 串流。透過 API 可以建立 agent、配置容器、執行 session。

**SDK 增強**：
- 新增 `get_context_usage()` 方法可追蹤 context 用量
- 支援 `typing.Annotated` 描述參數
- `ToolPermissionContext` 暴露 `tool_use_id` 和 `agent_id`
- `ClaudeAgentOptions` 新增 `session_id` 選項

最新版本：0.2.104，仍在密集開發中。

**Wiki relevance**: 對應 [[build-for-models]] 和 [[agentic-web]] concept。Advisor Tool 的設計思維（雙模型協作）值得拉出來討論——這是把 [[human-ai-collaboration]] 內化到 AI 系統內部的具體實作。
