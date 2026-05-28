param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,
  [string]$EnvFile = ".env"
)

$ErrorActionPreference = "Stop"

function Import-DotEnv {
  param([string]$Path)

  if (!(Test-Path -LiteralPath $Path)) {
    return
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()

    if (!$line -or $line.StartsWith("#") -or !$line.Contains("=")) {
      return
    }

    $parts = $line.Split("=", 2)
    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")

    if ($name -and !(Test-Path "Env:$name")) {
      Set-Item -Path "Env:$name" -Value $value
    }
  }
}

function Get-Setting {
  param(
    [string]$Name,
    [string]$Default
  )

  $value = [Environment]::GetEnvironmentVariable($Name)

  if ([string]::IsNullOrWhiteSpace($value)) {
    return $Default
  }

  return $value
}

Import-DotEnv -Path $EnvFile

$container = Get-Setting -Name "POSTGRES_CONTAINER" -Default "atende-pix-postgres"
$user = Get-Setting -Name "POSTGRES_USER" -Default "atende_pix"
$password = Get-Setting -Name "POSTGRES_PASSWORD" -Default "atende_pix"
$restoreDatabase = "atende_pix_restore_check_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

if (!(Test-Path -LiteralPath $BackupPath)) {
  throw "Arquivo de backup nao encontrado: $BackupPath"
}

$runningContainer = docker ps --filter "name=^/$container$" --format "{{.Names}}"
if ($runningContainer -ne $container) {
  throw "Container Postgres '$container' nao esta em execucao."
}

try {
  docker exec -e "PGPASSWORD=$password" $container createdb -U $user $restoreDatabase

  Get-Content -LiteralPath $BackupPath -Raw |
    docker exec -i -e "PGPASSWORD=$password" $container psql -U $user -d $restoreDatabase -v ON_ERROR_STOP=1 | Out-Null

  $tableCount = docker exec -e "PGPASSWORD=$password" $container psql -U $user -d $restoreDatabase -t -A -c "select count(*) from information_schema.tables where table_schema = 'public';"
  Write-Output "Restore validado em banco temporario '$restoreDatabase' com $($tableCount.Trim()) tabelas publicas."
} finally {
  docker exec -e "PGPASSWORD=$password" $container dropdb -U $user --if-exists $restoreDatabase | Out-Null
}
