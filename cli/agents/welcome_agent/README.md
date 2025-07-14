# Welcome Agent (Mila)

A friendly welcome agent that serves as the first point of contact for patients entering the Mila Patient Care System. Provides warm greetings, introductions, and guides patients on how to get started with their recovery journey.

## What is the Welcome Agent?

The Welcome Agent is Mila's welcoming personality - the friendly face that patients first encounter when they interact with the Mila Patient Care System. This agent:

- **Greets patients warmly** and makes them feel comfortable
- **Introduces the Mila system** and its capabilities
- **Answers basic questions** about recovery care
- **Guides patients** on next steps to begin their recovery journey

## Features

### 👋 **Warm Patient Greetings**

- Responds to common greetings: "Hi", "Hello", "Good morning"
- Creates a welcoming, supportive environment
- Uses friendly, encouraging language

### 💬 **System Introduction**

- Explains who Mila is and what she does
- Describes the Mila Patient Care System capabilities
- Helps patients understand available services

### 🩺 **Recovery Support Information**

- Provides information about post-surgery care
- Explains support for various surgeries (appendectomy, hysterectomy, transplants)
- Answers "What can you do?" and similar questions

### 📋 **Onboarding Guidance**

- Directs patients to upload their discharge summary
- Explains next steps in the recovery process
- Bridges patients to other specialized agents

## How to Use

### Prerequisites

1. Set up environment variables:

   ```bash
   AGENT_JWT=your_agent_jwt_token
   OPENAI_API_KEY=your_openai_api_key
   ```

2. Install dependencies:
   ```bash
   uv sync
   ```

### Running the Agent

```bash
python welcome_agent.py
```

### Example Interactions

**Basic Greeting:**

```
User: "Hi"
Mila: "Hello! I'm Mila, your friendly recovery assistant 😊 How can I help you today?"
```

**System Information:**

```
User: "What can you do?"
Mila: "I'm here to help you through your recovery—answering questions, tracking meds, and more."
```

**Identity Questions:**

```
User: "Who are you?"
Mila: "I'm Mila, your recovery assistant. I'm here to help you navigate your post-surgery care and recovery journey."
```

**Next Steps:**

```
User: "What should I do next?"
Mila: "To get started, please upload your discharge summary so I can provide personalized guidance for your recovery."
```

**General Recovery Questions:**

```
User: "What is Mila?"
Mila: "Mila is a patient care system designed to help you recover from surgeries like appendectomy, hysterectomy, and transplants. I'm here to support you every step of the way!"
```

## User Memory Integration

The agent includes user memory capabilities:

- **Retrieves user profiles** from memory
- **Personalizes responses** when username is available
- **Maintains conversation context** across interactions

## Response Characteristics

### 🎯 **Tone & Style**

- **Friendly and warm** - Makes patients feel welcomed
- **Simple and clear** - Easy to understand language
- **Supportive** - Encouraging and reassuring
- **Professional** - Maintains medical care standards

### 📝 **Response Guidelines**

- Keep responses short and focused
- Use emojis appropriately for warmth
- Always be encouraging and positive
- Guide users toward helpful next steps

## Technical Details

- **Framework**: GenAI Session Protocol
- **AI Model**: GPT-4o (OpenAI)
- **Memory**: Integrated user profile storage
- **Temperature**: 0.5 (balanced creativity and consistency)
- **Max Tokens**: 200 (concise responses)

## Error Handling

When OpenAI API fails, provides a friendly fallback:

```
"Hi! I'm Mila, your recovery assistant 😊
Please upload your medical discharge summary so I can assist you better."
```

## Integration with Other Agents

The Welcome Agent serves as the entry point to the Mila ecosystem:

### 🔄 **Patient Journey Flow**

1. **Welcome Agent** - First contact, greetings, system introduction
2. **Discharge Summary Agent** - Process medical documents
3. **Activity Agent** - Recovery exercises and activities
4. **Other specialized agents** - Specific care needs

### 🎯 **Handoff Points**

- Directs to discharge summary upload
- Guides to specialized recovery agents
- Maintains continuity of care

## Use Cases

### 🏥 **Healthcare Settings**

- Hospital discharge processes
- Clinic follow-up systems
- Telehealth platforms
- Patient portals

### 👥 **Patient Types**

- Post-surgery patients
- First-time system users
- Patients needing orientation
- Anyone seeking recovery support

## Best Practices

### 💡 **For Patients**

- Start with a simple greeting
- Ask about system capabilities
- Follow guidance for next steps
- Upload discharge summary when ready

### 🛠 **For Developers**

- Ensure OpenAI API key is configured
- Monitor user memory integration
- Test fallback responses
- Integrate with other Mila agents

Perfect for creating a welcoming, supportive first impression in healthcare applications! 🌟💚
