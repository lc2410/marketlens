#!/bin/bash

# Deactivate any active venv before blowing it away
deactivate 2>/dev/null

rm -rf marketlens-env
python3 -m venv marketlens-env
source marketlens-env/bin/activate
pip install -r backend/requirements.txt

