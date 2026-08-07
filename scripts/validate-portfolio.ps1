param(
    [switch]$Quiet
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Web
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]
$checks = 0

function Add-Check {
    param([bool]$Condition, [string]$Message)
    $script:checks++
    if (-not $Condition) { $script:errors.Add($Message) }
}

function Resolve-LocalPath {
    param([System.IO.FileInfo]$SourceFile, [string]$Link)
    $clean = $Link.Split('#')[0].Split('?')[0]
    $clean = [System.Web.HttpUtility]::UrlDecode($clean)
    if ($clean.StartsWith('/')) { return [System.IO.Path]::GetFullPath((Join-Path $root $clean.Substring(1))) }
    return [System.IO.Path]::GetFullPath((Join-Path $SourceFile.DirectoryName $clean))
}

# Global local-link, anchor, duplicate-ID, and target-blank checks.
$htmlFiles = Get-ChildItem -Path $root -Filter "*.html" -Recurse
foreach ($file in $htmlFiles) {
    $raw = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $content = [regex]::Replace($raw, '<!--.*?-->', '', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $relative = $file.FullName.Substring($root.Length).TrimStart('\')

    $ids = [regex]::Matches($content, '\sid="([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
    $duplicates = $ids | Group-Object | Where-Object { $_.Count -gt 1 }
    Add-Check ($duplicates.Count -eq 0) "$relative contains duplicate IDs: $($duplicates.Name -join ', ')"

    foreach ($match in [regex]::Matches($content, '(?:href|src)="([^"]+)"')) {
        $link = $match.Groups[1].Value
        if ($link -match '^(https?:|mailto:|tel:|data:|javascript:)' -or [string]::IsNullOrWhiteSpace($link)) { continue }
        if ($link.StartsWith('#')) {
            $anchor = $link.Substring(1)
            if ($anchor) { Add-Check ($ids -contains $anchor) "$relative points to missing same-page anchor #$anchor" }
            continue
        }
        $resolved = Resolve-LocalPath -SourceFile $file -Link $link
        Add-Check (Test-Path -LiteralPath $resolved) "$relative points to missing local asset or route: $link"
    }

    foreach ($anchorTag in [regex]::Matches($content, '<a\b[^>]*target="_blank"[^>]*>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) {
        Add-Check ($anchorTag.Value -match 'rel="[^"]*noopener') "$relative has target=_blank without rel=noopener: $($anchorTag.Value)"
    }
}

# Canonical project data validation.
$dataPath = Join-Path $root 'scripts\project-worlds-data.js'
Add-Check (Test-Path -LiteralPath $dataPath) 'Canonical Project Worlds data file is missing.'
if (Test-Path -LiteralPath $dataPath) {
    $dataSource = [System.IO.File]::ReadAllText($dataPath, [System.Text.Encoding]::UTF8)
    $dataMatch = [regex]::Match($dataSource, 'Object\.freeze\((\[[\s\S]*?\])\);')
    Add-Check $dataMatch.Success 'Project Worlds data could not be parsed as JSON.'
    if ($dataMatch.Success) {
        $projects = $dataMatch.Groups[1].Value | ConvertFrom-Json
        Add-Check ($projects.Count -eq 4) "Expected 4 Project Worlds; found $($projects.Count)."
        Add-Check (($projects.number | Sort-Object -Unique).Count -eq $projects.Count) 'Project numbers are not unique.'
        Add-Check (($projects.slug | Sort-Object -Unique).Count -eq $projects.Count) 'Project slugs are not unique.'

        foreach ($project in $projects) {
            $label = "$($project.number) $($project.title)"
            Add-Check (-not [string]::IsNullOrWhiteSpace($project.description)) "$label has an empty description."
            Add-Check ($project.roles.Count -gt 0) "$label has no role/status detail."
            if ($project.status -eq 'published') {
                Add-Check (-not [string]::IsNullOrWhiteSpace($project.caseStudy)) "$label has no case-study route."
                Add-Check (-not [string]::IsNullOrWhiteSpace($project.poster)) "$label has no poster."
                $uri = $null
                $validUri = [System.Uri]::TryCreate([string]$project.live, [System.UriKind]::Absolute, [ref]$uri) -and $uri.Scheme -eq 'https'
                Add-Check $validUri "$label has an invalid live URL."

                if ($project.caseStudy) { Add-Check (Test-Path -LiteralPath (Join-Path $root $project.caseStudy)) "$label case-study route is missing: $($project.caseStudy)" }
                if ($project.poster) {
                    $posterPath = Join-Path $root $project.poster
                    Add-Check (Test-Path -LiteralPath $posterPath) "$label poster is missing: $($project.poster)"
                    if (Test-Path -LiteralPath $posterPath) {
                        $image = [System.Drawing.Image]::FromFile($posterPath)
                        try {
                            Add-Check ($image.Width -eq [int]$project.posterWidth -and $image.Height -eq [int]$project.posterHeight) "$label declared poster dimensions do not match the file."
                        } finally { $image.Dispose() }
                    }
                }
            } elseif ($project.status -eq 'private') {
                Add-Check (-not $project.caseStudy -and -not $project.live) "$label is private but exposes an unverified public link."
            } else {
                Add-Check $false "$label has an unsupported status: $($project.status)"
            }
        }
    }
}

# Homepage structural, accessibility, and media checks.
$homePath = Join-Path $root 'index.html'
$homeContent = [System.IO.File]::ReadAllText($homePath, [System.Text.Encoding]::UTF8)
Add-Check ($homeContent -match '<html lang="en">') 'Homepage is missing a valid language declaration.'
Add-Check ($homeContent -match '<main\b[^>]*\bid="main-content"[^>]*>') 'Homepage is missing its main landmark.'
Add-Check ([regex]::Matches($homeContent, '<h1\b').Count -eq 1) 'Homepage must contain exactly one H1.'
Add-Check ($homeContent -match 'class="skip-link"') 'Homepage is missing a skip link.'
Add-Check ($homeContent -notmatch '<video\b|<canvas\b') 'Homepage must not depend on video or canvas/WebGL.'
Add-Check ($homeContent -notmatch 'class="cursor"') 'Homepage still contains a custom cursor.'

foreach ($imageTag in [regex]::Matches($homeContent, '<img\b[^>]*>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) {
    Add-Check ($imageTag.Value -match '\balt="[^"]*"') "Homepage image is missing alt text: $($imageTag.Value)"
    Add-Check ($imageTag.Value -match '\bwidth="\d+"' -and $imageTag.Value -match '\bheight="\d+"') "Homepage image is missing intrinsic dimensions: $($imageTag.Value)"
}

$requiredFields = @('name', 'email', 'company', 'projectType', 'message')
foreach ($field in $requiredFields) {
    $labelPattern = '<label[^>]*for="' + [regex]::Escape($field) + '"'
    $idPattern = 'id="' + [regex]::Escape($field) + '"'
    Add-Check ($homeContent -match $labelPattern) "Contact field $field has no visible label."
    Add-Check ($homeContent -match $idPattern) "Contact field $field is missing."
}

$cssPath = Join-Path $root 'styles\project-worlds.css'
$css = [System.IO.File]::ReadAllText($cssPath, [System.Text.Encoding]::UTF8)
Add-Check ($css -match '@media \(prefers-reduced-motion:reduce\)') 'Reduced-motion CSS is missing.'
Add-Check ($css -match ':focus-visible') 'Visible focus styling is missing.'

# Transfer-size budgets for files directly referenced by the homepage.
$referenced = New-Object System.Collections.Generic.HashSet[string]
foreach ($match in [regex]::Matches($homeContent, '(?:href|src)="([^"]+)"')) {
    $link = $match.Groups[1].Value
    if ($link -match '^(https?:|mailto:|tel:|#)' -or $link -eq '') { continue }
    $resolved = Resolve-LocalPath -SourceFile (Get-Item $homePath) -Link $link
    if (Test-Path -LiteralPath $resolved -PathType Leaf) { [void]$referenced.Add($resolved) }
}
$homeBytes = (Get-Item $homePath).Length
$assetBytes = 0
foreach ($path in $referenced) { $assetBytes += (Get-Item $path).Length }
$totalBytes = $homeBytes + $assetBytes
Add-Check ($totalBytes -lt 3MB) "Homepage referenced local transfer exceeds 3 MB: $([math]::Round($totalBytes / 1MB, 2)) MB."

if (-not $Quiet) {
    Write-Host "Portfolio validation"
    Write-Host "HTML routes: $($htmlFiles.Count)"
    Write-Host "Checks executed: $checks"
    Write-Host "Homepage HTML: $([math]::Round($homeBytes / 1KB, 1)) KB"
    Write-Host "Homepage referenced local files: $($referenced.Count)"
    Write-Host "Homepage referenced local transfer: $([math]::Round($totalBytes / 1MB, 2)) MB"
}

if ($warnings.Count -gt 0 -and -not $Quiet) {
    Write-Host "Warnings: $($warnings.Count)"
    $warnings | ForEach-Object { Write-Host "WARN: $_" }
}

if ($errors.Count -gt 0) {
    Write-Host "FAIL: $($errors.Count) validation error(s)"
    $errors | ForEach-Object { Write-Host "ERROR: $_" }
    exit 1
}

Write-Host "PASS: all $checks checks passed"
exit 0
