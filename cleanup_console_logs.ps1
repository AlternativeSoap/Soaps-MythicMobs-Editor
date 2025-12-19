# Script to remove debugging console.log statements while keeping console.error/warn
# This removes emoji-based debug logs but keeps admin panel error logging

$files = Get-ChildItem -Path "." -Include "*.js" -Recurse -Exclude "node_modules"

$patterns = @(
    "console\.log\(['\`"][✅🔍📦☁️💾🚀ℹ️📋📄🎁🔑🧹✨⏳📭👁️🔄➕📤🎮💾📝⏰❌⚠️💜🧙🔧🎬📦🔍🛠️📋🎯]\s*.*?\);\s*\n",
    "if \(window\.DEBUG_MODE\) console\.log\(.*?\);\s*\n",
    "console\.log\('%c✅.*?\);\s*\n",
    "console\.log\('%c🔍.*?\);\s*\n",
    "console\.log\('%cℹ️.*?\);\s*\n"
)

$removedCount = 0

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)" -ForegroundColor Cyan
    
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalLength = $content.Length
    
    foreach ($pattern in $patterns) {
        $content = $content -replace $pattern, ""
    }
    
    if ($content.Length -ne $originalLength) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $removedCount++
        Write-Host "  ✓ Cleaned" -ForegroundColor Green
    }
}

Write-Host "`nCleaned $removedCount files" -ForegroundColor Yellow
