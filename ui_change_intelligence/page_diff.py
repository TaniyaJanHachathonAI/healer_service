def structural_diff(base, curr):
    base_tags = [e["tag"] for e in base]
    curr_tags = [e["tag"] for e in curr]

    return {
        "added": list(set(curr_tags) - set(base_tags)),
        "removed": list(set(base_tags) - set(curr_tags))
    }

def semantic_diff(base, curr):
    base_texts = set(e["text"] for e in base if e["text"])
    curr_texts = set(e["text"] for e in curr if e["text"])

    return {
        "added_text": list(curr_texts - base_texts),
        "removed_text": list(base_texts - curr_texts)
    }
