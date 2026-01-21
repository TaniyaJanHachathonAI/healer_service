"""
Simple API Test Script
Tests the healer service with a real API call using full HTML

Usage:
    1. Start the service: python main.py
    2. Run this test: python test_run.py
"""

import requests
import json
from main import DOMExtractor
print("=" * 80)
print("HEALER SERVICE - API TEST")
print("=" * 80)

# Configuration
API_URL = "http://0.0.0.0:9001/heal"
SAMPLE_HTML_PATH = "sample_data/zookeeper.html"
SCREENSHOT_PATH = "sample_data/zookeeper.png"

# Test Case: Add to Cart Button
print("\n Test Case: Amazon Add to Cart Button")
print("-" * 80)

try:
    # Read HTML
    print("\n1. Reading sample HTML...")
    with open(SAMPLE_HTML_PATH, "r") as f:
        html = f.read()
    print(f"    Loaded HTML: {len(html):,} bytes ({len(html)/1024:.1f} KB)")
    
    # Prepare payload
    print("\n2. Preparing API request...")
    extractor = DOMExtractor(html)
    dom_data = extractor.extract_semantic_dom(full_coverage=True)
    #print(dom_data)
    
    payload = {
        "failed_selector": "card__logomark__wrapper12as3aas pbc-g-elevation-2 a imageasda",
        "html": html,  # Always send HTML
        "semantic_dom": dom_data,
        "use_of_selector": "click on logomark wraper pepsico",
        "full_coverage": True,
        "page_url": "https://zookeeper.apache.org/",
        "screenshot_path": SCREENSHOT_PATH,
        "selector_type": "mixed"
    }
    
    print(f"    Failed selector: {payload['failed_selector']}")
    print(f"    Page URL: {payload['page_url']}")
    print(f"    Selector type: {payload['selector_type']}")
    
    # Make API call
    print("\n3. Calling Healer API...")
    print(f"    POST {API_URL}")
    response = requests.post(API_URL, json=payload, timeout=30)
    
    # Check response
    print(f"\n4. Response received:")
    print(f"    Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        #print(result)
        print("\n" + "=" * 80)
        print("SUCCESS - Selector Healed!")
        print("=" * 80)
        
        print(f"\nChosen Selector:")
        print(f"   {result.get('chosen', 'N/A')}")
        
        print(f"\nConfidence Score:")
        if result.get('confidence_scores'):
            print(f"   {result['confidence_scores'][0]:.2f}")
        else:
            print(f"   N/A")
        
        print(f"\n Processing Time:")
        metadata = result.get('metadata', {})
        print(f"   {metadata.get('processing_time_ms', 0):.2f}ms")
        
        print(f"\n Metadata:")
        print(f"   LLM Used: {metadata.get('llm_used', 'N/A')}")
        print(f"   Screenshot Analyzed: {metadata.get('screenshot_analyzed', False)}")
        print(f"   Total Candidates: {metadata.get('total_candidates_generated', 'N/A')}")
        
        print(f"\nTop 5 Candidates:")
        candidates = result.get('candidates', [])
        confidence_scores = result.get('confidence_scores', [])
        for i, (selector, confidence) in enumerate(zip(candidates[:5], confidence_scores[:5]), 1):
            print(f"   {i}. {selector}")
            print(f"      Confidence: {confidence:.2f}")
        
        print(f"\n Healing ID: {result.get('healing_id', 'N/A')}")
        print(f" Request ID: {result.get('request_id', 'N/A')}")
        
        # Full JSON response
        print("\n" + "=" * 80)
        print("Full JSON Response:")
        print("=" * 80)
        print(json.dumps(result, indent=2))
        
    else:
        print("\n" + "=" * 80)
        print("ERROR - Request Failed")
        print("=" * 80)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {response.text}")

except FileNotFoundError as e:
    print(f"\n Error: Sample HTML file not found!")
    print(f"   Make sure '{SAMPLE_HTML_PATH}' exists")
    print(f"   Error: {e}")

except requests.exceptions.ConnectionError:
    print(f"\n Error: Cannot connect to healer service!")
    print(f"   Make sure the service is running:")
    print(f"   → python main.py")

except requests.exceptions.Timeout:
    print(f"\n Error: Request timed out!")
    print(f"   The API took too long to respond (>30s)")

except Exception as e:
    print(f"\n Error: {type(e).__name__}")
    print(f"   {str(e)}")

print("\n" + "=" * 80)
print("Test Complete")
print("=" * 80)
