import os
import sys
from dotenv import load_dotenv
import oracledb

# Ensure we can accurately find the .env file regardless of where this script is executed from
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(env_path)

# Pull the newly created application credentials from the .env file
db_user = os.environ.get("DB_USER")
db_password = os.environ.get("DB_PASSWORD")

print(f"Testing connection as: '{db_user}'...")

try:
    # Attempt to connect to the Pluggable Database (FREEPDB1) using the application user
    conn = oracledb.connect(user=db_user, password=db_password, dsn="localhost:1521/FREEPDB1")
    
    # If the connection succeeds, the database is perfectly configured
    print("Success! Database connection is fully operational.")
    
except Exception as e:
    # If it fails, print the exact Oracle error code and exit with a failure status
    print(f"Failed: {e}")
    sys.exit(1)

