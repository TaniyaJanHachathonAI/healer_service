"""
Screenshot analysis with vision models
"""
import os
import base64
import requests
from typing import Optional, Dict, Any, Tuple
from config import Config
from logger import logger
from google import genai
from google.genai import types
client = genai.Client()

def encode_image_to_base64(image_path: str) -> Tuple[Optional[str], Optional[str]]:
    """Encode image file to base64 string and detect MIME type
    
    Returns:
        Tuple of (base64_encoded_string, mime_type) or (None, None) on error
    """
    try:
        if not os.path.exists(image_path):
            logger.warning(f"Screenshot file not found: {image_path}", extra={'request_id': 'system'})
            return None, None
        
        # Detect image format from extension
        ext = os.path.splitext(image_path)[1].lower()
        mime_types = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        }
        mime_type = mime_types.get(ext, 'image/png')  # Default to png
        
        with open(image_path, "rb") as image_file:
            encoded = base64.b64encode(image_file.read()).decode('utf-8')
            return encoded, mime_type
    except Exception as e:
        logger.error(f"Failed to encode image: {e}", extra={'request_id': 'system'}, exc_info=True)
        return None, None


def analyze_screenshot_with_vision(
    screenshot_path: str,
    failed_selector: str,
    page_url: Optional[str] = None
) -> Optional[Dict[str, Any]]:

    if not screenshot_path or not os.path.exists(screenshot_path):
        return None

    try:
        prompt = f"""
You are an expert UI/UX analyst.

Analyze this screenshot and identify the element related to the failed selector.

Failed selector:
{failed_selector}

Page URL:
{page_url or "N/A"}

Please describe:
1. The likely target element
2. Visual characteristics
3. Nearby landmarks
4. Suggested stable attributes for automation
"""

        with open(screenshot_path, "rb") as f:
            image_bytes = f.read()

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[
                prompt,
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type="image/png"
                )
            ],
        )

        if not response or not response.text:
            logger.warning("Gemini Vision returned empty response")
            return None

        return {
            "success": True,
            "analysis": response.text,
            "model_used": "gemini-3-flash-preview"
        }

    except Exception as e:
        logger.error(f"Vision analysis failed: {e}", exc_info=True)
        return None


# def analyze_screenshot_with_vision(
#     screenshot_path: str,
#     failed_selector: str,
#     page_url: Optional[str] = None
# ) -> Optional[Dict[str, Any]]:
#     """
#     Analyze screenshot using vision-capable LLM to extract UI context
    
#     Returns:
#         Dictionary with analysis results or None if analysis fails
#     """
#     if not Config.ENABLE_SCREENSHOT_ANALYSIS:
#         logger.debug("Screenshot analysis is disabled", extra={'request_id': 'system'})
#         return None
    
#     if not screenshot_path:
#         return None
    
#     # Encode image
#     image_base64, mime_type = encode_image_to_base64(screenshot_path)
#     if not image_base64:
#         return None
    
#     try:
#         # Build vision prompt
#         system_prompt = (
#             "You are an expert UI/UX analyst. Analyze the screenshot and identify "
#             "UI elements that match the failed selector context. Describe the visual "
#             "characteristics, position, and surrounding elements."
#         )
        
#         # Combine system prompt and user prompt for Gemini (it doesn't use separate system messages)
#         full_prompt = f"""{system_prompt}

# Analyze this screenshot and help identify the element that matches this selector:
# Failed selector: {failed_selector}
# Page URL: {page_url or 'N/A'}

# Please provide:
# 1. Description of the likely target element
# 2. Visual characteristics (color, size, position)
# 3. Nearby elements or landmarks
# 4. Suggested stable attributes to use for selection

# Return your analysis in a concise, structured format.
# """
        
#         # Google Gemini API format
#         if not Config.GEMINI_API_KEY:
#             logger.error("GEMINI_API_KEY is not configured", extra={'request_id': 'system'})
#             return {"success": False, "error": "GEMINI_API_KEY is not configured"}
        
#         # Build Gemini API endpoint
#         api_url = f"{Config.GEMINI_API_URL}/{Config.GEMINI_VISION_MODEL}:generateContent"
        
#         # Gemini API payload format
#         payload = {
#             "contents": [{
#                 "parts": [
#                     {"text": full_prompt},
#                     {
#                         "inline_data": {
#                             "mime_type": mime_type,
#                             "data": image_base64
#                         }
#                     }
#                 ]
#             }],
#             "generationConfig": {
#                 "temperature": 0.0,
#                 "maxOutputTokens": 500
#             }
#         }
        
#         # Gemini API uses API key as query parameter
#         params = {"key": Config.GEMINI_API_KEY}
        
#         headers = {
#             "Content-Type": "application/json"
#         }
        
#         response = requests.post(
#             api_url,
#             headers=headers,
#             json=payload,
#             params=params,
#             timeout=Config.LLM_TIMEOUT
#         )
        
#         # Better error handling - log the actual error response
#         if response.status_code != 200:
#             error_detail = response.text
#             try:
#                 error_json = response.json()
#                 error_detail = error_json.get("error", {}).get("message", error_detail)
#             except:
#                 pass
#             logger.error(
#                 f"Gemini Vision API error {response.status_code}: {error_detail}",
#                 extra={'request_id': 'system'}
#             )
#             response.raise_for_status()
        
#         result = response.json()
#         # Extract text from Gemini response format
#         analysis_text = ""
#         for part in result["candidates"][0]["content"]["parts"]:
#             if "text" in part:
#                 analysis_text += part["text"] + "\n"

        
#         logger.info("Screenshot analysis completed successfully", extra={'request_id': 'system'})
        
#         return {
#             "success": True,
#             "analysis": analysis_text,
#             "model_used": Config.GEMINI_VISION_MODEL
#         }
        
#     except requests.exceptions.Timeout:
#         logger.error("Vision API timeout", extra={'request_id': 'system'})
#         return {"success": False, "error": "Vision API timeout"}
    
#     except requests.exceptions.RequestException as e:
#         logger.error(f"Vision API request failed: {e}", extra={'request_id': 'system'}, exc_info=True)
#         return {"success": False, "error": str(e)}
    
#     except Exception as e:
#         logger.error(f"Screenshot analysis failed: {e}", extra={'request_id': 'system'}, exc_info=True)
#         return {"success": False, "error": str(e)}

def get_visual_context_for_healing(
    screenshot_path: Optional[str],
    failed_selector: str,
    page_url: Optional[str] = None
) -> str:
    """
    Get visual context from screenshot to enhance healing prompt
    
    Returns:
        String with visual context to add to LLM prompt, or empty string if unavailable
    """
    if not screenshot_path or not Config.ENABLE_SCREENSHOT_ANALYSIS:
        return ""
    
    analysis = analyze_screenshot_with_vision(screenshot_path, failed_selector, page_url)
    
    if analysis and analysis.get("success"):
        context = f"""
Visual Analysis from Screenshot:
{analysis.get('analysis', 'No analysis available')}
"""
        return context
    
    return ""
