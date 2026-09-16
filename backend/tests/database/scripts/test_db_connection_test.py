from unittest.mock import patch, MagicMock
import pytest
from database.scripts.db_connection_test import main

@patch("database.scripts.db_connection_test.oracledb.connect")
@patch.dict('os.environ', {'DB_USER': 'TEST_USER', 'DB_PASSWORD': 'test_password'}, clear=True)
def test_test_db_connection_success(mock_connect, capsys):
    mock_conn = MagicMock()
    mock_connect.return_value = mock_conn

    main()

    # Ensure it connected as the correct application user
    mock_connect.assert_called_once_with(user="TEST_USER", password="test_password", dsn="localhost:1521/FREEPDB1")
    
    # Capture output
    captured = capsys.readouterr()
    assert "Success! Database connection is fully operational." in captured.out

@patch("database.scripts.db_connection_test.sys.exit")
@patch("database.scripts.db_connection_test.oracledb.connect")
@patch.dict('os.environ', {'DB_USER': 'TEST_USER', 'DB_PASSWORD': 'test_password'}, clear=True)
def test_test_db_connection_failure(mock_connect, mock_exit, capsys):
    # Simulate a connection failure (e.g., wrong password)
    mock_connect.side_effect = Exception("ORA-01017: invalid username/password; logon denied")

    main()

    # Ensure it caught the fatal error and called sys.exit(1)
    captured = capsys.readouterr()
    assert "Failed: ORA-01017: invalid username/password; logon denied" in captured.out
    mock_exit.assert_called_once_with(1)

