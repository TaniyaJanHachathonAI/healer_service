"""
XPath selector generation and utilities
"""
from bs4 import BeautifulSoup
from typing import List, Tuple
import re

def generate_xpath_from_dom(html: str, limit: int = 30) -> List[str]:
    """Generate XPath selectors from HTML DOM"""
    soup = BeautifulSoup(html, "lxml")
    xpaths = []
    
    for el in soup.find_all(True):
        # XPath by ID
        if el.get("id"):
            xpaths.append(f"//*[@id='{el.get('id')}']")
        
        # XPath by data-testid
        if el.get("data-testid"):
            xpaths.append(f"//*[@data-testid='{el.get('data-testid')}']")
        
        # XPath by aria-label
        if el.get("aria-label"):
            xpaths.append(f"//*[@aria-label='{el.get('aria-label')}']")
        
        # XPath by role
        if el.get("role"):
            xpaths.append(f"//*[@role='{el.get('role')}']")
        
        # XPath by class
        if el.get("class"):
            classes = " ".join(el.get("class"))
            xpaths.append(f"//*[@class='{classes}']")
        
        # XPath by text content
        text = (el.get_text() or "").strip()
        if text and len(text) < 60 and len(text) > 0:
            # Escape quotes in text
            text_escaped = text.replace("'", "\\'")
            xpaths.append(f"//{el.name}[contains(text(), '{text_escaped}')]")
            xpaths.append(f"//{el.name}[text()='{text_escaped}']")
        
        # XPath by name attribute (for form elements)
        if el.get("name"):
            xpaths.append(f"//*[@name='{el.get('name')}']")
        
        # XPath by type (for inputs)
        if el.name == "input" and el.get("type"):
            xpaths.append(f"//input[@type='{el.get('type')}']")
        
        # XPath by placeholder
        if el.get("placeholder"):
            xpaths.append(f"//*[@placeholder='{el.get('placeholder')}']")
            
        # XPath by alt (for images)
        if el.get("alt"):
            xpaths.append(f"//*[@alt='{el.get('alt')}']")
            
        # XPath by title
        if el.get("title"):
            xpaths.append(f"//*[@title='{el.get('title')}']")
    
    # Deduplicate while preserving order
    seen = set()
    unique_xpaths = []
    for xpath in xpaths:
        if xpath not in seen:
            seen.add(xpath)
            unique_xpaths.append(xpath)
        if len(unique_xpaths) >= limit:
            break
    
    return unique_xpaths

def is_xpath(selector: str) -> bool:
    """Detect if a selector is XPath"""
    xpath_indicators = [
        selector.startswith("//"),
        selector.startswith("/"),
        "//" in selector,
        "@" in selector,
        "[" in selector and "]" in selector and "@" in selector
    ]
    return any(xpath_indicators)

def xpath_stability_score(xpath: str) -> float:
    """Calculate stability score for XPath selector"""
    score = 1.0
    
    # Penalize position-based selectors
    if re.search(r'\[\d+\]', xpath):  # e.g., [1], [2]
        score -= 0.3
    
    # Penalize complex paths (too many levels)
    depth = xpath.count("/")
    if depth > 4:
        score -= 0.2
    
    # Penalize contains() without specific attributes
    if "contains(" in xpath and "@" not in xpath:
        score -= 0.1
    
    # Bonus for stable attributes
    if "@data-testid" in xpath:
        score += 0.2
    if "@aria-label" in xpath or "@aria-" in xpath:
        score += 0.15
    if "@id" in xpath:
        score += 0.1
    if "@role" in xpath:
        score += 0.1
    
    return max(min(score, 1.0), 0.0)

def xpath_semantic_score(xpath: str) -> float:
    """Calculate semantic score for XPath selector"""
    score = 0.0
    
    # Prefer semantic attributes
    if "@data-testid" in xpath:
        score += 0.4
    if "@aria-" in xpath:
        score += 0.3
    if "@role" in xpath:
        score += 0.2
    if "text()" in xpath:
        score += 0.2
    if "@id" in xpath:
        score += 0.15
    if "@name" in xpath:
        score += 0.1
    if "@alt" in xpath:
        score += 0.2
    if "@title" in xpath:
        score += 0.15
    
    return min(score, 1.0)

def css_to_xpath(css_selector: str) -> str:
    """
    Convert simple CSS selectors to XPath (basic conversion)
    Note: This is a simplified converter and may not handle all CSS selectors
    """
    xpath = css_selector
    
    # ID selector: #id -> //*[@id='id']
    if css_selector.startswith("#"):
        id_value = css_selector[1:]
        return f"//*[@id='{id_value}']"
    
    # Class selector: .class -> //*[@class='class']
    if css_selector.startswith("."):
        class_value = css_selector[1:]
        return f"//*[contains(@class, '{class_value}')]"
    
    # Attribute selector: [attr='value'] -> //*[@attr='value']
    attr_match = re.match(r'\[([^=]+)=["\']([^"\']+)["\']\]', css_selector)
    if attr_match:
        attr_name, attr_value = attr_match.groups()
        return f"//*[@{attr_name}='{attr_value}']"
    
    # Element selector: tag -> //tag
    if re.match(r'^[a-z]+$', css_selector):
        return f"//{css_selector}"
    
    # Return original if can't convert
    return xpath

def xpath_to_css(xpath: str) -> str:
    """
    Convert simple XPath selectors to CSS (basic conversion)
    Note: This is a simplified converter and may not handle all XPath selectors
    """
    css = xpath
    
    # //*[@id='value'] -> #value
    id_match = re.match(r"//\*\[@id='([^']+)'\]", xpath)
    if id_match:
        return f"#{id_match.group(1)}"
    
    # //*[@data-testid='value'] -> [data-testid='value']
    attr_match = re.match(r"//\*\[@([^=]+)='([^']+)'\]", xpath)
    if attr_match:
        attr_name, attr_value = attr_match.groups()
        return f"[{attr_name}='{attr_value}']"
    
    # //tag -> tag
    tag_match = re.match(r'//([a-z]+)$', xpath)
    if tag_match:
        return tag_match.group(1)
    
    # Return original if can't convert
    return css

def rank_xpaths(xpaths: List[str], base_confidences: List[float] = None) -> List[Tuple[str, float]]:
    """Rank XPath selectors by stability and semantic scores"""
    if base_confidences is None:
        base_confidences = [0.5] * len(xpaths)
    
    ranked = []
    for xpath, base_conf in zip(xpaths, base_confidences):
        stability = xpath_stability_score(xpath)
        semantic = xpath_semantic_score(xpath)
        
        # Weighted score
        final_score = (
            base_conf * 0.3 +
            stability * 0.4 +
            semantic * 0.3
        )
        
        ranked.append((xpath, round(final_score, 3)))
    
    ranked.sort(key=lambda x: x[1], reverse=True)
    return ranked
