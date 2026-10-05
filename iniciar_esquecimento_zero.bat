@echo off
title Esquecimento Zero - Servidor Local
echo ========================================================
echo   Iniciando Esquecimento Zero (Ambiente Local)
echo ========================================================
echo.
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)
echo.
echo Executando testes automatizados de sanidade...
call npm test
if %errorlevel% neq 0 (
  echo [ERRO] Falha nos testes de sanidade.
  pause
  exit /b %errorlevel%
)
echo.
echo Iniciando servidor em http://localhost:3333
start http://localhost:3333
node server/server.js
pause
