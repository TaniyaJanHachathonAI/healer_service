"""
Logging configuration and utilities
"""
import logging
import sys
import uuid
from datetime import datetime
from config import Config

# Configure logging
def setup_logger():
    """Setup structured logging for the healer service"""
    logger = logging.getLogger("healer_service")
    logger.setLevel(getattr(logging, Config.LOG_LEVEL.upper()))
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    
    # File handler
    file_handler = logging.FileHandler(Config.LOG_FILE)
    file_handler.setLevel(logging.DEBUG)
    
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger

# Create logger instance
logger = setup_logger()

def generate_request_id() -> str:
    """Generate a unique request ID"""
    return f"req_{uuid.uuid4().hex[:12]}"

class RequestLogger:
    """Context manager for request logging with request ID"""
    
    def __init__(self, endpoint: str, request_data: dict = None):
        self.endpoint = endpoint
        self.request_id = generate_request_id()
        self.request_data = request_data
        self.start_time = None
        
    def __enter__(self):
        self.start_time = datetime.now()
        logger.info(
            f"Request started: {self.endpoint}",
            extra={'request_id': self.request_id}
        )
        if self.request_data:
            logger.debug(
                f"Request data: {self.request_data}",
                extra={'request_id': self.request_id}
            )
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = (datetime.now() - self.start_time).total_seconds() * 1000
        
        if exc_type is None:
            logger.info(
                f"Request completed: {self.endpoint} in {duration:.2f}ms",
                extra={'request_id': self.request_id}
            )
        else:
            logger.error(
                f"Request failed: {self.endpoint} after {duration:.2f}ms - {exc_val}",
                extra={'request_id': self.request_id},
                exc_info=True
            )
        
        return False  # Don't suppress exceptions
    
    def log_info(self, message: str):
        """Log info message with request ID"""
        logger.info(message, extra={'request_id': self.request_id})
    
    def log_debug(self, message: str):
        """Log debug message with request ID"""
        logger.debug(message, extra={'request_id': self.request_id})
    
    def log_warning(self, message: str):
        """Log warning message with request ID"""
        logger.warning(message, extra={'request_id': self.request_id})
    
    def log_error(self, message: str, exc_info=False):
        """Log error message with request ID"""
        logger.error(message, extra={'request_id': self.request_id}, exc_info=exc_info)

# Add a default filter to add request_id to all log records
class RequestIdFilter(logging.Filter):
    """Add request_id to log records if not present"""
    def filter(self, record):
        if not hasattr(record, 'request_id'):
            record.request_id = 'system'
        return True

# Add filter to logger
logger.addFilter(RequestIdFilter())
