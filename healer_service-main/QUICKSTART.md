# Quickstart Guide

This guide will help you get the **Selector Healer Service** up and running in minutes.

## 1. Setup Environment

First, open your terminal and navigate to the project directory:

```bash
cd /path/to/healer_service-main
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

## 2. Configure the Service

Ensure you have a `.env` file in the root directory. If not, create one or copy any example config provided.

## 3. Start the Server

Launch the API server using the provided `main.py` script:

```bash
python main.py
```

You should see logs indicating the service has started:
```
INFO:     Started server process [PID]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

## 4. Evaluate with Test Script

In a separate terminal window, run the included test script to confirm everything is working. This script sends a sample request (using `sample_data/`) to your running server:

```bash
python test_run.py
```

**Expected Output:**
You should see a "SUCCESS - Selector Healed!" message along with a list of candidate selectors and confidence scores.

## 5. Usage Example (cURL)

You can also test the API manually using `curl`. Here is a basic example assuming you have the server running:

```bash
curl -X POST "http://0.0.0.0:8000/heal" \
     -H "Content-Type: application/json" \
     -d '{
           "failed_selector": "#old-id",
           "html": "<html><body><button id=\"new-id\" class=\"btn\">Submit</button></body></html>",
           "use_of_selector": "submit the form"
         }'
```

*Note: In a real scenario, you would send the full HTML of the page where the selector failed.*
