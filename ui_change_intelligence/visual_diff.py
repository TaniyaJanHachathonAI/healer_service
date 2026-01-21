import cv2
from skimage.metrics import structural_similarity as ssim

def resize_to_smallest(img1, img2):
    h1, w1 = img1.shape
    h2, w2 = img2.shape

    new_h = min(h1, h2)
    new_w = min(w1, w2)

    img1_resized = cv2.resize(img1, (new_w, new_h))
    img2_resized = cv2.resize(img2, (new_w, new_h))

    return img1_resized, img2_resized


def visual_diff(base_img_path, curr_img_path):
    img1 = cv2.imread(base_img_path, cv2.IMREAD_GRAYSCALE)
    img2 = cv2.imread(curr_img_path, cv2.IMREAD_GRAYSCALE)

    if img1 is None or img2 is None:
        raise ValueError("One or both images could not be loaded")

    img1, img2 = resize_to_smallest(img1, img2)

    score, _ = ssim(img1, img2, full=True)

    return round(1 - score, 4)
