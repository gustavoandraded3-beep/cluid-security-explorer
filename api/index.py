from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
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

DATA_STORE = {}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(400, "Only .xlsx files are supported")
    contents = await file.read()
    try:
        parsed = parse_excel(io.BytesIO(contents))
        DATA_STORE.clear()
        DATA_STORE.update(parsed)
        return {"success": True, "summary": {
            "roles": len(parsed.get("roles", {})),
            "teams": len(parsed.get("teams", [])),
            "total_assignments": len(parsed.get("role_assignments", [])),
        }}
    except Exception as e:
        raise HTTPException(500, f"Failed to parse file: {str(e)}")

@app.get("/api/data")
def get_all_data():
    if not DATA_STORE:
        raise HTTPException(404, "No data loaded")
    return DATA_STORE

@app.get("/api/roles")
def get_roles():
    return sorted(DATA_STORE.get("roles", {}).keys())

@app.get("/api/roles/{role_name}")
def get_role(role_name: str):
    roles = DATA_STORE.get("roles", {})
    if role_name not in roles:
        raise HTTPException(404, f"Role '{role_name}' not found")
    return roles[role_name]

@app.get("/api/teams")
def get_teams():
    return DATA_STORE.get("teams", [])

@app.get("/api/assignments")
def get_assignments():
    return DATA_STORE.get("role_assignments", [])

@app.get("/api/search")
def search(q: str = ""):
    if not q or not DATA_STORE:
        return {"roles": [], "teams": [], "assignments": []}
    q_lower = q.lower()
    roles = [r for r in DATA_STORE.get("roles", {}).keys() if q_lower in r.lower()]
    teams = [t for t in DATA_STORE.get("teams", []) if q_lower in t.get("name", "").lower()]
    assignments = [
        a for a in DATA_STORE.get("role_assignments", [])
        if q_lower in str(a.get("cluid_role", "")).lower()
        or q_lower in str(a.get("department", "")).lower()
        or q_lower in str(a.get("security_roles", "")).lower()
    ][:20]
    return {"roles": roles, "teams": teams, "assignments": assignments}

@app.get("/api/compare")
def compare_roles(role1: str, role2: str):
    roles = DATA_STORE.get("roles", {})
    for r in [role1, role2]:
        if r not in roles:
            raise HTTPException(404, f"Role '{r}' not found")
    r1, r2 = roles[role1], roles[role2]
    all_entities = sorted(set(list(r1["permissions"].keys()) + list(r2["permissions"].keys())))
    comparison = []
    for entity in all_entities:
        p1 = r1["permissions"].get(entity, {})
        p2 = r2["permissions"].get(entity, {})
        comparison.append({"entity": entity, "role1": p1, "role2": p2, "differs": p1 != p2})
    return {"role1": role1, "role2": role2, "comparison": comparison}

@app.get("/api/export/csv")
def export_csv(role: str = None):
    roles = DATA_STORE.get("roles", {})
    target = {role: roles[role]} if role and role in roles else roles
    rows = []
    for rname, rdata in target.items():
        for entity, perms in rdata.get("permissions", {}).items():
            rows.append({
                "Role": rname, "Entity": entity,
                "Create": perms.get("Create", ""), "Edit": perms.get("Edit", ""),
                "Read": perms.get("Read", ""), "Assign": perms.get("Assign", ""),
                "Delete": perms.get("Delete", ""), "Write": perms.get("Write", ""),
                "Append": perms.get("Append", ""), "Append To": perms.get("Append To", ""),
                "Share": perms.get("Share", ""),
            })
    output = io.StringIO()
    if rows:
        writer = csv.DictWriter(output, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    output.seek(0)
    filename = f"{role or 'all_roles'}_permissions.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
