::
:: Jala Project [http://opensvn.csie.org/traccgi/jala]
::
:: Copyright 2004 ORF Online und Teletext GmbH
::
:: Licensed under the Apache License, Version 2.0 (the ``License'');
:: you may not use this file except in compliance with the License.
:: You may obtain a copy of the License at
::
::    http://www.apache.org/licenses/LICENSE-2.0
::
:: Unless required by applicable law or agreed to in writing, software
:: distributed under the License is distributed on an ``AS IS'' BASIS,
:: WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
:: See the License for the specific language governing permissions and
:: limitations under the License.
::
:: $Revision$
:: $LastChangedBy$
:: $LastChangedDate$
:: $HeadURL$
::


@echo off

REM --------------------------------------------
REM buildfile for ant 1.6.5
REM --------------------------------------------

rem set JAVA_HOME=c:\programme\Java\jre1.5.0_05

REM --------------------------------------------
REM No need to edit anything past here
REM --------------------------------------------


rem ---- store path of this script as BUILD_HOME
set BUILD_HOME=%~dp0

rem ---- Slurp the command line arguments. This loop allows for an unlimited number
rem ---- of arguments (up to the command line limit, anyway).
set ANT_CMD_LINE_ARGS=%1
if ""%1""=="""" goto final
shift
:setupArgs
if ""%1""=="""" goto final
if ""%1""==""-noclasspath"" goto final
set ANT_CMD_LINE_ARGS=%ANT_CMD_LINE_ARGS% %1
shift
goto setupArgs


:final


rem ---- if there is no build.xml in the working directory, use the library
rem ---- in this directory
if not exist ".\build.xml" (
   set ANT_CMD_LINE_ARGS=-file "%BUILD_HOME%lib.xml" %ANT_CMD_LINE_ARGS%
)

echo buildhome: %BUILD_HOME%
if "%JAVA_HOME%" == "" goto javahomeerror

set CP=%CLASSPATH%;%BUILD_HOME%lib/ant-launcher.jar

echo CLASSPATH: "%CP%"
echo JAVA_HOME: "%JAVA_HOME%"

"%JAVA_HOME%\bin\java.exe" -classpath "%CP%" %APPNAME% "-Dant.home=." org.apache.tools.ant.launch.Launcher -propertyfile "%CD%\build.properties" %ANT_CMD_LINE_ARGS%

goto end


REM -----------ERROR-------------
:javahomeerror
echo "ERROR: JAVA_HOME not found in your environment."
echo "Please, set the JAVA_HOME variable in your environment to match the"
echo "location of the Java Virtual Machine you want to use."

:end

