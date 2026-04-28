import pandas as pd
import re

STANDARD_ROLE_SHEETS = [
    "Housing Officer", "Housing Manager", "Contact Center Advisor",
    "Contact Center Manager", "Superuser", "Basic Role",
    "Finance Officer ARRP", "Finance Officer Role",
    "Estate Services Officer Permiss", "Estate Services Mgr Permissions",
    "Tenancy Management Mgr Permissi", "Tenancy Management Officer Perm",
    "ASB BoT Officer Permissions", "ASB BoT Manager Permissions",
    "Complaints Manager Permissions", "Complaints Officer Permissions",
]

ADMIN_ROLE_SHEETS = [
    "Cluid Account Admin", "Cluid Service Resp Admin",
    "Cluid Charge Level Admin", "Property Admin",
]

DISPLAY_NAMES = {
    "Estate Services Officer Permiss":  "Estate Services Officer",
    "Estate Services Mgr Permissions":  "Estate Services Manager",
    "Tenancy Management Mgr Permissi":  "Tenancy Management Manager",
    "Tenancy Management Officer Perm":  "Tenancy Management Officer",
    "ASB BoT Officer Permissions":      "ASB BoT Officer",
    "ASB BoT Manager Permissions":      "ASB BoT Manager",
    "Complaints Manager Permissions":   "Complaints Manager",
    "Complaints Officer Permissions":   "Complaints Officer",
    "Finance Officer Role":             "Finance Officer",
}

PERM_COLS_STANDARD = ["Create", "Edit", "Read", "Assign", "Delete"]
PERM_COLS_ADMIN    = ["Create", "Read", "Write", "Delete", "Append", "Append To", "Assign", "Share"]

def clean_val(v):
    if pd.isna(v) or v is None:
        return ""
    s = str(v).strip()
    return "" if s.lower() in ("nan", "none", "") else s

def parse_perm(v):
    raw = clean_val(v)
    if not raw: return ""
    low = raw.lower().strip()

    if low in ("no", "false", "0", "no*"):
        return "No"

    # Business Unit variants
    if "business unit" in low or low == "business unit":
        return "Business Unit"

    # Own + Reportees variants
    if ("own" in low and "report" in low) or "reportees" in low:
        return "Yes - Own & Reportees"

    # Own records only
    if "own" in low:
        return "Yes - Own"

    # Plain yes
    if low in ("yes", "true", "1", "user"):
        return "Yes"

    return raw

def parse_standard_sheet(df):
    if df.empty or len(df.columns) < 2:
        return {}
    entity_col = df.columns[0]
    cols = [c for c in PERM_COLS_STANDARD if c in df.columns]
    perms = {}
    for _, row in df.iterrows():
        entity = clean_val(row[entity_col])
        if not entity or entity.lower() in ("entity", "permissions", "permissions\nentity"):
            continue
        p = {col: parse_perm(row.get(col, "")) for col in cols}
        perms[entity] = {k: v for k, v in p.items() if v}
    return perms

def parse_admin_sheet(df):
    if df.empty or "Name" not in df.columns:
        return {}
    perms = {}
    for _, row in df.iterrows():
        name = clean_val(row.get("Name", ""))
        if not name: continue
        p = {col: parse_perm(row.get(col, "")) for col in PERM_COLS_ADMIN if col in df.columns}
        perms[name] = {k: v for k, v in p.items() if v}
    return perms

def compute_effective(permissions):
    eff = {
        "can_create": [], "can_edit": [], "can_read": [],
        "can_delete": [], "can_assign": [],
        "full_access_entities": [], "read_only_entities": [], "no_access_entities": [],
        "total_entities": len(permissions),
    }
    for entity, p in permissions.items():
        if p.get("Create"): eff["can_create"].append(entity)
        if p.get("Edit") or p.get("Write"): eff["can_edit"].append(entity)
        if p.get("Read"): eff["can_read"].append(entity)
        if p.get("Delete"): eff["can_delete"].append(entity)
        if p.get("Assign"): eff["can_assign"].append(entity)
        if not p:
            eff["no_access_entities"].append(entity)
        elif p.get("Read") and not p.get("Create") and not p.get("Edit") and not p.get("Write"):
            eff["read_only_entities"].append(entity)
        elif len(p) >= 3:
            eff["full_access_entities"].append(entity)
    return eff

def parse_teams(df):
    """
    Two-pass approach:
    Pass 1 — collect member counts from [INFO] Group: IPC_xxx - Members: N lines
    Pass 2 — collect real teams from rows 0-14 that have an IPC group ref in col2
    """
    if df.empty:
        return []

    # Pass 1: member_map  IPC_key -> count
    member_map = {}
    for _, row in df.iterrows():
        v = str(row.iloc[0]).strip()
        m = re.match(r'\[INFO\]\s*Group:\s*(IPC_\S+?)\s*-\s*Members:\s*(\d+)', v)
        if m:
            member_map[m.group(1)] = int(m.group(2))

    SKIP_START = [
        'Originally we requested', 'Role Based Security', 'Notes:',
        'Group name will be', 'Team Definitions', '[INFO]',
    ]

    teams = []
    for _, row in df.iterrows():
        name = str(row.iloc[0]).strip()
        col2 = str(row.iloc[2]).strip() if len(df.columns) > 2 else ''

        if not name or name == 'nan': continue
        if any(name.startswith(p) for p in SKIP_START): continue

        # Only rows that reference an IPC group are real teams
        ipc_m = re.search(r'(IPC_\S+)', col2)
        if not ipc_m:
            continue

        ipc_key = ipc_m.group(1).rstrip()

        # Resolve truncated IPC keys: pick the shortest key that starts with ipc_key
        if ipc_key not in member_map:
            candidates = sorted([k for k in member_map if k.startswith(ipc_key)], key=len)
            if candidates:
                ipc_key = candidates[0]

        count = member_map.get(ipc_key)
        teams.append({"name": name, "ipc_key": ipc_key, "members": count})

    teams.sort(key=lambda t: t["name"])
    return teams

