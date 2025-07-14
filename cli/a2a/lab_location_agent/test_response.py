#!/usr/bin/env python3
import requests
import json

def test_a2a_endpoint():
    """Test the /a2a-location endpoint and print the response structure"""
    
    url = "http://localhost:9999/a2a-location"
    payload = {
        "user_location": "downtown Seattle",
        "facility_type": "laboratory"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n=== Response Structure ===")
            print(json.dumps(data, indent=2)[:1000] + "..." if len(json.dumps(data, indent=2)) > 1000 else json.dumps(data, indent=2))
            
            # Check if it has the expected structure
            if "result" in data:
                result = data["result"]
                print(f"\n=== Validation ===")
                print(f"Has 'result' field: ✓")
                print(f"Result has 'messageId': {'✓' if 'messageId' in result else '✗'}")
                print(f"Result has 'role': {'✓' if 'role' in result else '✗'}")
                print(f"Result has 'parts': {'✓' if 'parts' in result else '✗'}")
                print(f"Result has 'artifacts': {'✓' if 'artifacts' in result else '✗'}")
                
                if 'role' in result:
                    print(f"Role value: {result['role']}")
                if 'parts' in result and result['parts']:
                    print(f"First part type: {result['parts'][0].get('type', 'missing')}")
            elif "error" in data:
                print(f"Response has error: {data['error']}")
            else:
                print("Response missing both 'result' and 'error' fields")
                
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_a2a_endpoint()
