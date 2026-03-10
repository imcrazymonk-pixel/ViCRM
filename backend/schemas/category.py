"""
Pydantic схемы для категорий ViCRM
"""
from pydantic import BaseModel


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


__all__ = ["CategoryBase", "CategoryCreate", "CategoryUpdate"]
