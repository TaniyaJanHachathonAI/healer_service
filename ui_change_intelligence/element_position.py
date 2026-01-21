import cv2

def extract_positions(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    blur = cv2.GaussianBlur(img, (5, 5), 0)

    _, thresh = cv2.threshold(
        blur, 200, 255, cv2.THRESH_BINARY_INV
    )

    contours, _ = cv2.findContours(
        thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    elements = []

    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        if w * h < 1500:
            continue

        elements.append({
            "bbox": {"x": x, "y": y, "w": w, "h": h},
            "center": {"cx": x + w // 2, "cy": y + h // 2}
        })

    elements.sort(key=lambda e: e["center"]["cy"])
    return elements
