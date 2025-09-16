Write-Host "Starting Open Legend Character Sheet Server..." -ForegroundColor Green
Write-Host ""
Write-Host "The application will be available at: http://localhost:8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""

try {
    python -m http.server 8000
} catch {
    Write-Host "Error: Python not found or not in PATH" -ForegroundColor Red
    Write-Host "Please make sure Python is installed and added to your PATH" -ForegroundColor Red
    pause
}
