param([string]$m = "update")

$sw = "sw.js"
$content = Get-Content $sw -Raw
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$newContent = $content -replace '@VERSION@', $ts
if ($newContent -eq $content) {
  Write-Warning "Could not find @VERSION@ token in $sw"
  exit 1
}
Set-Content $sw -Value $newContent -NoNewline
git add -A
git commit -m $m
git push
# Restore @VERSION@ for next deploy
Set-Content $sw -Value $content -NoNewline
