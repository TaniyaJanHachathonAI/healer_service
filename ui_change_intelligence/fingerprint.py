def build_fingerprint(element, bounding_box=None):
    return {
        "tag": element.get("tag"),
        "type": element.get("type"),
        "semantic_role": element.get("role"),
        "placeholder": element.get("placeholder"),
        "text": element.get("text"),
        "visual": bounding_box or {}
    }
