Add-Type -AssemblyName System.Drawing

# Source sheets live outside public/ so the build does not copy 58 MB of unused art into dist/.
$srcDir = "C:\Users\quyen.nguyen\Documents\Quyen\Metal Slug\art-source\Metal Slug 3"
$outDir = "C:\Users\quyen.nguyen\Documents\Quyen\Metal Slug\public\assets\packed"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Is-BgColor($c, $bg, $tol = 6) {
  if ($c.A -lt 20) { return $true }
  return ([Math]::Abs($c.R - $bg.R) -le $tol -and [Math]::Abs($c.G - $bg.G) -le $tol -and [Math]::Abs($c.B - $bg.B) -le $tol)
}

function Extract-RowSprites($bmp, $yMin, $yMax, $xMax, $bg, $minW = 14, $minH = 14) {
  $w = [Math]::Min($xMax, $bmp.Width)
  $y1 = [Math]::Min($yMax, $bmp.Height - 1)
  $colHasPixel = New-Object bool[] $w
  for ($x = 0; $x -lt $w; $x++) {
    for ($y = $yMin; $y -le $y1; $y++) {
      if (-not (Is-BgColor ($bmp.GetPixel($x, $y)) $bg)) {
        $colHasPixel[$x] = $true
        break
      }
    }
  }

  $boxes = @()
  $inSpan = $false
  $sx = 0
  for ($x = 0; $x -lt $w; $x++) {
    if ($colHasPixel[$x] -and -not $inSpan) {
      $inSpan = $true; $sx = $x
    } elseif ((-not $colHasPixel[$x] -or $x -eq $w - 1) -and $inSpan) {
      $ex = if ($colHasPixel[$x]) { $x } else { $x - 1 }
      $inSpan = $false
      # Find tight vertical bounds
      $top = $y1; $bot = $yMin
      for ($xx = $sx; $xx -le $ex; $xx++) {
        for ($yy = $yMin; $yy -le $y1; $yy++) {
          if (-not (Is-BgColor ($bmp.GetPixel($xx, $yy)) $bg)) {
            if ($yy -lt $top) { $top = $yy }
            if ($yy -gt $bot) { $bot = $yy }
          }
        }
      }
      $bw = $ex - $sx + 1
      $bh = $bot - $top + 1
      if ($bw -ge $minW -and $bh -ge $minH) {
        $boxes += [PSCustomObject]@{ X = $sx; Y = $top; W = $bw; H = $bh }
      }
    }
  }
  return $boxes
}

function Pack-Strip($srcFile, $outFile, $yMin, $yMax, $xMax, $maxFrames, $cellW, $cellH, $minW = 14, $minH = 14) {
  $bmp = [System.Drawing.Bitmap]::FromFile((Join-Path $srcDir $srcFile))
  $bg = $bmp.GetPixel(0, 0)
  $boxes = Extract-RowSprites $bmp $yMin $yMax $xMax $bg $minW $minH
  $take = [Math]::Min($maxFrames, $boxes.Count)
  if ($take -le 0) {
    Write-Host "WARNING: No sprites found for $outFile in Y=$yMin..$yMax"
    $bmp.Dispose()
    return
  }

  $outBmp = New-Object System.Drawing.Bitmap(($cellW * $take), $cellH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($i = 0; $i -lt $take; $i++) {
    $b = $boxes[$i]
    $dstX0 = $i * $cellW + [int](($cellW - $b.W) / 2)
    $dstY0 = $cellH - $b.H - 2
    for ($py = 0; $py -lt $b.H; $py++) {
      for ($px = 0; $px -lt $b.W; $px++) {
        $c = $bmp.GetPixel($b.X + $px, $b.Y + $py)
        if (-not (Is-BgColor $c $bg)) {
          $dx = $dstX0 + $px
          $dy = $dstY0 + $py
          if ($dx -ge 0 -and $dx -lt $outBmp.Width -and $dy -ge 0 -and $dy -lt $outBmp.Height) {
            $outBmp.SetPixel($dx, $dy, $c)
          }
        }
      }
    }
  }

  $outPath = Join-Path $outDir $outFile
  $outBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host "Packed $outFile : $take frames ($($cellW)x$($cellH))"
  $outBmp.Dispose()
  $bmp.Dispose()
}

# 1. Marco Rossi Upper Body (Idle/Run row) and Legs (MS1 Run row)
Pack-Strip "Marco Rossi [11226].png" "marco_upper.png" 472 508 500 8 44 40 16 16
Pack-Strip "Marco Rossi [11226].png" "marco_legs.png" 510 531 360 12 44 26 14 14

# 2. SV-001 Metal Slug Tank (DRIVING row)
Pack-Strip "Metal Slug [32523].png" "tank_drive.png" 101 154 880 8 72 58 40 35

# 3. Rebel Soldier (Rifle) Running row
Pack-Strip "Rebel Soldier (Rifle) [16305].png" "rebel_run.png" 45 84 506 8 44 44 20 25

# 4. P.O.W. Tied to Post row
Pack-Strip "P.O.W.s _ Helpful NPCs [11293].png" "pow_tied.png" 142 194 400 6 48 56 20 30

# 5. Type 02 Di-Cokka Heavy Boss Tank (DRIVING row)
Pack-Strip "Type 02 ''Di-Cokka' [16284].png" "boss_tank.png" 61 118 450 6 80 62 50 45

# 6. Explosion SFX (MEDIUM explosion row)
Pack-Strip "Explosion SFX [11305].png" "explosion.png" 92 148 592 8 60 60 30 30

# 7. Mission 1 Tropical Beach/Jungle Panorama (clean strip Y=66..270, X=0..1200)
$bgBmp = [System.Drawing.Bitmap]::FromFile((Join-Path $srcDir "Mission 1 [37874].png"))
$bgRect = New-Object System.Drawing.Rectangle(0, 66, 1200, 204)
$bgCrop = $bgBmp.Clone($bgRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bgKey = $bgBmp.GetPixel(0, 0)
for ($y = 0; $y -lt $bgCrop.Height; $y++) {
  for ($x = 0; $x -lt $bgCrop.Width; $x++) {
    $c = $bgCrop.GetPixel($x, $y)
    if (Is-BgColor $c $bgKey 10) {
      # Fill top magenta sky gap with tropical sky blue
      $bgCrop.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 24, 96, 126))
    }
  }
}
$bgCrop.Save((Join-Path $outDir "mission1_bg.png"), [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Packed mission1_bg.png : 1200x204"
$bgCrop.Dispose(); $bgBmp.Dispose()
