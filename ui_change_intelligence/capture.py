from playwright.sync_api import sync_playwright

def capture_page(url, screenshot_path):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(url)
        page.wait_for_load_state("networkidle")
        page.screenshot(path=screenshot_path, full_page=True)
        dom = page.content()
        browser.close()
    return dom