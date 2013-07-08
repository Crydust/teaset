@ECHO OFF
PUSHD %~dp0
java -classpath .;uploader.jar be.crydust.uploader.App
POPD