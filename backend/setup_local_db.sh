#!/bin/bash

cd "$(dirname "$0")"

echo "========================================="
echo "1. Starting Local Oracle Database"
echo "========================================="
docker compose down -v
docker compose up -d

echo ""
echo "========================================="
echo "2. Waiting for Oracle to boot (~60-90s)"
echo "========================================="
while ! docker logs marketlens-oracle-local 2>&1 | grep -q "DATABASE IS READY TO USE!"; do
  sleep 5
done
echo "✅ Database is fully booted!"

echo ""
echo "========================================="
echo "3. Creating ADMIN User"
echo "========================================="
python3 database/scripts/create_db_admin_user.py

echo ""
echo "========================================="
echo "4. Testing Connection"
echo "========================================="
python3 database/scripts/test_db_connection.py

echo ""
echo "========================================="
echo "5. Populating Database with Market Data"
echo "========================================="
python3 database/scripts/update_db.py

echo ""
echo "✅ Local Environment Setup Complete!"

