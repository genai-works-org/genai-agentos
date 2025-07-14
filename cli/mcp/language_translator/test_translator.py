#!/usr/bin/env python3
"""
Test script for Language Translator MCP Server
This script demonstrates how to use the translation tools.
"""

import json
import time

# Configuration
MCP_SERVER_URL = "http://localhost:8000"

def test_translation():
    """Test the translation functionality"""
    print("🧪 Testing Language Translator MCP Server")
    print("=" * 50)
    
    # Example texts to translate
    test_cases = [
        {
            "text": "Hello, how are you today? I hope you're having a wonderful day!",
            "target": "Spanish",
            "description": "English to Spanish"
        },
        {
            "text": "La vida es bella y llena de oportunidades increíbles.",
            "target": "English", 
            "description": "Spanish to English"
        },
        {
            "text": "Bonjour! Comment allez-vous? J'espère que tout va bien.",
            "target": "German",
            "description": "French to German"
        }
    ]
    
    print("Test cases:")
    for i, case in enumerate(test_cases, 1):
        print(f"{i}. {case['description']}")
        print(f"   Text: {case['text']}")
        print(f"   Target: {case['target']}")
        print()
    
    print("Note: To test this with the MCP server, you would:")
    print("1. Make sure the MCP server is running (python language_translator.py)")
    print("2. Integrate it with your GenAI system")
    print("3. Use the translate_user_text tool with the test cases above")
    print()
    
    # Example tool usage format
    print("Example tool call format:")
    example_call = {
        "tool": "translate_user_text",
        "parameters": {
            "text": test_cases[0]["text"],
            "target_language": test_cases[0]["target"],
            "detect_source": True
        }
    }
    print(json.dumps(example_call, indent=2))

def show_available_tools():
    """Show all available tools"""
    print("\n📋 Available Translation Tools:")
    print("=" * 50)
    
    tools = [
        {
            "name": "translate_user_text",
            "description": "Translate any text to target language",
            "use_case": "Perfect for quick text translations"
        },
        {
            "name": "translate_file_content", 
            "description": "Translate uploaded file content",
            "use_case": "Great for document translation"
        },
        {
            "name": "detect_text_language",
            "description": "Detect the language of text",
            "use_case": "Identify unknown language text"
        },
        {
            "name": "list_supported_languages",
            "description": "Show supported languages",
            "use_case": "See what languages are available"
        },
        {
            "name": "batch_translate",
            "description": "Translate multiple texts at once",
            "use_case": "Efficient bulk translation"
        },
        {
            "name": "get_translation_history",
            "description": "View saved translations",
            "use_case": "Track previous translations"
        }
    ]
    
    for tool in tools:
        print(f"🔧 {tool['name']}")
        print(f"   Description: {tool['description']}")
        print(f"   Use case: {tool['use_case']}")
        print()

def show_popular_languages():
    """Show popular language targets"""
    print("🌍 Popular Translation Targets:")
    print("=" * 50)
    
    popular_languages = [
        "Spanish", "French", "German", "Italian", "Portuguese",
        "Chinese", "Japanese", "Korean", "Russian", "Arabic",
        "Hindi", "Dutch", "Swedish", "Turkish", "Polish"
    ]
    
    for i, lang in enumerate(popular_languages, 1):
        print(f"{i:2d}. {lang}")
        if i % 5 == 0:
            print()

if __name__ == "__main__":
    test_translation()
    show_available_tools()
    show_popular_languages()
    
    print("\n✅ Language Translator MCP Server is ready to use!")
    print("🚀 Start translating by adding it to your GenAI system.")
