<div align="center">

# 🧠 TrackMind

### AI-powered study notes tracker with smart coaching, streak tracking, and offline support.

[![Live App](https://img.shields.io/badge/🌐%20Live%20App-trackmindnotes.netlify.app-a671f5?style=for-the-badge)](https://trackmindnotes.netlify.app/)
[![GitHub](https://img.shields.io/badge/📂%20GitHub-amanmehta276%2FTrackmind-24292e?style=for-the-badge&logo=github)](https://github.com/amanmehta276/Trackmind)

</div>

---

## 📖 What is TrackMind?

TrackMind helps students log their study sessions and get **instant AI coaching** on what they studied — what went well, what to improve, and what to focus on next. You can write your notes or even upload a photo of your textbook or whiteboard, and the AI will analyse it.

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 📝 | **Smart Notes** | Write study notes and get AI feedback instantly |
| 📸 | **Vision Mode** | Upload a photo of notes/textbook — AI reads and analyses it |
| 📊 | **Stats Dashboard** | Track total notes, weekly activity, and daily study streak |
| 🔐 | **Auth System** | Secure signup/login with JWT tokens and bcrypt hashing |
| 📱 | **PWA** | Installable on any device, works offline |
| 🌙 | **Dark / Light Mode** | Fully themed UI with smooth transitions |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Python, Flask, Flask-CORS |
| **Database** | MongoDB Atlas (PyMongo) |
| **Auth** | JWT (PyJWT) + bcrypt |
| **AI** | Groq API — `llama-3.1-8b-instant` (text), `llama-4-scout-17b` (vision) |
| **Hosting** | Frontend → Netlify · Backend → Render (Gunicorn) |
| **PWA** | Service Worker + Web App Manifest |

---

## 🗂️ Project Structure

```
TrackMind/
│
├── backend/                        # Flask REST API
│   ├── app.py                      # Entry point — registers all blueprints
│   ├── config.py                   # Loads secrets from .env
│   ├── database.py                 # MongoDB Atlas connection
│   ├── middleware.py               # @token_required JWT auth guard
│   ├── Procfile                    # Gunicorn command for deployment
│   ├── requirements.txt            # Python dependencies
│   ├── .env                        # 🔒 Secret keys (DO NOT commit)
│   │
│   ├── models/
│   │   └── study_log.py            # Study log document factory
│   │
│   ├── routes/
│   │   ├── auth_routes.py          # /api/auth/signup  /api/auth/login
│   │   ├── note_routes.py          # /api/notes  (CRUD + stats)
│   │   └── log_routes.py           # Legacy log routes
│   │
│   ├── services/
│   │   └── groq_service.py         # Groq AI — text + vision analysis
│   │
│   └── utils/
│       └── revision_scheduler.py
│
└── frontend/                       # Static site (Netlify)
    ├── index.html                  # Login / Signup page
    ├── dashboard.html              # Main app after login
    ├── style.css                   # Global styles + dark/light theme
    ├── auth.js                     # Login/signup form logic
    ├── script.js                   # Core app logic
    ├── dashboard.js                # Dashboard interactions
    ├── site.webmanifest            # PWA config (name, icons, colors)
    ├── sw.js                       # Service worker — offline + caching
    └── [icons]                     # 192px, 512px, apple-touch-icon, favicon
```

---

## ⚙️ API Reference

### 🔑 Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login — returns JWT token |

### 📒 Notes &nbsp;*(Bearer token required)*

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/notes` | Save a note + get AI feedback |
| `GET` | `/api/notes` | Get all notes for logged-in user |
| `GET` | `/api/notes/stats` | Total notes, weekly count, streak |
| `DELETE` | `/api/notes/<note_id>` | Delete a specific note |

---

## 🚀 Running Locally

### 1. Clone the repo

```bash
git clone https://github.com/amanmehta276/Trackmind.git
cd Trackmind
```

### 2. Set up the backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file inside `/backend`:

```env
MONGO_URI=your_mongodb_atlas_connection_string
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=any_long_random_secret_string
```

Start the server:

```bash
python app.py
# API runs at http://localhost:5000
```

### 3. Run the frontend

Open `frontend/index.html` directly in a browser, or use a local server:

```bash
cd frontend
npx serve .
```

> ⚠️ **PWA Install Note:** The "Install App" button only appears when the site is served over **HTTPS** (or `localhost`). It will not show on a plain `http://` address.

---

## 🤖 How the AI Works

Every time you save a note, `groq_service.py` sends it to Groq with a fixed system prompt. The AI always replies in this exact structure:

```
1. Summary          → What you studied (2–3 sentences)
2. Strengths        → What you did well
3. Areas to Improve → Gaps in your understanding
4. Action Plan      → What to focus on next session
```

If you attach an **image**, the vision model (`llama-4-scout-17b`) first describes what it sees in the photo, then gives the full coaching analysis.

---

## 🔒 Security

- Passwords hashed with **bcrypt** (never stored in plain text)
- JWT tokens expire after **7 days**
- Every notes route is protected by the `@token_required` middleware
- Add `.env` to your `.gitignore` — never push secret keys to GitHub

---

## 📦 Deployment

### Backend → Render

1. Push backend to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set environment variables in the Render dashboard: `MONGO_URI`, `GROQ_API_KEY`, `JWT_SECRET`
4. Render uses the `Procfile` to start with `gunicorn app:app`

### Frontend → Netlify

1. Drag and drop the `frontend/` folder to [Netlify](https://netlify.com), or connect your GitHub repo
2. Make sure `site.webmanifest` has the correct `start_url` and `scope` matching your Netlify domain

---

## 👨‍💻 Built By

**Aman Mehta** — Project Karakoram
