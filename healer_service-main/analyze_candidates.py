"""
Detailed Analysis of Candidate Generation
Analyzes why the correct selector is not appearing in top candidates
"""
import sys
import os
sys.path.append(os.path.abspath("."))

from dom_extractor import DOMExtractor
from xpath_generator import generate_xpath_from_dom
from main import candidate_from_dom

def analyze_salesforce_html():
    print("=" * 80)
    print("ANALYZING SALESFORCE HTML - Watch the webinar button")
    print("=" * 80)
    
    # Load HTML
    with open("sample_data/salseforce.html", "r", encoding="utf-8") as f:
        html = f.read()
    
    print(f"\nHTML Size: {len(html):,} bytes ({len(html)/1024:.1f} KB)")
    
    # Extract DOM
    print("\n" + "-" * 80)
    print("1. DOM EXTRACTION (full_coverage=True)")
    print("-" * 80)
    extractor = DOMExtractor(html)
    dom_data = extractor.extract_semantic_dom(full_coverage=True)
    
    print(f"Total elements extracted: {dom_data['total_elements']}")
    print(f"Extraction method: {dom_data.get('extraction_method', 'N/A')}")
    
    # Find the target element
    print("\n" + "-" * 80)
    print("2. FINDING TARGET: 'Watch the webinar' button")
    print("-" * 80)
    
    target_elements = []
    for idx, elem in enumerate(dom_data["elements"]):
        text = elem.get("text", "")
        attrs = elem.get("attributes", {})
        
        # Check for webinar button
        if "webinar" in text.lower() or "webinar" in str(attrs).lower():
            target_elements.append((idx, elem))
            print(f"\nFound at index {idx}:")
            print(f"  Tag: {elem.get('tag', 'N/A')}")
            print(f"  Text: {text}")
            print(f"  Selector: {elem.get('selector', 'N/A')}")
            print(f"  Attributes: {attrs}")
    
    if not target_elements:
        print("  ❌ Target element NOT found in DOM extraction!")
        return
    
    # Generate CSS candidates
    print("\n" + "-" * 80)
    print("3. CSS CANDIDATE GENERATION")
    print("-" * 80)
    
    failed_selector = "a.cta_button[aria-label^='Watch the webinar']"
    css_candidates = candidate_from_dom(html, failed_selector, limit=30)
    
    print(f"Total CSS candidates generated: {len(css_candidates)}")
    print("\nTop 10 CSS candidates:")
    for i, selector in enumerate(css_candidates[:10], 1):
        print(f"  {i}. {selector}")
    
    # Check if target selector is in candidates
    target_selectors = [elem.get('selector') for _, elem in target_elements]
    print(f"\nTarget selectors from DOM:")
    for ts in target_selectors:
        print(f"  - {ts}")
        if ts in css_candidates:
            print(f"    ✓ Found at position: {css_candidates.index(ts) + 1}")
        else:
            print(f"    ❌ NOT in CSS candidates!")
    
    # Generate XPath candidates
    print("\n" + "-" * 80)
    print("4. XPATH CANDIDATE GENERATION")
    print("-" * 80)
    
    xpath_candidates = generate_xpath_from_dom(html, limit=30)
    
    print(f"Total XPath candidates generated: {len(xpath_candidates)}")
    print("\nTop 10 XPath candidates:")
    for i, xpath in enumerate(xpath_candidates[:10], 1):
        print(f"  {i}. {xpath}")
    
    # Check if target XPath is in candidates
    target_xpaths = [elem.get('xpath') for _, elem in target_elements]
    print(f"\nTarget XPaths from DOM:")
    for tx in target_xpaths:
        print(f"  - {tx}")
        if tx in xpath_candidates:
            print(f"    ✓ Found at position: {xpath_candidates.index(tx) + 1}")
        else:
            print(f"    ❌ NOT in XPath candidates!")
    
    # Combined analysis
    print("\n" + "-" * 80)
    print("5. COMBINED CANDIDATE ANALYSIS")
    print("-" * 80)
    
    all_candidates = css_candidates + xpath_candidates
    print(f"Total combined candidates: {len(all_candidates)}")
    
    # Check for webinar-related selectors
    webinar_related = [c for c in all_candidates if "webinar" in c.lower() or "cta_button" in c.lower()]
    print(f"\nWebinar/CTA-related candidates: {len(webinar_related)}")
    for i, selector in enumerate(webinar_related[:5], 1):
        print(f"  {i}. {selector}")
    
    # Size analysis
    print("\n" + "-" * 80)
    print("6. SIZE IMPACT ANALYSIS")
    print("-" * 80)
    
    print(f"HTML Size: {len(html):,} bytes")
    print(f"DOM Elements: {dom_data['total_elements']}")
    print(f"Size per element: {len(html) / dom_data['total_elements']:.0f} bytes")
    
    # Recommendations
    print("\n" + "=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80)
    
    if len(html) > 500000:
        print("⚠️  Large HTML detected (>500KB)")
        print("   → Consider HTML minification or chunking")
        print("   → LLM context window might be overwhelmed")
    
    if dom_data['total_elements'] > 200:
        print("⚠️  Large DOM detected (>200 elements)")
        print("   → Consider more aggressive filtering")
        print("   → Implement semantic similarity ranking")
    
    if not any(ts in css_candidates[:10] for ts in target_selectors):
        print("⚠️  Target selector not in top 10 CSS candidates")
        print("   → Improve candidate scoring algorithm")
        print("   → Add semantic text matching bonus")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    analyze_salesforce_html()
