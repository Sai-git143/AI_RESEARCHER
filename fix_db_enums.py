import sqlite3
import os

DB_PATH = "sql_app.db"
if not os.path.exists(DB_PATH):
    if os.path.exists("backend/sql_app.db"):
        DB_PATH = "backend/sql_app.db"
    else:
        print(f"Database not found at {DB_PATH}")
        exit(1)

print(f"Fixing database enums at: {DB_PATH}")

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Fix ChatRole (ASSISTANT -> assistant, USER -> user)
    print("Normalizing ChatRoles...")
    cursor.execute("UPDATE chat_messages SET role = 'assistant' WHERE role = 'ASSISTANT'")
    cursor.execute("UPDATE chat_messages SET role = 'user' WHERE role = 'USER'")
    print(f"ChatRoles updated. Rows affected: {cursor.rowcount}") # rough count of last query
    
    # 2. Fix MessageType (CHAT -> chat, RESEARCH -> research)
    # Check if message_type column exists first (it should, based on previous migration)
    try:
        print("Normalizing MessageTypes...")
        cursor.execute("UPDATE chat_messages SET message_type = 'chat' WHERE message_type = 'CHAT'")
        cursor.execute("UPDATE chat_messages SET message_type = 'research' WHERE message_type = 'RESEARCH'")
        print("MessageTypes updated.")
    except Exception as e:
        print(f"Skipping MessageType fix (column might be missing or error): {e}")

    conn.commit()
    conn.close()
    print("Database repair complete.")

except Exception as e:
    print(f"Repair failed: {e}")
