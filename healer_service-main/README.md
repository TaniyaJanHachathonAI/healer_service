# Selector Healer Service

AI-powered selector healing service for test automation. Automatically fixes broken CSS and XPath selectors using LLM intelligence, DOM analysis, and semantic extraction.

---

## Features

### Smart Selector Healing
- **CSS & XPath Generation** - Supports both selector types
- **LLM-Powered Intelligence** - Uses advanced language models for smart suggestions
- **DOM Heuristics** - Fallback to local analysis when LLM unavailable
- **Semantic DOM Extraction** - 76% cost reduction by sending only interactive elements
- **Stability Scoring** - Ranks selectors by resistance to UI changes
- **Semantic Scoring** - Prioritizes meaningful, maintainable selectors

### Screenshot Analysis
- **Vision Model Integration** - Analyzes UI screenshots for context
- **Visual Element Identification** - Understands layout and hierarchy
- **Enhanced Accuracy** - Combines visual and DOM analysis

### Comprehensive API
- **Single Healing** - `/heal` endpoint for individual selectors
- **Batch Healing** - `/heal-batch` for up to 10 selectors at once
- **History Tracking** - `/history` with pagination and filtering
- **Statistics** - `/stats` for performance metrics
- **Feedback System** - `/feedback` for continuous improvement
- **Health Checks** - `/health` for monitoring

### Persistent Memory
- **SQLite Database** - Caches successful healings
- **History Tracking** - Records all healing attempts
- **Feedback Collection** - Stores user feedback for learning
- **Performance Metrics** - Tracks processing times and success rates

### Cost Optimization
- **Semantic DOM Extraction** - 76% reduction in LLM token usage
- **Smart Caching** - Reuses previous healings
- **Efficient Processing** - Focuses on interactive elements only

---

## Quick Start

See [QUICKSTART.md](QUICKSTART.md) for detailed installation and setup instructions.

### Installation (TL;DR)
```bash
cd /Applications/MAMP/htdocs/test-agent/qa-ai-system/healer_service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Configuration
Create `.env` file:
```env
OPENROUTER_API_KEY=your_api_key_here
LLM_MODEL=meta-llama/llama-3-8b-instruct
ENABLE_SCREENSHOT_ANALYSIS=true
ENABLE_XPATH_GENERATION=true
```

### Run
```bash
python main.py
# Service starts on http://localhost:8000
```

---

## API Documentation

### POST /heal
Heal a single failing selector.

**Request (Option 1: Semantic DOM - Recommended)**
```json
{
  "failed_selector": "#submit-btn",
  "semantic_dom": {
    "type": "semantic_dom",
    "total_elements": 283,
    "elements": [...]
  },
  "page_url": "https://example.com",
  "use_of_selector": "click on submit button",
  "selector_type": "mixed"
}
```

**Request (Option 2: Full HTML - Legacy)**
```json
{
  "failed_selector": "#submit-btn",
  "html": "<html>...</html>",
  "page_url": "https://example.com",
  "use_of_selector": "focus on password field",
  "screenshot_path": "/path/to/screenshot.png",
  "selector_type": "mixed"
}
```

**New: `use_of_selector` Field (Optional)**
- Provide context about how the selector is used
- Examples: "click on login button", "focus on username field", "select item from dropdown"
- **Enables LLM Re-ranking**: When provided, the LLM always has final say on selector choice
- **Improves Accuracy**: Disambiguates between similar elements (e.g., username vs. password)
- Sends top 8 candidates to LLM for context-aware re-ranking

**New: `full_coverage` Field (Optional)**
- Default: `false` (Optimized for forms/controls - 76% smaller)
- Set to `true` to extract **ALL** interactive elements (images, menus, banners, logos)
- Use when healing selectors for non-form elements (e.g., "click on logo", "open menu")

**Response:**
```json
{
  "request_id": "req_abc123",
  "candidates": ["[data-testid='submit']", "#submit-btn", "button.primary"],
  "confidence_scores": [0.95, 0.82, 0.71],
  "chosen": "[data-testid='submit']",
  "message": "Smart Healed",
  "healing_id": 123,
  "metadata": {
    "llm_used": true,
    "screenshot_analyzed": false,
    "processing_time_ms": 1234,
    "total_candidates_generated": 15
  }
}
```

### POST /heal-batch
Heal multiple selectors (max 10).

**Request:**
```json
{
  "selectors": [
    {
      "failed_selector": "#btn1",
      "semantic_dom": {...}
    },
    {
      "failed_selector": "#btn2",
      "semantic_dom": {...}
    }
  ]
}
```

**Response:**
```json
{
  "request_id": "req_xyz789",
  "results": [...],
  "total_processed": 2,
  "total_succeeded": 2,
  "total_failed": 0,
  "processing_time_ms": 2456
}
```

### GET /history
Get healing history with pagination.

**Query Parameters:**
- `page` (default: 1)
- `page_size` (default: 20, max: 100)
- `url_filter` (optional)

**Response:**
```json
{
  "items": [...],
  "total_count": 1523,
  "page": 1,
  "page_size": 20,
  "has_more": true
}
```

### GET /stats
Get healing statistics.

**Response:**
```json
{
  "total_healings": 1523,
  "total_with_feedback": 342,
  "positive_feedback_count": 298,
  "negative_feedback_count": 44,
  "success_rate": 0.87,
  "most_healed_selectors": [
    {"selector": "#submit-btn", "count": 45},
    {"selector": ".login-form", "count": 32}
  ],
  "recent_healings_count": 156,
  "average_confidence": 0.82
}
```

### POST /feedback
Submit feedback on a healed selector.

**Request:**
```json
{
  "healing_id": 123,
  "rating": "positive",
  "comment": "Worked perfectly!",
  "actual_selector_used": "[data-testid='submit']"
}
```

### GET /health
Service health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "database_connected": true,
  "llm_api_available": true,
  "version": "1.0.0"
}
```

