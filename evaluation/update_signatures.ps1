<#
.SYNOPSIS
Regenerates Stripe signature values inside test_data.jsonl based on timestamp + payload.

.DESCRIPTION
Reads JSONL lines from evaluation\test_data.jsonl, and for each line that has fields:
 - signature: "t=<timestamp>,v1=<hex>"
 - webhook_payload: raw JSON string
 - secret: webhook secret
Optionally only updates where expected_valid = true. Writes back updated file.

.PARAMETER Path
Path to JSONL dataset. Defaults to .\evaluation\test_data.jsonl.

.PARAMETER UpdateAll
If set, updates all lines with a signature field, regardless of expected_valid.

.EXAMPLE
./evaluation/update_signatures.ps1

.EXAMPLE
./evaluation/update_signatures.ps1 -Path .\evaluation\test_data.jsonl -UpdateAll
#>
[CmdletBinding()] param(
  [string] $Path = ".\evaluation\test_data.jsonl",
  [switch] $UpdateAll
)

if (-not (Test-Path -Path $Path)) { throw "Dataset not found: $Path" }

$lines = Get-Content -Path $Path
$updated = @()

foreach ($line in $lines) {
  if ([string]::IsNullOrWhiteSpace($line)) { $updated += $line; continue }
  $obj = $null
  try { $obj = $line | ConvertFrom-Json } catch { $updated += $line; continue }

  $hasSig = $obj.PSObject.Properties.Name -contains 'signature'
  $hasPayload = $obj.PSObject.Properties.Name -contains 'webhook_payload'
  $hasSecret = $obj.PSObject.Properties.Name -contains 'secret'
  $hasExpectedValid = $obj.PSObject.Properties.Name -contains 'expected_valid'

  if ($hasSig -and $hasPayload -and $hasSecret -and ($UpdateAll -or ($hasExpectedValid -and $obj.expected_valid -eq $true))) {
    # Extract timestamp if present in signature; else use current
    $timestamp = $null
    if ($obj.signature -match 't=(\d+),') { $timestamp = [long]$Matches[1] }
    if (-not $timestamp) { $timestamp = [long][double]::Parse((Get-Date -Date (Get-Date).ToUniversalTime() -UFormat %s)) }

    $payload = [string]$obj.webhook_payload
    $secret = [string]$obj.secret

    $raw = "$timestamp.$payload"
    $hmac = [System.Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($secret))
    $hashBytes = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($raw))
    $sig = ($hashBytes | ForEach-Object { $_.ToString('x2') }) -join ''
    $obj.signature = "t=$timestamp,v1=$sig"
  }

  $updated += ($obj | ConvertTo-Json -Compress)
}

# Backup and write
Copy-Item -Path $Path -Destination "$Path.bak" -Force
Set-Content -Path $Path -Value $updated -NoNewline
Write-Host "Updated signatures written to $Path. Backup at $Path.bak"
