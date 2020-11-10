@echo off
rem  CHCP 65001
rem  936 GBK(一般情况下为默认编码)
rem  437 美国英语
rem  65001 utf-8
node "%~dp0\src\index.js" %*
