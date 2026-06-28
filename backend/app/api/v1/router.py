from fastapi import APIRouter

from app.api.v1.routes import admin, auth, billing, diagrams, health, projects, srs, workspaces


api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router)
api_router.include_router(workspaces.router)
api_router.include_router(projects.router)
api_router.include_router(diagrams.router)
api_router.include_router(srs.router)
api_router.include_router(billing.plans_router)
api_router.include_router(billing.workspace_billing_router)
api_router.include_router(admin.router)
