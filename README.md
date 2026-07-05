# Arroyo Systems — Corporate Website + Admin

Production-ready full-stack web application for **Arroyo Systems** (Engineering
for Machined Components).

- **Frontend:** React 19 (Create React App / craco) + Tailwind + shadcn/ui
- **Backend:** FastAPI + Motor (async MongoDB driver) + JWT auth
- **Database:** MongoDB (works locally or on MongoDB Atlas)

Features:

- Public marketing site (Hero, Approach, Decisions, Capabilities, Products,
  Contact) — fully responsive (desktop / tablet / mobile).
- Native contact form persisting submissions to MongoDB.
- Password-protected admin dashboard at `/admin` to manage messages (search,
  mark read/unread, delete, export CSV).
- JWT-based auth, token stored in `sessionStorage`.

---

## Repository layout

```
.
├── backend/                # FastAPI application
│   ├── server.py
│   ├── requirements.txt
│   ├── Procfile            # For Railway / Heroku-compatible platforms
│   ├── .env.example
│   └── .gitignore
├── frontend/               # React application
│   ├── src/
│   ├── package.json
│   ├── vercel.json         # Vercel configuration
│   ├── .env.example
│   └── .gitignore
├── render.yaml             # Render (backend) blueprint
├── netlify.toml            # Netlify (frontend) config
├── .gitignore
└── README.md
```

The frontend and backend are **completely independent**: they only talk to
each other over HTTPS using the URL set in `REACT_APP_BACKEND_URL`. You can
deploy them to different providers (recommended).

---

## Local development

**Requirements:** Node 20+, Python 3.11+, MongoDB running locally (or an
Atlas connection string).

### Backend

```bash
cd backend
cp .env.example .env         # then edit values
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

On first startup an admin user is seeded from `ADMIN_USERNAME` /
`ADMIN_PASSWORD`.

### Frontend

```bash
cd frontend
cp .env.example .env         # set REACT_APP_BACKEND_URL=http://localhost:8001
yarn install
yarn start
```

Open <http://localhost:3000>.

---

## Environment variables

### Backend (`backend/.env`)

| Variable         | Required | Example                                                              | Description                                          |
| ---------------- | -------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| `MONGO_URL`      | Yes      | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true`      | MongoDB connection string                            |
| `DB_NAME`        | Yes      | `arroyo_systems`                                                     | Database name                                        |
| `CORS_ORIGINS`   | Yes      | `https://arroyo-systems.com,https://www.arroyo-systems.com`          | Allowed origins (or `*` while testing)               |
| `JWT_SECRET`     | Yes      | 48+ random bytes url-safe                                            | Token signing secret. **Rotate on deploy.**          |
| `ADMIN_USERNAME` | Yes      | `arroyo_admin`                                                       | Initial admin username (seed on first boot)          |
| `ADMIN_PASSWORD` | Yes      | 24+ chars strong password                                            | Initial admin password (seed on first boot)          |

Generate a strong `JWT_SECRET`:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### Frontend (`frontend/.env`)

| Variable                | Required | Example                            | Description                    |
| ----------------------- | -------- | ---------------------------------- | ------------------------------ |
| `REACT_APP_BACKEND_URL` | Yes      | `https://api.arroyo-systems.com`   | Public URL of the backend API  |

> ⚠️ **Never commit `.env` files.** They are ignored by `.gitignore`. Use the
> deployment platforms' dashboards or CLIs to set env vars.

---

## Deployment

Recommended split:

| Component | Provider(s)              | URL example                       |
| --------- | ------------------------ | --------------------------------- |
| Frontend  | Vercel (preferred) or Netlify | `https://arroyo-systems.com`     |
| Backend   | Render or Railway         | `https://api.arroyo-systems.com` |
| Database  | MongoDB Atlas            | `mongodb+srv://…`                 |

### 1. MongoDB Atlas

1. Create a free account at <https://www.mongodb.com/atlas>.
2. Create a **Shared** cluster (M0 free tier is enough to start).
3. **Database Access → Add user:** create a user with password. Grant
   `readWrite` on the database you'll use.
4. **Network Access → Add IP:** allow `0.0.0.0/0` (from any IP) while
   testing. For hardening, restrict later to Render/Railway egress ranges.
5. Get the connection string (**Connect → Drivers → Python**). It looks like:

   ```
   mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```

   Store this — it goes into `MONGO_URL` on the backend host.

### 2. Backend on Render (blueprint-based)

The included `render.yaml` at the repo root describes the service.

1. Push this repository to GitHub.
2. Go to <https://render.com/dashboard> → **New +** → **Blueprint**.
3. Connect your GitHub repo. Render reads `render.yaml` and proposes the
   service `arroyo-systems-api`.
4. When prompted, set the following env vars (Render generates `JWT_SECRET`
   automatically because of `generateValue: true`):
   - `MONGO_URL` — from MongoDB Atlas step above
   - `DB_NAME` — e.g. `arroyo_systems`
   - `CORS_ORIGINS` — e.g. `https://arroyo-systems.com,https://www.arroyo-systems.com`
   - `ADMIN_USERNAME` — e.g. `arroyo_admin`
   - `ADMIN_PASSWORD` — a strong password (24+ chars)
5. Deploy. Render assigns a URL like `https://arroyo-systems-api.onrender.com`.
   Test it: `curl https://arroyo-systems-api.onrender.com/api/` → should
   return `{"service":"Arroyo Systems API","status":"ok"}`.

