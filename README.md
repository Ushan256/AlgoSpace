# AlgoSpace

Developer workspace web app with a React frontend, Django REST Framework backend, and SQLite database.

## Quick start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend runs at http://127.0.0.1:8000

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at http://localhost:3000 (proxies `/api` to the Django server).

## Features

- User registration and login with DRF token authentication
- Per-user document CRUD (markdown/code workspace)
- Code complexity analysis endpoint with SVG graph visualization

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register/` | Register user, returns token |
| POST | `/api/auth/login/` | Login, returns token |
| GET/POST | `/api/documents/` | List / create documents |
| GET/PATCH/DELETE | `/api/documents/{id}/` | Document detail |
| POST | `/api/analyze-code/` | Analyze code string |

Authenticated requests use header: `Authorization: Token <your-token>`
