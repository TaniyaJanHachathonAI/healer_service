# Healer Service - Quick Start Guide

Get up and running with the Selector Healer Service in 5 minutes!

---

##  Prerequisites

- Python 3.8+
- pip or pip3
- OpenRouter API key ([Get one here](https://openrouter.ai/))

---

## ⚡ Installation

### 1. Navigate to the project directory
```bash
cd /Applications/MAMP/htdocs/test-agent/qa-ai-system/healer_service
```

### 2. Create and activate virtual environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

---

## Configuration

Create a `.env` file in the healer_service directory:

```bash
# Create .env file
cat > .env << 'EOF'
OPENROUTER_API_KEY=your_api_key_here
LLM_MODEL=meta-llama/llama-3-8b-instruct
VISION_MODEL=google/gemini-pro-vision
ENABLE_SCREENSHOT_ANALYSIS=true
ENABLE_XPATH_GENERATION=true
LOG_LEVEL=INFO
EOF
```

**Important:** Replace `your_api_key_here` with your actual OpenRouter API key!

---

## Running the Service

### Start the server
```bash
source venv/bin/activate
python main.py
```

The service will start on **http://localhost:8000**

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

##  Testing

### Run All Tests (Recommended)
```bash
source venv/bin/activate
python test_all.py
```

This comprehensive test runner covers:
- ✅ DOM extraction (3 methods)
- ✅ API health check
- ✅ Single selector healing (HTML & Semantic DOM)
- ✅ Batch healing
- ✅ History & statistics
- ✅ Feedback submission

**Options:**
```bash
# Skip API tests (only test DOM extraction)
python test_all.py --skip-api

# Skip DOM extraction tests (only test API)
python test_all.py --skip-extraction

# Use different URL
python test_all.py --url http://localhost:9000
```

### Run Individual Tests

#### Quick API Test
```bash
# Simple API test with full HTML
python test_run.py
```

#### Unit Tests
```bash
# Pytest-based unit tests
pytest test_healer_unit.py -v
```

#### Amazon Test Cases
```bash
# Real-world test scenarios
python run_amazon_tests.py
```

---

##  Available Test Files

| File | Purpose |
|------|---------|
| `test_all.py` | Comprehensive test suite (all scenarios) |
| `test_run.py` | Quick API test with full HTML |
| `test_healer_unit.py` | Unit tests (pytest) |
| `run_amazon_tests.py` | Amazon.in test cases |

---

##  Quick API Test

### Using curl
```bash
curl -X POST http://localhost:8000/heal \
  -H "Content-Type: application/json" \
  -d '{
    "failed_selector": "#old-button",
    "html": "<html><body><button id=\"new-button\">Click</button></body></html>",
    "page_url": "https://example.com"
  }'
```

### Using Python
```python
import requests

response = requests.post("http://localhost:8000/heal", json={
    "failed_selector": "#old-button",
    "html": "<html><body><button id='new-button'>Click</button></body></html>",
    "page_url": "https://example.com"
})

result = response.json()
print(f"Healed selector: {result['chosen']}")
```

---

##  API Documentation

Once the service is running, visit:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Landing Page:** http://localhost:8000/

---

##  Using Semantic DOM (Recommended - 76% Cost Savings!)

Instead of sending full HTML, extract semantic DOM first:

```python
from dom_extractor import DOMExtractor
import requests

# Read your HTML
with open("page.html") as f:
    html = f.read()

# Extract semantic DOM (76% smaller!)
extractor = DOMExtractor(html)
semantic_dom = extractor.extract_semantic_dom()

# Send to healer
response = requests.post("http://localhost:8000/heal", json={
    "failed_selector": "#old-button",
    "semantic_dom": semantic_dom,  # 76% smaller than full HTML!
    "page_url": "https://example.com"
})

print(f"Healed: {response.json()['chosen']}")
```

---

##  Common Commands

| Task | Command |
|------|---------|
| Start service | `python main.py` |
| Run tests | `pytest test_healer_unit.py -v` |
| Test DOM extraction | `python test_dom_extractor.py` |
| Test semantic DOM | `python test_semantic_dom.py` |
| Check health | `curl http://localhost:8000/health` |
| View logs | Check console output |
| Reset database | `rm healed_selectors.db` |

---

##  Troubleshooting

### Service won't start
```bash
# Check if port 8000 is already in use
lsof -i :8000

# Kill the process if needed
kill -9 <PID>
```

### LLM API errors
- Verify your `.env` file has the correct API key
- Check you have API credits at https://openrouter.ai/
- Test with: `curl http://localhost:8000/health`

### Import errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Database errors
```bash
# Reset the database
rm healed_selectors.db
# Restart the service
python main.py
```

---

##  Next Steps

1. Service running? Great!
2. Read the full [README.md](README.md) for detailed documentation
3. Check [AMAZON_TEST_CASES.md](sample_data/AMAZON_TEST_CASES.md) for test examples
4. Integrate with your test automation framework

---

##  Pro Tips

- **Use semantic DOM** for 76% cost savings
- **Enable screenshot analysis** for better accuracy
- **Submit feedback** to improve healing quality
- **Check /stats endpoint** to monitor performance

---

##  Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review test files for examples
- Check logs for error messages
- Ensure `.env` file is configured correctly

---


