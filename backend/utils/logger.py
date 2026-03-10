"""
Настройка логирования ViCRM
"""
import logging
import os
from logging.handlers import RotatingFileHandler

from config import LOGS_DIR, LOG_MAX_BYTES, LOG_BACKUP_COUNT


def setup_logger(name: str, log_file: str, level=logging.INFO):
    """
    Создаёт логгер с ротацией файлов и выводом в консоль
    
    Args:
        name: Имя логгера
        log_file: Имя файла лога
        level: Уровень логирования
    
    Returns:
        Настроенный логгер
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Если уже настроен — возвращаем
    if logger.handlers:
        return logger

    # Формат сообщений
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Файловый обработчик с ротацией
    file_handler = RotatingFileHandler(
        os.path.join(LOGS_DIR, log_file),
        maxBytes=LOG_MAX_BYTES,
        backupCount=LOG_BACKUP_COUNT,
        encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # Консольный обработчик
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    return logger


# Создаём основной логгер backend
logger = setup_logger("backend", "backend.log", level=logging.INFO)
