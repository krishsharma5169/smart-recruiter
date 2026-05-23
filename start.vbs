Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

root = FSO.GetParentFolderName(WScript.ScriptFullName)

WshShell.Run "cmd /c cd /d """ & root & """ && .venv\Scripts\activate && cd backend && python -m uvicorn main:app", 0, False

WScript.Sleep 5000

WshShell.Run "cmd /c cd /d """ & root & "\frontend"" && npm run dev", 0, False

WScript.Sleep 8000

WshShell.Run "rundll32 url.dll,FileProtocolHandler http://localhost:3000", 0, False

MsgBox "Smart Recruiter is running." & vbCrLf & vbCrLf & "Click OK to stop all servers and exit.", 64, "Smart Recruiter"

WshShell.Run "cmd /c taskkill /f /im python.exe", 0, True
WshShell.Run "cmd /c taskkill /f /im node.exe", 0, True