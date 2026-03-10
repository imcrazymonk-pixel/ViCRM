"""
Pydantic схемы для тегов ViCRM
"""
from typing import Optional
from pydantic import BaseModel


class TagBase(BaseModel):
    name: str
    color: str = '#8b5cf6'


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


__all__ = ["TagBase", "TagCreate", "TagUpdate"]
