<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Access Restricted — LikhaGrade</title>
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700,800|jetbrains-mono:400,500,600&display=swap" rel="stylesheet" />
        <style>
            *, *::before, *::after {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            body {
                font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #f1f5f9;
                color: #1e293b;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 1.5rem;
            }
            .card {
                background: #ffffff;
                border: 1px solid #cbd5e1;
                border-radius: 1.25rem;
                padding: 2.5rem;
                max-width: 32rem;
                width: 100%;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
                text-align: center;
            }
            .badge {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.75rem;
                border-radius: 9999px;
                font-size: 0.75rem;
                font-weight: 700;
                background-color: #fee2e2;
                color: #b91c1c;
                border: 1px solid #fecaca;
                margin-bottom: 1.25rem;
            }
            .brand {
                font-size: 1.125rem;
                font-weight: 800;
                color: #0f172a;
                margin-bottom: 0.5rem;
            }
            .brand span {
                color: #4f46e5;
            }
            h1 {
                font-size: 1.5rem;
                font-weight: 800;
                color: #0f172a;
                margin-bottom: 0.75rem;
                letter-spacing: -0.025em;
            }
            p {
                font-size: 0.875rem;
                color: #64748b;
                line-height: 1.6;
                margin-bottom: 2rem;
            }
            .actions {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.625rem 1.25rem;
                border-radius: 0.75rem;
                font-size: 0.875rem;
                font-weight: 600;
                text-decoration: none;
                cursor: pointer;
                transition: background-color 0.15s ease;
                border: 1px solid transparent;
                width: 100%;
            }
            .btn-primary {
                background-color: #4f46e5;
                color: #ffffff;
            }
            .btn-primary:hover {
                background-color: #4338ca;
            }
            .btn-outline {
                background-color: #ffffff;
                color: #334155;
                border-color: #cbd5e1;
            }
            .btn-outline:hover {
                background-color: #f8fafc;
            }
            .btn-danger {
                background-color: #ef4444;
                color: #ffffff;
            }
            .btn-danger:hover {
                background-color: #dc2626;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="brand">Likha<span>Grade</span></div>
            <div class="badge">403 Forbidden</div>
            <h1>Workspace Access Restricted</h1>
            <p>{{ $exception->getMessage() ?: 'Your workspace has been suspended or is currently unavailable. Please contact support or your institution administrator.' }}</p>
            <div class="actions">
                @auth
                    @if(auth()->user()->isSuperAdmin())
                        <a href="{{ route('platform.dashboard') }}" class="btn btn-primary">
                            Open SuperAdmin Console
                        </a>
                    @endif
                    <a href="{{ route('logout') }}" class="btn btn-danger">
                        Sign Out / Log Out
                    </a>
                @else
                    <a href="{{ route('login') }}" class="btn btn-primary">
                        Back to Sign In
                    </a>
                @endauth
                <a href="{{ url('/') }}" class="btn btn-outline">
                    Return to Homepage
                </a>
            </div>
        </div>
    </body>
</html>

