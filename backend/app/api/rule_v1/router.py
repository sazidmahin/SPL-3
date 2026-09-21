from fastapi import APIRouter

from app.api.rule_v1.routes import rule_system

rule_api_router = APIRouter(prefix="/api/rule/v1")
rule_api_router.include_router(rule_system.router)
