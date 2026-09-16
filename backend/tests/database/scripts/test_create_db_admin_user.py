from unittest.mock import patch, MagicMock
import pytest
from database.scripts.create_db_admin_user import main

@patch("database.scripts.create_db_admin_user.oracledb.connect")
@patch.dict('os.environ', {'DB_USER': 'TEST_USER', 'DB_PASSWORD': 'test_password'}, clear=True)
def test_create_db_admin_user_success(mock_connect, capsys):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_connect.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    main()

    # Ensure it connected as SYSTEM
    mock_connect.assert_called_once_with(user="SYSTEM", password="test_password", dsn="localhost:1521/FREEPDB1")
    
    # Ensure it executed the creation commands
    assert mock_cursor.execute.call_count == 2
    
    # Capture output
    captured = capsys.readouterr()
    assert "Success! The user TEST_USER has been permanently created" in captured.out

@patch("database.scripts.create_db_admin_user.oracledb.connect")
@patch.dict('os.environ', {'DB_USER': 'TEST_USER', 'DB_PASSWORD': 'test_password'}, clear=True)
def test_create_db_admin_user_already_exists(mock_connect, capsys):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_connect.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    
    # Simulate the Oracle "user already exists" exception
    mock_cursor.execute.side_effect = Exception("ORA-01920: user name 'TEST_USER' conflicts with another user or role name")

    main()

    # Ensure it caught the exception and printed success instead of exiting
    captured = capsys.readouterr()
    assert "Success! User TEST_USER already exists." in captured.out

@patch("database.scripts.create_db_admin_user.sys.exit")
@patch("database.scripts.create_db_admin_user.oracledb.connect")
@patch.dict('os.environ', {'DB_USER': 'TEST_USER', 'DB_PASSWORD': 'test_password'}, clear=True)
def test_create_db_admin_user_fatal_error(mock_connect, mock_exit, capsys):
    mock_connect.side_effect = Exception("ORA-12541: TNS:no listener")

    main()

    # Ensure it caught the fatal error and called sys.exit(1)
    captured = capsys.readouterr()
    assert "Error: ORA-12541: TNS:no listener" in captured.out
    mock_exit.assert_called_once_with(1)

