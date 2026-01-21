# from bs4 import BeautifulSoup
# import re

# DYNAMIC_PATTERNS = [
#     r"\d+",
#     r"\d{4}-\d{2}-\d{2}",
#     r"₹\s?\d+"
# ]

# def is_dynamic(text):
#     if not text:
#         return False
#     return any(re.search(p, text) for p in DYNAMIC_PATTERNS)

# def normalize_dom(html):
#     soup = BeautifulSoup(html, "html.parser")
#     elements = []

#     TRACKED_TAGS = ["button", "input", "a", "select", "label", "div", "h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "img", "svg", "video", "audio", "canvas", "nav", "main", "header", "footer", "article", "section"]

#     for el in soup.find_all(TRACKED_TAGS):
#         if el.name == "div" and not el.get("class"):
#             continue
#         #text = el.text.strip()
#         text = " ".join(el.stripped_strings)
#         if is_dynamic(text):
#             text = "<DYNAMIC>"

#         elements.append({
#             "tag": el.name,
#             "type": el.get("type"),
#             "role": el.get("aria-label"),
#             "placeholder": el.get("placeholder"),
#             "text": text[:40]
#         })

#     return elements

from bs4 import BeautifulSoup
import re

TRACKED_TAGS = ["button", "input", "a", "select", "label", "div", "h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "img", "svg", "video", "audio", "canvas", "nav", "main", "header", "footer", "article", "section"]

DYNAMIC_PATTERNS = [
    r"\d+",
    r"\d{4}-\d{2}-\d{2}",
    r"₹\s?\d+"
]

def is_dynamic(text):
    return any(re.search(p, text) for p in DYNAMIC_PATTERNS)

def normalize_dom(html: str):
    soup = BeautifulSoup(html, "html.parser")
    elements = []

    for el in soup.find_all(TRACKED_TAGS):
        if el.name == "div" and not el.get("class"):
            continue

        text = " ".join(el.stripped_strings)
        if is_dynamic(text):
            text = "<DYNAMIC>"

        elements.append({
            "tag": el.name,
            "class": " ".join(el.get("class", [])),
            "text": text.strip()
        })

    return elements
