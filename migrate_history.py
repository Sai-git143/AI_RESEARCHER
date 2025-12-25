import sqlite3
import os

# Database file path (assuming default location from session.py/config.py)
# Usually 'sql_app.db' or similar in the root or backend dir.
# Let's try to find it.
DB_PATH = "sql_app.db" # Standard default for this stack
if not os.path.exists(DB_PATH):
    # Try finding it in backend/
    if os.path.exists("backend/sql_app.db"):
        DB_PATH = "backend/sql_app.db"
    else:
        print(f"Database not found at {DB_PATH}. Please check the path.")
        # Proceeding to try creating it or failing if strictly needed, 
        # but for migration we need existing one.
        # We will assume it might be in current dir if running from root.

print(f"Migrating database at: {DB_PATH}")

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if column exists
    cursor.execute("PRAGMA table_info(chat_messages)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if "message_type" not in columns:
        print("Adding message_type column...")
        # Add column with default 'chat'
        cursor.execute("ALTER TABLE chat_messages ADD COLUMN message_type VARCHAR DEFAULT 'chat'")
        conn.commit()
        print("Column added successfully.")
    else:
        print("Column message_type already exists.")
        
    conn.close()
    print("Migration complete.")

except Exception as e:
    print(f"Migration failed: {e}")
