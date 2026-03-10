"""
Модели участников ViCRM
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Participant(Base):
    """Участник/контрагент"""
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    group_id = Column(Integer, ForeignKey("participant_groups.id"), nullable=True)  # Группа контрагента
    start_date = Column(String(7), nullable=True)  # "2026-07" - с какого месяца пользуется
    is_active = Column(Boolean, default=True)  # Активен ли сейчас
    total_paid = Column(Float, default=0.0)  # Общая сумма взносов (для быстрого доступа)
    paid_until_month = Column(String(7), nullable=True)  # "2026-05" - до какого месяца оплачено
    balance = Column(Float, default=0.0)  # Персональный баланс (+ аванс, - долг)
    created_at = Column(DateTime, default=datetime.now)

    group = relationship("ParticipantGroup", back_populates="participants")
    incomes = relationship("Income", back_populates="participant", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="participant", cascade="all, delete-orphan")
    contributions = relationship("Contribution", back_populates="participant", cascade="all, delete-orphan")
    membership_history = relationship("MembershipHistory", back_populates="participant", cascade="all, delete-orphan")


class ParticipantGroup(Base):
    """Группа участников"""
    __tablename__ = "participant_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # "VPN участники", "Хосты"
    group_type = Column(String(20), default="contribution")  # "contribution" (с них берём) или "expense" (им платим)
    monthly_fee = Column(Float, default=0.0)  # Обязательный платёж в месяц
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    auto_create_contributions = Column(Boolean, default=True)  # Создавать обязательства автоматически
    created_at = Column(DateTime, default=datetime.now)

    participants = relationship("Participant", back_populates="group")


class MembershipHistory(Base):
    """История членства в группах"""
    __tablename__ = "membership_history"

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("participant_groups.id"), nullable=False)
    joined_at = Column(String(7), nullable=False)  # "2026-03" - когда вступил
    left_at = Column(String(7), nullable=True)  # "2026-06" - когда вышел (NULL = ещё в группе)
    reason = Column(Text, nullable=True)  # Причина выхода/смены
    created_at = Column(DateTime, default=datetime.now)

    participant = relationship("Participant", back_populates="membership_history")
    group = relationship("ParticipantGroup")


__all__ = ["Participant", "ParticipantGroup", "MembershipHistory"]
