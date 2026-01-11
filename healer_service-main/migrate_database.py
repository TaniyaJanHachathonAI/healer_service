#!/usr/bin/env python3
"""
Database migration script for healer service
Migrates old database schema to new schema with additional columns
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = "healed_selectors.db"
BACKUP_PATH = f"healed_selectors_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"

def backup_database():
    """Create a backup of the existing database"""
    if os.path.exists(DB_PATH):
        import shutil
        shutil.copy2(DB_PATH, BACKUP_PATH)
        print(f"✓ Backup created: {BACKUP_PATH}")
        return True
    return False

def check_column_exists(cursor, table, column):
    """Check if a column exists in a table"""
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    return column in columns

def migrate_database():
    """Migrate database to new schema"""
    print("Starting database migration...")
    
    # Backup first
    if os.path.exists(DB_PATH):
        backup_database()
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if healed table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='healed'")
    if not cursor.fetchone():
        print("✓ No existing database found. Will create new schema.")
        conn.close()
        # Import and initialize new database
        from database import db
        print("✓ New database initialized with latest schema")
        return True
    
    print("✓ Existing database found. Checking schema...")
    
    # Add missing columns to healed table
    columns_to_add = [
        ("selector_type", "TEXT DEFAULT 'css'"),
        ("success", "BOOLEAN DEFAULT NULL"),
        ("processing_time_ms", "REAL"),
        ("llm_used", "BOOLEAN DEFAULT 1"),
        ("screenshot_analyzed", "BOOLEAN DEFAULT 0")
    ]
    
    for column_name, column_def in columns_to_add:
        if not check_column_exists(cursor, 'healed', column_name):
            try:
                cursor.execute(f"ALTER TABLE healed ADD COLUMN {column_name} {column_def}")
                print(f"✓ Added column: {column_name}")
            except Exception as e:
                print(f"⚠ Could not add column {column_name}: {e}")
    
    # Create feedback table if it doesn't exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='feedback'")
    if not cursor.fetchone():
        cursor.execute("""
            CREATE TABLE feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                healing_id INTEGER NOT NULL,
                rating TEXT NOT NULL,
                comment TEXT,
                actual_selector_used TEXT,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (healing_id) REFERENCES healed(id)
            )
        """)
        print("✓ Created feedback table")
    
    # Create healing_attempts table if it doesn't exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='healing_attempts'")
    if not cursor.fetchone():
        cursor.execute("""
            CREATE TABLE healing_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                failed_selector TEXT NOT NULL,
                url TEXT,
                timestamp TEXT NOT NULL,
                success BOOLEAN NOT NULL,
                error_message TEXT,
                processing_time_ms REAL
            )
        """)
        print("✓ Created healing_attempts table")
    
    # Create indexes
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_healed_old_selector ON healed(old_selector)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_healed_timestamp ON healed(timestamp DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_feedback_healing_id ON feedback(healing_id)")
        print("✓ Created indexes")
    except Exception as e:
        print(f"⚠ Index creation warning: {e}")
    
    conn.commit()
    conn.close()
    
    print("\n✅ Migration completed successfully!")
    print(f"   Backup saved to: {BACKUP_PATH}" if os.path.exists(BACKUP_PATH) else "")
    return True

if __name__ == "__main__":
    try:
        migrate_database()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        print(f"   Your original database is backed up at: {BACKUP_PATH}")
        exit(1)
