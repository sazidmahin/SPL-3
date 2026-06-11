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