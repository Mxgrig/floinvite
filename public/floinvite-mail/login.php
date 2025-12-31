<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';

    // Simple password check
    if ($password === 'admin@fl0invitE') {
        $_SESSION['admin_logged_in'] = true;
        header('Location: index.php');
        exit;
    } else {
        $error = 'Invalid password';
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Marketing - Floinvite</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --auth-text-color: rgba(255, 255, 255, 0.95);
            --auth-subtitle-color: rgba(255, 255, 255, 0.75);
            --auth-label-color: rgba(255, 255, 255, 0.85);
            --auth-card-bg: rgba(15, 23, 42, 0.8);
            --auth-card-blur: 16px;
            --auth-card-border: 1px solid rgba(255, 255, 255, 0.1);
            --auth-card-border-radius: 12px;
            --auth-card-padding: 2.5rem;
            --auth-card-gap: 1.5rem;
            --auth-card-max-width: 420px;
            --auth-card-max-height: 90vh;
            --auth-input-bg: rgba(255, 255, 255, 0.08);
            --auth-input-focus-bg: rgba(255, 255, 255, 0.12);
            --auth-input-text-color: rgba(255, 255, 255, 0.95);
            --auth-input-placeholder-color: rgba(255, 255, 255, 0.5);
            --auth-input-border: 1px solid rgba(255, 255, 255, 0.15);
            --auth-input-focus-border: 1px solid rgba(79, 70, 229, 0.5);
            --auth-input-focus-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
            --auth-button-bg: linear-gradient(135deg, #4f46e5 0%, #667eea 100%);
            --auth-button-bg-hover: linear-gradient(135deg, #4338ca 0%, #5a67d8 100%);
            --auth-button-text-color: white;
            --auth-button-padding: 0.75rem 1.5rem;
            --auth-button-radius: 8px;
            --auth-title-font-size: 1.875rem;
            --auth-title-font-weight: 700;
            --auth-subtitle-font-size: 0.95rem;
            --auth-error-bg: rgba(239, 68, 68, 0.1);
            --auth-error-border: 1px solid rgba(239, 68, 68, 0.3);
            --auth-error-text: rgba(239, 68, 68, 0.95);
            --auth-link-color: rgba(79, 70, 229, 0.9);
            --auth-link-hover-opacity: 0.8;
            --auth-footer-link-color: rgba(79, 70, 229, 0.9);
            --auth-footer-link-hover-color: rgba(79, 70, 229, 1);
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
            background: #0b1220;
        }

        .auth-page {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            overflow: hidden;
        }

        .auth-page video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 0;
        }

        .auth-overlay {
            position: absolute;
            inset: 0;
            background: rgba(11, 18, 32, 0.4);
            z-index: 1;
            pointer-events: none;
        }

        .auth-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
            padding: 2rem;
        }

        .auth-card {
            background: var(--auth-card-bg);
            backdrop-filter: blur(var(--auth-card-blur));
            border: var(--auth-card-border);
            border-radius: var(--auth-card-border-radius);
            padding: var(--auth-card-padding);
            width: 100%;
            max-width: var(--auth-card-max-width);
            max-height: var(--auth-card-max-height);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--auth-card-gap);
            text-align: center;
            overflow-y: auto;
        }

        .auth-brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            justify-content: center;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
        }

        .auth-logo {
            width: 40px;
            height: 40px;
            object-fit: contain;
        }

        .auth-brand-name {
            font-size: 1.3rem;
            font-weight: 800;
            color: var(--auth-text-color);
            letter-spacing: -0.3px;
        }

        .auth-title {
            font-size: var(--auth-title-font-size);
            font-weight: var(--auth-title-font-weight);
            color: var(--auth-text-color);
            line-height: 1.05;
            margin: 0;
            letter-spacing: -0.5px;
        }

        .auth-subtitle {
            font-size: var(--auth-subtitle-font-size);
            color: var(--auth-subtitle-color);
            line-height: 1.3;
            margin: 0;
            letter-spacing: -0.2px;
        }

        .auth-form {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
            text-align: left;
        }

        .form-label {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--auth-label-color);
            letter-spacing: -0.2px;
        }

        .form-input {
            padding: 0.7rem 0.9rem;
            border: var(--auth-input-border);
            border-radius: 8px;
            background: var(--auth-input-bg);
            color: var(--auth-input-text-color);
            font-size: 0.9rem;
            transition: all 0.2s ease;
            font-family: inherit;
            font-weight: 500;
        }

        .form-input::placeholder {
            color: var(--auth-input-placeholder-color);
        }

        .form-input:focus {
            outline: none;
            background: var(--auth-input-focus-bg);
            border-color: var(--auth-input-focus-border);
            box-shadow: var(--auth-input-focus-shadow);
        }

        .auth-button {
            padding: var(--auth-button-padding);
            border: none;
            border-radius: var(--auth-button-radius);
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            letter-spacing: -0.2px;
            width: 100%;
            background: var(--auth-button-bg);
            color: var(--auth-button-text-color);
        }

        .auth-button:hover:not(:disabled) {
            background: var(--auth-button-bg-hover);
            transform: translateY(-1px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .auth-button:active:not(:disabled) {
            transform: translateY(0);
        }

        .auth-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .auth-error {
            padding: 0.8rem;
            background: var(--auth-error-bg);
            border: var(--auth-error-border);
            border-radius: 8px;
            color: var(--auth-error-text);
            font-size: 0.9rem;
            text-align: center;
        }

        .auth-footer {
            font-size: 0.85rem;
            color: var(--auth-text-color);
            line-height: 1.5;
            margin-top: 0.5rem;
        }

        @media (max-width: 768px) {
            .auth-card {
                padding: 2rem 1.75rem;
                max-width: 100%;
            }

            .auth-title {
                font-size: clamp(1.4rem, 3vw, 2rem);
            }

            .auth-subtitle {
                font-size: 0.85rem;
            }

            .form-input {
                padding: 0.75rem 0.9rem;
                font-size: 0.9rem;
            }

            .auth-button {
                padding: 0.75rem 1rem;
                font-size: 0.9rem;
            }
        }

        @media (max-width: 480px) {
            .auth-container {
                padding: 1rem;
            }

            .auth-card {
                padding: 1.75rem 1.5rem;
                gap: 1.25rem;
            }

            .auth-logo {
                width: 36px;
                height: 36px;
            }

            .auth-brand-name {
                font-size: 1.1rem;
            }

            .auth-title {
                font-size: 1.4rem;
            }

            .auth-subtitle {
                font-size: 0.8rem;
            }

            .form-input {
                padding: 0.7rem 0.8rem;
                font-size: 0.85rem;
            }

            .auth-button {
                padding: 0.7rem 0.9rem;
                font-size: 0.85rem;
            }
        }
    </style>
</head>
<body>
    <div class="auth-page">
        <video autoplay muted loop playsinline>
            <source src="../sessionlogin.mp4" type="video/mp4">
        </video>

        <div class="auth-overlay"></div>

        <div class="auth-container">
            <div class="auth-card">
                <button class="auth-brand" type="button" style="background: none; border: none; cursor: pointer;">
                    <img src="<?php echo htmlspecialchars(get_logo_path()); ?>" alt="floinvite" class="auth-logo" />
                    <span class="auth-brand-name">
                        flo<span style="color: #4f46e5;">invite</span>
                    </span>
                </button>

                <h1 class="auth-title">Email Marketing</h1>

                <p class="auth-subtitle">
                    Sign in to manage campaigns and subscribers
                </p>

                <?php if (isset($error)): ?>
                    <div class="auth-error">
                        <?php echo htmlspecialchars($error); ?>
                    </div>
                <?php endif; ?>

                <form method="POST" class="auth-form">
                    <div class="form-group">
                        <label class="form-label" for="password">Admin Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            class="form-input"
                            placeholder="Enter your password"
                            required
                            autofocus
                        >
                    </div>
                    <button type="submit" class="auth-button">Sign In</button>
                </form>

                <div class="auth-footer">
                    <p>Professional Email Marketing for Floinvite</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
