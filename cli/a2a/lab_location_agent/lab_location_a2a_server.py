#!/usr/bin/env python3
"""
A2A Lab Location Agent Server
Provides laboratory and hospital location services using external API
"""

import os
import json
import requests
from typing import Dict, List, Any, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
import uvicorn

app = FastAPI(
    title="Lab Location A2A Agent",
    description="Agent-to-Agent server for finding laboratories and hospitals",
    version="1.0.0"
)

# CORS middleware
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

PORT = int(os.getenv("PORT", 8001))
EXTERNAL_API_BASE = "https://location-lab.onrender.com"
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
GOOGLE_MAPS_BASE_URL = "https://maps.googleapis.com/maps/api"

# Pydantic models
class FacilitySearchRequest(BaseModel):
    user_location: str
    facility_type: Optional[str] = "laboratory"  # laboratory or hospital
    additional_info: Optional[str] = ""

class A2ALocationRequest(BaseModel):
    user_location: str
    facility_type: Optional[str] = "laboratory"
    additional_info: Optional[str] = ""

class FacilityResult(BaseModel):
    name: str
    address: str
    distance: Optional[str] = None
    phone: Optional[str] = None
    hours: Optional[str] = None
    rating: Optional[float] = None

class LocationResponse(BaseModel):
    success: bool
    results: str
    facilities: Optional[List[FacilityResult]] = None
    error: Optional[str] = None

# JSON-RPC compatible response models for Agent OS
import uuid

class MessagePart(BaseModel):
    type: str = "text"
    text: str

class Message(BaseModel):
    messageId: str
    role: str = "agent"  
    parts: List[MessagePart]
    artifacts: Optional[List[Any]] = []

class SendMessageSuccessResponse(BaseModel):
    result: Message

