# Language Translator MCP Server

This MCP server provides comprehensive text translation capabilities using OpenAI's GPT models. It can translate text between many languages, detect languages, and handle both direct text input and file content.

## Features

- **Text Translation**: Translate any text to your desired target language
- **File Content Translation**: Upload text files and get translations
- **Language Detection**: Automatically detect the source language of text
- **Batch Translation**: Translate multiple texts at once
- **Translation History**: Save and track translation files
- **50+ Supported Languages**: Major world languages supported

## Setup

1. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Configure your OpenAI API key:**
   The `.env` file should already contain your OpenAI API key:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Run the MCP server:**
   ```bash
   python language_translator.py
   ```

## Available Tools

### 1. `translate_user_text`

Translate any user-provided text to the specified target language.

**Parameters:**

- `text` (string): Text content to translate
- `target_language` (string): Target language (e.g., 'Spanish', 'French', 'German')
- `source_language` (optional): Source language (will auto-detect if not provided)
- `detect_source` (optional): Whether to auto-detect source language (default: true)

**Returns:** JSON with original text, translated text, and language information

### 2. `translate_file_content`

Translate uploaded file content to the specified target language.

**Parameters:**

- `file_content` (string): Content of the uploaded file to translate
- `target_language` (string): Target language (e.g., 'Spanish', 'French', 'German')
- `source_language` (optional): Source language (will auto-detect if not provided)
- `save_to_file` (optional): Whether to save translation to a file (default: true)

**Returns:** JSON with translation details and file information

### 3. `detect_text_language`

Detect the language of the provided text.

**Parameters:**

- `text` (string): Text to analyze for language detection

**Returns:** JSON with detected language and confidence information

### 4. `list_supported_languages`

List all supported languages for translation.

**Returns:** JSON list of supported languages with their codes

### 5. `batch_translate`

Translate multiple texts to the same target language.

**Parameters:**

- `texts` (array): List of text strings to translate
- `target_language` (string): Target language for all translations
- `source_language` (optional): Source language (will auto-detect if not provided)

**Returns:** JSON with all translations and results

### 6. `get_translation_history`

Get list of previously saved translation files.

**Returns:** JSON list of translation files in the output directory

## Supported Languages

The translator supports 50+ languages including:

**European Languages:**

- Spanish, French, German, Italian, Portuguese
- Russian, Dutch, Swedish, Norwegian, Danish, Finnish
- Polish, Czech, Hungarian, Turkish, Greek, Hebrew

**Asian Languages:**

- Chinese, Japanese, Korean, Hindi, Arabic, Thai
- Vietnamese, Indonesian, Malay, Filipino, Bengali, Urdu

**And many more!** Use the `list_supported_languages` tool to see the complete list.

## Adding to GenAI System

1. Start your MCP server (it runs on the default port)
2. In your GenAI system, add the MCP server URL
3. The translation tools will be available for use in your GenAI workflows

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)

### Models Used

- **Translation Model**: `gpt-4o-mini` (cost-effective and accurate for translation)
- **Temperature**: 0.3 (for consistent translations)
- **Language Detection**: Uses the same model with specialized prompts

## Example Usage

Once added to your GenAI system, you can use it like:

**Translate user text:**

```json
{
  "tool": "translate_user_text",
  "parameters": {
    "text": "Hello, how are you today?",
    "target_language": "Spanish"
  }
}
```

**Translate file content:**

```json
{
  "tool": "translate_file_content",
  "parameters": {
    "file_content": "This is the content of my document that needs translation.",
    "target_language": "French",
    "save_to_file": true
  }
}
```

**Detect language:**

```json
{
  "tool": "detect_text_language",
  "parameters": {
    "text": "Bonjour, comment allez-vous?"
  }
}
```

**Batch translate:**

```json
{
  "tool": "batch_translate",
  "parameters": {
    "texts": ["Hello", "Goodbye", "Thank you"],
    "target_language": "Spanish"
  }
}
```

## Translation Quality

- Uses OpenAI's GPT-4o-mini for high-quality translations
- Preserves context and tone in translations
- Handles idiomatic expressions and cultural nuances
- Supports technical and specialized terminology

## File Management

- Translated files are saved to `./translations/` directory
- Files are named with source and target language information
- Includes both original and translated content in saved files
- Translation history is tracked and accessible

## Error Handling

- Comprehensive error handling for API failures
- Graceful degradation for unsupported languages
- Clear error messages for debugging
- Automatic retry logic for transient failures

## Cost Optimization

- Uses GPT-4o-mini model for cost-effective translations
- Optimized prompts to minimize token usage
- Batch processing support to reduce API calls
- Efficient caching of language detection results
