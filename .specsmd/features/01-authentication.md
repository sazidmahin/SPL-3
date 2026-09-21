# Authentication

Users must be able to register and log in.

On successful registration:

- create user
- create personal workspace
- create workspace_members record with role owner
- assign default free plan/subscription if needed

Login returns access token.

Access token is used for all protected API calls.
