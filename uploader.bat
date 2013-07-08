@ECHO OFF
PUSHD %~dp0
java -classpath .;uploader-1.0-jar-with-dependencies.jar be.crydust.uploader.App
POPD