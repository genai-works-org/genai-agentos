# Eleven Labs Text-to-Audio MCP Server

This MCP server converts text files and direct text input to audio using Eleven Labs' text-to-speech API.

## Setup

1. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Configure your Eleven Labs API key:**
   Edit the `.env` file and add your Eleven Labs API key:

   ```
   ELEVEN_LABS_API_KEY=your_actual_api_key_here
   ```

3. **Run the MCP server:**

   ```bash
   python main.py
   ```

4. **Run the audio file server (for HTTP downloads):**
   In a separate terminal:
   ```bash
   python audio_server.py
   ```
   This serves audio files at http://localhost:8891/audio/

## Important: Audio File Downloads

- The MCP server generates audio files and saves them locally
- To download audio files via HTTP (for web access), run the separate audio server
- Audio files will be accessible at: `http://localhost:8891/audio/filename.mp3`
- The audio server supports CORS and provides proper headers for browser playback

## Available Tools

### 1. `text_file_to_audio`

Converts uploaded text file content to audio (main tool for GenAI system).

**Parameters:**

- `file_content` (string): Content of the text file to convert
- `voice_id` (optional): Eleven Labs voice ID (defaults to Rachel)
- `model` (optional): TTS model (default: eleven_monolingual_v1)

**Returns:** Audio file information including both local path and HTTP download URL (if audio server is running)

### 2. `local_file_to_audio`

Converts a local text file to audio (for testing with file paths).

**Parameters:**

- `file_path` (string): Path to the text file
- `voice_id` (optional): Eleven Labs voice ID (defaults to Rachel)
- `model` (optional): TTS model (default: eleven_monolingual_v1)

**Returns:** Path to the generated audio file

### 3. `text_to_audio`

Converts text directly to audio.

**Parameters:**

- `text` (string): Text content to convert
- `voice_id` (optional): Eleven Labs voice ID (defaults to Rachel)
- `model` (optional): TTS model (default: eleven_monolingual_v1)

**Returns:** Path to the generated audio file

### 4. `list_available_voices`

Lists all available voices from Eleven Labs.

**Returns:** JSON string of available voices with their IDs and names

### 5. `get_audio_output_directory`

Gets the current audio output directory path.

**Returns:** Absolute path to the audio output directory

### 6. `get_audio_file_url`

Gets the HTTP download URL for a specific audio file.

**Parameters:**

- `filename` (string): Name of the audio file (e.g., "audio_12345678.mp3")

**Returns:** HTTP URL for downloading the audio file

### 7. `list_audio_files`

Lists all available audio files with their download URLs.

**Returns:** List of audio files with their filenames, URLs, and file sizes

## Adding to GenAI System

1. Start your MCP server (it runs on port 8889 by default)
2. In your GenAI system, add the MCP server URL: `http://host.docker.internal:8889/mcp`
3. The tools will be available for use in your GenAI workflows

## Configuration

### Environment Variables

- `ELEVEN_LABS_API_KEY`: Your Eleven Labs API key (required)
- `ELEVEN_LABS_VOICE_ID`: Default voice ID (optional, defaults to Rachel)
- `AUDIO_OUTPUT_DIR`: Directory for audio files (optional, defaults to ./audio_output)

### Voice IDs

Some popular Eleven Labs voice IDs:

- Rachel: `21m00Tcm4TlvDq8ikWAM`
- Drew: `29vD33N1CtxCmqQRPOHJ`
- Clyde: `2EiwWnXFnvU5JabPnv8n`
- Paul: `5Q0t7uMcjvnagumLfvZi`

Use the `list_available_voices` tool to get a complete list of available voices for your account.

## Example Usage

Once added to your GenAI system, you can use it like:

**For uploaded file content:**

```json
{
  "tool": "text_file_to_audio",
  "parameters": {
    "file_content": "Hello! This is the content of my uploaded text file that I want to convert to audio.",
    "voice_id": "21m00Tcm4TlvDq8ikWAM"
  }
}
```

**For local file testing:**

```json
{
  "tool": "local_file_to_audio",
  "parameters": {
    "file_path": "./sample.txt",
    "voice_id": "21m00Tcm4TlvDq8ikWAM"
  }
}
```

**For direct text:**

```json
{
  "tool": "text_to_audio",
  "parameters": {
    "text": "Hello, this is a direct text message to convert to audio."
  }
}
```

All tools return information about the generated audio file, including the local path and HTTP download URL (when the audio server is running).

**Example response:**

```
Audio saved successfully!
Download URL: http://localhost:8891/audio/audio_12345678.mp3
Local path: /path/to/audio_output/audio_12345678.mp3
```
