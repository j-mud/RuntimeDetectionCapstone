# Runtime Malware & Phishing Detection System

A web application that detects malicious URLs (phishing, malware, defacement) using ensemble machine learning models with explainability powered by SHAP, LIME, and an LLM (OpenAI).

---

## For graders — read this first

**Canonical repo:** `mialfadda/RuntimeDetectionCapstoneGitHub`, **`master` branch**
(not `main` — that's old ML-only history; not `integration` — that PR is already merged)

The model files are tracked with **Git LFS**. If you clone without LFS installed first, the models come down as broken pointer stubs and the app will fail with errors like `KeyError: 118`. Install LFS before cloning — it's a one-time setup.

### Clone & verify

```bash
# 1. Install Git LFS (one-time)
#    macOS:   brew install git-lfs
#    Ubuntu:  sudo apt install git-lfs
#    Windows: choco install git-lfs
git lfs install

# 2. Clone the canonical repo (master is the latest)
git clone https://github.com/mialfadda/RuntimeDetectionCapstoneGitHub.git
cd RuntimeDetectionCapstoneGitHub

# 3. Safety net — make sure model files actually came down
git lfs pull
```

### Confirm the models loaded correctly

```bash
pytest tests/
```

Expected: **17/17 passing**. These tests load the real model binaries (no dataset needed). If all pass, LFS worked and the ensemble is intact. You do **not** need the training CSV to run scans — it is gitignored and only needed for retraining.

### Run locally (no Railway needed)

> Use **Python 3.11**. Python 3.13+ breaks `psycopg2` locally.

```bash
# Backend — Terminal 1
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py                       # → http://localhost:5000

# Dashboard — Terminal 2
cd dashboard
npm install
npm run dev                         # → http://localhost:5174
```

---

The system has three components that run together:

| Component | What it is | URL |
|-----------|-----------|-----|
| Flask Backend | REST API — handles scans, auth, ML inference | http://localhost:5000 |
| Frontend | User-facing app — submit URLs, view detections | http://localhost:5173 |
| Dashboard | Admin analytics — threat metrics, model management | http://localhost:5174 |

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

---

## Step 1 — Configure environment

Copy the example below into a file named `.env` in the project root (it already exists in this repo — just fill in the values):

```
FLASK_APP=run.py
FLASK_ENV=development

SECRET_KEY=change-this-to-a-random-string
JWT_SECRET_KEY=change-this-to-another-random-string

DATABASE_URL=sqlite:///capstone.db

OPENAI_API_KEY=sk-...your-openai-key-here...
```

> `OPENAI_API_KEY` is required for LLM-generated scan summaries. Without it the system falls back to template summaries.

---

## Step 2 — Install Python dependencies

```bash
pip3 install -r requirements.txt
```

---

## Step 3 — Initialise the database (first time only)

```bash
python3 -c "
from app import create_app
from app.database.models import db
app = create_app()
with app.app_context():
    db.create_all()
print('Done')
"
```

---

## Step 4 — Start the Flask backend

Open a terminal in the project root and run:

```bash
python3 run.py
```

Expected output:

```
 * Serving Flask app 'app'
 * Running on http://127.0.0.1:5000
```

To verify it is healthy:

```bash
curl http://localhost:5000/health
# {"service":"RUNTIME MALWEB DETECTOR","status":"healthy"}
```

Keep this terminal open. The frontend and dashboard both proxy API requests to port 5000.

---

## Step 5 — Start the Frontend

Open a **second terminal**:

```bash
cd frontend
npm install        # first time only
npm run dev
```

Expected output:

```
VITE ready in ...ms
➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

- Register a new account (or log in if you already have one)
- Paste any URL into the scan box and submit
- View the detection result, risk level, confidence score, and LLM explanation

---

## Step 6 — Start the Dashboard

Open a **third terminal**:

```bash
cd dashboard
npm install        # first time only
npm run dev
```

Expected output:

```
VITE ready in ...ms
➜  Local:   http://localhost:5174/
```

Open **http://localhost:5174** in your browser.

The dashboard shows:
- Threat metrics and scan counts
- Breakdown by threat category (phishing / malware / defacement / benign)
- Active ML model versions
- Generated reports (downloadable as PDF/CSV)
- Admin tools: user management, model upload/rollback, audit log

> Log in with the same credentials you created on the frontend.

---

## Summary — three terminals

```
Terminal 1 (project root):   python3 run.py          → http://localhost:5000
Terminal 2 (frontend/):      npm run dev             → http://localhost:5173
Terminal 3 (dashboard/):     npm run dev             → http://localhost:5174
```

Use **http://localhost:5173** for scanning URLs.  
Use **http://localhost:5174** for analytics and admin.

---

## Stopping the servers

Press `Ctrl+C` in each terminal.

If port 5000 is already in use on restart:

```bash
lsof -ti :5000 | xargs kill -9
```

---

## Project structure

```
├── run.py                  # Flask entry point
├── .env                    # Environment variables (never commit secrets)
├── requirements.txt        # Python dependencies
├── app/
│   ├── api/                # REST endpoints (auth, scan, detections, dashboard, admin)
│   ├── database/           # SQLAlchemy models and persistence helpers
│   ├── explainability/     # SHAP, LIME, and LLM explainers
│   ├── interfaces/         # ML pipeline contract and adapters
│   ├── models/             # Trained ML model artifacts and ensemble logic
│   └── runtime/            # Feature extraction and URL analysis
├── frontend/               # React + Vite user app (port 5173)
├── dashboard/              # React + Vite admin dashboard (port 5174)
└── extension/              # Chrome browser extension source
```
