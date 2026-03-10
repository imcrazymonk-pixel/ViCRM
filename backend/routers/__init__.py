"""
API роутеры ViCRM
"""
from routers.participants import router as participants_router
from routers.groups import router as groups_router
from routers.incomes import router as incomes_router
from routers.expenses import router as expenses_router
from routers.categories import router as categories_router
from routers.tags import router as tags_router
from routers.templates import router as templates_router
from routers.currencies import router as currencies_router
from routers.contributions import router as contributions_router
from routers.forecast import router as forecast_router
from routers.backup import router as backup_router

__all__ = [
    "participants_router",
    "groups_router",
    "incomes_router",
    "expenses_router",
    "categories_router",
    "tags_router",
    "templates_router",
    "currencies_router",
    "contributions_router",
    "forecast_router",
    "backup_router",
]
