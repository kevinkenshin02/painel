Set WshShell = CreateObject("WScript.Shell")
projectDir = Replace(WScript.ScriptFullName, "\electron\abrir-painel.vbs", "")
WshShell.CurrentDirectory = projectDir
WshShell.Run "cmd /c set ELECTRON_RUN_AS_NODE=&& npm run desktop:start", 0, False
