# 🚀 GenAI CLI

A command-line tool for interacting with the **GenAI infrastructure**. It allows you to:

* Register users
* Create, register, and manage agents
* Run agents in isolated environments

---

## 🛠️ Installation

### 📦 Option 1: Install Pre-Built Binary

#### 🐧 Linux / 🍏 macOS

1. Run the install script:

   ```bash
   ./install_cli.sh
   ```

2. Enter your system password when prompted — this installs the binary to `/usr/local/bin`.

3. Verify installation:

   ```bash
   genai --help
   ```

   You should see a help message with available commands:

   ```
   Usage: genai [OPTIONS] COMMAND [ARGS]...
   ...
   Commands:
     login
     signup
     logout
     list_agents
     register_agent
     delete_agent
     generate_agent
     run_agents
   ```

#### 🪟 Windows

1. Set the GitHub token as a user environment variable in PowerShell:

   ```powershell
   [Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "your_token_here", "User")
   ```

2. Install the CLI:

   ```powershell
   .\install_cli.ps1
   ```

3. Use the CLI:

   ```powershell
   .\genai.exe --help
   ```

> **Note**: This will change after the repo becomes public.

---

### 🏗️ Option 2: Build From Source

#### 🐧 Linux / 🍏 macOS

* Run the build script:

  ```bash
  ./build_cli.sh
  ```

* Or build manually:

  1. Ensure `python3.12` and `uv` are installed.
  2. Run:

     ```bash
     uv run pyinstaller --onefile --name genai.bin cli.py
     ```

#### 🪟 Windows

* Build using:

  ```powershell
  ./build_cli.ps1
  ```

  This uses **Nuitka** to compile into a Windows-friendly executable that avoids malware flags.

---

## 📘 Usage Guide

### 👤 Authentication

* If you already have a GenAI account (from front-end or back-end):

  ```bash
  genai login -u <your_username> -p <your_password>
  ```

* First-time users:

  ```bash
  genai signup -u <new_username>
  ```

* GenAI CLI stores your JWT token in `~/.genai/credentials` and uses it for agent-related operations.

> ⚠️ You must be logged in to use agent-related commands.

---

### 🤖 Working with Agents

#### ✅ Valid Agent Criteria:

* Python syntax must be valid.
* Agent structure should follow GenAI conventions.
* All dependencies should be installed in the agent’s virtual environment.

#### ✨ Create an Agent

1. Ensure you're logged in.
2. Run:

   ```bash
   genai register_agent --name my_cool_agent --description "This agent does something awesome"
   ```
3. This will:

   * Register metadata in the backend
   * Create a Python file in `agents/`
   * Assign a JWT to the agent (stored in the file)

> 🚫 **Do not modify the JWT** — it's used to validate your agent.

#### 🧪 Set Up Environment for Agent

1. Go to the agent directory:

   ```bash
   cd agents/my_cool_agent
   ```
2. Create a virtual environment:

   ```bash
   uv venv
   uv sync
   ```

> You can also use `python3 -m venv` or other tools instead of `uv`.

---

### 🏃 Running Agents

* Agents are isolated Python files that may have different dependencies.
* Each agent folder must contain a virtual environment: `venv` or `.venv`.
* Run all agents:

  ```bash
  genai run_agents
  ```

> ⚠️ If no venv is found, GenAI will fallback to the parent folder or return an error.

---

## 🔁 Advanced: Register Agent via API

If you prefer to register your agent manually:

1. Go to `http://localhost:8000/docs`.
2. Log in or sign up.
3. Use the `/api/agents/register` endpoint to register your agent.

Example response:

```json
{
  "id": "uuid-here",
  "name": "my_cool_agent",
  "description": "does something great",
  "jwt": "your-agent-jwt"
}
```

4. Add the JWT to your agent:

   ```python
   session = GenAISession(jwt_token="your-agent-jwt")
   ```

5. Generate the agent file:

   ```bash
   genai generate_agent --id uuid-here
   ```

> This creates an agent file in `agents/` folder using the metadata from your API request.

---

## 🧬 Agent Template

Here’s what a typical agent file looks like:

```python
import asyncio
from typing import Annotated
from genai_session.session import GenAISession
from genai_session.utils.context import GenAIContext

AGENT_JWT = "your-agent-jwt"
session = GenAISession(jwt_token=AGENT_JWT)

@session.bind(name="my_cool_agent", description="does something great")
async def my_cool_agent(
    agent_context: GenAIContext,
    test_arg: Annotated[str, "Test argument"]
):
    return "Hello, World!"

async def main():
    print(f"Agent with token '{AGENT_JWT}' started")
    await session.process_events()

if __name__ == "__main__":
    asyncio.run(main())
```

> ✅ Once created, remember to set up the agent’s virtual environment before running:

```bash
python my_agent.py
# or
genai run_agents
```
