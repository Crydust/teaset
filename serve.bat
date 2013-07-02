@ECHO OFF
PUSHD %~dp0
python -m SimpleHTTPServer 8000
POPD