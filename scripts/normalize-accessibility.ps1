$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$stylePath = Join-Path $root 'styles\accessibility-baseline.css'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$changed = 0
$failed = New-Object System.Collections.Generic.List[string]

foreach ($file in Get-ChildItem -Path $root -Filter '*.html' -Recurse) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $original = $content

    $relativeFile = $file.FullName.Substring($root.Length).TrimStart('\')
    $directoryPart = Split-Path -Parent $relativeFile
    $depth = if ([string]::IsNullOrWhiteSpace($directoryPart)) { 0 } else { ($directoryPart -split '\\').Count }
    $prefix = if ($depth -eq 0) { '' } else { '../' * $depth }
    $styleHref = $prefix + 'styles/accessibility-baseline.css'

    if ($content -notmatch 'accessibility-baseline\.css') {
        $content = $content.Replace('</head>', "<link rel=`"stylesheet`" href=`"$styleHref`">`r`n</head>")
    }

    if ($content -notmatch 'class="skip-link"') {
        $bodyMatch = [regex]::Match($content, '<body[^>]*>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        if ($bodyMatch.Success) {
            $insertAt = $bodyMatch.Index + $bodyMatch.Length
            $content = $content.Insert($insertAt, "`r`n<a class=`"skip-link`" href=`"#main-content`">Skip to main content</a>")
        } else {
            $failed.Add("$relativeFile has no body element.")
        }
    }

    if ($content -notmatch '<main\b') {
        $navClose = [regex]::Match($content, '</nav>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        $footerOpen = [regex]::Match($content, '<footer\b', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        if ($navClose.Success -and $footerOpen.Success -and $footerOpen.Index -gt $navClose.Index) {
            $mainStart = $navClose.Index + $navClose.Length
            $content = $content.Insert($mainStart, "`r`n<main id=`"main-content`">")
            $footerOpen = [regex]::Match($content, '<footer\b', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            $content = $content.Insert($footerOpen.Index, "</main>`r`n")
        } else {
            $failed.Add("$relativeFile could not be wrapped with a main landmark.")
        }
    }

    # Make the skip-link destination programmatically focusable in every route.
    $content = $content.Replace('<main id="main-content">', '<main id="main-content" tabindex="-1">')

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8)
        $changed++
    }
}

# Normalize repeated card headings where the page H1 was followed directly by H3.
$categoryPages = @('ads.html', 'meta-ads.html', 'social-media.html')
foreach ($relativePath in $categoryPages) {
    $path = Join-Path $root $relativePath
    $content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    $updated = $content.Replace('.card-body h3', '.card-body h2').Replace('<h3>', '<h2>').Replace('</h3>', '</h2>')
    if ($updated -ne $content) {
        [System.IO.File]::WriteAllText($path, $updated, $utf8)
        $changed++
    }
}

$scopePages = @('xavik-labs.html', 'nafume.html', 'padma-shree-travels.html', 'pankhuri.html', 'upsc-quiz-app.html')
foreach ($relativePath in $scopePages) {
    $path = Join-Path $root $relativePath
    $content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    $updated = $content.Replace('.scope-card h3', '.scope-card h2').Replace('<h3>', '<h2>').Replace('</h3>', '</h2>')
    if ($updated -ne $content) {
        [System.IO.File]::WriteAllText($path, $updated, $utf8)
        $changed++
    }
}

# Correct the remaining deeper article heading reported by the static scanner.
$processArticlePath = Join-Path $root 'blog\social-media-design-process-explained.html'
$processArticle = [System.IO.File]::ReadAllText($processArticlePath, [System.Text.Encoding]::UTF8)
$processArticleUpdated = $processArticle.Replace('<h4>Related Articles</h4>', '<h3>Related Articles</h3>')
if ($processArticleUpdated -ne $processArticle) {
    [System.IO.File]::WriteAllText($processArticlePath, $processArticleUpdated, $utf8)
    $changed++
}

$comparisonPath = Join-Path $root 'blog\social-media-packages-smm-agency.html'
$comparisonContent = [System.IO.File]::ReadAllText($comparisonPath, [System.Text.Encoding]::UTF8)
$comparisonUpdated = $comparisonContent
if ($comparisonContent -notmatch 'Comparison of DIY, agency, and freelancer social media support') {
    $comparisonUpdated = $comparisonContent.Replace('<table class="comp-table">', '<table class="comp-table">' + "`r`n    <caption>Comparison of DIY, agency, and freelancer social media support</caption>")
}
if ($comparisonUpdated -ne $comparisonContent) {
    [System.IO.File]::WriteAllText($comparisonPath, $comparisonUpdated, $utf8)
    $changed++
}

Write-Host "Accessibility normalization changed $changed HTML file(s)."
if ($failed.Count -gt 0) {
    $failed | ForEach-Object { Write-Host "ERROR: $_" }
    exit 1
}
exit 0
