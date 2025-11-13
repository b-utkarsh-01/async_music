# PowerShell script — download face-api model files into public/models
# Run this from the project root (async_music folder):
#    .\scripts\download-faceapi-models.ps1

$targetDir = Join-Path -Path (Get-Location) -ChildPath "public\models"
if (!(Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }

$base = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
$files = @(
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1",
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model-shard1",
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model-shard1",
  "face_expression_model-weights_manifest.json",
  "face_expression_model-shard1"
)

Write-Host "Downloading face-api model files to $targetDir"
foreach ($f in $files) {
  $url = "$base/$f"
  $out = Join-Path $targetDir $f
  try {
    Write-Host "Downloading $f..."
    Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -ErrorAction Stop
    Write-Host "Saved: $out"
  } catch {
    Write-Warning "Failed to download $url — $_"
  }
}

Write-Host "Done. If any files failed, check the README for manual download instructions."