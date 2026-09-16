#!/bin/bash

cd "$(dirname "$0")"

DIVIDER="========================================="

echo "$DIVIDER"
echo "1. Starting Local Oracle Database"
echo "$DIVIDER"
docker compose down -v
docker compose up -d

echo ""
echo "$DIVIDER"
echo "2. Waiting for Oracle to boot (~60-90s)"
echo "$DIVIDER"
while ! docker logs marketlens-oracle-local 2>&1 | grep -q "DATABASE IS READY TO USE!"; do
  sleep 5
done
echo "✅ Database is fully booted!"

echo ""
echo "$DIVIDER"
echo "3. Creating ADMIN User"
echo "$DIVIDER"
python3 database/scripts/create_db_admin_user.py

echo ""
echo "$DIVIDER"
echo "4. Testing Connection"
echo "$DIVIDER"
python3 database/scripts/db_connection_test.py

echo ""
echo "$DIVIDER"
echo "5. Populating Database with Market Data"
echo "$DIVIDER"
python3 database/scripts/update_db.py

echo ""
echo "✅ Local Environment Setup Complete!"

