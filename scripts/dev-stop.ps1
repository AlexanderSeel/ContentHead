$ErrorActionPreference = 'SilentlyContinue'

$ports = @(3000, 4000, 5173)
foreach ($port in $ports) {
  $procIds = Get-NetTCPConnection -LocalPort $port -State Listen | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $procIds) {
    if ($procId -and $procId -ne $PID) {
      Stop-Process -Id $procId -Force
    }
  }
}
