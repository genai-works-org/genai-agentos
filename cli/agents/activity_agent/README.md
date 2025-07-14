# Activity Agent

A recovery-focused agent that provides personalized music and yoga recommendations for patients during their post-surgery recovery period.

## What is the Activity Agent?

The Activity Agent is designed to support patients during their recovery journey by providing:

- **Relaxing music recommendations** for stress relief and healing
- **Gentle yoga routines** adapted to recovery stages
- **Day-specific suggestions** based on recovery progress

## Features

### 🎵 **Music Therapy**

- Curated peaceful piano music for relaxation
- Consistent calming content to reduce stress
- Helps create a healing environment

### 🧘 **Recovery Yoga**

- **Early Recovery (Days 1-3)**: Gentle neck stretches and shoulder rolls while seated
- **Later Recovery (Day 4+)**: Seated twists and gentle hamstring stretches
- Safety-first approach with pain monitoring

### 📅 **Progressive Recovery**

- Adapts recommendations based on recovery day
- Considers healing timeline and patient capabilities
- Gradual increase in activity complexity

## How to Use

### Prerequisites

1. Set up environment variables:

   ```bash
   AGENT_JWT=your_agent_jwt_token
   ```

2. Install dependencies:
   ```bash
   uv sync
   ```

### Running the Agent

```bash
python activity_agent.py
```

### Example Interactions

**Early Recovery (Day 1-3):**

```
Input: day_number = 1
Output: {
  "success": true,
  "music": {
    "description": "Peaceful piano music for relaxation",
    "url": "https://www.youtube.com/watch?v=lFcSrYw-ARY"
  },
  "yoga": {
    "routine": "Neck stretches and shoulder rolls while seated",
    "note": "Stop if you feel pain or discomfort. Perform with supervision if needed."
  },
  "day": 1
}
```

**Later Recovery (Day 4+):**

```
Input: day_number = 5
Output: {
  "success": true,
  "music": {
    "description": "Peaceful piano music for relaxation",
    "url": "https://www.youtube.com/watch?v=lFcSrYw-ARY"
  },
  "yoga": {
    "routine": "Seated twists and gentle hamstring stretches",
    "note": "Stop if you feel pain or discomfort. Perform with supervision if needed."
  },
  "day": 5
}
```

## Safety Guidelines

### 🚨 **Important Reminders**

- **Stop if you feel pain or discomfort**
- **Perform with supervision if needed**
- **Always consult your healthcare provider** before starting any activity
- **Listen to your body** and rest when needed

## Response Format

### Success Response

```json
{
  "success": true,
  "music": {
    "description": "Peaceful piano music for relaxation",
    "url": "https://www.youtube.com/watch?v=lFcSrYw-ARY"
  },
  "yoga": {
    "routine": "Specific yoga routine based on recovery day",
    "note": "Safety reminder message"
  },
  "day": 1
}
```

### Error Response

```json
{
  "success": false,
  "error": "activity_suggestion_error",
  "message": "Error description"
}
```

## Recovery Timeline

| Recovery Stage           | Days | Yoga Routine                       | Focus                           |
| ------------------------ | ---- | ---------------------------------- | ------------------------------- |
| **Early Recovery**       | 1-3  | Neck stretches, shoulder rolls     | Gentle movement, circulation    |
| **Progressive Recovery** | 4+   | Seated twists, hamstring stretches | Increased flexibility, mobility |

## Technical Details

- **Framework**: GenAI Session Protocol
- **Input**: Recovery day number (integer)
- **Output**: Structured activity recommendations
- **Safety**: Built-in pain monitoring reminders

## Integration

This agent works seamlessly with:

- **Mila Discharge Summary Agent** - Can be called based on recovery timeline
- **Other recovery agents** - Part of comprehensive post-surgery care
- **GenAI Agent OS** - Full platform integration

## Use Cases

- **Post-surgery recovery programs**
- **Physical therapy support**
- **Stress reduction during healing**
- **Gradual return to activity**
- **Holistic recovery approaches**

Perfect for healthcare applications focused on patient wellness and recovery support! 🌟
