# Super Admin Database Additions

Platform administration is separate from workspace roles.

## users additions

The `users` table includes platform-level role fields:

- `platform_role VARCHAR` values: `user`, `support_admin`, `super_admin`
- `is_platform_admin BOOLEAN DEFAULT FALSE`

`support_admin` is reserved for later limited support workflows. Current full admin APIs require `platform_role = super_admin`.

## admin_audit_logs

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

Admin read actions and platform-setting writes should create audit rows.

## platform_settings

Stores application-wide configuration.

Fields:

- id UUID PK
- key VARCHAR UNIQUE
- value JSONB
- description TEXT NULL
- created_at TIMESTAMP
- updated_at TIMESTAMP

Example keys:

- default_free_plan_id
- llm_provider
- maintenance_mode
- max_raw_requirement_input_length
