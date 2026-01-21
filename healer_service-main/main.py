# healer_service/main.py
import time
from fastapi import FastAPI, HTTPException, Query
from bs4 import BeautifulSoup
from typing import List, Dict, Any
from models import (
    HealRequest
)
from typing import List, Optional, Dict, Any
from logger import RequestLogger
from dom_extractor import DOMExtractor
from matching_engine  import MatchingEngine

app = FastAPI(
    title="Selector Healer Service",
    description="AI-powered selector healing service for test automation",
    version="1.0.0"
)



def build_custom_heal_response(
    engine_results: list,
    request_id: str,
    processing_time: float,
    vision_analyzed: bool = False,
    vision_analysis: Optional[Dict[str, Any]] = None
):
    candidates = []

    for r in engine_results:
        el = r["element"]

        candidates.append({
            "selector": r["suggested"],
            "score": round(float(r["score"]), 4),
            "base_score": round(float(r["base"]), 4),
            "attribute_score": round(float(r["attr"]), 4),
            "tag": el.get("tag"),
            "text": el.get("text") or el.get("accessible_name"),
            "xpath": el.get("xpath"),
        })

    debug_info = {
        "total_candidates": len(candidates),
        "engine": "matching_engine_faiss",
        "processing_time_ms": round(processing_time, 2),
        "vision_analyzed": vision_analyzed
    }
    
    if vision_analyzed and vision_analysis:
        debug_info["vision_model"] = vision_analysis.get("model_used")
        debug_info["vision_success"] = vision_analysis.get("success", False)

    return {
        "request_id": request_id,
        "message": "Success",
        "chosen": candidates[0]["selector"] if candidates else None,
        "candidates": candidates,
        "debug": debug_info
    }
# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.post("/heal")
async def heal(req: HealRequest):
    """Heal a single failing selector"""
    start_time = time.time()
    
    with RequestLogger("POST /heal", {"selector": req.failed_selector}) as req_logger:
        try:
            # Prepare DOM data for processing
            html_content = req.html  # Always preserve HTML for validation
            dom_data = None
            local_cands = []
            if req.semantic_dom:
                # Use provided semantic DOM (76% smaller!)
                # Generate candidates from semantic DOM elements
                extractor = DOMExtractor(html_content)
                dom_data = extractor.extract_semantic_dom(full_coverage=True)

                engine = MatchingEngine(dom_data['elements'])
                dom_data  = engine.rank(req.failed_selector, req.use_of_selector, top_k=2)
                processing_time = (time.time() - start_time) * 1000
                results = engine.rank(
                    req.failed_selector,
                    req.use_of_selector,
                    top_k=5
                )

                response = build_custom_heal_response(
                    engine_results=results,
                    request_id=req_logger.request_id,
                    processing_time=processing_time
                )

                return response
            
        except Exception as e:
            req_logger.log_error(f"Healing failed: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Healing failed: {str(e)}")    


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Healer Service...", extra={'request_id': 'system'})
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
