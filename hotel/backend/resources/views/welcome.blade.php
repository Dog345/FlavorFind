<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HotelManager API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 480px;
        }
        .icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        h1 {
            font-size: 1.75rem;
            font-weight: 700;
            color: #f8fafc;
            margin-bottom: 0.4rem;
            letter-spacing: -0.02em;
        }
        .subtitle {
            color: #94a3b8;
            font-size: 0.95rem;
            margin-bottom: 2rem;
        }
        .status {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 9999px;
            padding: 0.4rem 1rem;
            font-size: 0.85rem;
            color: #4ade80;
            margin-bottom: 2rem;
        }
        .dot {
            width: 8px;
            height: 8px;
            background: #4ade80;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }
        .endpoints {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 1.25rem 1.5rem;
            text-align: left;
            margin-bottom: 1.5rem;
        }
        .endpoints h2 {
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #64748b;
            margin-bottom: 0.75rem;
        }
        .endpoint {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.35rem 0;
            border-bottom: 1px solid #1e293b;
            font-size: 0.85rem;
        }
        .endpoint:last-child { border-bottom: none; }
        .method {
            font-size: 0.7rem;
            font-weight: 700;
            padding: 0.15rem 0.45rem;
            border-radius: 4px;
            min-width: 42px;
            text-align: center;
        }
        .get  { background: #0369a1; color: #e0f2fe; }
        .post { background: #166534; color: #dcfce7; }
        .path { color: #cbd5e1; font-family: 'SF Mono', 'Fira Code', monospace; }
        .footer {
            color: #475569;
            font-size: 0.8rem;
        }
        .footer a {
            color: #64748b;
            text-decoration: none;
        }
        .footer a:hover { color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🏨</div>
        <h1>HotelManager API</h1>
        <p class="subtitle">Multi-tenant POS &amp; Reservation Platform</p>

        <div class="status">
            <div class="dot"></div>
            All systems operational
        </div>

        <div class="endpoints">
            <h2>Available Endpoints</h2>
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/health</span>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/v1/auth/register</span>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/api/v1/auth/login</span>
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/v1/auth/me</span>
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/v1/tenant</span>
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/api/v1/orders</span>
            </div>
        </div>

        <p class="footer">
            Part of <a href="https://flavorfind.co.ke">FlavorFind</a> &nbsp;·&nbsp;
            &copy; {{ date('Y') }} FlavorFind
        </p>
    </div>
</body>
</html>
