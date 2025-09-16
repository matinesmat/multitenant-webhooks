@echo off
echo Removing organizations from dashboard...

REM Remove organizations from main dashboard
if exist "app\dashboard\organizations" (
    echo Removing app\dashboard\organizations...
    rmdir /s /q "app\dashboard\organizations"
)

REM Remove organizations from slug-based dashboard
if exist "app\[slug]\dashboard\organizations" (
    echo Removing app\[slug]\dashboard\organizations...
    rmdir /s /q "app\[slug]\dashboard\organizations"
)

echo Organizations removed from dashboard successfully!
echo Organizations remain available on the after-login page (select-organization).
pause
