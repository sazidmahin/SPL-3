from fastapi import APIRouter

from app.api.v1.routes import auth, diagrams, health, projects, workspaces


api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router)
api_router.include_router(workspaces.router)
api_router.include_router(projects.router)
api_router.include_router(diagrams.router)