### 2. Backend on Railway (alternative)

Railway auto-detects Python and reads `backend/Procfile`.

1. Push repo to GitHub.
2. Go to <https://railway.app> → **New Project** → **Deploy from GitHub**.
3. Choose the repo. In the service settings, set **Root Directory** to
   `backend`.
4. Add the env vars listed above (MONGO_URL, DB_NAME, CORS_ORIGINS,
   JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD).
5. Railway assigns a URL like `https://arroyo-systems-api.up.railway.app`.

### 3. Frontend on Vercel

Vercel automatically picks up `frontend/vercel.json`.

1. Push repo to GitHub.
2. Go to <https://vercel.com/new> → **Import Git Repository**.
3. Select the repo. **Root Directory** → `frontend`. Framework preset →
   Create React App (auto-detected).
4. **Environment Variables** → add:
   - `REACT_APP_BACKEND_URL` = your backend URL from step 2
     (e.g. `https://arroyo-systems-api.onrender.com` or later
     `https://api.arroyo-systems.com`)
5. Deploy. Vercel gives you a URL like
   `https://arroyo-systems.vercel.app`.

Whenever `REACT_APP_BACKEND_URL` changes, you must trigger a redeploy on
Vercel (React inlines env vars at build time).

### 3. Frontend on Netlify (alternative)

The included `netlify.toml` handles the build.

1. Push repo to GitHub.
2. Go to <https://app.netlify.com/start> → **Import from Git**.
3. Select the repo. Netlify reads `netlify.toml` (base = `frontend`, build =
   `yarn build`, publish = `frontend/build`).
4. **Site settings → Environment variables**:
   - `REACT_APP_BACKEND_URL` = your backend URL
5. Deploy.

---

## Custom domain: arroyo-systems.com

Suggested setup:

| Hostname                  | Points to      |
| ------------------------- | -------------- |
| `arroyo-systems.com`      | Frontend host  |
| `www.arroyo-systems.com`  | Frontend host  |
| `api.arroyo-systems.com`  | Backend host   |

### Frontend (Vercel)

1. Vercel project → **Settings → Domains** → **Add** → enter
   `arroyo-systems.com` and `www.arroyo-systems.com`.
2. Vercel shows DNS records to add at your registrar. Typically:
   - `A` record on `@` → `76.76.21.21` (Vercel anycast IP shown in the UI)
   - `CNAME` on `www` → `cname.vercel-dns.com`
3. Wait for DNS to propagate (few minutes to a few hours). Vercel
   auto-provisions HTTPS via Let's Encrypt.

### Frontend (Netlify) — alternative

1. Netlify → **Domain settings → Add custom domain**.
2. Add both `arroyo-systems.com` and `www.arroyo-systems.com`.
3. Point DNS at your registrar:
   - `ALIAS`/`ANAME` on `@` → `apex-loadbalancer.netlify.com`
     (or `A` records shown in the UI)
   - `CNAME` on `www` → `<your-site>.netlify.app`
4. HTTPS is enabled automatically.

### Backend

1. On Render → project → **Settings → Custom Domains → Add**:
   `api.arroyo-systems.com`. Render shows a CNAME target
   (`<service>.onrender.com`).
2. At your registrar add:
   - `CNAME` on `api` → `<service>.onrender.com` (Render) **or**
     `<service>.up.railway.app` (Railway).
3. Once DNS propagates, update:
   - `REACT_APP_BACKEND_URL` on Vercel/Netlify → `https://api.arroyo-systems.com`
   - `CORS_ORIGINS` on Render/Railway →
     `https://arroyo-systems.com,https://www.arroyo-systems.com`
4. Trigger a redeploy on both sides.

---

## Pushing the repo to GitHub

```bash
# From the project root
git init                     # (skip if already a git repo)
git add .
git commit -m "Initial commit: Arroyo Systems full-stack app"
git branch -M main

# Create an empty repo on GitHub first, then:
git remote add origin git@github.com:<your-org>/arroyo-systems.git
git push -u origin main
```

**Before pushing, double-check that no `.env` file is staged:**

```bash
git status
git ls-files | grep -E "\\.env(\\.|$)"
# Only .env.example files should appear. If .env shows up, remove it:
# git rm --cached backend/.env frontend/.env
```

---

## Rotating admin credentials in production

1. Update `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars on the backend host.
2. Connect to MongoDB Atlas (Compass or `mongosh`) and drop the existing
   record:

   ```js
   use arroyo_systems
   db.admin_users.deleteMany({})
   ```

3. Restart the backend service → it will re-seed the admin from the new
   env vars.

Rotating `JWT_SECRET` invalidates all existing tokens (users get logged
out) — no DB action needed.

---

## Post-deploy sanity checklist

- [ ] `GET https://api.arroyo-systems.com/api/` returns
      `{"service":"Arroyo Systems API","status":"ok"}`
- [ ] `POST https://api.arroyo-systems.com/api/contact` with a valid body
      returns `201`
- [ ] `https://arroyo-systems.com` loads and all sections render
- [ ] Contact form on the site successfully submits and shows the success
      card (verify a new document appears in MongoDB Atlas)
- [ ] `https://arroyo-systems.com/admin` login page loads
- [ ] Login with the production credentials, dashboard shows the message
- [ ] HTTPS is active (padlock) on both domains
- [ ] `CORS_ORIGINS` on the backend does NOT include `*` in production

---

## License

Proprietary — © Arroyo Systems.
