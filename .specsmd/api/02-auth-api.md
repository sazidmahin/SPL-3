# Auth API

## Register

POST /api/v1/auth/register

Request:

- email
- password
- full_name

Behavior:

- create user
- create personal workspace
- create workspace member as owner
- return access token

## Login

POST /api/v1/auth/login

Request:

- email
- password

Response:

- access_token
- user

## Current User

GET /api/v1/auth/me

Response:

- user
- workspaces
