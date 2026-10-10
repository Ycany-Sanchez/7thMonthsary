@echo off
title 7th Monthsary - Kirsten ^& Ycany
echo ========================================================
echo Starting 7th Monthsary Website with Full Online Features...
echo ========================================================
echo.
echo Starting local web server on http://localhost:8000 ...
start "" "http://localhost:8000/index.html"
python -m http.server 8000
pause
