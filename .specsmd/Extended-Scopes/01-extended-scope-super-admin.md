No. In the DB design I gave, I added:

```text
workspace owner
workspace admin
workspace member
workspace viewer
```

But I  **did not add a platform-level super admin** .

You should add it, but keep it separate from normal workspace roles.

---

# Correct Role Design

There should be two role layers:

```text
Platform Role
--
Controls whole application/admin panel access
```

```text
Workspace Role
--
Controls access inside one personal or organization workspace
```

---

# Add Super Admin Support

## Option I recommend

Add platform-level fields to `users`.

Update `users` table:

```sql
users
--
id UUID PK
email VARCHAR UNIQUE
password_hash VARCHAR
full_name VARCHAR
avatar_url TEXT
status VARCHAR -- active, invited, disabled
platform_role VARCHAR -- user, support_admin, super_admin
is_platform_admin BOOLEAN DEFAULT FALSE
created_at TIMESTAMP
updated_at TIMESTAMP
```

Better enum values:

```text
user
support_admin
super_admin
```

Meaning:

```text
user
--
Normal user
--
Can only access their own workspaces
```

```text
support_admin
--
Can view platform data for support/debugging
--
Should not modify billing or delete data unless allowed
```

```text
super_admin
--
Platform owner/admin
--
Can access all users, workspaces, projects, billing, SRS, diagrams, jobs
--
Can manage plans, subscriptions, users, and system configuration
```

---

# Important Rule

Normal APIs should still use:

```text
workspace_id tenant isolation
```

Super admin should not randomly bypass this everywhere.

Use separate admin APIs:

```text
/api/v1/admin/users
/api/v1/admin/workspaces
/api/v1/admin/subscriptions
/api/v1/admin/projects
/api/v1/admin/generation-jobs
/api/v1/admin/llm-calls
```

So the design becomes:

```text
Normal user request
--
JWT Authentication
--
Check workspace membership
--
Check workspace role
--
Check workspace subscription
--
Run workspace-scoped query
```

```text
Super admin request
--
JWT Authentication
--
Check user.platform_role = super_admin
--
Allow platform-level access
--
Log admin action
```

---

# Add Admin Audit Log Table

You should also add this table.

```sql
admin_audit_logs
--
id UUID PK
admin_user_id UUID FK -> users.id
action VARCHAR
target_type VARCHAR -- user, workspace, subscription, project, diagram, srs_document
target_id UUID NULL
metadata JSONB NULL
ip_address VARCHAR NULL
user_agent TEXT NULL
created_at TIMESTAMP
```

Why this is needed:

```text
Super admin has powerful access
--
Every important action should be logged
--
Useful for security and debugging
```

---

# Add Platform Settings Table

Optional but useful.

```sql
platform_settings
--
id UUID PK
key VARCHAR UNIQUE
value JSONB
description TEXT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

Example settings:

```text
default_free_plan_id
llm_provider
maintenance_mode
max_raw_requirement_input_length
```

---

# Updated Access Model

```text
User
--
Platform Role
--
user / support_admin / super_admin
```

```text
User
--
Workspace Member
--
Workspace Role
--
owner / admin / member / viewer
```

Final access decision:

```text
If platform_role = super_admin
--
Allow admin routes
--
Log action
```

```text
Else
--
Require workspace_members record
--
Apply workspace role permission
--
Apply subscription rules
--
Scope query by workspace_id
```

---

# Add This to SpecsMD

Update this file:

```text
.specsmd/database/01-database-design.md
```

Add:

```md
### Super Admin Support

The system supports platform-level administrators.

The `users` table includes:

- platform_role VARCHAR -- user, support_admin, super_admin
- is_platform_admin BOOLEAN DEFAULT FALSE

Super admins can access platform-level admin APIs.

Normal workspace APIs must still enforce workspace_id tenant isolation.
```

Add this table:

```md
### admin_audit_logs

Tracks platform admin actions.

Fields:
- id UUID PK
- admin_user_id UUID FK users.id
- action VARCHAR
- target_type VARCHAR
- target_id UUID NULL
- metadata JSONB NULL
- ip_address VARCHAR NULL
- user_agent TEXT NULL
- created_at TIMESTAMP
```

Also update:

```text
.specsmd/api/01-api-overview.md
```

Add:

```md
## Admin APIs

Platform admin APIs are separate from workspace APIs.

Admin base path:

/api/v1/admin

Only users with platform_role = super_admin can access full admin routes.
```

---

# Super Admin Seed Rule

During first backend setup, create first super admin from environment variables:

```env
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=change-this-password
```

Seed flow:

```text
Backend startup or seed command
--
Check if super admin exists
--
If not, create super admin user
--
Set platform_role = super_admin
--
Set is_platform_admin = true
```

Do not allow public registration to create super admin.
