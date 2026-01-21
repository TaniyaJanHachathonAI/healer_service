from fastapi import FastAPI
from fastapi.responses import HTMLResponse
import pathlib


app = FastAPI(
    title="Demo App for UI Change Intelligence",
    description="UI Change Intelligence Demo App",
    version="1.0.0"
)

@app.get("/baseline/login")
def baseline():
    html = pathlib.Path("baseline/login.html").read_text()
    return HTMLResponse(html)

@app.get("/current/login")
def current():
    html = pathlib.Path("current/login.html").read_text()
    return HTMLResponse(html)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=9003, reload=True)
