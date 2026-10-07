[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$Server,

    [string]$User,

    [string]$RemoteRoot,

    [string]$IdentityFile,

    [int]$Port = 0,

    [string]$SourcePath = 'semestres',

    [string]$ConfigFile = '.deploy.local.psd1'
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$configPath = if ([System.IO.Path]::IsPathRooted($ConfigFile)) { $ConfigFile } else { Join-Path $repositoryRoot $ConfigFile }
$config = if (Test-Path -LiteralPath $configPath) { Import-PowerShellDataFile -LiteralPath $configPath } else { @{} }

if (-not $PSBoundParameters.ContainsKey('Server')) { $Server = $config.Server }
if (-not $PSBoundParameters.ContainsKey('User')) { $User = $config.User }
if (-not $PSBoundParameters.ContainsKey('RemoteRoot')) { $RemoteRoot = $config.RemoteRoot }
if (-not $PSBoundParameters.ContainsKey('IdentityFile')) { $IdentityFile = $config.IdentityFile }
if (-not $PSBoundParameters.ContainsKey('Port')) { $Port = if ($config.Port) { [int]$config.Port } else { 22 } }

foreach ($requiredValue in @{
    Server = $Server
    User = $User
    RemoteRoot = $RemoteRoot
    IdentityFile = $IdentityFile
}.GetEnumerator()) {
    if ([string]::IsNullOrWhiteSpace([string]$requiredValue.Value)) {
        throw "Falta $($requiredValue.Key). Indíquelo como parámetro o en $configPath."
    }
}

if ($Server -notmatch '^[A-Za-z0-9._-]+$') { throw 'Server contiene caracteres no válidos.' }
if ($User -notmatch '^[A-Za-z0-9._-]+$') { throw 'User contiene caracteres no válidos.' }
if ($RemoteRoot -notmatch '^/[A-Za-z0-9._/-]+$') { throw 'RemoteRoot debe ser una ruta absoluta sin espacios.' }
if ($RemoteRoot.Split('/', [System.StringSplitOptions]::RemoveEmptyEntries) -contains '..') { throw 'RemoteRoot no puede contener segmentos ..' }
if ($Port -lt 1 -or $Port -gt 65535) { throw 'Port debe estar entre 1 y 65535.' }

$identity = (Resolve-Path -LiteralPath $IdentityFile).Path
$source = (Resolve-Path -LiteralPath (Join-Path $repositoryRoot $SourcePath)).Path

if ($RemoteRoot -eq '/') {
    throw 'La raíz / no puede utilizarse como destino de publicación.'
}

$repositoryPrefix = $repositoryRoot.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
if ($source -ne $repositoryRoot -and -not $source.StartsWith($repositoryPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'SourcePath debe estar dentro del repositorio.'
}

$relativeSource = [System.IO.Path]::GetRelativePath($repositoryRoot, $source).Replace('\', '/')
if ($relativeSource.StartsWith('../') -or $relativeSource -eq '..') {
    throw 'SourcePath debe estar dentro del repositorio.'
}

foreach ($command in @('tar.exe', 'scp.exe', 'ssh.exe')) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "No se encontró $command. Instale o habilite OpenSSH en Windows."
    }
}

$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('ovas-deploy-' + [guid]::NewGuid().ToString('N'))
$archiveName = 'ovas-' + [guid]::NewGuid().ToString('N') + '.tar.gz'
$localArchive = Join-Path $temporaryRoot $archiveName
$remoteArchive = $RemoteRoot.TrimEnd('/') + '/.' + $archiveName
$destination = "$User@$Server"

if ($WhatIfPreference) {
    $null = $PSCmdlet.ShouldProcess("$destination`:$RemoteRoot", "Publicar $relativeSource por SSH")
    return
}

New-Item -ItemType Directory -Path $temporaryRoot | Out-Null

try {
    Write-Host "Preparando: $relativeSource"
    & tar.exe -czf $localArchive -C $repositoryRoot $relativeSource
    if ($LASTEXITCODE -ne 0) { throw 'No fue posible crear el paquete temporal.' }

    $sizeMb = [math]::Round((Get-Item -LiteralPath $localArchive).Length / 1MB, 2)
    Write-Host "Paquete temporal: $sizeMb MB"

    if (-not $PSCmdlet.ShouldProcess("$destination`:$RemoteRoot", "Publicar $relativeSource por SSH")) {
        return
    }

    $sshOptions = @('-i', $identity, '-p', $Port, '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes')
    & ssh.exe @sshOptions $destination "mkdir -p '$RemoteRoot'"
    if ($LASTEXITCODE -ne 0) { throw 'No fue posible preparar la ruta remota.' }

    $scpOptions = @('-i', $identity, '-P', $Port, '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes')
    & scp.exe @scpOptions $localArchive "${destination}:$remoteArchive"
    if ($LASTEXITCODE -ne 0) { throw 'No fue posible transferir el paquete al servidor.' }

    $remoteCommand = "tar -xzf '$remoteArchive' -C '$RemoteRoot' && rm -f '$remoteArchive' && test -e '$RemoteRoot/$relativeSource'"
    & ssh.exe @sshOptions $destination $remoteCommand
    if ($LASTEXITCODE -ne 0) { throw 'El servidor no pudo extraer o verificar la publicación.' }

    Write-Host "Publicación completada: $destination`:$RemoteRoot/$relativeSource" -ForegroundColor Green
}
finally {
    if (Test-Path -LiteralPath $temporaryRoot) {
        Remove-Item -LiteralPath $temporaryRoot -Recurse -Force
    }
}
