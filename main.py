from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI(title="EcoPulse α")

@app.get("/")
async def root():
    return {"message": "Welcome to EcoPulse α!"}

@app.post("/analyze")
async def analyze_product(file: UploadFile = File(None), url: str = None):
    # Dummy response for now
    eco_score = {"carbon": 80, "recyclability": 90, "sourcing": 85}
    return JSONResponse(content={"eco_score": eco_score, "alternatives": ["Use bamboo instead!"]})