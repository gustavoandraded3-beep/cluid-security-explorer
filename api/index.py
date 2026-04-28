from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io
import csv
from parser import parse_excel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Parse the Excel file and return ALL data in a single response.
    This works around Vercel's stateless serverless functions —
    the frontend stores the result in localStorage.
    """
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(400, "Only .xlsx files are supported")
    contents = await file.read()
    try:
        parsed = parse_excel(io.BytesIO(contents))
        return {
            "success": True,
            "data": parsed,          # full data returned here
            "summary": {
                "roles": len(parsed.get("roles", {})),
                "teams": len(parsed.get("teams", [])),
                "total_assignments": len(parsed.get("role_assignments", [])),
            }
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to parse file: {str(e)}")

@app.get("/api/health")
def health():
    return {"status": "ok"}
