# Selector Healer Service

The **Selector Healer Service** is an AI-powered tool designed to automatically "heal" broken or fragile web selectors in test automation scripts. It analyzes the DOM (Document Object Model) and optionally visual screenshots to identify the most likely element that corresponds to a failed selector, returning a list of ranked candidates with confidence scores.

## Features

-   **Semantic Healing**: matches elements based on text intensity, attributes, and tags.
-   **Multi-Strategy**: Uses various strategies (text, attributes, position) to find the best match.
-   **Confidence Scoring**: Returns a confidence score for each suggested selector.
-   **Visual Analysis**: Can leverage screenshots (via `screenshot_path`) for better accuracy (if configured).
-   **API Database**: Built on FastAPI for high performance and easy integration.

## Prerequisites

-   Python 3.8+
-   `pip` package manager

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    cd healer_service-main
    ```

2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

The service uses a `.env` file for configuration. A sample `.env` file should be present in the root directory. Key configuration options include:

-   `SCORE_WEIGHT_BASE`: Weight for base match score (default: 0.3)
-   `SCORE_WEIGHT_STABILITY`: Weight for stability score (default: 0.4)
-   `SCORE_WEIGHT_SEMANTIC`: Weight for semantic similarity score (default: 0.3)
-   `MAX_CANDIDATES`: Max number of candidates to generate.
-   `LOG_LEVEL`: Logging level (default: INFO)

## Usage

### Starting the Service

To start the server, run:

```bash
python main.py
```
Or using uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The service will start at `http://0.0.0.0:8000`.

### API Documentation

#### Heal Selector (`POST /heal`)

Analyzes a failing selector and returns healed candidates.

**Request Body (`HealRequest`):**

```json
{
  "failed_selector": "#submit-btn",
  "html": "<html>...</html>",
  "semantic_dom": { ... }, 
  "page_url": "https://example.com/form",
  "use_of_selector": "Click the submit button",
  "selector_type": "mixed"
}
```

*Note: You must provide at least `html` or `semantic_dom`.*

**Response (`HealResponse`):**

```json
{
    "request_id": "req_123",
    "message": "Success",
    "chosen": "[data-testid='submit']",
    "candidates": [
        {
            "selector": "[data-testid='submit']",
            "score": 0.95,
            ...
        }
    ],
    "debug": {
        "processing_time_ms": 150.5
    }
}
```

## Testing

A test script `test_run.py` is included to verify the service functionality using sample data.

```bash
python test_run.py
```
