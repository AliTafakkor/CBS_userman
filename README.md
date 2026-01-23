# CBS_useman
User management system for CBS server

## Overview
CBS_useman is a comprehensive user and billing management system for CBS (Computational Biology Server) that manages Principal Investigators (PIs), sponsored users, projects, storage allocations, and automated billing.

## Key Features

### User Management
- **Principal Investigators (PIs)**: Faculty/staff who sponsor user accounts and own projects
- **Sponsored Users**: Users sponsored by PIs, assigned to projects
- **User Types**: `basic` and `poweruser`
- **User Roles**: Student, Staff, Faculty, External Collaborator
- **Department Organization**: Users organized by academic departments

### Project System
- **Projects**: Organizational units for users and storage allocations
- **Default Projects**: Automatically created when a PI account is created
- **Collaborative Projects**: Multiple PIs can share costs within a project
- **Speedcode Allocation**: Costs split across multiple speedcodes with percentage allocation
- All users (including PIs) must be assigned to a project
- Only PIs can create new projects

### Storage Management
- **Storage Types**:
  - Legacy (2018): $40 per TB per Year
  - OneFS (2025): $65 per TB per Year
- Storage allocated at project level
- Storage costs distributed across project speedcodes

### Billing System
- Automated billing cycle processing
- User billing based on account type and duration
- Storage billing based on allocation and storage type
- Cost distribution across multiple speedcodes per project
- Prorated billing for partial months
- Comprehensive billing history and audit trail

## Models

### Accounts App
- `Department`: Academic departments
- `Project`: Project container for users and storage
- `ProjectSpeedcode`: Speedcode allocations for cost splitting
- `PrincipalInvestigator`: PI accounts with default projects
- `SponsoredUser`: User accounts assigned to projects
- `UserChangeRecord`: Audit trail for user changes

### Billing App
- `BillingRate`: Monthly rates per user type
- `StorageType`: Storage types with rates (per TB per year)
- `StorageAllocation`: Storage allocated to projects
- `BillingCycle`: Billing periods
- `BillingRecord`: User billing records per cycle
- `StorageBillingRecord`: Storage billing records per cycle
- `SpeedcodeBillingAllocation`: Cost distribution across speedcodes

## API Endpoints

### Accounts
- `/api/accounts/departments/`
- `/api/accounts/projects/`
- `/api/accounts/project-speedcodes/`
- `/api/accounts/principal-investigators/`
- `/api/accounts/sponsored-users/`
- `/api/accounts/change-records/`

### Billing
- `/api/billing/rates/`
- `/api/billing/storage-types/`
- `/api/billing/storage-allocations/`
- `/api/billing/cycles/`
- `/api/billing/records/`

## Technology Stack
- **Backend**: Django + Django REST Framework
- **Frontend**: React + Material-UI
- **Database**: PostgreSQL (recommended) / SQLite (development)
- **Authentication**: OAuth2 (configured, SSO integration pending)

## Local Development Setup

### Prerequisites
- Python 3.8+ 
- Node.js 16+ and npm
- PostgreSQL (recommended) or SQLite for development
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CBS_useman
   ```

2. **Create and activate a virtual environment**
   ```bash
   python -m venv venv
   
   # On macOS/Linux:
   source venv/bin/activate
   
   # On Windows:
   venv\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install django djangorestframework django-cors-headers django-oauth-toolkit
   ```

4. **Configure database** (Optional - defaults to SQLite)
   
   For PostgreSQL, create a database and update `CBS_useman/settings.py`:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'cbs_useman',
           'USER': 'your_user',
           'PASSWORD': 'your_password',
           'HOST': 'localhost',
           'PORT': '5432',
       }
   }
   ```

5. **Create and run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create a superuser account**
   ```bash
   python manage.py createsuperuser
   ```

7. **Populate initial data (Optional)**
   
   Create storage types and billing rates via Django admin or API:
   - Storage Types: Legacy (2018) - $40/TB/year, OneFS (2025) - $65/TB/year
   - Billing Rates: basic, poweruser

8. **Run the development server**
   ```bash
   python manage.py runserver
   ```
   
   Backend will be available at: `http://localhost:8000`
   Admin panel at: `http://localhost:8000/admin`
   API endpoints at: `http://localhost:8000/api/`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd cbs_useman_front
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   The `.env` file should contain:
   ```
   REACT_APP_API_URL=http://localhost:8000/api
   ```

4. **Start the development server**
   ```bash
   npm start
   ```
   
   Frontend will open automatically at: `http://localhost:3000`

### Running Both Servers Concurrently

For convenience during development, run these commands in separate terminal windows:

**Terminal 1 - Backend:**
```bash
cd CBS_useman
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd CBS_useman/cbs_useman_front
npm start
```

### Accessing the Application

1. **Frontend**: Navigate to `http://localhost:3000`
2. **Backend API**: Access at `http://localhost:8000/api/`
3. **Admin Panel**: Access at `http://localhost:8000/admin/` (use superuser credentials)

### Default Test Login

For development, you can use the superuser account created during setup.

### API Documentation

Once the backend is running, you can explore the API at:
- Browsable API: `http://localhost:8000/api/`
- Accounts endpoints: `http://localhost:8000/api/accounts/`
- Billing endpoints: `http://localhost:8000/api/billing/`

### Common Development Tasks

**Reset database:**
```bash
python manage.py flush
python manage.py migrate
python manage.py createsuperuser
```

**Create new migrations after model changes:**
```bash
python manage.py makemigrations
python manage.py migrate
```

**Run tests:**
```bash
# Backend
python manage.py test

# Frontend
cd cbs_useman_front
npm test
```

**Build frontend for production:**
```bash
cd cbs_useman_front
npm run build
```

## Current Status
✅ Backend models and API complete
✅ Project system with cost splitting implemented
✅ Storage management system implemented
✅ Speedcode ownership validation enforced
✅ Billing logic with prorated calculations
✅ Frontend UI pages and components built
✅ Authentication flow implemented
✅ Routing and navigation complete
⚠️ Database migrations need to be created and run
⚠️ SSO authentication integration pending
⚠️ Additional form validations and tests needed

## Next Steps
1. Create and run database migrations
2. Populate initial data (storage types, billing rates, departments)
3. Test complete user workflows
4. Add comprehensive unit and integration tests
5. Implement SSO authentication
6. Add advanced reporting features
7. Deploy to production environment

