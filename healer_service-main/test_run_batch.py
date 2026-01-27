"""
Batch API Test Script
Tests the healer service with a batch API call using full HTML

Usage:
    1. Start the service: python main.py
    2. Run this test: python test_run_batch.py
"""

import requests
import json
import time

print("=" * 80)
print("HEALER SERVICE - BATCH API TEST")
print("=" * 80)

# Configuration
API_URL = "http://0.0.0.0:9001/heal/batch"
SAMPLE_HTML_PATH = "sample_data/zookeeper.html"

try:
    # Read HTML
    print("\n1. Reading sample HTML...")
    with open(SAMPLE_HTML_PATH, "r") as f:
        html = f.read()
    print(f"    Loaded HTML: {len(html):,} bytes")
    
    # Prepare batch payload
    print("\n2. Preparing Batch API request...")
    
    # We will simulate the DOM extraction on client side if needed, 
    # but for simplicity let's just send HTML in one and NULL in others if allowed, 
    # but the service checks per-request. Each request needs a source.
    # To reduce payload size in real apps we'd use semantic_dom, but here we'll just send HTML twice or use a small dummy.
    
    selectors_to_heal = [
        {
            "failed_selector": "card__logomark__wrapper12as3aas pbc-g-elevation-2 a imageasda",
            "html": html,
            "use_of_selector": "click on logomark wraper pepsico",
            "page_url": "https://zookeeper.apache.org/",
            "selector_type": "mixed"
        },
        {
            "failed_selector": "#non-existent-id .invalid-class",
            "html": html,
            "use_of_selector": "click on search button", # assuming there is one, or just testing fail logic
            "page_url": "https://zookeeper.apache.org/",
            "selector_type": "css"
        }
    ]
    
    payload = {
        "selectors": selectors_to_heal
    }
    
    print(f"    Batch size: {len(selectors_to_heal)}")
    
    # Make API call
    print("\n3. Calling Batch Healer API...")
    start_time = time.time()
    response = requests.post(API_URL, json=payload, timeout=30)
    elapsed = time.time() - start_time
    
    # Check response
    print(f"\n4. Response received in {elapsed:.2f}s:")
    print(f"    Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(result)
        print("\n" + "=" * 80)
        print("SUCCESS - Batch Processed!")
        print("=" * 80)
        
        print(f"Total Processed: {result.get('total_processed')}")
        print(f"Total Succeeded: {result.get('total_succeeded')}")
        print(f"Total Failed: {result.get('total_failed')}")
        
        print("\nResults:")
        for i, res in enumerate(result.get('results', [])):
            print(f"\n  Item {i+1}:")
            print(f"    Status: {res.get('message')}")
            print(f"    Chosen Selector: {res.get('chosen')}")
            if res.get('chosen'):
                # Assumes at least one candidate if chosen is set
                top_candidate = res['candidates'][0]
                print(f"    Confidence: {top_candidate['score']:.2f} (Candidates: {len(res['candidates'])})")
            else:
                print(f"    No candidates found.")

    else:
        print("\n" + "=" * 80)
        print("ERROR - Request Failed")
        print("=" * 80)
        print(f"Response: {response.text}")

except FileNotFoundError:
    print(f"\n Error: Sample HTML file not found at {SAMPLE_HTML_PATH}")
except Exception as e:
    print(f"\n Error: {e}")

print("\n" + "=" * 80)
