# bookrent


Table of contents

Prerequisites

Repo layout

Quick start (development)

1. Backend (Django) setup

2. Frontend setup

Environment variables

Database migrations & admin user

Authentication & CORS notes

Available API endpoints (examples)

Running tests (optional)

Deployment notes (brief)

Granting repo access (GitHub)

Extra credit ideas

Troubleshooting / FAQ

Prerequisites

Python 3.10+ (or your project Python version)

Node.js 18+ & npm / pnpm / yarn

Git

(Optional) PostgreSQL or use SQLite for quick local setup

(Recommended) venv for Python virtual environments

Repo layout (example)
.
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   └── book/                # app: models, views, utils (OpenLibrary), serializers
│
├── frontend/
│   ├── package.json
│   ├── src/
│   └── vite.config.ts
│
└── README.md


Adjust paths if your project uses a different layout. This README assumes backend/ and frontend/ dirs.

Quick start (development)

Follow these exact steps to get the project running locally.

1. Backend (Django) setup

Open a terminal in the repo backend/ folder.

Create + activate virtualenv

Linux / macOS (bash/zsh):

cd backend
python -m venv .venv
source .venv/bin/activate


Windows (PowerShell):

cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1

Install dependencies
pip install -r requirements.txt


If you don't have requirements.txt, create it with packages you'll need (example):

Django>=4.2
djangorestframework
django-cors-headers
requests
psycopg2-binary   # if using PostgreSQL
python-dotenv     # if you load .env files

Configure environment

Create a .env (or edit settings.py) in backend/. Example .env keys:

DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3            # or your postgres URI
CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000


If you use django-environ or python-dotenv, ensure settings.py loads these.

Migrations & runserver
# make migrations (if needed)
python manage.py makemigrations
python manage.py migrate

# create an admin user
python manage.py createsuperuser

# run dev server
python manage.py runserver


Server runs at http://127.0.0.1:8000/ by default.

2. Frontend setup

Open another terminal, go to frontend/.

cd frontend
npm install
npm run dev


Default dev host (Vite) usually http://localhost:3000 — ensure it matches CORS_ALLOWED_ORIGINS and CSRF_TRUSTED_ORIGINS in Django settings.

Environment variables (recommended)

Add an example .env.example in backend/:

# .env.example
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000


Copy to .env and fill secrets:

cp .env.example .env
# edit .env

Database migrations & admin user

Create + apply migrations:

python manage.py makemigrations
python manage.py migrate


Create superuser:

python manage.py createsuperuser


Visit admin at http://127.0.0.1:8000/admin/ and log in with the superuser.