# 🧠 Master Agent (Supervisor)

The **Master Agent** is the central orchestrator of the platform, powered by a large language model (LLM).
It receives user queries and intelligently decomposes them into actionable steps, coordinating a set of
developer-defined tools and agents (including flows) to complete the task.

While the Master Agent is LLM-driven, the tools and agents it manages can be anything defined by the developer —
ranging from simple functions and external APIs to other LLM-powered agents.

Currently, we support integration with:

* **GenAI Agents** (created using the GenAI Protocol library)
* **A2A Agents**
* **MCP Tools**

The Master Agent operates iteratively using the **ReAct** reasoning framework to plan and act step by step.

---

## 🚀 Purpose

The **Master Agent** acts as the **Supervisor** of the agent ecosystem. It does not solve tasks directly but:

* Analyzes the user's query
* Breaks the problem down into substeps
* Selects and invokes the appropriate tool, agent, or flow for each step
* Aggregates the results and produces a final response

It functions as a **thinking-and-acting LLM agent**, using reasoning + action loops to achieve task goals.

---

## 🧩 How It Works

The Master Agent is built using the **LangGraph** framework, following the **ReAct (Reasoning + Acting)** paradigm.
It operates in the following stages:

1. **Receive Inputs**

   * Request metadata (session ID, user ID, LLM configuration)
   * A list of available agents and tools (including **flows**) from the Backend API
   * Chat history from the Backend API
   * Optional file metadata

2. **Plan and Decompose**

   * Analyze the user query
   * Break it down into smaller steps

3. **Select Flow or Agent**

   * Search for a **tool, agent, or flow** capable of handling the current step
   * If none are suitable, return a final response

4. **Execute Agents**

   * Invoke the appropriate agent or tool using the relevant connector (GenAI Agents, MCP tools, A2A agents, flows)
   * Append results to the chat history
   * Repeat from step 3 until the task is complete or no further agents are applicable

> ⚠️ **If a flow is executing**, the Master Agent **must only execute the next agent** in the flow's queue.
> It cannot choose a different agent or flow during this state.

---

## 🏗️ Key Concepts

### 🔧 Agents & Tools

Agents are developer-defined processes that can be remotely invoked via:

* `GenAI Protocol` (for GenAI Agents)
* `MCP SDK` (for MCP tools)
* `Google ADK` (for A2A agents)

Each agent or tool must advertise:

* Its name and description
* Accepted parameters
* Expected input types

### 🔁 Flows

A **flow** is a **predefined, linear sequence** of agents and/or tools designed to accomplish a broader task.
Flows can:

* Contain any mix of GenAI Agents, MCP tools, A2A agents, or other flows
* Be decomposed and executed step-by-step by the Master Agent

You don’t need to manually connect agent inputs and outputs — the Master Agent handles that automatically.

### 🧠 ReAct via LangGraph

The Master Agent follows an iterative reasoning and acting process:

* **Thinks** → “What step is needed?”
* **Acts** → “Which tool can perform this step?”
* **Iterates** until the task is complete or no suitable tools remain

### 📁 File Support

The Master Agent does **not** process file contents directly. It only receives **metadata**, such as:

```json
{
  "original_name": "invoice.pdf",
  "mimetype": "application/pdf",
  "internal_id": "abc123"
}
```

If a step requires file input, the Master Agent will:

* Select relevant files based on metadata
* Pass their IDs to the appropriate agent

---

## 🧠 System Prompts

### 🔤 Default System Prompt

This prompt guides the Master Agent in selecting tools and applying ReAct-based reasoning:

```text
- Analyze user query
- Identify the next logical step
- Select a tool ONLY if it can perform the step
- Format correct tool names and parameters
```

### 📁 File-Aware Prompt

This prompt activates when files are included in the request. It instructs the Master Agent
to match tools to files using available metadata.

---

## 🤖 LLM Compatibility

The Master Agent supports any LLM that enables **tool-calling**, including:

* 🔷 OpenAI models (via OpenAI API)
* 🔷 Azure OpenAI models
* 🟠 Ollama (for local LLMs)

---

## 📡 Integrations

The Master Agent supports communication with a variety of agents and tools:

* **GenAI Agents** via `GenAI Protocol` — a platform library for remote calls, session tracking, and streaming results
* **MCP tools** via MCP Python SDK
* **A2A Agents** via Google ADK

---

## 🧪 Development Tips

* Ensure that agents/tools advertise correct input types (especially for file support)
* Avoid nested flows — prefer linear flows for better observability
* Test flow execution: the Master Agent enforces strict sequential order in flows
* Use tool-call logs and traces to debug ReAct loops and agent selection behavior
