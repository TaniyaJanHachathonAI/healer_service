from config import *

def classify(structure, semantic, visual_score, position):
    if structure["added"] or structure["removed"]:
        return "FAIL"

    if semantic["added_text"] or semantic["removed_text"]:
        return "FAIL"

    if position["moved"] and position["max_delta"] > 80:
        return "FAIL"

    if position["moved"]:
        return "WARN"

    if visual_score > VISUAL_FAIL_THRESHOLD:
        return "FAIL"

    if visual_score > VISUAL_WARN_THRESHOLD:
        return "WARN"

    return "IGNORE"
