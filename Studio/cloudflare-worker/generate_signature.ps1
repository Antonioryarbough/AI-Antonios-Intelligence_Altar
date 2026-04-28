<#
.SYNOPSIS
Generates a valid Stripe-Signature header for testing webhook verification.

.DESCRIPTION
Computes HMAC-SHA256 over "<timestamp>.<payload>" using your webhook signing secret.
Outputs the header string: "Stripe-Signature: t=<timestamp>,v1=<hex_sig>".

.PARAMETER Secret
Stripe webhook signing secret (e.g., whsec_...). Required.

.PARAMETER Timestamp
Unix epoch seconds. If omitted, current UTC timestamp is used.

.PARAMETER PayloadPath
Path to a file containing the raw JSON payload. Mutually exclusive with -Payload.

.PARAMETER Payload
Raw JSON payload string. Mutually exclusive with -PayloadPath.

.PARAMETER OutputOnly
If set, outputs only the header value (without the leading key name).

.EXAMPLE
./generate_signature.ps1 -Secret "whsec_test" -Timestamp 1234567890 -Payload '{"id":"evt_test","type":"checkout.session.completed"}'

.EXAMPLE
./generate_signature.ps1 -Secret $env:STRIPE_WEBHOOK_SECRET -PayloadPath .\evaluation\sample_payload.json

#>
[CmdletBinding()] param(
    [Parameter(Mandatory=$true)]
    [string] $Secret,

    [Parameter(Mandatory=$false)]
    [long] $Timestamp,

    [Parameter(Mandatory=$false, ParameterSetName="File")]
    [string] $PayloadPath,

    [Parameter(Mandatory=$false, ParameterSetName="Inline")]
    [string] $Payload,

    [switch] $OutputOnly
)

function Get-CurrentUnixSeconds {
    $nowUtc = (Get-Date).ToUniversalTime()
    return [long][double]::Parse($nowUtc.ToString('yyyy-MM-ddTHH:mm:ssZ') | Out-Null; [double]((Get-Date -Date $nowUtc -UFormat %s)))
}

if (-not $Timestamp -or $Timestamp -le 0) {
    $Timestamp = [long][double]::Parse((Get-Date -Date (Get-Date).ToUniversalTime() -UFormat %s))
}

if ($PSCmdlet.ParameterSetName -eq "File") {
    if (-not (Test-Path -Path $PayloadPath)) {
        throw "PayloadPath not found: $PayloadPath"
    }
    $Payload = Get-Content -Path $PayloadPath -Raw
} elseif ($PSCmdlet.ParameterSetName -eq "Inline") {
    if (-not $Payload) {
        throw "Provide -Payload or use -PayloadPath to read from file."
    }
} else {
    throw "Provide -Payload or -PayloadPath."
}

# Build raw string: "<timestamp>.<payload>"
$raw = "$Timestamp.$Payload"

# Compute HMAC-SHA256
$hmac = [System.Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($Secret))
$hashBytes = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($raw))
$sig = ($hashBytes | ForEach-Object { $_.ToString("x2") }) -join ""

$headerValue = "t=$Timestamp,v1=$sig"
if ($OutputOnly) {
    Write-Output $headerValue
} else {
    Write-Output "Stripe-Signature: $headerValue"
}
