import oracledb
import os
import sys
from dotenv import load_dotenv

# Ensure we can find the .env file if run from the root or backend folder
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(env_path)

password = os.environ.get("DB_PASSWORD")
new_user = os.environ.get("DB_USER")

print(f"Connecting as SYSTEM to create user: {new_user}...")
try:
    # Connect as the built-in SYSTEM administrator
    conn = oracledb.connect(user="SYSTEM", password=password, dsn="localhost:1521/FREEPDB1")
    cursor = conn.cursor()
    
    # Create the new user and grant them full DBA privileges
    cursor.execute(f'CREATE USER {new_user} IDENTIFIED BY "{password}"')
    cursor.execute(f'GRANT DBA TO {new_user}')
    conn.commit()
    print(f"Success! The user {new_user} has been permanently created in your local database!")
except Exception as e:
    # If the user already exists, it will throw an error, which is fine!
    if "ORA-01920" in str(e):
        print(f"Success! User {new_user} already exists.")
    else:
        print(f"Error: {e}")
        sys.exit(1)

