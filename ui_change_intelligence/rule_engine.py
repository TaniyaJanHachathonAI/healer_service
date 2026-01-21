def apply_rules(dom_elements, positions):
    violations = []

    tags = [e["tag"] for e in dom_elements]
    texts = [e["text"] for e in dom_elements if e["text"]]

    # Rule 1: New or missing element
    if "label" in tags and "Email" in texts:
        violations.append({
            "rule": "label_added",
            "severity": "FAIL",
            "message": "New label added above input"
        })

    # Rule 2: Vertical order check (label above input)
    if len(positions) >= 2:
        y_positions = [p["center"]["cy"] for p in positions]
        if y_positions != sorted(y_positions):
            violations.append({
                "rule": "layout_order_changed",
                "severity": "FAIL",
                "message": "Element vertical order changed"
            })

    # Rule 3: Horizontal shift
    xs = [p["center"]["cx"] for p in positions]
    if max(xs) - min(xs) > 80:
        violations.append({
            "rule": "horizontal_shift",
            "severity": "WARN",
            "message": "Elements shifted horizontally"
        })

    return violations
