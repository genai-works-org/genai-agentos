# Text to Audio MCP Server using Eleven Labs
import os
import uuid
from pathlib import Path
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv
from elevenlabs import ElevenLabs
from mcp.server.fastmcp import FastMCP

# Load environment variables
load_dotenv()

# Create an MCP server
mcp = FastMCP("Eleven Labs Text-to-Audio Server")

# Initialize Eleven Labs client
ELEVEN_LABS_API_KEY = os.getenv("ELEVEN_LABS_API_KEY")
if not ELEVEN_LABS_API_KEY:
    raise ValueError("ELEVEN_LABS_API_KEY environment variable is required")

client = ElevenLabs(api_key=ELEVEN_LABS_API_KEY)

# Configuration
DEFAULT_VOICE_ID = os.getenv("ELEVEN_LABS_VOICE_ID", "7y08zcZtSuqXynKAr63n")  # Rachel voice
AUDIO_OUTPUT_DIR = Path(os.getenv("AUDIO_OUTPUT_DIR", "./audio_output"))

# Ensure output directory exists
AUDIO_OUTPUT_DIR.mkdir(exist_ok=True)


def generate_timestamped_filename() -> str:
    """Generate a filename with current date and time"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:6]
    return f"audio_{timestamp}_{unique_id}.mp3"


def create_audio_response(audio_filename: str, audio_path: Path) -> str:
    """Create a response with both local path and HTTP URL for web access"""
    audio_url = f"http://localhost:8891/audio/{audio_filename}"
    return f"Audio saved successfully!\nDownload URL: {audio_url}\nLocal path: {audio_path.absolute()}"


@mcp.tool()
def text_file_to_audio(
    file_content: str, 
    voice_id: Optional[str] = None, 
    model: str = "eleven_monolingual_v1"
) -> str:
    """
    Convert text file content to audio using Eleven Labs TTS.
    
    Args:
        file_content: Content of the text file to convert
        voice_id: Optional voice ID (defaults to Rachel voice)
        model: TTS model to use (default: eleven_monolingual_v1)
    
    Returns:
        Path to the generated audio file
    """
    try:
        # Check if content is provided
        if not file_content or not file_content.strip():
            return "Error: File content is empty"
        
        # Use provided voice_id or default
        selected_voice_id = voice_id or DEFAULT_VOICE_ID
        
        # Generate audio using the correct API method
        audio = client.text_to_speech.convert(
            voice_id=selected_voice_id,
            text=file_content.strip(),
            model_id=model,
            output_format="mp3_44100_128"
        )
        
        # Generate timestamped filename
        audio_filename = generate_timestamped_filename()
        audio_path = AUDIO_OUTPUT_DIR / audio_filename
        
        # Save audio to file (audio is a generator, so we need to iterate)
        with open(audio_path, 'wb') as f:
            for chunk in audio:
                f.write(chunk)
        
        return create_audio_response(audio_filename, audio_path)
        
    except Exception as e:
        return f"Error converting text to audio: {str(e)}"


@mcp.tool()
def text_to_audio(
    text: str, 
    voice_id: Optional[str] = None, 
    model: str = "eleven_monolingual_v1"
) -> str:
    """
    Convert text directly to audio using Eleven Labs TTS.
    
    Args:
        text: Text content to convert to audio
        voice_id: Optional voice ID (defaults to Rachel voice)
        model: TTS model to use (default: eleven_monolingual_v1)
    
    Returns:
        Path to the generated audio file
    """
    try:
        if not text.strip():
            return "Error: Text content is empty"
        
        # Use provided voice_id or default
        selected_voice_id = voice_id or DEFAULT_VOICE_ID
        
        # Generate audio using the correct API method
        audio = client.text_to_speech.convert(
            voice_id=selected_voice_id,
            text=text,
            model_id=model,
            output_format="mp3_44100_128"
        )
        
        # Generate timestamped filename
        audio_filename = generate_timestamped_filename()
        audio_path = AUDIO_OUTPUT_DIR / audio_filename
        
        # Save audio to file (audio is a generator, so we need to iterate)
        with open(audio_path, 'wb') as f:
            for chunk in audio:
                f.write(chunk)
        
        return create_audio_response(audio_filename, audio_path)
        
    except Exception as e:
        return f"Error converting text to audio: {str(e)}"


@mcp.tool()
def list_available_voices() -> str:
    """
    List available voices from Eleven Labs.
    
    Returns:
        JSON string of available voices with their IDs and names
    """
    try:
        voices = client.voices.get_all()
        voice_list = []
        
        for voice in voices.voices:
            voice_info = {
                "voice_id": voice.voice_id,
                "name": voice.name,
                "category": voice.category,
                "description": getattr(voice, 'description', 'N/A')
            }
            voice_list.append(voice_info)
        
        return str(voice_list)
        
    except Exception as e:
        return f"Error fetching voices: {str(e)}"


@mcp.tool()
def get_audio_output_directory() -> str:
    """
    Get the current audio output directory path.
    
    Returns:
        Absolute path to the audio output directory
    """
    return str(AUDIO_OUTPUT_DIR.absolute())


@mcp.tool()
def local_file_to_audio(
    file_path: str, 
    voice_id: Optional[str] = None, 
    model: str = "eleven_monolingual_v1"
) -> str:
    """
    Convert a local text file to audio using Eleven Labs TTS (for testing with local files).
    
    Args:
        file_path: Path to the text file to convert
        voice_id: Optional voice ID (defaults to Rachel voice)
        model: TTS model to use (default: eleven_monolingual_v1)
    
    Returns:
        Path to the generated audio file
    """
    try:
        # Read the text file
        text_path = Path(file_path)
        if not text_path.exists():
            return f"Error: File '{file_path}' not found"
        
        with open(text_path, 'r', encoding='utf-8') as f:
            text_content = f.read().strip()
        
        if not text_content:
            return "Error: Text file is empty"
        
        # Use provided voice_id or default
        selected_voice_id = voice_id or DEFAULT_VOICE_ID
        
        # Generate audio using the correct API method
        audio = client.text_to_speech.convert(
            voice_id=selected_voice_id,
            text=text_content,
            model_id=model,
            output_format="mp3_44100_128"
        )
        
        # Generate timestamped filename
        audio_filename = generate_timestamped_filename()
        audio_path = AUDIO_OUTPUT_DIR / audio_filename
        
        # Save audio to file (audio is a generator, so we need to iterate)
        with open(audio_path, 'wb') as f:
            for chunk in audio:
                f.write(chunk)
        
        return create_audio_response(audio_filename, audio_path)
        
    except Exception as e:
        return f"Error converting text to audio: {str(e)}"


@mcp.tool()
def get_audio_file_url(filename: str) -> str:
    """
    Get the HTTP URL for a specific audio file.
    
    Args:
        filename: Name of the audio file
    
    Returns:
        HTTP URL for downloading the audio file
    """
    audio_path = AUDIO_OUTPUT_DIR / filename
    if audio_path.exists():
        return f"http://localhost:8891/audio/{filename}"
    else:
        return f"Error: Audio file '{filename}' not found"


@mcp.tool()
def list_audio_files() -> str:
    """
    List all available audio files with their download URLs and creation times.
    
    Returns:
        JSON string of available audio files with URLs and timestamps
    """
    try:
        audio_files = []
        for file_path in AUDIO_OUTPUT_DIR.glob("*.mp3"):
            # Get file creation time
            created_timestamp = file_path.stat().st_mtime
            created_datetime = datetime.fromtimestamp(created_timestamp).strftime("%Y-%m-%d %H:%M:%S")
            
            audio_files.append({
                "filename": file_path.name,
                "url": f"http://localhost:8891/audio/{file_path.name}",
                "size_mb": round(file_path.stat().st_size / (1024 * 1024), 2),
                "created_at": created_datetime,
                "created_timestamp": created_timestamp
            })
        
        # Sort by creation time (newest first)
        audio_files.sort(key=lambda x: x["created_timestamp"], reverse=True)
        
        return str(audio_files)
    except Exception as e:
        return f"Error listing audio files: {str(e)}"


# Add a dynamic greeting resource (keeping from original)
@mcp.resource("greeting://{name}")
def get_greeting(name: str) -> str:
    """Get a personalized greeting"""
    return f"Hello, {name}! I'm your Text-to-Audio assistant powered by Eleven Labs."


if __name__ == "__main__":
    # Configure server settings
    mcp.settings.host = "0.0.0.0"  # Allow external connections
    mcp.settings.port = 8890  # Set your desired port (changed from 8889)
    mcp.settings.log_level = "DEBUG"
    
    print("🎵 Eleven Labs Text-to-Audio MCP Server 🎵")
    print("=========================================")
    print(f"Starting Eleven Labs Text-to-Audio MCP server...")
    print(f"Audio output directory: {AUDIO_OUTPUT_DIR.absolute()}")
    print(f"Audio files will be named with timestamp: audio_YYYYMMDD_HHMMSS_uniqueID.mp3")
    print("")
    print("📥 IMPORTANT: To download audio files via HTTP, run the audio server:")
    print("    python audio_server.py")
    print("    Audio files will be accessible at: http://localhost:8891/audio/")
    print("")
    
    # Run the server with streamable-http transport (required by the GenAI system)
    mcp.run(transport="streamable-http")