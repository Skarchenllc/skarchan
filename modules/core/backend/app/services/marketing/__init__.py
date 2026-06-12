"""Marketing execution: email delivery + journey (drip sequence) runner."""
from .ops import process_email_queue, send_email, run_journeys, enroll_subjects

__all__ = ["process_email_queue", "send_email", "run_journeys", "enroll_subjects"]
