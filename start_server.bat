@echo off
title MeasureX! Legal Metrology Portal & API Server
cls
echo ====================================================================
echo   MeasureX! - Legal Metrology Online Verification Portal (SIH PSC26036)
echo   Full-Stack Express.js + PostgreSQL + Vanilla HTML/CSS/JS Engine
echo ====================================================================
echo.
echo Your Local IP Address(es) on this Wi-Fi / LAN Network:
ipconfig | findstr /i "IPv4"
echo.
echo --------------------------------------------------------------------
echo To open this portal on another PC, Mobile, or Tablet on the SAME Wi-Fi:
echo Type this in the browser on the other device:
echo.
echo   http://<YOUR_IP_ADDRESS>:5000/
echo   API Health: http://<YOUR_IP_ADDRESS>:5000/api/health
echo --------------------------------------------------------------------
echo.
echo Starting MeasureX! Express API & Web Server on Port 5000...
echo.

node server.js
if %ERRORLEVEL% NEQ 0 (
  echo Error starting node server. Trying npm start...
  npm start
)

pause
