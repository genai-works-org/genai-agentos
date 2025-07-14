#!/usr/bin/env python3
"""
Simple A2A Lab Location Agent
Returns one nearby laboratory or hospital based on user location
"""

import os
import uuid
from typing import Optional, List, Any
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Simple Lab Location Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

PORT = int(os.getenv("PORT", 9999))

# Simple request model
class LocationRequest(BaseModel):
    user_location: str
    facility_type: Optional[str] = "laboratory"

# Agent OS response models
class MessagePart(BaseModel):
    type: str = "text"
    text: str

class ArtifactPart(BaseModel):
    root: MessagePart

class Artifact(BaseModel):
    parts: List[ArtifactPart]

class Message(BaseModel):
    messageId: str
    role: str = "agent"
    parts: List[MessagePart]
    artifacts: List[Artifact]

class SendMessageSuccessResponse(BaseModel):
    result: Message

def get_simple_facility(location: str, facility_type: str) -> str:
    """
    Return one simple facility result
    """
    if facility_type.lower() == "hospital":
        return f"""🏥 Here's a hospital near {location}:

**General Hospital of {location}**
📍 123 Main Street, {location}
📞 (555) 123-4567
🕒 24 hours emergency services
⭐ 4.2/5.0 rating"""
    else:
        return f"""🔬 Here's a laboratory near {location}:

**LabCorp - {location} Center**
📍 456 Medical Plaza, {location}
📞 (555) 234-5678
🕒 Mon-Fri 7AM-4PM, Sat 8AM-12PM
⭐ 4.5/5.0 rating"""

@app.post("/a2a-location")
async def find_location(request: LocationRequest):
    """
    Main A2A endpoint - returns one facility result
    """
    try:
        result_text = get_simple_facility(request.user_location, request.facility_type)
        
        return SendMessageSuccessResponse(
            result=Message(
                messageId=str(uuid.uuid4()),
                role="agent",
                parts=[MessagePart(type="text", text=result_text)],
                artifacts=[Artifact(
                    parts=[ArtifactPart(
                        root=MessagePart(type="text", text=result_text)
                    )]
                )]
            )
        )
    except Exception as e:
        return {
            "error": {
                "code": -32603,
                "message": "Internal error",
                "data": f"Error finding {request.facility_type}: {str(e)}"
            }
        }

@app.post("/")
async def root_post(request: Request):
    """
    Root POST endpoint for Agent OS compatibility
    """
    try:
        body = await request.json()
        
        # Extract location from various possible formats
        user_location = (
            body.get("user_location") or 
            body.get("location") or 
            body.get("query") or 
            body.get("text", "New York")
        )
        
        facility_type = body.get("facility_type", "laboratory")
        
        location_request = LocationRequest(
            user_location=user_location,
            facility_type=facility_type
        )
        
        return await find_location(location_request)
    except Exception as e:
        return {
            "error": {
                "code": -32602,
                "message": "Invalid params",
                "data": str(e)
            }
        }

@app.get("/.well-known/agent.json")
async def agent_discovery():
    """
    Agent discovery endpoint
    """
    return {
        "name": "simple_lab_agent",
        "description": "Find one nearby laboratory or hospital",
        "version": "1.0.0",
        "url": f"http://host.docker.internal:{PORT}",
        "defaultInputModes": ["text"],
        "defaultOutputModes": ["text"],
        "capabilities": {
            "pushNotifications": False,
            "stateTransitionHistory": False,
            "streaming": False
        },
        "skills": [
            {
                "id": "find_lab",
                "name": "find_lab",
                "description": "Find one nearby laboratory",
                "tags": ["medical", "laboratory", "location"],
                "examples": ["Find a lab in New York"],
                "inputModes": ["text"],
                "outputModes": ["text"]
            },
            {
                "id": "find_hospital",
                "name": "find_hospital",
                "description": "Find one nearby hospital",
                "tags": ["medical", "hospital", "location"],
                "examples": ["Find a hospital in Miami"],
                "inputModes": ["text"],
                "outputModes": ["text"]
            }
        ]
    }

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy", "service": "Simple Lab Agent"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "simple_lab_agent",
        "description": "Find one nearby laboratory or hospital",
        "status": "active"
    }

if __name__ == "__main__":
    print(f"🚀 Starting Simple Lab Agent on port {PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