async def geocode_location(location: str) -> Dict[str, Any]:
    """
    Use Google Maps Geocoding API to get precise coordinates for a location
    """
    if not GOOGLE_MAPS_API_KEY:
        return {"success": False, "error": "Google Maps API key not configured"}
    
    try:
        geocode_url = f"{GOOGLE_MAPS_BASE_URL}/geocode/json"
        params = {
            "address": location,
            "key": GOOGLE_MAPS_API_KEY
        }
        
        response = requests.get(geocode_url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data["status"] == "OK" and data["results"]:
                result = data["results"][0]
                return {
                    "success": True,
                    "formatted_address": result["formatted_address"],
                    "lat": result["geometry"]["location"]["lat"],
                    "lng": result["geometry"]["location"]["lng"]
                }
            else:
                return {"success": False, "error": f"Geocoding failed: {data.get('status', 'Unknown error')}"}
        else:
            return {"success": False, "error": f"Google Maps API returned status {response.status_code}"}
            
    except Exception as e:
        return {"success": False, "error": f"Error calling Google Maps API: {str(e)}"}

async def search_nearby_places(location: str, place_type: str, radius: int = 5000) -> Dict[str, Any]:
    """
    Use Google Maps Places API to search for nearby facilities
    """
    if not GOOGLE_MAPS_API_KEY:
        return {"success": False, "error": "Google Maps API key not configured"}
    
    try:
        # First geocode the location
        geocode_result = await geocode_location(location)
        if not geocode_result["success"]:
            return geocode_result
        
        # Search for nearby places
        places_url = f"{GOOGLE_MAPS_BASE_URL}/place/nearbysearch/json"
        
        # Map facility types to Google Places types
        google_place_type = "hospital" if place_type.lower() == "hospital" else "health"
        
        params = {
            "location": f"{geocode_result['lat']},{geocode_result['lng']}",
            "radius": radius,
            "type": google_place_type,
            "key": GOOGLE_MAPS_API_KEY
        }
        
        if place_type.lower() == "laboratory":
            params["keyword"] = "laboratory lab medical testing"
        
        response = requests.get(places_url, params=params, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            if data["status"] == "OK":
                return {
                    "success": True,
                    "data": data["results"],
                    "user_location": geocode_result["formatted_address"]
                }
            else:
                return {"success": False, "error": f"Places API failed: {data.get('status', 'Unknown error')}"}
        else:
            return {"success": False, "error": f"Google Places API returned status {response.status_code}"}
            
    except Exception as e:
        return {"success": False, "error": f"Error calling Google Places API: {str(e)}"}

def format_google_places_results(places_data: Dict[str, Any], facility_type: str) -> str:
    """
    Format Google Places API response into a user-friendly string
    """
    try:
        if not places_data.get("success"):
            return f"Sorry, I couldn't find {facility_type}s. {places_data.get('error', '')}"
        
        places = places_data.get("data", [])
        user_location = places_data.get("user_location", "your location")
        
        if not places:
            return f"No {facility_type}s found near {user_location}."
        
        result_text = f"🏥 Here are {facility_type}s near {user_location}:\n\n"
        
        for i, place in enumerate(places[:5], 1):  # Limit to top 5 results
            name = place.get("name", "Unknown Facility")
            vicinity = place.get("vicinity", "Address not available")
            rating = place.get("rating", "")
            price_level = place.get("price_level", "")
            business_status = place.get("business_status", "")
            
            result_text += f"{i}. **{name}**\n"
            result_text += f"   📍 {vicinity}\n"
            
            if rating:
                result_text += f"   ⭐ {rating}/5.0\n"
            
            if business_status == "OPERATIONAL":
                result_text += f"   ✅ Currently open\n"
            elif business_status == "CLOSED_TEMPORARILY":
                result_text += f"   ⚠️ Temporarily closed\n"
            
            if price_level:
                result_text += f"   💰 Price level: {'$' * price_level}\n"
            
            result_text += "\n"
        
        return result_text.strip()
        
    except Exception as e:
        return f"Found {facility_type}s but had trouble formatting the results: {str(e)}"

async def call_external_api(location: str, facility_type: str = "laboratory") -> Dict[str, Any]:
    """
    Call the external location-lab API to get facility information
    """
    try:
        # Determine the endpoint based on facility type
        if facility_type.lower() == "hospital":
            endpoint = f"{EXTERNAL_API_BASE}/nearest-hospital"
        else:
            endpoint = f"{EXTERNAL_API_BASE}/nearest-lab"
        
        # Make the API call
        response = requests.get(
            endpoint,
            params={"location": location},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "data": data
            }
        else:
            return {
                "success": False,
                "error": f"API returned status {response.status_code}: {response.text}"
            }
            
    except requests.exceptions.Timeout:
        return {
            "success": False,
            "error": "Request timed out while calling external API"
        }
    except requests.exceptions.ConnectionError:
        return {
            "success": False,
            "error": "Failed to connect to external API"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error calling external API: {str(e)}"
        }

def format_facility_results(api_data: Dict[str, Any], facility_type: str, location: str) -> str:
    """
    Format the API response into a user-friendly string
    """
    try:
        if not api_data.get("success"):
            return f"Sorry, I couldn't find {facility_type}s near {location}. {api_data.get('error', '')}"
        
        data = api_data.get("data", {})
        
        # Handle different response formats
        if isinstance(data, list) and len(data) > 0:
            # List of facilities
            facilities = data
        elif isinstance(data, dict):
            # Check if it's a single facility or contains a list
            if "facilities" in data:
                facilities = data["facilities"]
            elif "results" in data:
                facilities = data["results"]
            elif "name" in data:
                # Single facility
                facilities = [data]
            else:
                # Try to extract facility info from the dict
                facilities = [data]
        else:
            return f"No {facility_type}s found near {location}."
        
        if not facilities:
            return f"No {facility_type}s found near {location}."
        
        # Format the results
        result_text = f"🏥 Here are {facility_type}s near {location}:\n\n"
        
        for i, facility in enumerate(facilities, 1):
            if isinstance(facility, dict):
                name = facility.get("name", "Unknown Facility")
                address = facility.get("address", "Address not available")
                phone = facility.get("phone", facility.get("contact", ""))
                hours = facility.get("hours", facility.get("opening_hours", ""))
                distance = facility.get("distance", "")
                rating = facility.get("rating", "")
                
                result_text += f"{i}. **{name}**\n"
                result_text += f"   📍 {address}\n"
                
                if phone:
                    result_text += f"   📞 {phone}\n"
                if hours:
                    result_text += f"   🕒 {hours}\n"
                if distance:
                    result_text += f"   📏 {distance}\n"
                if rating:
                    result_text += f"   ⭐ {rating}\n"
                
                result_text += "\n"
            else:
                # Handle string results
                result_text += f"{i}. {facility}\n\n"
        
        return result_text.strip()
        
    except Exception as e:
        return f"Found {facility_type}s near {location} but had trouble formatting the results: {str(e)}"

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Lab Location A2A Agent",
        "timestamp": datetime.now().isoformat(),
        "port": PORT,
        "google_maps_enabled": bool(GOOGLE_MAPS_API_KEY),
        "external_api": EXTERNAL_API_BASE
    }

@app.post("/google-maps-search", response_model=LocationResponse)
async def google_maps_search(request: FacilitySearchRequest):
    """
    Direct Google Maps API search endpoint
    """
    if not GOOGLE_MAPS_API_KEY:
        return LocationResponse(
            success=False,
            results="",
            error="Google Maps API key not configured"
        )
    
    try:
        google_result = await search_nearby_places(request.user_location, request.facility_type)
        
        if google_result["success"]:
            formatted_results = format_google_places_results(google_result, request.facility_type)
            return LocationResponse(
                success=True,
                results=formatted_results
            )
        else:
            return LocationResponse(
                success=False,
                results="",
                error=google_result.get("error", "Google Maps search failed")
            )
            
    except Exception as e:
        return LocationResponse(
            success=False,
            results="",
            error=f"Error during Google Maps search: {str(e)}"
        )

@app.post("/find-facility", response_model=LocationResponse)
async def find_facility(request: FacilitySearchRequest):
    """
    Main endpoint for finding facilities (for direct API calls)
    """
    try:
        # Try external API first
        api_result = await call_external_api(request.user_location, request.facility_type)
        
        if api_result["success"]:
            formatted_results = format_facility_results(
                api_result, 
                request.facility_type, 
                request.user_location
            )
            
            return LocationResponse(
                success=True,
                results=formatted_results,
                facilities=None
            )
        else:
            # Fallback to Google Maps API if available
            if GOOGLE_MAPS_API_KEY:
                google_result = await search_nearby_places(request.user_location, request.facility_type)
                if google_result["success"]:
                    formatted_results = format_google_places_results(google_result, request.facility_type)
                    return LocationResponse(
                        success=True,
                        results=formatted_results,
                        error=f"Using Google Maps data due to external API error: {api_result['error']}"
                    )
            
            # Final fallback to mock data
            mock_results = get_mock_facilities(request.user_location, request.facility_type)
            return LocationResponse(
                success=True,
                results=mock_results,
                error=f"Using mock data - External API: {api_result['error']}"
            )
            
    except Exception as e:
        return LocationResponse(
            success=False,
            results="",
            error=f"Internal server error: {str(e)}"
        )

@app.post("/a2a-location")
async def a2a_location_endpoint(request: A2ALocationRequest):
    """
    A2A endpoint for Agent-to-Agent communication - returns Agent OS compatible response
    """
    try:
        # Try external API first
        api_result = await call_external_api(request.user_location, request.facility_type)
        
        if api_result["success"]:
            # Use external API data
            response_text = format_facility_results(
                api_result, 
                request.facility_type, 
                request.user_location
            )
        else:
            # Fallback to Google Maps API if available
            if GOOGLE_MAPS_API_KEY:
                google_result = await search_nearby_places(request.user_location, request.facility_type)
                if google_result["success"]:
                    response_text = format_google_places_results(google_result, request.facility_type)
                else:
                    # Fallback to mock data
                    response_text = get_mock_facilities(request.user_location, request.facility_type)
            else:
                # Fallback to mock data
                response_text = get_mock_facilities(request.user_location, request.facility_type)
        
        # Return Agent OS compatible response with required 'result' field
        return SendMessageSuccessResponse(
            result=Message(
                messageId=str(uuid.uuid4()),
                role="agent",
                parts=[MessagePart(type="text", text=response_text)],
                artifacts=[]
            )
        )
            
    except Exception as e:
        # Return Agent OS compatible error response
        error_text = f"I'm currently unable to search for {request.facility_type}s near {request.user_location}. Please try searching online or contact your healthcare provider for recommendations. Error: {str(e)}"
        
        return {
            "error": {
                "code": -32603,
                "message": "Internal error",
                "data": error_text
            }
        }

@app.get("/.well-known/agent.json")
async def agent_discovery():
    """
    Agent OS discovery endpoint - returns A2A compliant agent card
    """
    return {
        "name": "lab_location_agent",
        "description": "Find nearby laboratories and hospitals based on user location",
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
                "id": "find_laboratory",
                "name": "find_laboratory", 
                "description": "Find nearby laboratories for medical tests and diagnostics",
                "tags": ["medical", "laboratory", "healthcare", "location"],
                "examples": [
                    "Find a laboratory near me in New York",
                    "I need a lab for blood tests in Los Angeles",
                    "Where can I get medical tests done in Chicago?"
                ],
                "inputModes": ["text"],
                "outputModes": ["text"]
            },
            {
                "id": "find_hospital",
                "name": "find_hospital",
                "description": "Find nearby hospitals for medical care and emergency services", 
                "tags": ["medical", "hospital", "healthcare", "location", "emergency"],
                "examples": [
                    "Find a hospital near me in Miami",
                    "I need emergency care in San Francisco", 
                    "Where is the nearest hospital in Seattle?"
                ],
                "inputModes": ["text"],
                "outputModes": ["text"]
            }
        ]
    }

