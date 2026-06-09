# Billing API

## List Plans

GET /api/v1/billing/plans

## Get Workspace Subscription

GET /api/v1/workspaces/{workspace_id}/billing/subscription

## Get Workspace Usage

GET /api/v1/workspaces/{workspace_id}/billing/usage

## Create Checkout Session

POST /api/v1/workspaces/{workspace_id}/billing/checkout

Later implementation can integrate Stripe or another payment provider.

Subscription checks should be implemented in backend service layer before paid features are executed.
