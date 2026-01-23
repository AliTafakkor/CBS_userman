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
- **Frontend**: React (in development)
- **Database**: PostgreSQL (recommended) / SQLite (development)
- **Authentication**: OAuth2 (configured, SSO integration pending)

## Setup Instructions

### Backend Setup
1. Create and activate virtual environment
2. Install dependencies: `pip install -r requirements.txt`
3. Run migrations: `python manage.py makemigrations && python manage.py migrate`
4. Create superuser: `python manage.py createsuperuser`
5. Run server: `python manage.py runserver`

### Frontend Setup
```bash
cd cbs_useman_front
npm install
npm start
```

## Current Status
✅ Backend models and API complete
✅ Project system with cost splitting implemented
✅ Storage management system implemented
✅ Billing logic with prorated calculations
⚠️ Frontend UI pages need to be built
⚠️ Database migrations need to be created and run
⚠️ SSO authentication integration pending

## Next Steps
1. Create and run database migrations
2. Build React frontend pages (Dashboard, PI Management, User Management, Billing Reports)
3. Integrate authentication flow
4. Add comprehensive tests
5. Deploy to production environment
