# Clúid Security Explorer

Dynamics 365 Security Roles & Permissions Explorer — built with React + FastAPI, deployed on Vercel.

## Deploy

1. Push this repo to GitHub
2. Import on [vercel.com](https://vercel.com) → **Add New Project** → select the repo
3. No extra config needed — Vercel auto-detects from `vercel.json`
4. Click **Deploy**

## Usage

Upload your `Clúid_Security_Profiles_MASTERFILE.xlsx` on first load.

> **Note:** Vercel serverless functions are stateless — you'll need to re-upload the file each browser session.

## Local development

```bash
npm install
npm start          # frontend on :3000

cd api
pip install -r requirements.txt
uvicorn index:app --port 8000 --reload
```
