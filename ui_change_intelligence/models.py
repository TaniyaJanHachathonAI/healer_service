from pydantic import BaseModel

class ArtifactInput(BaseModel):
    baseline_html: str
    baseline_image: str
    current_html: str
    current_image: str
