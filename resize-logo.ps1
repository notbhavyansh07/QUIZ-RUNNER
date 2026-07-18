[void][System.Reflection.Assembly]::LoadWithPartialName("System.Drawing")

$sourcePath = "C:\Users\HP\.gemini\antigravity\brain\67b8223e-e40e-40d2-bfee-0f6885cbbc78\media__1784386377335.jpg"
$baseDir = "c:\Users\HP\OneDrive\Desktop\game claude + anti"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image not found!"
    exit 1
}

# Function to resize image (standard full scale)
function Resize-Image {
    param (
        [string]$SrcPath,
        [string]$DstPath,
        [int]$Width,
        [int]$Height
    )
    $srcImg = [System.Drawing.Image]::FromFile($SrcPath)
    $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    $g.DrawImage($srcImg, 0, 0, $Width, $Height)
    
    $g.Dispose()
    $srcImg.Dispose()
    
    # Ensure destination folder exists
    $parent = Split-Path $DstPath
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    
    $bmp.Save($DstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created: $DstPath"
}

# Function to resize with adaptive padding (logo is centered, padded, transparent background)
function Resize-Foreground-Image {
    param (
        [string]$SrcPath,
        [string]$DstPath,
        [int]$Size
    )
    $srcImg = [System.Drawing.Image]::FromFile($SrcPath)
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.Clear([System.Drawing.Color]::Transparent)
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Scale to 70% of the total size for safe safezone margin
    $paddedSize = [int]($Size * 0.70)
    $offset = [int](($Size - $paddedSize) / 2)
    
    $g.DrawImage($srcImg, $offset, $offset, $paddedSize, $paddedSize)
    
    $g.Dispose()
    $srcImg.Dispose()
    
    $bmp.Save($DstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created Foreground: $DstPath"
}

# Function to resize with round circular clip mask
function Resize-Round-Image {
    param (
        [string]$SrcPath,
        [string]$DstPath,
        [int]$Size
    )
    $srcImg = [System.Drawing.Image]::FromFile($SrcPath)
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.Clear([System.Drawing.Color]::Transparent)
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $Size, $Size)
    $g.SetClip($path)
    
    $g.DrawImage($srcImg, 0, 0, $Size, $Size)
    
    $path.Dispose()
    $g.Dispose()
    $srcImg.Dispose()
    
    $bmp.Save($DstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created Round: $DstPath"
}

# --- 1. Generate Web App Icons ---
Resize-Image $sourcePath "$baseDir\images\logo.png" 256 256
Resize-Image $sourcePath "$baseDir\images\icon-192.png" 192 192
Resize-Image $sourcePath "$baseDir\images\icon-512.png" 512 512

# --- 2. Generate Android Mipmap Icons ---
$androidRes = "$baseDir\android\app\src\main\res"
$mipmapSizes = @{
    "mdpi" = 48
    "hdpi" = 72
    "xhdpi" = 96
    "xxhdpi" = 144
    "xxxhdpi" = 192
}

foreach ($folder in $mipmapSizes.Keys) {
    $size = $mipmapSizes[$folder]
    $folderPath = "$androidRes\mipmap-$folder"
    
    # Normal launcher icon
    Resize-Image $sourcePath "$folderPath\ic_launcher.png" $size $size
    
    # Circular launcher icon
    Resize-Round-Image $sourcePath "$folderPath\ic_launcher_round.png" $size $size
    
    # Adaptive foreground icon
    Resize-Foreground-Image $sourcePath "$folderPath\ic_launcher_foreground.png" $size $size
}

Write-Host "All icons resized and copied successfully!"
