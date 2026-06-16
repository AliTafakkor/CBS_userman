"""
Account provisioning logic: creates real User + PI/SponsoredUser records
when an admin approves a Request.
"""
import secrets
import string
from datetime import date

from django.contrib.auth.models import User
from django.db import transaction

from .models import Department, PrincipalInvestigator, SponsoredUser, Project, ProjectSpeedcode


def _generate_username(first_name, last_name, email):
    """Derive a username; fall back to email prefix with suffix if taken."""
    base = email.split('@')[0].lower().replace('.', '_').replace('+', '_')
    if not User.objects.filter(username=base).exists():
        return base
    # Append a short random suffix
    suffix = ''.join(secrets.choice(string.digits) for _ in range(4))
    return f"{base}_{suffix}"


def _generate_password(length=16):
    alphabet = string.ascii_letters + string.digits + '!@#$%^&*'
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def _get_or_create_department(name):
    code = name.strip().upper()[:20]
    dept, _ = Department.objects.get_or_create(
        name=name.strip(),
        defaults={'code': code},
    )
    return dept


@transaction.atomic
def provision_pi(data):
    """
    Create a User + PrincipalInvestigator from approved new_pi request data.
    Returns (pi, temp_password) so the caller can communicate credentials.
    """
    email = data.get('uwo_email', '').strip()
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    department_name = data.get('department', 'Unknown').strip()
    contract_end = data.get('contract_end') or None
    projects_data = data.get('projects', [])
    existing_project_ids = data.get('existing_project_ids', [])

    if not email:
        raise ValueError("uwo_email is required")
    if not projects_data:
        raise ValueError("At least one project with a speedcode is required")

    # Create or retrieve the Django User
    if User.objects.filter(email=email).exists():
        user = User.objects.get(email=email)
        temp_password = None
    else:
        username = _generate_username(first_name, last_name, email)
        temp_password = _generate_password()
        user = User.objects.create_user(
            username=username,
            email=email,
            password=temp_password,
            first_name=first_name,
            last_name=last_name,
        )

    # If a PI already exists for this user, skip creation
    if PrincipalInvestigator.objects.filter(user=user).exists():
        raise ValueError(f"A PI account already exists for {email}")

    dept = _get_or_create_department(department_name)

    # Use the first project's speedcode as the PI's primary speedcode
    first_speedcode = projects_data[0].get('speedcode', '').strip()
    if not first_speedcode:
        raise ValueError("First project must have a speedcode")

    # Auto-generate employee_id (can be updated by admin later)
    employee_id = f"PI-{user.id:05d}"
    while PrincipalInvestigator.objects.filter(employee_id=employee_id).exists():
        employee_id = f"PI-{user.id:05d}-{secrets.randbelow(900) + 100}"

    pi = PrincipalInvestigator.objects.create(
        user=user,
        department=dept,
        employee_id=employee_id,
        speedcode=first_speedcode,
        start_date=date.today(),
        end_date=contract_end or None,
    )

    # Create each project + speedcode allocation
    for i, proj_data in enumerate(projects_data):
        proj_name = proj_data.get('name', '').strip() or f"{last_name}'s Project {i + 1}"
        speedcode = proj_data.get('speedcode', '').strip() or first_speedcode
        description = proj_data.get('description', '')
        is_default = (i == 0)

        project = Project.objects.create(
            name=proj_name,
            description=description,
            owner=pi,
            is_default=is_default,
        )
        ProjectSpeedcode.objects.create(
            project=project,
            pi=pi,
            speedcode=speedcode,
            allocation_percentage=100,
        )
        if is_default:
            pi.default_project = project
            pi.save(update_fields=['default_project'])

    # Add PI as collaborator to existing projects they requested access to
    for proj_id in existing_project_ids:
        try:
            proj = Project.objects.get(pk=proj_id)
            proj.collaborating_pis.add(pi)
        except Project.DoesNotExist:
            pass

    return pi, temp_password


@transaction.atomic
def provision_sponsored_user(data):
    """
    Create a User + SponsoredUser from approved new_user request data.
    Returns (sponsored_user, temp_password).
    """
    email = data.get('uwo_email', '').strip()
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    pi_id = data.get('pi_id')
    project_id = data.get('project_id')
    user_type_raw = data.get('user_type', 'basic')
    contract_end = data.get('contract_end') or None

    if not email:
        raise ValueError("uwo_email is required")
    if not pi_id:
        raise ValueError("pi_id is required")
    if not project_id:
        raise ValueError("project_id is required")

    # Map form value 'heavy' to model choice 'poweruser'
    user_type = 'poweruser' if user_type_raw == 'heavy' else 'basic'

    try:
        pi = PrincipalInvestigator.objects.get(pk=pi_id)
    except PrincipalInvestigator.DoesNotExist:
        raise ValueError(f"PI with id {pi_id} not found")

    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        raise ValueError(f"Project with id {project_id} not found")

    if User.objects.filter(email=email).exists():
        user = User.objects.get(email=email)
        temp_password = None
    else:
        username = _generate_username(first_name, last_name, email)
        temp_password = _generate_password()
        user = User.objects.create_user(
            username=username,
            email=email,
            password=temp_password,
            first_name=first_name,
            last_name=last_name,
        )

    if SponsoredUser.objects.filter(user=user).exists():
        raise ValueError(f"A sponsored user account already exists for {email}")

    sponsored = SponsoredUser.objects.create(
        user=user,
        status='active',
        user_type=user_type,
        user_role='student',  # default; admin can update via Django admin
        sponsor=pi,
        project=project,
        start_date=date.today(),
        end_date=contract_end or None,
    )
    return sponsored, temp_password
