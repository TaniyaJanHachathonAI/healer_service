def semantic_diff(old, new):
    score = 0
    reasons = []

    for key in ["tag", "semantic_role", "placeholder"]:
        if old.get(key) != new.get(key):
            score += 0.3
            reasons.append(f"{key} changed")

    if old.get("text") != new.get("text"):
        score += 0.4
        reasons.append("text meaning changed")

    return {
        "semantic_score": round(score, 2),
        "reasons": reasons
    }
