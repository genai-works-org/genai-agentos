# Mila Discharge Summary Agent

A friendly post-surgery care assistant that helps patients with their recovery by extracting structured information from discharge summaries.

## What is Mila?

Mila is an AI agent designed to help patients navigate their post-surgery recovery. She can:

- Greet patients warmly and provide friendly assistance
- Extract structured recovery plans from discharge summaries
- Answer basic questions about recovery care
- Guide patients on next steps

## Features

### 🏥 **Discharge Summary Processing**

When provided with a discharge summary, Mila extracts:

- **Medicines**: Medication schedules with dates, times, and dosages
- **Appointments**: Follow-up appointments and lab tests
- **Activity**: Recovery activities and restrictions
- **Diet**: Dietary recommendations and restrictions

### 💬 **Conversational Assistant**

Without a discharge summary, Mila acts as a friendly assistant:

- Welcomes new patients
- Explains her capabilities
- Guides users to upload their discharge summary
- Answers basic recovery questions

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
python discharge_summary.py
```

### Example Interactions

**Greeting:**

```
User: Hi Mila!
Mila: Hello! I'm Mila, your friendly recovery assistant 😊 How can I help you today?
```

**With Discharge Summary:**

```
User: "Please process my discharge summary"
Discharge Summary: "Patient had appendectomy. Take ibuprofen 400mg twice daily..."

Mila: Returns structured JSON with:
{
  "medicines": [
    {
      "date": "2025-07-15",
      "time": "08:00",
      "type": "breakfast",
      "medicine_name": "ibuprofen",
      "dosage": "400mg"
    }
  ],
  "appointments": [...],
  "activity": [...],
  "diet": [...]
}
```

**Without Summary:**

```
User: "What medications should I take?"
Mila: "I'd love to help with your medications! Please upload your discharge summary so I can provide personalized guidance."
```

## Response Format

### Conversational Mode

```json
{
  "response": "Hello! I'm Mila, your recovery assistant...",
  "user_message": "Hi",
  "agent_type": "mila_agent",
  "has_discharge_summary": false
}
```

### Extraction Mode

```json
{
  "response": "JSON structured data...",
  "user_message": "Process my summary",
  "agent_type": "mila_agent",
  "has_discharge_summary": true
}
```

## Technical Details

- **Framework**: GenAI Session Protocol
- **AI Model**: GPT-4o (OpenAI)
- **Input**: User messages + optional discharge summary text
- **Output**: Structured JSON responses

## Error Handling

If anything goes wrong, Mila provides a helpful fallback response:

```
"Hi! I'm Mila, your post-surgery care assistant. 🏥
Please upload your discharge summary so I can help you better with medications, appointments, or diet tips."
```

## Integration

This agent is designed to work with the GenAI Agent OS platform and can be integrated into larger healthcare applications for post-surgery patient care management.