---

## 💡 Semantic DOM Extraction (76% Cost Savings!)

Instead of sending full HTML (expensive), extract semantic DOM first:

### Why Use Semantic DOM?
- ✅ **76% smaller** than full HTML
- ✅ **76% lower LLM costs**
- ✅ **Faster processing**
- ✅ **Better accuracy** (focuses on interactive elements)
- ✅ **Automatic extraction** if you send HTML

### How to Use

```python
from dom_extractor import DOMExtractor
import requests

# Read HTML
with open("page.html") as f:
    html = f.read()

# Extract semantic DOM
extractor = DOMExtractor(html)
semantic_dom = extractor.extract_semantic_dom()

# Original: 770 KB → Semantic: 185 KB (76% reduction!)
print(f"Elements: {semantic_dom['total_elements']}")

# Send to healer
response = requests.post("http://localhost:8000/heal", json={
    "failed_selector": "#old-button",
    "semantic_dom": semantic_dom,  # 76% smaller!
    "page_url": "https://example.com"
})

print(f"Healed: {response.json()['chosen']}")
```

### Automatic Extraction
If you send full HTML, the service automatically extracts semantic DOM:
```python
# You send full HTML
response = requests.post("http://localhost:8000/heal", json={
    "failed_selector": "#old-button",
    "html": html  # Service extracts semantic DOM automatically
})
# Service logs: "Extracted semantic DOM: 283 elements (76% smaller)"
```

---

## 🎯 Context-Aware Healing with `use_of_selector`

Provide context about how a selector is used to enable intelligent LLM re-ranking!

### Why Use `use_of_selector`?
- ✅ **LLM has final say** when context is provided
- ✅ **Disambiguates similar elements** (username vs. password fields)
- ✅ **Higher accuracy** for semantically correct selectors
- ✅ **Considers top 8 candidates** for re-ranking

### How It Works
1. Initial ranking uses heuristics (stability, semantic scores)
2. If `use_of_selector` is provided, triggers **LLM re-ranking**
3. LLM receives top 8 candidates + your context
4. LLM chooses the best match based on semantic understanding
5. Chosen selector moved to #1 with boosted score

### Examples

**Login Form Fields:**
```python
# Password field
requests.post("http://localhost:8000/heal", json={
    "failed_selector": "#password123",
    "semantic_dom": dom_data,
    "use_of_selector": "focus on password field"  # ← Disambiguates from username
})
# ✅ Correctly chooses #password over #username

# Username field
requests.post("http://localhost:8000/heal", json={
    "failed_selector": "#user_input",
    "semantic_dom": dom_data,
    "use_of_selector": "enter username"  # ← Clear context
})
# ✅ Correctly chooses #username
```

