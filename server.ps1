param(
    [int]$Port = 8080
)

$prefix = "http://localhost:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "============================================="
    Write-Host " SICEKAS Local Server is running!"
    Write-Host " URL: $prefix"
    Write-Host " Root: $(Get-Location)"
    Write-Host "============================================="
} catch {
    Write-Error "Failed to start listener on port $Port : $_"
    exit 1
}

# Open browser automatically
try {
    Start-Process $prefix
} catch {
    Write-Host "Please open $prefix in your browser."
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".pdf"  = "application/pdf"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
    ".eot"  = "application/vnd.ms-fontobject"
    ".mp3"  = "audio/mpeg"
    ".mp4"  = "video/mp4"
    ".webm" = "video/webm"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
        if ($urlPath -eq "/" -or [string]::IsNullOrWhiteSpace($urlPath)) {
            $urlPath = "/index.html"
        }

        # Handle /api/* requests by proxying to live Cloudflare D1 backend
        if ($urlPath.StartsWith("/api/")) {
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
            $cloudApiUrl = "https://sicekas.web.id" + $urlPath + ($request.Url.Query)
            Write-Host "[PROXY] $($request.HttpMethod) $cloudApiUrl"
            try {
                $proxyParams = @{
                    Uri = $cloudApiUrl
                    Method = $request.HttpMethod
                    ContentType = "application/json"
                    TimeoutSec = 10
                    UseBasicParsing = $true
                }

                # Forward request body for POST/PUT/PATCH
                if ($request.HasEntityBody) {
                    $reader = New-Object System.IO.StreamReader($request.InputStream)
                    $bodyStr = $reader.ReadToEnd()
                    $reader.Close()
                    $proxyParams['Body'] = $bodyStr
                }

                $cloudRes = Invoke-WebRequest @proxyParams -ErrorAction Stop
                $response.StatusCode = $cloudRes.StatusCode
                $response.ContentType = "application/json; charset=utf-8"
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $response.AddHeader("Cache-Control", "no-cache, no-store")

                $resBytes = [System.Text.Encoding]::UTF8.GetBytes($cloudRes.Content)
                $response.ContentLength64 = $resBytes.Length
                $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
                Write-Host "[PROXY] -> $($cloudRes.StatusCode) OK ($($resBytes.Length) bytes)"
            } catch {
                $errDetail = $_.Exception.Message
                Write-Host "[PROXY] -> ERROR: $errDetail"
                $statusCode = 502
                $errBody = '{"success":false,"error":"' + ($errDetail -replace '"','\"') + '"}'

                # Try to extract status code from WebException
                if ($_.Exception.Response) {
                    $statusCode = [int]$_.Exception.Response.StatusCode
                    try {
                        $errStream = $_.Exception.Response.GetResponseStream()
                        $errReader = New-Object System.IO.StreamReader($errStream)
                        $errBody = $errReader.ReadToEnd()
                        $errReader.Close()
                    } catch {}
                }

                $response.StatusCode = $statusCode
                $response.ContentType = "application/json; charset=utf-8"
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errBody)
                $response.ContentLength64 = $errBytes.Length
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        # Normalize relative path
        $relPath = $urlPath.TrimStart('/').Replace('/', '\')
        $fullPath = Join-Path (Get-Location) $relPath

        # Check directory vs file
        if ((Test-Path $fullPath -PathType Container) -and (Test-Path (Join-Path $fullPath "index.html"))) {
            $fullPath = Join-Path $fullPath "index.html"
        }
        if (-not (Test-Path $fullPath -PathType Leaf) -and (Test-Path ($fullPath + ".html") -PathType Leaf)) {
            $fullPath = $fullPath + ".html"
        }

        if (Test-Path $fullPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }

            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")
            $response.StatusCode = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $notFoundMsg = [System.Text.Encoding]::UTF8.GetBytes("<html><body><h2>404 Not Found</h2><p>File not found: $urlPath</p></body></html>")
            $response.ContentType = "text/html; charset=utf-8"
            $response.ContentLength64 = $notFoundMsg.Length
            $response.OutputStream.Write($notFoundMsg, 0, $notFoundMsg.Length)
        }
        $response.OutputStream.Close()
    } catch {
        # Continue on connection errors
    }
}
