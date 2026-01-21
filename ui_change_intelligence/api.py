# from fastapi import FastAPI
# from pydantic import BaseModel
# from capture import capture_page
# from dom_normalizer import normalize_dom
# from visual_diff import visual_diff
# from fingerprint import build_fingerprint
# from semantic import semantic_diff
# from classifier import classify_change
# from page_diff import structural_diff, semantic_text_diff
# from page_classifier import classify_page_change
from fastapi import FastAPI
from models import ArtifactInput
from dom_normalizer import normalize_dom
from page_diff import structural_diff, semantic_diff
from visual_diff import visual_diff
from classifier import classify
from position_diff import position_diff
app = FastAPI()

# class HealInput(BaseModel):
#     element_id: str
#     healed_confidence: float
#     baseline_url: str
#     current_url: str

# @app.post("/ui/change/analyze")
# def analyze_ui(data: HealInput):
#     base_dom = capture_page(data.baseline_url, "base.png")
#     curr_dom = capture_page(data.current_url, "curr.png")

#     base_elements = normalize_dom(base_dom)
#     curr_elements = normalize_dom(curr_dom)

#     # base_fp = build_fingerprint(base_elements[0])
#     # curr_fp = build_fingerprint(curr_elements[0])
#     def find_element(elements, element_id):
#         for el in elements:
#             # Match by aria-label
#             if el.get("role") == element_id:
#                 return el

#             # Match by button text (fallback)
#             if el.get("tag") == "button" and el.get("text"):
#                 if element_id.replace("_", "").lower() in el.get("text").lower():
#                     return el

#         return None

#     base_el = find_element(base_elements, "login-title")
#     curr_el = find_element(curr_elements, "login-title")

#     if not base_el or not curr_el:
#         return {
#             "element_id": data.element_id,
#             "decision": "FAIL",
#             "reason": "Target element not found in baseline or current UI"
#         }

#     base_fp = build_fingerprint(base_el)
#     curr_fp = build_fingerprint(curr_el)

#     semantic = semantic_diff(base_fp, curr_fp)
#     visual = visual_diff("base.png", "curr.png")

#     decision = classify_change(
#         visual=visual,
#         semantic=semantic,
#         structure_score=0.2,
#         healer_confidence=data.healed_confidence
#     )

#     return {
#         "element_id": data.element_id,
#         "decision": decision,
#         "visual": visual,
#         "semantic": semantic
#     }

@app.post("/ui/change/analyze")
# def analyze_ui(data: HealInput):
#     base_dom = capture_page(data.baseline_url, "base.png")
#     curr_dom = capture_page(data.current_url, "curr.png")

#     base_elements = normalize_dom(base_dom)
#     curr_elements = normalize_dom(curr_dom)

#     visual = visual_diff("base.png", "curr.png")
#     structure = structural_diff(base_elements, curr_elements)
#     semantic = semantic_text_diff(base_elements, curr_elements)

#     decision = classify_page_change(visual, structure, semantic)

#     return {
#         "decision": decision,
#         "visual": visual,
#         "structure": structure,
#         "semantic": semantic
#     }

def analyze_ui(data: ArtifactInput):

    base_dom = open(data.baseline_html).read()
    curr_dom = open(data.current_html).read()

    base_elements = normalize_dom(base_dom)
    curr_elements = normalize_dom(curr_dom)

    structure = structural_diff(base_elements, curr_elements)
    semantic = semantic_diff(base_elements, curr_elements)
    visual_score = visual_diff(data.baseline_image, data.current_image)
    position = position_diff(data.baseline_image, data.current_image)

    decision = classify(structure, semantic, visual_score, position)

    

    return {
        "decision": decision,
        "visual": {"change_score": visual_score},
        "structure": structure,
        "semantic": semantic,
        "position": position
    }

if __name__ == "__main__":
    import uvicorn
    #logger.info("Starting API for UI Change Intelligence...")
    uvicorn.run("api:app", host="0.0.0.0", port=9002, reload=True)
