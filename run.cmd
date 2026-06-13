@echo off
rem Lanceur cmd.exe du runner de projet — delegue a scripts\run.mjs (Node).
rem Usage : run <commande>   (voir run help)
node "%~dp0scripts\run.mjs" %*
