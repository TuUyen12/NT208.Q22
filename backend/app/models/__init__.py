# Import all models here so SQLAlchemy's mapper registry resolves
# forward-reference relationship strings (e.g. "Attachment") correctly
# regardless of the order individual modules are imported.

from app.models.user import User
from app.models.chart import Chart, ChartConfiguration
from app.models.annotation import Annotation
from app.models.journal import JournalLog
from app.models.client import Client
from app.models.appointment import Appointment
from app.models.attachment import Attachment

__all__ = [
    "User",
    "Chart",
    "ChartConfiguration",
    "Annotation",
    "JournalLog",
    "Client",
    "Appointment",
    "Attachment",
]