def parse_role_assignments(df):
    if df.empty:
        return []
    records = []
    for _, row in df.iterrows():
        division     = clean_val(row.get("Division", ""))
        dept         = clean_val(row.get("Cluid Department", ""))
        cluid_role   = clean_val(row.get("Cluid Role", ""))
        activities   = clean_val(row.get("Key Activity Headlines / Core Entities Acccessed", ""))
        profile_team = clean_val(row.get("Security Profile/Teams", ""))
        sec_roles    = clean_val(row.get("Security Roles", ""))
        ipc_group    = clean_val(row.get("IPC Group", ""))
        comments     = clean_val(row.get("Comments", ""))
        if cluid_role or dept:
            records.append({
                "division": division, "department": dept, "cluid_role": cluid_role,
                "activities": activities, "profile_team": profile_team,
                "security_roles": sec_roles, "ipc_group": ipc_group, "comments": comments,
            })
    return records

def build_used_by_index(role_assignments):
    index = {}
    for a in role_assignments:
        for rn in [r.strip() for r in a.get("security_roles", "").split(",") if r.strip()]:
            index.setdefault(rn, []).append({
                "cluid_role":   a.get("cluid_role", ""),
                "department":   a.get("department", ""),
                "profile_team": a.get("profile_team", ""),
                "ipc_group":    a.get("ipc_group", ""),
            })
    return index

def parse_excel(file_buf):
    xl = pd.ExcelFile(file_buf)
    sheet_names = xl.sheet_names

    roles = {}

    for sheet in STANDARD_ROLE_SHEETS:
        if sheet not in sheet_names: continue
        df = pd.read_excel(xl, sheet_name=sheet)
        perms = parse_standard_sheet(df)
        display = DISPLAY_NAMES.get(sheet, sheet)
        roles[display] = {"name": display, "sheet": sheet, "permissions": perms, "perm_type": "standard"}

    for sheet in ADMIN_ROLE_SHEETS:
        if sheet not in sheet_names: continue
        df = pd.read_excel(xl, sheet_name=sheet)
        if df.empty:
            roles[sheet] = {"name": sheet, "sheet": sheet, "permissions": {}, "perm_type": "admin",
                            "note": "Sheet exists but has no data configured yet."}
            continue
        perms = parse_admin_sheet(df)
        if perms:
            roles[sheet] = {"name": sheet, "sheet": sheet, "permissions": perms, "perm_type": "admin"}

    teams = []
    if "Security Groups & Teams" in sheet_names:
        df = pd.read_excel(xl, sheet_name="Security Groups & Teams")
        teams = parse_teams(df)

    role_assignments = []
    if "Role Assignments" in sheet_names:
        df = pd.read_excel(xl, sheet_name="Role Assignments")
        role_assignments = parse_role_assignments(df)

    if "deleted.." in sheet_names:
        df_del = pd.read_excel(xl, sheet_name="deleted..")
        if not df_del.empty:
            for _, row in df_del.iterrows():
                dept         = clean_val(row.iloc[0]) if len(row) > 0 else ""
                cluid_role   = clean_val(row.iloc[1]) if len(row) > 1 else ""
                profile_team = clean_val(row.iloc[3]) if len(row) > 3 else ""
                sec_roles    = clean_val(row.iloc[4]) if len(row) > 4 else ""
                if cluid_role:
                    role_assignments.append({
                        "division": "", "department": dept, "cluid_role": cluid_role,
                        "activities": "", "profile_team": profile_team,
                        "security_roles": sec_roles, "ipc_group": "", "comments": "(archived)",
                    })

    used_by_index = build_used_by_index(role_assignments)
    for rname, rdata in roles.items():
        rdata["used_by"] = used_by_index.get(rname, [])
        rdata["effective"] = compute_effective(rdata["permissions"])

    general_info = []
    if "General" in sheet_names:
        df = pd.read_excel(xl, sheet_name="General")
        for _, row in df.iterrows():
            team = clean_val(row.iloc[0]) if len(df.columns) > 0 else ""
            desc = clean_val(row.iloc[1]) if len(df.columns) > 1 else ""
            if team:
                general_info.append({"team": team, "description": desc})

    field_security = []
    if "Field Security" in sheet_names:
        df = pd.read_excel(xl, sheet_name="Field Security")
        if not df.empty:
            for _, row in df.iterrows():
                entity          = clean_val(row.iloc[0]) if len(row) > 0 else ""
                entity_specific = clean_val(row.iloc[1]) if len(row) > 1 else ""
                field           = clean_val(row.iloc[2]) if len(row) > 2 else ""
                if entity and field:
                    entry = {"entity": entity, "entity_specific": entity_specific, "field": field}
                    for i, col in enumerate(df.columns[3:], 3):
                        entry[str(col)] = clean_val(row.iloc[i]) if i < len(row) else ""
                    field_security.append(entry)

    return {
        "roles": roles,
        "teams": teams,
        "role_assignments": role_assignments,
        "general_info": general_info,
        "field_security": field_security,
        "meta": {
            "total_roles": len(roles),
            "total_teams": len(teams),
            "total_assignments": len(role_assignments),
            "sheets_found": sheet_names,
        }
    }