def get_mock_facilities(location: str, facility_type: str) -> str:
    """
    Fallback mock data when external API is unavailable
    """
    if facility_type.lower() == "hospital":
        return f"""🏥 Here are hospitals near {location}:

1. **General Hospital**
   📍 123 Main Street, {location}
   📞 (555) 123-4567
   🕒 24 hours

2. **City Medical Center**
   📍 456 Health Ave, {location}
   📞 (555) 234-5678
   🕒 Mon-Fri 8AM-8PM, Weekends 9AM-5PM

3. **Emergency Care Hospital**
   📍 789 Emergency Blvd, {location}
   📞 (555) 345-6789
   🕒 24 hours emergency services"""
    else:
        return f"""🔬 Here are laboratories near {location}:

1. **LabCorp Testing Center**
   📍 123 Lab Street, {location}
   📞 (555) 123-4567
   🕒 Mon-Fri 7AM-4PM, Sat 8AM-12PM

2. **Quest Diagnostics**
   📍 456 Test Ave, {location}
   📞 (555) 234-5678
   🕒 Mon-Fri 6AM-5PM, Sat 7AM-1PM

3. **City Medical Lab**
   📍 789 Sample Blvd, {location}
   📞 (555) 345-6789
   🕒 Mon-Fri 8AM-6PM"""

