$lines = Get-Content 'E:\My Drive\APLIKASI INFO CKG\index.html'
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'id="modalTambahSiswa"') {
        Write-Output "Line $($i+1)"
        for ($j = $i; $j -le [Math]::Min($lines.Count - 1, $i + 60); $j++) {
            Write-Output "$($j+1): $($lines[$j])"
        }
        break
    }
}
