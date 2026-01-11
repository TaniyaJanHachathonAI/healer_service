"""
Database operations and schema management
"""
import sqlite3
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from config import Config
from logger import logger

class Database:
    """Database manager for healer service"""
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path or Config.DB_PATH
        self.init_db()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        return conn
    
    def init_db(self):
        """Initialize database schema"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Main healed selectors table (enhanced)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS healed (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                old_selector TEXT NOT NULL,
                new_selector TEXT NOT NULL,
                confidence REAL NOT NULL,
                url TEXT,
                timestamp TEXT NOT NULL,
                selector_type TEXT DEFAULT 'css',
                success BOOLEAN DEFAULT NULL,
                processing_time_ms REAL,
                llm_used BOOLEAN DEFAULT 1,
                screenshot_analyzed BOOLEAN DEFAULT 0
            )
        """)
        
        # Feedback table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                healing_id INTEGER NOT NULL,
                rating TEXT NOT NULL,
                comment TEXT,
                actual_selector_used TEXT,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (healing_id) REFERENCES healed(id)
            )
        """)
        
        # Healing attempts table (for tracking all attempts, not just successful ones)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS healing_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                failed_selector TEXT NOT NULL,
                url TEXT,
                timestamp TEXT NOT NULL,
                success BOOLEAN NOT NULL,
                error_message TEXT,
                processing_time_ms REAL
            )
        """)
        
        # Create indexes for better query performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_healed_old_selector 
            ON healed(old_selector)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_healed_timestamp 
            ON healed(timestamp DESC)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_feedback_healing_id 
            ON feedback(healing_id)
        """)
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully", extra={'request_id': 'system'})
    
    def save_healing(
        self,
        old_selector: str,
        new_selector: str,
        confidence: float,
        url: str = "",
        selector_type: str = "css",
        processing_time_ms: float = 0,
        llm_used: bool = True,
        screenshot_analyzed: bool = False
    ) -> int:
        """Save a healing record and return its ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO healed 
            (old_selector, new_selector, confidence, url, timestamp, selector_type, 
             processing_time_ms, llm_used, screenshot_analyzed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            old_selector, new_selector, confidence, url,
            datetime.utcnow().isoformat(), selector_type,
            processing_time_ms, llm_used, screenshot_analyzed
        ))
        
        healing_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.debug(f"Saved healing record with ID: {healing_id}", extra={'request_id': 'system'})
        return healing_id
    
    def get_healing_by_selector(self, old_selector: str) -> Optional[Dict[str, Any]]:
        """Get the most recent healing for a given selector"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM healed 
            WHERE old_selector = ? 
            ORDER BY id DESC 
            LIMIT 1
        """, (old_selector,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def save_feedback(
        self,
        healing_id: int,
        rating: str,
        comment: Optional[str] = None,
        actual_selector_used: Optional[str] = None
    ) -> int:
        """Save feedback for a healing"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO feedback 
            (healing_id, rating, comment, actual_selector_used, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (
            healing_id, rating, comment, actual_selector_used,
            datetime.utcnow().isoformat()
        ))
        
        feedback_id = cursor.lastrowid
        
        # Update success field in healed table
        success = (rating == "positive")
        cursor.execute("""
            UPDATE healed 
            SET success = ? 
            WHERE id = ?
        """, (success, healing_id))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Saved feedback for healing {healing_id}: {rating}", extra={'request_id': 'system'})
        return feedback_id
    
    def get_history(
        self,
        page: int = 1,
        page_size: int = 20,
        url_filter: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Get healing history with pagination"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Build query
        where_clause = ""
        params = []
        
        if url_filter:
            where_clause = "WHERE h.url LIKE ?"
            params.append(f"%{url_filter}%")
        
        # Get total count
        count_query = f"SELECT COUNT(*) FROM healed h {where_clause}"
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()[0]
        
        # Get paginated results with feedback
        offset = (page - 1) * page_size
        query = f"""
            SELECT 
                h.*,
                f.rating as feedback_rating,
                f.comment as feedback_comment
            FROM healed h
            LEFT JOIN feedback f ON h.id = f.healing_id
            {where_clause}
            ORDER BY h.timestamp DESC
            LIMIT ? OFFSET ?
        """
        
        cursor.execute(query, params + [page_size, offset])
        rows = cursor.fetchall()
        conn.close()
        
        items = [dict(row) for row in rows]
        return items, total_count
    
    def get_stats(self) -> Dict[str, Any]:
        """Get healing statistics"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Total healings
        cursor.execute("SELECT COUNT(*) FROM healed")
        total_healings = cursor.fetchone()[0]
        
        # Feedback stats
        cursor.execute("SELECT COUNT(*) FROM feedback")
        total_with_feedback = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM feedback WHERE rating = 'positive'")
        positive_feedback = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM feedback WHERE rating = 'negative'")
        negative_feedback = cursor.fetchone()[0]
        
        # Success rate
        success_rate = 0.0
        if total_with_feedback > 0:
            success_rate = positive_feedback / total_with_feedback
        
        # Most healed selectors
        cursor.execute("""
            SELECT old_selector, COUNT(*) as count
            FROM healed
            GROUP BY old_selector
            ORDER BY count DESC
            LIMIT 10
        """)
        most_healed = [
            {"selector": row[0], "count": row[1]}
            for row in cursor.fetchall()
        ]
        
        # Recent healings (last 7 days)
        seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
        cursor.execute("""
            SELECT COUNT(*) FROM healed 
            WHERE timestamp > ?
        """, (seven_days_ago,))
        recent_count = cursor.fetchone()[0]
        
        # Average confidence
        cursor.execute("SELECT AVG(confidence) FROM healed")
        avg_confidence = cursor.fetchone()[0] or 0.0
        
        conn.close()
        
        return {
            "total_healings": total_healings,
            "total_with_feedback": total_with_feedback,
            "positive_feedback_count": positive_feedback,
            "negative_feedback_count": negative_feedback,
            "success_rate": round(success_rate, 2),
            "most_healed_selectors": most_healed,
            "recent_healings_count": recent_count,
            "average_confidence": round(avg_confidence, 2)
        }
    
    def log_attempt(
        self,
        failed_selector: str,
        url: str,
        success: bool,
        error_message: Optional[str] = None,
        processing_time_ms: float = 0
    ):
        """Log a healing attempt"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO healing_attempts 
            (failed_selector, url, timestamp, success, error_message, processing_time_ms)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            failed_selector, url, datetime.utcnow().isoformat(),
            success, error_message, processing_time_ms
        ))
        
        conn.commit()
        conn.close()
    
    def check_connection(self) -> bool:
        """Check if database connection is working"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Database connection check failed: {e}", extra={'request_id': 'system'})
            return False

# Create global database instance
db = Database()