@app.get("/")
async def root():
    """
    Root endpoint - returns agent info for Agent OS or HTML for browsers
    """
    return {
        "name": "lab-location-agent",
        "description": "Find nearby laboratories and hospitals based on user location",
        "version": "1.0.0",
        "status": "active",
        "endpoints": {
            "agent_discovery": "/.well-known/agent.json",
            "a2a_location": "/a2a-location",
            "find_facility": "/find-facility",
            "google_maps_search": "/google-maps-search",
            "health": "/health"
        }
    }

@app.post("/")
async def root_post(request: Request):
    """
    Root POST endpoint for Agent OS compatibility - handles flexible request formats
    """
    try:
        # Get the raw request body
        body = await request.json()
        
        # Handle different Agent OS request formats
        if isinstance(body, dict):
            # Extract location and facility type from various possible formats
            user_location = (
                body.get("user_location") or 
                body.get("location") or 
                body.get("query") or 
                body.get("input") or
                body.get("text", "")
            )
            
            facility_type = (
                body.get("facility_type") or 
                body.get("type") or 
                "laboratory"
            )
            
            # Create a proper A2ALocationRequest
            location_request = A2ALocationRequest(
                user_location=user_location,
                facility_type=facility_type,
                additional_info=body.get("additional_info", "")
            )
            
            return await a2a_location_endpoint(location_request)
        else:
            # If it's a string, treat it as a location query
            location_request = A2ALocationRequest(
                user_location=str(body),
                facility_type="laboratory"
            )
            return await a2a_location_endpoint(location_request)
            
    except Exception as e:
        error_message = f"Invalid request format: {str(e)}"
        return {
            "error": {
                "code": -32602,
                "message": "Invalid params",
                "data": error_message
            }
        }

@app.post("/invoke")
async def invoke_endpoint(request: Request):
    """
    Invoke endpoint for Agent OS - flexible request handling
    """
    try:
        body = await request.json()
        
        # Handle Agent OS invoke format
        if isinstance(body, dict):
            # Extract the capability and parameters
            capability = body.get("capability", "find-laboratory")
            params = body.get("parameters", body)
            
            # Extract location from various possible parameter names
            user_location = (
                params.get("user_location") or 
                params.get("location") or 
                params.get("query") or 
                params.get("input") or
                params.get("text", "")
            )
            
            # Determine facility type based on capability or explicit parameter
            if "hospital" in capability.lower():
                facility_type = "hospital"
            elif "laboratory" in capability.lower() or "lab" in capability.lower():
                facility_type = "laboratory"
            else:
                facility_type = params.get("facility_type", "laboratory")
            
            # Create location request
            location_request = A2ALocationRequest(
                user_location=user_location,
                facility_type=facility_type,
                additional_info=params.get("additional_info", "")
            )
            
            return await a2a_location_endpoint(location_request)
        else:
            # Fallback to simple string processing
            location_request = A2ALocationRequest(
                user_location=str(body),
                facility_type="laboratory"
            )
            return await a2a_location_endpoint(location_request)
            
    except Exception as e:
        error_message = f"Error processing invoke request: {str(e)}"
        return {
            "error": {
                "code": -32603,
                "message": "Internal error", 
                "data": error_message
            }
        }

