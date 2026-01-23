# CBS_useman - Quick Start Guide

## 🚀 Quick Start for Local Development

### 1. Backend Setup (5 minutes)

```bash
# From project root
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create database and superuser
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Start backend server
python manage.py runserver
```

Backend runs at: http://localhost:8000

### 2. Frontend Setup (3 minutes)

```bash
# In a new terminal window
cd cbs_useman_front
npm install
npm start
```

Frontend runs at: http://localhost:3000

### 3. Initial Data Setup

Access Django Admin at http://localhost:8000/admin and create:

**Storage Types:**
- Legacy (2018): rate_per_tb_per_year = 40.00
- OneFS (2025): rate_per_tb_per_year = 65.00

**Billing Rates:**
- basic: rate_per_month = [your rate]
- poweruser: rate_per_month = [your rate]

**Departments:**
- Create at least one department

## 📁 Project Structure

```
CBS_useman/
├── accounts/              # User management app
│   ├── models.py         # PI, User, Project models
│   ├── views.py          # API views
│   ├── serializers.py    # DRF serializers
│   └── urls.py           # API routes
├── billing/              # Billing management app
│   ├── models.py         # Billing, Storage models
│   ├── views.py          # Billing API
│   └── urls.py           # Billing routes
├── CBS_useman/           # Django project settings
├── cbs_useman_front/     # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Application pages
│   │   ├── contexts/     # React contexts
│   │   └── services/     # API services
│   └── package.json
└── requirements.txt      # Python dependencies
```

## 🔑 Key Features

### User Management
- Create and manage Principal Investigators (PIs)
- Create sponsored user accounts
- Assign users to projects
- Track user changes with audit log

### Project System
- Each PI gets a default project automatically
- PIs can create additional projects
- Projects can have multiple collaborating PIs
- Speedcodes tied to specific PIs
- Cost splitting across multiple speedcodes

### Storage Management
- Two storage types with different rates
- Allocate storage to projects
- Track storage usage

### Billing
- Automated billing cycle processing
- Prorated billing for partial periods
- Cost distribution across speedcodes
- User and storage billing

## 🌐 Available Pages

- **Dashboard** - Overview statistics
- **Departments** - Department management
- **Projects** - Project listing
- **Principal Investigators** - PI management with forms
- **Sponsored Users** - User management with forms
- **Storage** - Storage allocation management
- **Billing Cycles** - Billing cycle management
- **Reports** - Report generation (placeholder)

## 🔧 Common Commands

### Backend
```bash
# Create migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test

# Access Django shell
python manage.py shell
```

### Frontend
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 📝 API Endpoints

### Accounts
- GET/POST `/api/accounts/departments/`
- GET/POST `/api/accounts/projects/`
- GET/POST `/api/accounts/principal-investigators/`
- GET/POST `/api/accounts/sponsored-users/`
- GET `/api/accounts/change-records/`

### Billing
- GET/POST `/api/billing/rates/`
- GET/POST `/api/billing/storage-types/`
- GET/POST `/api/billing/storage-allocations/`
- GET/POST `/api/billing/cycles/`
- POST `/api/billing/cycles/{id}/generate_billing/`

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Backend (change port)
python manage.py runserver 8001

# Frontend (change port in prompt or set PORT env var)
PORT=3001 npm start
```

**CORS errors:**
- Verify `django-cors-headers` is installed
- Check CORS settings in `settings.py`

**Database errors:**
- Ensure migrations are up to date: `python manage.py migrate`
- Check database configuration in `settings.py`

## 📚 Next Steps

1. ✅ Run migrations
2. ✅ Create superuser
3. ✅ Add initial data (departments, storage types, rates)
4. ✅ Create a PI account
5. ✅ Create a project
6. ✅ Add sponsored users
7. ✅ Test billing cycle generation

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Commit with descriptive messages
5. Push and create pull request

---

For detailed information, see the main [README.md](README.md)
