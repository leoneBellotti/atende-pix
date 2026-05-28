param(
  [string]$EnvFile = ".env",
  [string]$BackupDir,
  [int]$RetentionDays = 0
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
$database = Get-Setting -Name "POSTGRES_DATABASE" -Default "atende_pix"
$user = Get-Setting -Name "POSTGRES_USER" -Default "atende_pix"
$password = Get-Setting -Name "POSTGRES_PASSWORD" -Default "atende_pix"

if ([string]::IsNullOrWhiteSpace($BackupDir)) {
  $BackupDir = Get-Setting -Name "BACKUP_DIR" -Default ".backups/postgres"
}

if ($RetentionDays -le 0) {
  $RetentionDays = [int](Get-Setting -Name "BACKUP_RETENTION_DAYS" -Default "14")
}

$docker = Get-Command docker -ErrorAction SilentlyContinue
if (!$docker) {
  throw "Docker nao encontrado no PATH."
}

$runningContainer = docker ps --filter "name=^/$container$" --format "{{.Names}}"
if ($runningContainer -ne $container) {
  throw "Container Postgres '$container' nao esta em execucao."
}

$resolvedBackupDir = New-Item -ItemType Directory -Path $BackupDir -Force
$backupRoot = $resolvedBackupDir.FullName
if ([string]::IsNullOrWhiteSpace($backupRoot) -or [System.IO.Path]::GetPathRoot($backupRoot) -eq $backupRoot) {
  throw "Diretorio de backup invalido: $backupRoot"
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = Join-Path $backupRoot "$database`_$timestamp.sql"
$errorPath = Join-Path $backupRoot "$database`_$timestamp.err.log"

$arguments = @(
  "exec",
  "-e",
  "PGPASSWORD=$password",
  $container,
  "pg_dump",
  "-U",
  $user,
  "-d",
  $database,
  "--clean",
  "--if-exists",
  "--no-owner",
  "--no-privileges"
)

$process = Start-Process -FilePath "docker" -ArgumentList $arguments -NoNewWindow -Wait -PassThru -RedirectStandardOutput $backupPath -RedirectStandardError $errorPath

if ($process.ExitCode -ne 0) {
  if (Test-Path -LiteralPath $backupPath) {
    Remove-Item -LiteralPath $backupPath -Force
  }

  $details = if (Test-Path -LiteralPath $errorPath) { Get-Content -LiteralPath $errorPath -Raw } else { "" }
  throw "Backup falhou. $details"
}

if ((Get-Item -LiteralPath $backupPath).Length -le 0) {
  throw "Backup gerado vazio: $backupPath"
}

if (Test-Path -LiteralPath $errorPath) {
  $errorSize = (Get-Item -LiteralPath $errorPath).Length
  if ($errorSize -eq 0) {
    Remove-Item -LiteralPath $errorPath -Force
  }
}

$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -LiteralPath $backupRoot -Filter "$database`_*.sql" |
  Where-Object { $_.LastWriteTime -lt $cutoff } |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }

Write-Output "Backup criado: $backupPath"
