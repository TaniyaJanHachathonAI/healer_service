import cv2
import numpy as np

def extract_centroids(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    img = cv2.GaussianBlur(img, (5, 5), 0)

    _, thresh = cv2.threshold(img, 200, 255, cv2.THRESH_BINARY_INV)

    contours, _ = cv2.findContours(
        thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    centroids = []

    for c in contours:
        x, y, w, h = cv2.boundingRect(c)

        # ignore tiny noise
        if w * h < 1500:
            continue

        cx = x + w // 2
        cy = y + h // 2

        centroids.append((cx, cy))

    return sorted(centroids)

def position_diff(base_img, curr_img):
    base_centroids = extract_centroids(base_img)
    curr_centroids = extract_centroids(curr_img)

    if not base_centroids or not curr_centroids:
        return {
            "moved": False,
            "max_delta": 0
        }

    # Compare only common count (safe heuristic)
    min_len = min(len(base_centroids), len(curr_centroids))

    deltas = []

    for i in range(min_len):
        bx, by = base_centroids[i]
        cx, cy = curr_centroids[i]

        delta = ((bx - cx) ** 2 + (by - cy) ** 2) ** 0.5
        deltas.append(delta)

    max_delta = max(deltas)

    return {
        "moved": max_delta > 30,   # px threshold
        "max_delta": round(max_delta, 2)
    }