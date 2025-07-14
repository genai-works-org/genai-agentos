# Language Translator MCP Server using OpenAI
import os
import json
from pathlib import Path
from typing import Optional, List, Dict
from dotenv import load_dotenv
from openai import OpenAI
from mcp.server.fastmcp import FastMCP

# Load environment variables
load_dotenv()

# Create an MCP server
mcp = FastMCP("Language Translator Server")

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")

client = OpenAI(api_key=OPENAI_API_KEY)

# Configuration
DEFAULT_MODEL = "gpt-4o-mini"  # More cost-effective for translation
TRANSLATION_OUTPUT_DIR = Path("./translations")

# Ensure output directory exists
TRANSLATION_OUTPUT_DIR.mkdir(exist_ok=True)

# Common languages with their codes
SUPPORTED_LANGUAGES = {
    "spanish": "es",
    "french": "fr", 
    "german": "de",
    "italian": "it",
    "portuguese": "pt",
    "russian": "ru",
    "chinese": "zh",
    "japanese": "ja",
    "korean": "ko",
    "arabic": "ar",
    "hindi": "hi",
    "dutch": "nl",
    "swedish": "sv",
    "norwegian": "no",
    "danish": "da",
    "finnish": "fi",
    "polish": "pl",
    "czech": "cs",
    "hungarian": "hu",
    "turkish": "tr",
    "greek": "el",
    "hebrew": "he",
    "thai": "th",
    "vietnamese": "vi",
    "indonesian": "id",
    "malay": "ms",
    "filipino": "fil",
    "english": "en"
}

def detect_language(text: str) -> str:
    """Detect the language of the input text using OpenAI"""
    try:
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {
                    "role": "system", 
                    "content": "You are a language detection expert. Respond with only the language name in English (e.g., 'Spanish', 'French', 'English') for the given text. Be concise."
                },
                {
                    "role": "user", 
                    "content": f"What language is this text written in? Text: {text[:500]}..."
                }
            ],
            max_tokens=20,
            temperature=0
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error detecting language: {str(e)}"

def translate_text(text: str, target_language: str, source_language: Optional[str] = None) -> str:
    """Translate text using OpenAI's GPT model"""
    try:
        # Create the translation prompt
        if source_language:
            prompt = f"Translate the following text from {source_language} to {target_language}. Provide only the translation without any additional commentary:\n\n{text}"
        else:
            prompt = f"Translate the following text to {target_language}. Provide only the translation without any additional commentary:\n\n{text}"
        
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {
                    "role": "system", 
                    "content": "You are a professional translator. Provide accurate, natural translations while preserving the original meaning and tone. Only provide the translation, no explanations."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            temperature=0.3  # Lower temperature for more consistent translations
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error during translation: {str(e)}"

@mcp.tool()
def translate_user_text(
    text: str, 
    target_language: str, 
    source_language: Optional[str] = None,
    detect_source: bool = True
) -> str:
    """
    Translate user-provided text to the specified target language.
    
    Args:
        text: Text content to translate
        target_language: Target language (e.g., 'Spanish', 'French', 'German')
        source_language: Source language (optional, will auto-detect if not provided)
        detect_source: Whether to auto-detect source language
    
    Returns:
        Translated text with language information
    """
    try:
        if not text.strip():
            return "Error: Text content is empty"
        
        # Detect source language if requested and not provided
        detected_source = None
        if detect_source and not source_language:
            detected_source = detect_language(text)
            source_language = detected_source
        
        # Perform translation
        translated_text = translate_text(text, target_language, source_language)
        
        # Format response
        result = {
            "original_text": text,
            "translated_text": translated_text,
            "source_language": source_language or "auto-detected",
            "target_language": target_language,
            "detected_source": detected_source
        }
        
        return json.dumps(result, indent=2, ensure_ascii=False)
        
    except Exception as e:
        return f"Error translating text: {str(e)}"

@mcp.tool()
def translate_file_content(
    file_content: str,
    target_language: str,
    source_language: Optional[str] = None,
    save_to_file: bool = True
) -> str:
    """
    Translate uploaded file content to the specified target language.
    
    Args:
        file_content: Content of the uploaded file to translate
        target_language: Target language (e.g., 'Spanish', 'French', 'German')
        source_language: Source language (optional, will auto-detect if not provided)
        save_to_file: Whether to save the translation to a file
    
    Returns:
        Translated content with file information
    """
    try:
        if not file_content.strip():
            return "Error: File content is empty"
        
        # Detect source language if not provided
        detected_source = None
        if not source_language:
            detected_source = detect_language(file_content)
            source_language = detected_source
        
        # Perform translation
        translated_text = translate_text(file_content, target_language, source_language)
        
        # Save to file if requested
        output_file = None
        if save_to_file:
            safe_target = target_language.replace(" ", "_").lower()
            safe_source = (source_language or "unknown").replace(" ", "_").lower()
            filename = f"translation_{safe_source}_to_{safe_target}.txt"
            output_file = TRANSLATION_OUTPUT_DIR / filename
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"# Translation: {source_language} → {target_language}\n\n")
                f.write(f"## Original Text:\n{file_content}\n\n")
                f.write(f"## Translated Text:\n{translated_text}\n")
        
        # Format response
        result = {
            "original_content": file_content[:200] + "..." if len(file_content) > 200 else file_content,
            "translated_content": translated_text,
            "source_language": source_language,
            "target_language": target_language,
            "detected_source": detected_source,
            "output_file": str(output_file.absolute()) if output_file else None,
            "content_length": len(file_content),
            "translation_length": len(translated_text)
        }
        
        return json.dumps(result, indent=2, ensure_ascii=False)
        
    except Exception as e:
        return f"Error translating file content: {str(e)}"

