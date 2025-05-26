# CBS_useman

A comprehensive user management system for the Computational Brain Sciences (CBS) server, replacing spreadsheet-based workflows.  
Features include: PI and sponsored user management, project and storage requests, audit trails, and automated billing.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Backend Setup (Django)](#backend-setup-django)
- [Frontend Setup (React)](#frontend-setup-react)
- [Development Workflow](#development-workflow)
- [API Overview](#api-overview)
- [Request System](#request-system)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Project Structure

```
CBS_userman/
├── accounts/                # Django app for user management
├── billing/                 # Django app for billing
├── cbs_useman_front/        # React frontend (Create React App)
├── src/                     # (legacy/migrated frontend code)
├── manage.py
├── pyproject.toml           # Python dependencies (use uv or pip)
├── db.sqlite3               # SQLite database (dev only, ignored in git)
├── README.md
└── ...
```

---

## Backend Setup (Django)

### Prerequisites

- Python 3.12+
- [uv](https://github.com/astral-sh/uv) (recommended) or pip
- SQLite (default, for development)

### Installation

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd CBS_userman
   ```

2. **Create and activate a virtual environment:**
   ```sh
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```sh
   uv pip install -r requirements.txt
   # or, if using pip:
   pip install -r requirements.txt
   ```

   *(If using `pyproject.toml`, run `uv pip install -r requirements.txt` after generating it with `uv pip compile`.)*

4. **Apply migrations:**
   ```sh
   python manage.py migrate
   ```

5. **Create a superuser (for admin access):**
   ```sh
   python manage.py createsuperuser
   ```

6. **Run the development server:**
   ```sh
   python manage.py runserver
   ```

   The API will be available at `http://localhost:8000/`.

---

## Frontend Setup (React)

### Prerequisites

- Node.js 18+
- npm

### Installation

1. **Navigate to the frontend directory:**
   ```sh
   cd cbs_useman_front
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Start the development server:**
   ```sh
   npm start
   ```

   The app will be available at `http://localhost:3000/`.

---

## Development Workflow

- **Backend:** Make changes in the `accounts/` or `billing/` apps. Use Django admin at `/admin/` for management.
- **Frontend:** Add or update React components in `cbs_useman_front/src/`.
- **API Integration:** Use the provided API endpoints to connect frontend forms to backend logic.

**Authentication:**  
- Uses Django authentication (local for dev, SSO in production).
- API requests require a Bearer token (stored in `localStorage` as `token`).

---

## API Overview

- **Submit a request:**  
  `POST /api/accounts/requests/`  
  Payload:  
  ```json
  {
    "request_type": "new_pi", // or "new_user", "user_update", "pi_update"
    "data": { ...form fields }
  }
  ```
- **List requests:**  
  `GET /api/accounts/requests/`  
  - Admins see all, users see their own.

- **Other endpoints:**  
  - `/api/accounts/test-login/` (for dev login)
  - `/api/accounts/test-create-user/` (for dev user creation)

---

## Request System

All user/project/storage/account requests are tracked in a single flexible model:
- Linked to the submitting user.
- Status: pending/approved/denied.
- Approval tracked via `approved_by`.
- All request data stored as JSON for flexibility.

**Frontend forms** are available for:
- New PI account requests (`/request/new-pi`)
- (Add more forms for other request types as needed.)

---

## Testing

- **Backend:**  
  Run Django tests with:
  ```sh
  python manage.py test
  ```

- **Frontend:**  
  Run React tests with:
  ```sh
  npm test
  ```

---

## Troubleshooting

- **Django not found?**  
  Make sure your virtual environment is activated.

- **Node/Webpack errors?**  
  Ensure Node.js is v18+ and use `--openssl-legacy-provider` if needed.

- **Database issues?**  
  Delete `db.sqlite3` and rerun migrations for a fresh start (dev only).

- **CORS/API issues?**  
  The backend is configured for open CORS in development. Adjust in `settings.py` for production.

---

## Contributing

- Commit in meaningful parts (backend, frontend, migrations, etc.).
- Do not commit `db.sqlite3` or `.venv/`.
- Track migrations in git.

---

## License

See [LICENSE](LICENSE).

---

*For questions or help, contact the CBS server admin team.*
