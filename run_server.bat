@echo off
echo Starting Open Legend Character Sheet Server...
echo.
echo The application will be available at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000
