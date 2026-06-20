#!/usr/bin/env pwsh
# Valida exports n8n Sprint 1 - JSON parseable + campos minimos
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$dir = Join-Path $root "jarvis\n8n"
$files = @(
  "ZENKAI-M-04-hot-lead-alert.json",
  "LEADS-05-qualify-on-create.json",
  "ZENKAI-M-02-demo-autoreply.json",
  "ZENKAI-S-01-sla-form-3h.json"
)

Write-Host "ZENKAI n8n Sprint 1 checklist" -ForegroundColor Cyan
Write-Host "Directory: $dir"
Write-Host ""

$ok = 0
foreach ($f in $files) {
  $path = Join-Path $dir $f
  if (-not (Test-Path $path)) {
    Write-Host "[MISSING] $f" -ForegroundColor Red
    continue
  }
  try {
    $json = Get-Content $path -Raw | ConvertFrom-Json
    if (-not $json.name -or -not $json.nodes -or -not $json.connections) {
      Write-Host "[INVALID] $f - missing name/nodes/connections" -ForegroundColor Red
      continue
    }
    $webhooks = @($json.nodes | Where-Object { $_.type -eq "n8n-nodes-base.webhook" })
    $cron = @($json.nodes | Where-Object { $_.type -eq "n8n-nodes-base.scheduleTrigger" })
    $detail = if ($webhooks.Count) { "webhook: $($webhooks[0].parameters.path)" } elseif ($cron.Count) { "cron" } else { "?" }
    Write-Host "[OK] $f - $($json.name) - $detail - $($json.nodes.Count) nodes" -ForegroundColor Green
    $ok++
  } catch {
    Write-Host "[PARSE ERROR] $f - $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "$ok / $($files.Count) workflows valid"
if ($ok -ne $files.Count) { exit 1 }

Write-Host ""
Write-Host "Next: import in n8n Cloud (order M-04 then M-03 then M-02 then S-01)"
Write-Host "Guide: docs/jarvis/CHECKLIST-SPRINT1.md"
