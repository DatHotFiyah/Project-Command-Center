# Sync-Dashboard.ps1
# Synchronizes project working memory with the Command Center dashboard state.

$ledgerPath = "E:\openclaw\workspace\state\xp-ledger.json"
$workingDir = "E:\openclaw\workspace\working"
$htmlPath = "E:\openclaw\workspace\dashboard\diorama.html"

# Load the current ledger
if (Test-Path $ledgerPath) {
    $ledger = Get-Content $ledgerPath | ConvertFrom-Json
} else {
    $ledger = New-Object PSObject -Property @{ 
        projects = @(); 
        system = New-Object PSObject -Property @{ journalStreak = 0; reposOnline = 0; openLoops = 0; memoryIntegrity = 100; momentum = 0 }; 
        events = @();
        updatedAt = ""
    }
}

# Ensure properties exist
if (-not (Get-Member -InputObject $ledger -Name "events")) {
    $ledger | Add-Member -MemberType NoteProperty -Name "events" -Value @()
}

$totalTasks = 0
$completedTasksCount = 0

foreach ($project in $ledger.projects) {
    $workingFile = Join-Path $workingDir "$($project.slug).md"
    
    if (Test-Path $workingFile) {
        $content = Get-Content $workingFile
        
        # Extract tasks
        $allTasks = $content | Select-String -Pattern "^\s*-\s*\[[ x]\]\s*(.*)" | ForEach-Object { $_.Matches.Groups[1].Value.Trim() }
        $doneTasks = $content | Select-String -Pattern "^\s*-\s*\[x\]\s*(.*)" | ForEach-Object { $_.Matches.Groups[1].Value.Trim() }
        
        $pTotal = ($allTasks | Measure-Object).Count
        $pDone = ($doneTasks | Measure-Object).Count
        
        $totalTasks += $pTotal
        $completedTasksCount += $pDone
        
        # Ensure completedTasks property exists on project
        if (-not (Get-Member -InputObject $project -Name "completedTasks")) {
            $project | Add-Member -MemberType NoteProperty -Name "completedTasks" -Value @()
        }
        
        foreach ($task in $doneTasks) {
            if ($project.completedTasks -notcontains $task) {
                # New Task Completed!
                $event = New-Object PSObject -Property @{
                    timestamp = (Get-Date).ToString("HH:mm:ss")
                    type = "TASK_COMPLETE"
                    project = $project.name
                    character = if ($project.role) { $project.role } else { "System" }
                    text = "COMPLETED: $task"
                    xpGain = 50
                }
                $ledger.events += $event
                $project.completedTasks += $task
                
                # Update project XP
                $project.xp += 50
            }
        }
        
        # Calculate Level (ensure it doesn't drop)
        $newLevel = [math]::Floor($project.xp / 200) + 1
        if ($newLevel -gt $project.level) {
            $project.level = $newLevel
            $ledger.events += New-Object PSObject -Property @{
                timestamp = (Get-Date).ToString("HH:mm:ss")
                type = "LEVEL_UP"
                project = $project.name
                text = "LEVEL UP: $($project.class) REACHED LEVEL $($project.level)"
            }
        }
        
        # Extract Current Priority (first unchecked task)
        $nextTask = $content | Select-String -Pattern "^\s*-\s*\[ \]\s*(.*)" | Select-Object -First 1
        if ($nextTask) {
            $project.task = $nextTask.Matches.Groups[1].Value.Trim()
        } else {
            $project.task = "ALL TASKS COMPLETE"
            $project.mood = "stable"
        }
        
        # Extract all open tasks for the open loops panel
        $openTasks = $content | Select-String -Pattern "^\s*-\s*\[ \]\s*(.*)" | ForEach-Object { $_.Matches.Groups[1].Value.Trim() }
        # Ensure openTasks is an array (PS wraps single items)
        if ($null -eq $openTasks) {
            $openTasks = @()
        } elseif ($openTasks -isnot [system.array]) {
            $openTasks = @($openTasks)
        }
        
        # Ensure openTasks property exists on project
        if (-not (Get-Member -InputObject $project -Name "openTasks")) {
            $project | Add-Member -NotePropertyName "openTasks" -NotePropertyValue @()
        }
        $project.openTasks = $openTasks
    }
}

# Keep only last 15 events
if ($ledger.events.Count -gt 15) {
    $ledger.events = $ledger.events | Select-Object -Last 15
}

# --- Signal Drift Calculation ---
# Signal Drift (0-100%) measures how coherent and current the workspace is.
# 100% = tight, everything synced, no stale files, recent journal.
# Factors: recency, memory completeness, sync quality, journal health.

$daysSinceUpdate = if ($ledger.updatedAt) {
    [math]::Floor(((Get-Date) - [datetime]$ledger.updatedAt).TotalDays)
} else { 999 }

# Recency: start at 100%, lose 15% per day since last sync (min 40%)
$recencyScore = [math]::Max(40, 100 - ($daysSinceUpdate * 15))

# Memory completeness: +10% per valid working file (max +30%)
$workingFiles = Get-ChildItem $workingDir -Filter "*.md" -ErrorAction SilentlyContinue
$memoryScore = [math]::Min(30, ($workingFiles.Count * 10))

# Sync quality: if all ledger projects have matching working files
$projectSync = 0
$projectTotal = 0
foreach ($project in $ledger.projects) {
    $projectTotal++
    $wf = Join-Path $workingDir "$($project.slug).md"
    if (Test-Path $wf) { $projectSync++ }
}
$syncScore = if ($projectTotal -gt 0) { [math]::Round(($projectSync / $projectTotal) * 20) } else { 0 }

# Journal health: check if today or yesterday's daily log exists
$todayLog = "E:\openclaw\workspace\memory\$(Get-Date -Format 'yyyy-MM-dd').md"
$yesterdayLog = "E:\openclaw\workspace\memory\$((Get-Date).AddDays(-1).ToString('yyyy-MM-dd')).md"
$journalScore = 0
if (Test-Path $todayLog) { $journalScore = 10 }
elseif (Test-Path $yesterdayLog) { $journalScore = 5 }

$ledger.system.memoryIntegrity = [math]::Min(100, $recencyScore + $memoryScore + $syncScore + $journalScore)

# Update System Metrics
$ledger.system.openLoops = $totalTasks - $completedTasksCount
$ledger.system.momentum = if ($totalTasks -gt 0) { [math]::Round(($completedTasksCount / $totalTasks) * 100) } else { 0 }
$ledger.updatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")

# Save the updated ledger
$ledgerJson = $ledger | ConvertTo-Json -Depth 10
$ledgerJson | Out-File $ledgerPath -Encoding utf8

# Inject into diorama.html
if (Test-Path $htmlPath) {
    $html = Get-Content $htmlPath -Raw
    # Handle both single and double quotes for the script tag
    $pattern = '(?s)<script id=["'']embedded-xp["''] type=["'']application/json["'']>.*?</script>'
    $replacement = "<script id='embedded-xp' type='application/json'>`n$ledgerJson`n</script>"
    $newHtml = [regex]::Replace($html, $pattern, $replacement)
    $newHtml | Out-File $htmlPath -Encoding utf8
    Write-Host "Dashboard synced successfully."
} else {
    Write-Error "HTML path not found: $htmlPath"
}
