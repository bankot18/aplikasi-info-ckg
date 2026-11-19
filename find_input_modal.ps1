$lines = Get-Content 'E:\My Drive\APLIKASI INFO CKG\index.html'
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'sasaran skrining' -or $lines[$i] -match 'Data Identitas Pasien') {
        Write-Output "Line $($i+1): $($lines[$i])"
    }
}
