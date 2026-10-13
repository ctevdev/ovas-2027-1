[CmdletBinding()]
param(
    [string]$SourcePath = 'semestres'
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$candidatePath = if ([System.IO.Path]::IsPathRooted($SourcePath)) {
    $SourcePath
} else {
    Join-Path $repositoryRoot $SourcePath
}
$source = (Resolve-Path -LiteralPath $candidatePath).Path
$repositoryPrefix = $repositoryRoot.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar

if ($source -ne $repositoryRoot -and -not $source.StartsWith($repositoryPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'SourcePath debe estar dentro del repositorio.'
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

$catalogs = @()
if ((Split-Path -Leaf $source) -eq 'index.html' -and (Split-Path -Leaf (Split-Path -Parent $source)) -eq 'implementacion') {
    $catalogs = @(Get-Item -LiteralPath $source)
} elseif (Test-Path -LiteralPath $source -PathType Container) {
    $catalogs = @(Get-ChildItem -LiteralPath $source -Filter 'index.html' -File -Recurse | Where-Object {
        (Split-Path -Leaf $_.DirectoryName) -eq 'implementacion'
    })
}

$validatedCatalogs = 0
$validatedDownloads = 0
$errors = [System.Collections.Generic.List[string]]::new()

foreach ($catalog in $catalogs) {
    $html = Get-Content -LiteralPath $catalog.FullName -Raw
    $matches = [regex]::Matches(
        $html,
        'href\s*=\s*["'']\.\./publicables/([^"''?#]+\.zip)["'']',
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    if ($matches.Count -eq 0) {
        continue
    }

    $validatedCatalogs++
    $unitRoot = Split-Path -Parent $catalog.DirectoryName
    $publicables = Join-Path $unitRoot 'publicables'
    $downloadNames = @($matches | ForEach-Object {
        [System.Uri]::UnescapeDataString($_.Groups[1].Value)
    } | Sort-Object -Unique)

    foreach ($downloadName in $downloadNames) {
        $downloadPath = Join-Path $publicables $downloadName
        if (-not (Test-Path -LiteralPath $downloadPath -PathType Leaf)) {
            $errors.Add("Falta el ZIP enlazado '$downloadName' en $publicables")
            continue
        }

        try {
            $downloadZip = [System.IO.Compression.ZipFile]::OpenRead($downloadPath)
            try {
                if ($downloadZip.Entries.Count -eq 0) {
                    $errors.Add("El ZIP enlazado está vacío: $downloadPath")
                }
            } finally {
                $downloadZip.Dispose()
            }
            $validatedDownloads++
        } catch {
            $errors.Add("No se puede abrir el ZIP enlazado '$downloadPath': $($_.Exception.Message)")
        }
    }

    $serverPackages = @(Get-ChildItem -LiteralPath $publicables -Filter '*estructura-servidor.zip' -File -ErrorAction SilentlyContinue)
    if ($serverPackages.Count -eq 0) {
        continue
    }
    if ($serverPackages.Count -gt 1) {
        $errors.Add("Existe más de un paquete *estructura-servidor.zip en $publicables")
        continue
    }

    $serverPackage = $serverPackages[0]
    try {
        $serverZip = [System.IO.Compression.ZipFile]::OpenRead($serverPackage.FullName)
        try {
            $entryNames = @($serverZip.Entries | ForEach-Object { $_.FullName.Replace('\', '/') })
            $unitRelative = [System.IO.Path]::GetRelativePath($repositoryRoot, $unitRoot).Replace('\', '/')
            foreach ($downloadName in $downloadNames) {
                $expectedEntry = "$unitRelative/publicables/$downloadName"
                if ($entryNames -notcontains $expectedEntry) {
                    $errors.Add("El paquete '$($serverPackage.Name)' no incluye '$expectedEntry'")
                }
            }

            $selfEntry = "$unitRelative/publicables/$($serverPackage.Name)"
            if ($entryNames -contains $selfEntry) {
                $errors.Add("El paquete '$($serverPackage.Name)' contiene una copia de sí mismo")
            }
        } finally {
            $serverZip.Dispose()
        }
    } catch {
        $errors.Add("No se puede abrir el paquete de servidor '$($serverPackage.FullName)': $($_.Exception.Message)")
    }
}

if ($errors.Count -gt 0) {
    Write-Error ("Validación fallida:`n- " + ($errors -join "`n- "))
    exit 1
}

Write-Host "Validación correcta: $validatedCatalogs catálogo(s) y $validatedDownloads descarga(s)." -ForegroundColor Green
exit 0
