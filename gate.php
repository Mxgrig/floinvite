<?php
require_once __DIR__ . '/api/env.php';
require_once __DIR__ . '/api/PHPMailerHelper.php';

session_start();

$error = '';
$email = '';
$organisation = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $organisation = trim($_POST['organisation'] ?? '');

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Please enter a valid email address.';
    } else {
        // CSV stored outside the web root so it cannot be downloaded directly
        $csvPath = __DIR__ . '/../data/users.csv';
        $csvDir = dirname($csvPath);

        if (!is_dir($csvDir) && !mkdir($csvDir, 0775, true) && !is_dir($csvDir)) {
            $error = 'Unable to save your details right now. Please try again.';
        } else {
            $handle = fopen($csvPath, 'ab');

            if ($handle === false) {
                $error = 'Unable to save your details right now. Please try again.';
            } else {
                if (flock($handle, LOCK_EX)) {
                    // Re-read size after locking so concurrent first writes do not duplicate the header.
                    $stats = fstat($handle);
                    $isEmpty = $stats !== false && (int) ($stats['size'] ?? 0) === 0;
                    if ($isEmpty) {
                        fputcsv($handle, ['timestamp', 'email', 'organisation']);
                    }

                    fputcsv($handle, [
                        gmdate('c'),
                        $email,
                        $organisation,
                    ]);

                    fflush($handle);
                    flock($handle, LOCK_UN);
                    fclose($handle);

                    // Notify owner of new signup
                    $org     = $organisation !== '' ? $organisation : '(not provided)';
                    $subject = 'New FloInvite signup: ' . $email;
                    $body    = "New signup received.\n\nEmail: {$email}\nOrganisation: {$org}\nTime: " . gmdate('c');
                    $sent    = false;

                    try {
                        $mailer = new PHPMailerHelper();
                        $result = $mailer->send([
                            'to'      => 'mxgrig@gmail.com',
                            'subject' => $subject,
                            'body'    => $body,
                        ]);
                        $sent = !empty($result['success']);
                    } catch (Exception $e) {
                        error_log('Gate SMTP failed: ' . $e->getMessage());
                    }

                    // Fallback: native mail() if SMTP failed
                    if (!$sent) {
                        $sent = mail('mxgrig@gmail.com', $subject, $body, 'From: admin@floinvite.com');
                    }

                    // Last resort: write to a failure log so no signup is silently lost
                    if (!$sent) {
                        $failLog = __DIR__ . '/../data/mail_failures.log';
                        file_put_contents(
                            $failLog,
                            gmdate('c') . " | FAILED | {$email} | {$org}\n",
                            FILE_APPEND | LOCK_EX
                        );
                    }

                    session_regenerate_id(true);
                    $_SESSION['gate_passed'] = true;
                    header('Location: index.php');
                    exit;
                }

                flock($handle, LOCK_UN);
                fclose($handle);
                $error = 'Unable to save your details right now. Please try again.';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FloInvite Access</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            color-scheme: dark;
            --brand-blue: #4f46e5;
            --brand-green: #10b981;
            --page-bg: #0b1220;
            --card-bg: rgba(20, 25, 35, 0.78);
            --card-border: rgba(255, 255, 255, 0.08);
            --text-primary: #ffffff;
            --text-secondary: #b8c2d8;
            --input-bg: rgba(79, 70, 229, 0.16);
            --input-border: rgba(99, 102, 241, 0.35);
            --input-focus: rgba(99, 102, 241, 0.55);
            --shadow-lg: 0 24px 60px rgba(5, 10, 20, 0.35);
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background:
                radial-gradient(circle at top left, rgba(79, 70, 229, 0.26), transparent 32%),
                radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.18), transparent 28%),
                linear-gradient(180deg, #0b1220 0%, #111827 100%);
            color: var(--text-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }

        .shell {
            width: 100%;
            max-width: 1100px;
            display: grid;
            grid-template-columns: minmax(0, 1.1fr) minmax(320px, 460px);
            gap: 24px;
            align-items: stretch;
        }

        .panel,
        .card {
            background: var(--card-bg);
            backdrop-filter: blur(14px);
            border: 1px solid var(--card-border);
            border-radius: 24px;
            box-shadow: var(--shadow-lg);
        }

        .panel {
            padding: 40px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 620px;
        }

        .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 8px 14px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.06);
            color: var(--text-secondary);
            font-size: 0.9rem;
            font-weight: 500;
            width: fit-content;
        }

        .wordmark {
            font-size: 1.1rem;
            font-weight: 800;
            letter-spacing: -0.03em;
        }

        .wordmark .flo {
            color: var(--brand-blue);
        }

        .wordmark .invite {
            color: var(--brand-green);
        }

        h1 {
            margin: 20px 0 16px;
            font-size: clamp(2.2rem, 4vw, 4.4rem);
            line-height: 0.96;
            letter-spacing: -0.05em;
            max-width: 10ch;
        }

        .lead {
            margin: 0;
            max-width: 38rem;
            color: var(--text-secondary);
            font-size: 1.02rem;
            line-height: 1.7;
        }

        .highlights {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
            margin-top: 28px;
        }

        .highlight {
            padding: 18px;
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .highlight strong {
            display: block;
            font-size: 1rem;
            margin-bottom: 8px;
        }

        .highlight span {
            color: var(--text-secondary);
            font-size: 0.94rem;
            line-height: 1.5;
        }

        .card {
            padding: 32px;
            align-self: center;
        }

        .card h2 {
            margin: 0 0 10px;
            font-size: 1.7rem;
            letter-spacing: -0.04em;
        }

        .card p {
            margin: 0 0 24px;
            color: var(--text-secondary);
            line-height: 1.6;
        }

        .field {
            margin-bottom: 18px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-size: 0.95rem;
            font-weight: 600;
            color: #e5e7eb;
        }

        input {
            width: 100%;
            border: 1px solid var(--input-border);
            background: var(--input-bg);
            color: var(--text-primary);
            border-radius: 14px;
            padding: 14px 16px;
            font: inherit;
            transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        input::placeholder {
            color: rgba(184, 194, 216, 0.72);
        }

        input:focus {
            outline: none;
            border-color: var(--input-focus);
            box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.16);
            background: rgba(79, 70, 229, 0.22);
        }

        .button {
            width: 100%;
            border: 0;
            border-radius: 14px;
            padding: 15px 18px;
            font: inherit;
            font-weight: 700;
            color: #ffffff;
            background: linear-gradient(135deg, #4f46e5 0%, #10b981 140%);
            cursor: pointer;
            box-shadow: 0 16px 30px rgba(79, 70, 229, 0.24);
            transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
        }

        .button:hover {
            transform: translateY(-1px);
            box-shadow: 0 18px 34px rgba(79, 70, 229, 0.28);
        }

        .button:active {
            transform: translateY(0);
        }

        .gdpr {
            margin-top: 18px;
            font-size: 0.88rem;
            color: var(--text-secondary);
            line-height: 1.5;
        }

        .error {
            margin-bottom: 18px;
            padding: 12px 14px;
            border-radius: 12px;
            background: rgba(239, 68, 68, 0.14);
            border: 1px solid rgba(239, 68, 68, 0.28);
            color: #fecaca;
            font-size: 0.94rem;
        }

        @media (max-width: 900px) {
            .shell {
                grid-template-columns: 1fr;
            }

            .panel {
                min-height: auto;
                padding: 28px;
            }

            .highlights {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 640px) {
            body {
                padding: 16px;
            }

            .panel,
            .card {
                border-radius: 20px;
            }

            .panel,
            .card {
                padding: 24px;
            }

            h1 {
                max-width: none;
                font-size: clamp(2rem, 11vw, 3rem);
            }
        }
    </style>
</head>
<body>
    <main class="shell">
        <section class="panel">
            <div>
                <div class="eyebrow">
                    <span class="wordmark"><span class="flo">Flo</span><span class="invite">Invite</span></span>
                    <span>Early access</span>
                </div>
                <h1>Professional site access, without the friction.</h1>
                <p class="lead">Enter your email to continue into FloInvite. We’re using this gate to qualify interest and keep product updates relevant as the platform rolls out.</p>
            </div>

            <div class="highlights">
                <div class="highlight">
                    <strong>Fast setup</strong>
                    <span>Launch visitor flows without hardware, kiosks, or complex rollout work.</span>
                </div>
                <div class="highlight">
                    <strong>SME-ready</strong>
                    <span>Built for teams that need a cleaner arrival process and an audit trail.</span>
                </div>
                <div class="highlight">
                    <strong>Modern experience</strong>
                    <span>Mobile-friendly access for offices, venues, construction, and healthcare.</span>
                </div>
            </div>
        </section>

        <section class="card">
            <h2>Continue to FloInvite</h2>
            <p>Share your email and optionally your organisation name before entering the app.</p>

            <?php if ($error !== ''): ?>
                <div class="error"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></div>
            <?php endif; ?>

            <form method="post" action="gate.php" novalidate>
                <div class="field">
                    <label for="email">Email address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        inputmode="email"
                        autocomplete="email"
                        required
                        placeholder="you@company.com"
                        value="<?php echo htmlspecialchars($email, ENT_QUOTES, 'UTF-8'); ?>"
                    >
                </div>

                <div class="field">
                    <label for="organisation">Organisation name</label>
                    <input
                        id="organisation"
                        name="organisation"
                        type="text"
                        autocomplete="organization"
                        placeholder="Optional"
                        value="<?php echo htmlspecialchars($organisation, ENT_QUOTES, 'UTF-8'); ?>"
                    >
                </div>

                <button class="button" type="submit">Enter FloInvite</button>
            </form>

            <p class="gdpr">We only use your email for product updates. No spam. Unsubscribe anytime.</p>
        </section>
    </main>
</body>
</html>
