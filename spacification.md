🔧 AI-Powered Selector Healer Service

(How it works & why it matters)

1️⃣ Problem Statement (What problem are we solving?)
❌ The core problem

In modern UI test automation (Playwright, Selenium, Cypress, etc.):

UI elements change frequently

IDs change

Classes change

DOM structure shifts

Automated tests fail even though the application works

These failures are called flaky tests

❌ Current reality (manual pain)

When a test fails:

QA / Automation Engineers must:

Open the webpage

Inspect DOM

Find the correct element again

Rewrite selectors

Re-run pipelines

This process:

Takes minutes to hours

Breaks CI/CD velocity

Requires human intervention

✅ Goal of this project

Automatically heal broken selectors using AI + DOM intelligence — without human involvement.

2️⃣ Features (What does your system do?)
🔹 1. Automatic Selector Healing

Takes a failed selector

Analyzes the current DOM

Generates new, stable selectors

Ranks them intelligently

Returns the best replacement

🔹 2. Semantic DOM Understanding

From dom_extractor.py:

Extracts meaningful DOM attributes:

tag

text

aria-label

role

href

parent & sibling context

Builds a semantic representation of the page

Much smarter than raw XPath or CSS search

🔹 3. Intelligent Ranking Engine

From dom_matching_engine.py:

Each candidate selector is ranked using:

Semantic similarity (what the element represents)

Structural similarity (DOM position & context)

Attribute confidence (aria-label, id, role, etc.)

Stability heuristics (avoids volatile selectors)

➡️ Final output is ranked, explainable, and reliable

🔹 4. AI-Assisted Reasoning 

Uses In Memory all-MiniLM-L6-v2 model and in memory TfidfVectorizer vector technique to perform RAG:
Vector Embedding
Understand “use of selector” (e.g. click login button)
Semantic Search (Cossin Similarity)

🔹 5. API-Driven & CI/CD Friendly

From main.py:

FastAPI-based REST service

Endpoints like:

/heal – heal a single selector

/heal-batch – heal multiple failures

Easily pluggable into:

Jenkins

GitHub Actions

GitLab CI

Any test runner

🔹 6. Safe Fallback Design

Vision is non-blocking

If AI fails → system still works using DOM logic

No single point of failure

3️⃣ Technical Specification (What technologies are used?)
🧠 AI & ML

In Memory all-MiniLM-L6-v2 model
Semantic similarity scoring

Semantic similarity scoring

🌐 Backend & APIs

FastAPI – high-performance async API

JSON-based request/response

Stateless, scalable design

🧩 DOM Intelligence

BeautifulSoup / HTML parsing

Custom DOM flattening

Parent-child-sibling relationship modeling

⚙️ Matching Engine

From dom_matching_engine.py:

TF-IDF / semantic embeddings

Attribute scoring

Weighted ranking formula

Deterministic + explainable output

🧪 Testing & Validation

From test_run.py:

CLI-style local testing

Debug-friendly outputs

Easy reproducibility

🔐 Configuration & Safety

Environment-based config

Feature flags (vision on/off)

Timeouts & graceful failure handling

4️⃣ How This Reduces Human Effort (Business Impact)
❌ Before (Manual Process)
Step	Human Effort
Analyze failure	Manual
Inspect DOM	Manual
Guess correct selector	Manual
Update test	Manual
Re-run pipeline	Manual

⏱ 15–60 minutes per failure

✅ After (With Selector Healer)
Step	Human Effort
Failure detected	Automatic
DOM analysis	Automatic
Selector generation	Automatic
Best selector chosen	Automatic
Test healed	Automatic

⏱ Seconds, not minutes

📉 Quantifiable Benefits

🚀 Faster CI/CD pipelines

🧑‍💻 Less QA burnout

📉 Fewer flaky test reruns

📈 Higher test stability

🤖 Moves QA from maintenance to quality strategy

🎯 One-Line Executive Summary

This system uses AI and DOM intelligence to automatically repair broken UI test selectors, eliminating manual intervention and drastically reducing test maintenance effort.