**Navigation Links:**
```python
requests.post("http://localhost:8000/heal", json={
    "failed_selector": ".nav-link",
    "semantic_dom": dom_data,
    "use_of_selector": "click on forgot password link"  # ← Specific intent
})
# ✅ Chooses .forgot-password a instead of generic a tags
```

**Form Buttons:**
```python
requests.post("http://localhost:8000/heal", json={
    "failed_selector": "button.btn",
    "semantic_dom": dom_data,
    "use_of_selector": "submit login form"  # ← Action context
})
# ✅ Chooses button[type='submit'] over cancel/reset buttons
```

### Best Practices
- Be specific: "click on login button" > "click button"
- Describe the action and target: "enter email in signup form"
- Mention element type when ambiguous: "select country from dropdown"
- Avoid generic descriptions: "find element" ❌

---

##  Architecture

```
healer_service/
├── main.py                 # FastAPI application & endpoints
├── config.py               # Configuration management
├── models.py               # Pydantic models for validation
├── database.py             # SQLite database operations
├── logger.py               # Structured logging
├── xpath_generator.py      # XPath generation & scoring
├── vision_analyzer.py      # Screenshot analysis
├── dom_extractor.py        # Semantic DOM extraction (NEW!)
├── requirements.txt        # Python dependencies
├── .env                    # Configuration (create this)
├── healed_selectors.db     # SQLite database (auto-created)
├── test_healer_unit.py     # Unit tests
├── test_dom_extractor.py   # DOM extraction tests
├── test_semantic_dom.py    # Semantic DOM API tests
├── run_amazon_tests.py     # Amazon test cases
└── sample_data/
    ├── sample.html         # Amazon sample HTML
    └── AMAZON_TEST_CASES.md # Test case documentation
```

---

## Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENROUTER_API_KEY` | - | **Required.** Your OpenRouter API key |
| `LLM_MODEL` | `meta-llama/llama-3-8b-instruct` | LLM model for selector generation |
| `VISION_MODEL` | `google/gemini-pro-vision` | Vision model for screenshot analysis |
| `ENABLE_SCREENSHOT_ANALYSIS` | `true` | Enable/disable screenshot analysis |
| `ENABLE_XPATH_GENERATION` | `true` | Enable/disable XPath generation |
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `DB_PATH` | `healed_selectors.db` | SQLite database path |
| `MAX_CANDIDATES` | `10` | Maximum candidates to return |
| `MAX_DOM_CANDIDATES` | `30` | Maximum DOM-based candidates |
| `SCORE_WEIGHT_BASE` | `0.3` | Weight for base confidence |
| `SCORE_WEIGHT_STABILITY` | `0.4` | Weight for stability score |
| `SCORE_WEIGHT_SEMANTIC` | `0.3` | Weight for semantic score |
| `LLM_TIMEOUT` | `30` | LLM API timeout in seconds |
| `LLM_MAX_TOKENS` | `1000` | Maximum tokens for LLM response |

---

## Scoring Algorithm

The service ranks selector candidates using three weighted factors:

### 1. Base Confidence (30%)
- LLM's confidence in the selector
- Based on model's understanding of the DOM

### 2. Stability Score (40%)
- **Penalizes:**
  - Random IDs (e.g., `#btn-12345`)
  - Positional selectors (e.g., `:nth-child(3)`)
  - Deep nesting (e.g., `div > div > div > button`)
- **Rewards:**
  - Stable attributes (`data-testid`, `aria-label`)
  - Semantic HTML (`button`, `nav`, `main`)
  - Short, simple selectors

### 3. Semantic Score (30%)
- **Rewards:**
  - ARIA attributes (`aria-label`, `aria-describedby`)
  - Test IDs (`data-testid`, `data-test`)
  - Text-based selectors (`:has-text("Submit")`)
  - Semantic meaning

**Final Score = (Base × 0.3) + (Stability × 0.4) + (Semantic × 0.3)**

---

## Integration Examples

