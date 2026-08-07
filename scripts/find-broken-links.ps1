# Scans every *.html file in the project for local href/src links that
# don't resolve to a real file, and writes a CSV report.
#
# Usage: run from anywhere — it resolves the project root relative to
# this script's own location, so it works on any machine/checkout.
#   powershell -File scripts\find-broken-links.ps1
#
# Output: broken-links-report.csv in the project root (git-ignored).

Add-Type -AssemblyName System.Web

$baseDir = Split-Path -Parent $PSScriptRoot
$files = Get-ChildItem -Path $baseDir -Filter "*.html" -Recurse

$brokenLinks = @()

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $content = [regex]::Replace($content, '<!--.*?-->', '', [System.Text.RegularExpressions.RegexOptions]::Singleline)

    $matches = [regex]::Matches($content, '(?:href|src)="([^"]+)"')

    foreach ($m in $matches) {
        $link = $m.Groups[1].Value

        if ($link -match "^https?://" -or $link -match "^mailto:" -or $link -match "^tel:" -or $link.Trim() -eq "" -or $link.StartsWith("#") -or $link.StartsWith("data:") -or $link -match "^/\#") {
            continue
        }

        # Remove query params and hashes
        $cleanLink = $link.Split('#')[0].Split('?')[0]
        if ($cleanLink -eq "") {
            continue
        }

        # Decode URL encoding (e.g. %20 to space)
        $cleanLink = [System.Web.HttpUtility]::UrlDecode($cleanLink)

        $targetPath = ""

        if ($cleanLink.StartsWith("/")) {
            # Root relative: starts from $baseDir
            $targetPath = Join-Path $baseDir $cleanLink.Substring(1)
        } else {
            # Relative to current file
            $targetPath = Join-Path $file.DirectoryName $cleanLink
        }

        $targetPath = [System.IO.Path]::GetFullPath($targetPath)

        if (-not (Test-Path $targetPath)) {
            $brokenLinks += [PSCustomObject]@{
                File = $file.FullName.Replace($baseDir, "")
                Link = $link
                Resolved = $targetPath
            }
        }
    }
}

if ($brokenLinks.Count -gt 0) {
    $reportPath = Join-Path $baseDir "broken-links-report.csv"
    $brokenLinks | Export-Csv -Path $reportPath -NoTypeInformation -Encoding utf8
    Write-Host "Found $($brokenLinks.Count) broken links. Report saved to $reportPath"
} else {
    $reportPath = Join-Path $baseDir "broken-links-report.csv"
    if (Test-Path -LiteralPath $reportPath) {
        Remove-Item -LiteralPath $reportPath -Force
    }
    Write-Host "No broken links found!"
}
