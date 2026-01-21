def classify_page_change(visual, structure, semantic):
    if structure["added"] or structure["removed"]:
        return "FAIL"

    if semantic["added_text"] or semantic["removed_text"]:
        return "FAIL"

    if visual["change_score"] > 0.05:
        return "WARN"

    return "IGNORE"
