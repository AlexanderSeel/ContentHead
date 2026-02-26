$ErrorActionPreference = 'SilentlyContinue'

$webNextDir = Join-Path $PSScriptRoot '..\apps\web\.next'
if (Test-Path $webNextDir) {
  Remove-Item -Recurse -Force $webNextDir
}
