# import requests
# import json

# API_URL = "http://localhost:9002/ui/change/analyze"
# # ↑ change port if your FastAPI service runs on a different port

# payload = {
#     "element_id": "login-title",
#     "healed_confidence": 0.92,
#     "baseline_url": "http://localhost:9003/baseline/login",
#     "current_url": "http://localhost:9003/current/login"
# }

# headers = {
#     "Content-Type": "application/json"
# }

# def test_ui_change():
#     response = requests.post(
#         API_URL,
#         headers=headers,
#         data=json.dumps(payload),
#         timeout=30
#     )

#     print("\n=== STATUS CODE ===")
#     print(response.status_code)

#     print("\n=== RAW RESPONSE ===")
#     print(response.text)

#     if response.status_code == 200:
#         print("\n=== PARSED RESPONSE ===")
#         print(json.dumps(response.json(), indent=2))
#     else:
#         print("\n❌ API call failed")

# if __name__ == "__main__":
#     test_ui_change()


import requests
import json
import os

API_URL = "http://localhost:9002/ui/change/analyze"
# ⬆️ change port if your FastAPI service runs on a different one

# ---- Artifact paths ----
BASELINE_HTML = "demo_app/baseline/login.html"
BASELINE_IMAGE = "demo_app/baseline/login.png"

CURRENT_HTML = "demo_app/current/login.html"
CURRENT_IMAGE = "demo_app/current/login.png"


def validate_files():
    files = [
        BASELINE_HTML,
        BASELINE_IMAGE,
        CURRENT_HTML,
        CURRENT_IMAGE
    ]
    for f in files:
        if not os.path.exists(f):
            raise FileNotFoundError(f"❌ File not found: {f}")


def test_ui_change():
    validate_files()

    payload = {
        "baseline_html": BASELINE_HTML,
        "baseline_image": BASELINE_IMAGE,
        "current_html": CURRENT_HTML,
        "current_image": CURRENT_IMAGE
    }

    headers = {
        "Content-Type": "application/json"
    }

    print("\n📤 Sending payload:")
    print(json.dumps(payload, indent=2))

    response = requests.post(
        API_URL,
        headers=headers,
        json=payload,
        timeout=30
    )

    print("\n=== STATUS CODE ===")
    print(response.status_code)

    print("\n=== RAW RESPONSE ===")
    print(response.text)

    if response.status_code == 200:
        print("\n=== PARSED RESPONSE ===")
        print(json.dumps(response.json(), indent=2))
    else:
        print("\n❌ API call failed")


if __name__ == "__main__":
    test_ui_change()