### Python Client
```python
import requests

def heal_selector(failed_selector, html, page_url=None):
    response = requests.post("http://localhost:8000/heal", json={
        "failed_selector": failed_selector,
        "html": html,
        "page_url": page_url
    })
    return response.json()["chosen"]

# Usage
new_selector = heal_selector("#old-button", page_html, "https://example.com")
print(f"Use: {new_selector}")
```

### Playwright Integration
```python
from playwright.sync_api import sync_playwright
import requests

def heal_and_click(page, selector):
    try:
        page.click(selector, timeout=5000)
    except:
        # Selector failed, heal it
        html = page.content()
        response = requests.post("http://localhost:8000/heal", json={
            "failed_selector": selector,
            "html": html,
            "page_url": page.url
        })
        healed = response.json()["chosen"]
        print(f"Healed: {selector} → {healed}")
        page.click(healed)

# Usage
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("https://example.com")
    heal_and_click(page, "#submit-btn")
```

### Selenium Integration
```python
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
import requests

def heal_and_find(driver, selector):
    try:
        return driver.find_element_by_css_selector(selector)
    except NoSuchElementException:
        # Heal the selector
        html = driver.page_source
        response = requests.post("http://localhost:8000/heal", json={
            "failed_selector": selector,
            "html": html,
            "page_url": driver.current_url
        })
        healed = response.json()["chosen"]
        return driver.find_element_by_css_selector(healed)

# Usage
driver = webdriver.Chrome()
driver.get("https://example.com")
element = heal_and_find(driver, "#submit-btn")
element.click()
```

---

## Testing

### Comprehensive Test Suite
```bash
# Run all tests
python test_all.py

# Skip API tests (only DOM extraction)
python test_all.py --skip-api

# Skip DOM extraction (only API tests)
python test_all.py --skip-extraction
```

### Quick API Test
```bash
# Simple test with full HTML
python test_run.py
```

### Unit Tests
```bash
# Pytest-based tests
pytest test_healer_unit.py -v
```

### Amazon Test Cases
```bash
# Real-world scenarios
python run_amazon_tests.py
```

---

##  Test Files

| File | Purpose | Command |
|------|---------|---------|
| `test_all.py` | Comprehensive test suite | `python test_all.py` |
| `test_run.py` | Quick API test | `python test_run.py` |
| `test_healer_unit.py` | Unit tests | `pytest test_healer_unit.py -v` |
| `run_amazon_tests.py` | Amazon test cases | `python run_amazon_tests.py` |

---

##  Performance Metrics

### Cost Comparison

| Method | Data Size | LLM Tokens | Cost/Request | Monthly Cost (1000 req) |
|--------|-----------|------------|--------------|-------------------------|
| **Full HTML** | 770 KB | ~200,000 | $0.10 | $100 |
| **Semantic DOM** | 185 KB | ~48,000 | $0.024 | **$24** |
| **Savings** | **76%** | **76%** | **76%** | **$76/month** |

### Processing Time
- Average: 1.2s per selector
- With cache hit: <50ms
- Batch (10 selectors): ~8s

---

##  Troubleshooting

### Service Won't Start
```bash
# Check port availability
lsof -i :8000

# Kill existing process
kill -9 <PID>
```

### LLM API Errors
- Verify `.env` has correct `OPENROUTER_API_KEY`
- Check API credits at https://openrouter.ai/
- Test: `curl http://localhost:8000/health`

### Database Errors
```bash
# Reset database
rm healed_selectors.db
python main.py
```

### Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

---

##  Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Installation & setup guide
- **[AMAZON_TEST_CASES.md](sample_data/AMAZON_TEST_CASES.md)** - Real-world test cases
- **API Docs** - http://localhost:8000/docs (when running)

---

##  Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

---

##  License

MIT License - see LICENSE file for details

---

## Support

For issues and questions:
- Check [QUICKSTART.md](QUICKSTART.md) for setup help
- Review test files for usage examples
- Check logs for error messages
- Open an issue in the repository

---

##  Roadmap

- [ ] Support for more LLM providers
- [ ] Advanced caching strategies
- [ ] Selector confidence prediction
- [ ] Auto-healing in CI/CD pipelines
- [ ] Dashboard for monitoring
- [ ] Selector stability tracking over time

---

**Built with  for test automation engineers**