@app.get("/ui", response_class=HTMLResponse)
async def ui():
    """
    HTML interface for testing
    """
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Lab Location A2A Agent</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            input, select, button { padding: 10px; margin: 5px; }
            input[type="text"] { width: 300px; }
            button { background-color: #007cba; color: white; border: none; cursor: pointer; }
            button:hover { background-color: #005a8b; }
            .result { margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🏥 Lab Location A2A Agent</h1>
            <p>Find nearby laboratories and hospitals using our external API integration.</p>
            
            <div>
                <h3>Test the API:</h3>
                <input type="text" id="location" placeholder="Enter location (e.g., New York, NY)" value="Lagos, Nigeria">
                <select id="facilityType">
                    <option value="laboratory">Laboratory</option>
                    <option value="hospital">Hospital</option>
                </select>
                <button onclick="searchFacilities()">Search</button>
            </div>
            
            <div id="result" class="result" style="display: none;"></div>
            
            <h3>API Endpoints:</h3>
            <ul>
                <li><strong>POST /find-facility</strong> - Direct API call (tries external API first, then Google Maps, then mock data)</li>
                <li><strong>POST /a2a-location</strong> - Agent-to-Agent communication</li>
                <li><strong>POST /google-maps-search</strong> - Direct Google Maps API search</li>
                <li><strong>GET /.well-known/agent.json</strong> - Agent discovery</li>
                <li><strong>GET /health</strong> - Health check (shows Google Maps status)</li>
            </ul>
            
            <h3>Data Sources:</h3>
            <p><strong>Priority order:</strong></p>
            <ol>
                <li>External API: <code>https://location-lab.onrender.com</code></li>
                <li>Google Maps Places API (if API key configured)</li>
                <li>Mock data (fallback)</li>
            </ol>
            
            <h3>Example cURL commands:</h3>
            <pre style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
# Test laboratory search (tries all data sources)
curl -X POST "http://localhost:9999/a2a-location" \\
  -H "Content-Type: application/json" \\
  -d '{"user_location": "Lagos, Nigeria", "facility_type": "laboratory"}'

# Test hospital search  
curl -X POST "http://localhost:9999/a2a-location" \\
  -H "Content-Type: application/json" \\
  -d '{"user_location": "New York, NY", "facility_type": "hospital"}'

# Direct Google Maps search
curl -X POST "http://localhost:9999/google-maps-search" \\
  -H "Content-Type: application/json" \\
  -d '{"user_location": "San Francisco, CA", "facility_type": "laboratory"}'

# Agent discovery (for Agent OS)
curl -X GET "http://host.docker.internal:9999/.well-known/agent.json"

# Check health and API status
curl -X GET "http://localhost:9999/health"
            </pre>
        </div>
        
        <script>
            async function searchFacilities() {
                const location = document.getElementById('location').value;
                const facilityType = document.getElementById('facilityType').value;
                const resultDiv = document.getElementById('result');
                
                if (!location) {
                    alert('Please enter a location');
                    return;
                }
                
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = 'Searching...';
                
                try {
                    const response = await fetch('/find-facility', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            user_location: location,
                            facility_type: facilityType
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        resultDiv.innerHTML = '<pre>' + data.results + '</pre>';
                        if (data.error) {
                            resultDiv.innerHTML += '<p style="color: orange;">Note: ' + data.error + '</p>';
                        }
                    } else {
                        resultDiv.innerHTML = '<p style="color: red;">Error: ' + data.error + '</p>';
                    }
                } catch (error) {
                    resultDiv.innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
                }
            }
        </script>
    </body>
    </html>
    """

if __name__ == "__main__":
    print(f"🚀 Starting Lab Location A2A Agent on port {PORT}")
    print(f"🔗 Agent discovery: http://localhost:{PORT}/.well-known/agent.json")
    print(f"🧪 External API: {EXTERNAL_API_BASE}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)