@mcp.tool()
def detect_text_language(text: str) -> str:
    """
    Detect the language of the provided text.
    
    Args:
        text: Text to analyze for language detection
    
    Returns:
        Detected language information
    """
    try:
        if not text.strip():
            return "Error: Text content is empty"
        
        detected_language = detect_language(text)
        
        result = {
            "text_sample": text[:100] + "..." if len(text) > 100 else text,
            "detected_language": detected_language,
            "confidence": "high",  # OpenAI generally provides reliable detection
            "text_length": len(text)
        }
        
        return json.dumps(result, indent=2, ensure_ascii=False)
        
    except Exception as e:
        return f"Error detecting language: {str(e)}"

@mcp.tool()
def list_supported_languages() -> str:
    """
    List all supported languages for translation.
    
    Returns:
        JSON list of supported languages with their codes
    """
    try:
        # Add some additional context languages
        extended_languages = SUPPORTED_LANGUAGES.copy()
        extended_languages.update({
            "bengali": "bn",
            "urdu": "ur", 
            "persian": "fa",
            "ukrainian": "uk",
            "bulgarian": "bg",
            "romanian": "ro",
            "serbian": "sr",
            "croatian": "hr",
            "slovenian": "sl",
            "slovak": "sk",
            "latvian": "lv",
            "lithuanian": "lt",
            "estonian": "et"
        })
        
        result = {
            "supported_languages": extended_languages,
            "total_languages": len(extended_languages),
            "note": "You can specify target language by name (e.g., 'Spanish', 'French') or use any language name that OpenAI recognizes"
        }
        
        return json.dumps(result, indent=2, ensure_ascii=False)
        
    except Exception as e:
        return f"Error listing languages: {str(e)}"

@mcp.tool()
def batch_translate(
    texts: List[str],
    target_language: str,
    source_language: Optional[str] = None
) -> str:
    """
    Translate multiple texts to the same target language.
    
    Args:
        texts: List of text strings to translate
        target_language: Target language for all translations
        source_language: Source language (optional, will auto-detect if not provided)
    
    Returns:
        JSON with all translations
    """
    try:
        if not texts or len(texts) == 0:
            return "Error: No texts provided for translation"
        
        translations = []
        for i, text in enumerate(texts):
            if not text.strip():
                translations.append({
                    "index": i,
                    "original": text,
                    "translated": "",
                    "error": "Empty text"
                })
                continue
            
            try:
                # Detect source language for first text if not provided
                if not source_language and i == 0:
                    source_language = detect_language(text)
                
                translated = translate_text(text, target_language, source_language)
                translations.append({
                    "index": i,
                    "original": text,
                    "translated": translated,
                    "source_language": source_language,
                    "target_language": target_language
                })
            except Exception as e:
                translations.append({
                    "index": i,
                    "original": text,
                    "translated": "",
                    "error": str(e)
                })
        
        result = {
            "translations": translations,
            "total_texts": len(texts),
            "successful_translations": len([t for t in translations if "error" not in t]),
            "source_language": source_language,
            "target_language": target_language
        }
        
        return json.dumps(result, indent=2, ensure_ascii=False)
        
    except Exception as e:
        return f"Error in batch translation: {str(e)}"

@mcp.tool()
def get_translation_history() -> str:
    """
    Get list of previously saved translation files.
    
    Returns:
        JSON list of translation files in the output directory
    """
    try:
        translation_files = []
        for file_path in TRANSLATION_OUTPUT_DIR.glob("*.txt"):
            file_info = {
                "filename": file_path.name,
                "path": str(file_path.absolute()),
                "size_kb": round(file_path.stat().st_size / 1024, 2),
                "created": file_path.stat().st_mtime
            }
            translation_files.append(file_info)
        
        # Sort by creation time (newest first)
        translation_files.sort(key=lambda x: x["created"], reverse=True)
        
        result = {
            "translation_files": translation_files,
            "total_files": len(translation_files),
            "output_directory": str(TRANSLATION_OUTPUT_DIR.absolute())
        }
        
        return json.dumps(result, indent=2, ensure_ascii=False)
        
    except Exception as e:
        return f"Error getting translation history: {str(e)}"

if __name__ == "__main__":
    print("🌍 Language Translator MCP Server 🌍")
    print("====================================")
    print(f"Starting Language Translator MCP server...")
    print(f"Translation output directory: {TRANSLATION_OUTPUT_DIR.absolute()}")
    print(f"Using OpenAI model: {DEFAULT_MODEL}")
    print("")
    print("Available tools:")
    print("  - translate_user_text: Translate any text to target language")
    print("  - translate_file_content: Translate uploaded file content")
    print("  - detect_text_language: Detect language of text")
    print("  - list_supported_languages: Show supported languages")
    print("  - batch_translate: Translate multiple texts at once")
    print("  - get_translation_history: View saved translations")
    print("")
    
    # Run the server
    mcp.run(transport="streamable-http")
