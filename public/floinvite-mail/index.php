<?php
/**
 * Floinvite Mail Dashboard
 * Main admin panel for campaign management
 */

require_once 'config.php';
require_auth();

$db = get_db();

// Get dashboard statistics
$stats = [];

// Total subscribers
$result = $db->query("SELECT COUNT(*) as count FROM subscribers WHERE status = 'active'");
$stats['total_subscribers'] = $result->fetch()['count'] ?? 0;

// Active campaigns
$result = $db->query("SELECT COUNT(*) as count FROM campaigns WHERE status IN ('draft', 'scheduled', 'sending')");
$stats['active_campaigns'] = $result->fetch()['count'] ?? 0;

// Completed campaigns
$result = $db->query("SELECT COUNT(*) as count FROM campaigns WHERE status = 'completed'");
$stats['completed_campaigns'] = $result->fetch()['count'] ?? 0;

// Total emails sent (this week)
$result = $db->query("
    SELECT COUNT(*) as count FROM campaign_sends
    WHERE status = 'sent'
    AND sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
");
$stats['emails_sent_week'] = $result->fetch()['count'] ?? 0;

// Average open rate
$result = $db->query("
    SELECT
        COUNT(DISTINCT CASE WHEN opened_at IS NOT NULL THEN id END) as opens,
        COUNT(*) as total
    FROM campaign_sends
    WHERE status = 'sent' AND opened_at IS NOT NULL
");
$row = $result->fetch();
$stats['open_rate'] = $row['total'] > 0 ? round(($row['opens'] / $row['total']) * 100, 1) : 0;

// Recent campaigns
$result = $db->query("
    SELECT id, name, status, recipient_count, sent_count, opened_count, created_at
    FROM campaigns
    ORDER BY created_at DESC
    LIMIT 5
");
$recent_campaigns = $result->fetchAll();

// Check if API request
if (!empty($_GET['api'])) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'stats' => $stats,
        'recent_campaigns' => $recent_campaigns
    ]);
    exit;
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Floinvite Mail Admin</title>
    <style>
        :root {
            --text-color: rgba(255, 255, 255, 0.95);
            --subtitle-color: rgba(255, 255, 255, 0.75);
            --label-color: rgba(255, 255, 255, 0.85);
            --card-bg: rgba(15, 23, 42, 0.8);
            --card-blur: 16px;
            --card-border: 1px solid rgba(255, 255, 255, 0.1);
            --button-bg: linear-gradient(135deg, #4f46e5 0%, #667eea 100%);
            --button-bg-hover: linear-gradient(135deg, #4338ca 0%, #5a67d8 100%);
            --button-text: white;
            --input-bg: rgba(255, 255, 255, 0.08);
            --input-focus-bg: rgba(255, 255, 255, 0.12);
            --input-border: 1px solid rgba(255, 255, 255, 0.15);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0b1220;
            color: var(--text-color);
            overflow-x: hidden;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        header {
            background: rgba(15, 23, 42, 0.5);
            backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 2rem;
            padding: 2rem 0;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .header-branding {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .header-branding img {
            width: 32px;
            height: 32px;
        }

        .brand-name {
            font-size: 1.25rem;
            font-weight: 800;
            letter-spacing: -0.3px;
        }

        .brand-name-flo {
            color: var(--text-color);
        }

        .brand-name-invite {
            color: #4f46e5;
        }

        header h1 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }

        .nav {
            display: flex;
            gap: 2rem;
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            flex-wrap: wrap;
        }

        .nav a {
            color: var(--subtitle-color);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
            position: relative;
        }

        .nav a:hover {
            color: #4f46e5;
        }

        .nav a.active {
            color: #4f46e5;
        }

        .nav a.active::after {
            content: '';
            position: absolute;
            bottom: -0.5rem;
            left: 0;
            right: 0;
            height: 2px;
            background: #4f46e5;
        }

        .logout {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 0.625rem 1.25rem;
            border-radius: 6px;
            text-decoration: none;
            display: inline-block;
            border: none;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .logout:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: var(--card-bg);
            backdrop-filter: blur(var(--card-blur));
            border: var(--card-border);
            border-radius: 12px;
            padding: 1.5rem;
            transition: all 0.2s;
        }

        .stat-card:hover {
            background: rgba(15, 23, 42, 0.95);
            border-color: rgba(79, 70, 229, 0.3);
            transform: translateY(-2px);
        }

        .stat-card h3 {
            font-size: 0.75rem;
            color: var(--subtitle-color);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
            font-weight: 600;
        }

        .stat-card .value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #4f46e5;
            margin-bottom: 0.5rem;
        }

        .section {
            background: var(--card-bg);
            backdrop-filter: blur(var(--card-blur));
            border: var(--card-border);
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            overflow-x: auto;
        }

        .section h2 {
            margin-bottom: 1.5rem;
            font-size: 1.25rem;
            color: var(--text-color);
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        th {
            padding: 1rem 0.75rem;
            text-align: left;
            font-weight: 600;
            font-size: 0.875rem;
            color: var(--label-color);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 1rem 0.75rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            color: var(--text-color);
        }

        tr:last-child td {
            border-bottom: none;
        }

        .status-badge {
            display: inline-block;
            padding: 0.375rem 0.875rem;
            border-radius: 9999px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .status-draft {
            background: rgba(107, 114, 128, 0.2);
            color: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(107, 114, 128, 0.3);
        }

        .status-sending {
            background: rgba(79, 70, 229, 0.2);
            color: #a5b4fc;
            border: 1px solid rgba(79, 70, 229, 0.3);
        }

        .status-scheduled {
            background: rgba(217, 119, 6, 0.2);
            color: #fed7aa;
            border: 1px solid rgba(217, 119, 6, 0.3);
        }

        .status-completed {
            background: rgba(34, 197, 94, 0.2);
            color: #86efac;
            border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .button-group {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
        }

        button, a.btn-primary {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.95rem;
            text-decoration: none;
            display: inline-block;
        }

        .btn-primary {
            background: var(--button-bg);
            color: var(--button-text);
        }

        .btn-primary:hover {
            background: var(--button-bg-hover);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .btn-primary:active {
            transform: translateY(0);
        }

        .empty-state {
            text-align: center;
            padding: 3rem 1rem;
            color: var(--subtitle-color);
        }

        .empty-state p {
            margin-bottom: 1.5rem;
            font-size: 1.1rem;
        }

        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }

            header {
                padding: 1rem 0;
                margin-bottom: 1rem;
            }

            .header-top {
                flex-direction: column;
                gap: 1rem;
            }

            .nav {
                gap: 1rem;
                margin-top: 1rem;
                padding-top: 1rem;
            }

            .stats {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 0.75rem;
            }

            .stat-card {
                padding: 1rem;
            }

            .stat-card .value {
                font-size: 1.75rem;
            }

            .section {
                padding: 1rem;
            }

            .button-group {
                gap: 0.5rem;
            }

            button, a.btn-primary {
                padding: 0.625rem 1rem;
                font-size: 0.9rem;
            }

            table {
                font-size: 0.9rem;
            }

            th, td {
                padding: 0.5rem;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <div class="header-top">
                <div class="header-branding">
                    <img src="../xmas-logo.png" alt="floinvite">
                    <span class="brand-name">
                        <span class="brand-name-flo">flo</span><span class="brand-name-invite">invite</span>
                    </span>
                </div>
                <a href="?logout=1" class="logout">Logout</a>
            </div>
            <nav class="nav">
                <a href="index.php" class="active">Dashboard</a>
                <a href="subscribers.php">Subscribers</a>
                <a href="compose.php">New Campaign</a>
                <a href="?api=1">API</a>
            </nav>
        </div>
    </header>

    <div class="container">
        <!-- Statistics -->
        <div class="stats">
            <div class="stat-card">
                <h3>Active Subscribers</h3>
                <div class="value"><?php echo number_format($stats['total_subscribers']); ?></div>
            </div>
            <div class="stat-card">
                <h3>Active Campaigns</h3>
                <div class="value"><?php echo $stats['active_campaigns']; ?></div>
            </div>
            <div class="stat-card">
                <h3>Emails This Week</h3>
                <div class="value"><?php echo number_format($stats['emails_sent_week']); ?></div>
            </div>
            <div class="stat-card">
                <h3>Average Open Rate</h3>
                <div class="value"><?php echo $stats['open_rate']; ?>%</div>
            </div>
        </div>

        <!-- Recent Campaigns -->
        <div class="section">
            <h2>Recent Campaigns</h2>
            <?php if (count($recent_campaigns) > 0): ?>
                <table>
                    <thead>
                        <tr>
                            <th>Campaign</th>
                            <th>Status</th>
                            <th>Recipients</th>
                            <th>Sent</th>
                            <th>Opens</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recent_campaigns as $campaign): ?>
                            <tr>
                                <td><strong><?php echo htmlspecialchars($campaign['name']); ?></strong></td>
                                <td>
                                    <span class="status-badge status-<?php echo $campaign['status']; ?>">
                                        <?php echo ucfirst($campaign['status']); ?>
                                    </span>
                                </td>
                                <td><?php echo $campaign['recipient_count']; ?></td>
                                <td><?php echo $campaign['sent_count']; ?></td>
                                <td><?php echo $campaign['opened_count']; ?></td>
                                <td><?php echo date('M d, Y', strtotime($campaign['created_at'])); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <div class="empty-state">
                    <p>No campaigns yet</p>
                    <a href="compose.php" class="btn-primary">Create Your First Campaign</a>
                </div>
            <?php endif; ?>
        </div>

        <!-- Quick Actions -->
        <div class="section">
            <h2>Quick Actions</h2>
            <div class="button-group">
                <a href="compose.php" class="btn-primary">New Campaign</a>
                <a href="subscribers.php" class="btn-primary">Manage Subscribers</a>
                <a href="subscribers.php?action=import" class="btn-primary">Import List</a>
            </div>
        </div>
    </div>

    <script>
        // Mark current page in nav
        const currentPath = window.location.pathname;
        document.querySelectorAll('.nav a').forEach(link => {
            if (link.href.includes(currentPath.split('/').pop())) {
                link.classList.add('active');
            }
        });
    </script>
</body>
</html>
