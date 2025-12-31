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

// Handle logout
if (!empty($_GET['logout'])) {
    session_destroy();
    header('Location: login.php');
    exit;
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Marketing Dashboard - Floinvite</title>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f3f4f6;
            color: #1f2937;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        /* Header */
        header {
            background: white;
            border-radius: 0.5rem;
            padding: 1.25rem;
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            align-items: center;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
            margin-bottom: 1.5rem;
        }

        .header-branding {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .header-branding img {
            width: 32px;
            height: 32px;
        }

        .brand-name {
            font-size: 1.25rem;
            font-weight: 800;
            letter-spacing: -0.3px;
            color: #111827;
        }

        .brand-name-invite {
            color: #4f46e5;
        }

        .logout-btn {
            background: #dc2626;
            color: white;
            border: none;
            padding: 0.625rem 1.25rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .logout-btn:hover {
            background: #991b1b;
        }

        /* Navigation */
        nav {
            display: flex;
            gap: 1.5rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
            flex-wrap: wrap;
        }

        nav a {
            color: #6b7280;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s;
        }

        nav a:hover {
            color: #4f46e5;
        }

        nav a.active {
            color: #4f46e5;
            font-weight: 600;
        }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            padding: 1rem;
            transition: all 0.2s;
        }

        .stat-card:hover {
            background: #f9fafb;
            border-color: #4f46e5;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .stat-label {
            display: block;
            font-size: 0.85rem;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .stat-value {
            display: block;
            font-size: 2rem;
            font-weight: 700;
            color: #4f46e5;
        }

        /* Section */
        .section {
            background: white;
            border-radius: 0.75rem;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
            overflow: hidden;
        }

        .section-header {
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
        }

        .section h2 {
            font-size: 1.25rem;
            color: #111827;
            margin: 0;
        }

        .section-content {
            padding: 1.5rem;
        }

        /* Table */
        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background: #f9fafb;
            border-bottom: 2px solid #e5e7eb;
        }

        th {
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            font-size: 0.75rem;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
            color: #1f2937;
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:hover {
            background-color: #f9fafb;
        }

        /* Status Badge */
        .status-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.35rem 0.85rem;
            border-radius: 9999px;
            font-size: 0.7rem;
            font-weight: 600;
            white-space: nowrap;
            border: none;
        }

        .status-draft {
            background: #f3f4f6;
            color: #6b7280;
        }

        .status-scheduled {
            background: #fef3c7;
            color: #b45309;
        }

        .status-sending {
            background: #dbeafe;
            color: #1e40af;
        }

        .status-completed {
            background: #dcfce7;
            color: #16a34a;
        }

        /* Buttons */
        .button-group {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }

        button, a.btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.95rem;
            text-decoration: none;
            display: inline-block;
            font-family: inherit;
        }

        .btn-primary {
            background: #4f46e5;
            color: white;
        }

        .btn-primary:hover {
            background: #4338ca;
        }

        .btn-secondary {
            background: white;
            border: 1px solid #d1d5db;
            color: #1f2937;
        }

        .btn-secondary:hover {
            background: #f9fafb;
        }

        /* Empty State */
        .empty-state {
            padding: 3rem 1.5rem;
            text-align: center;
            color: #6b7280;
        }

        .empty-state p {
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
            color: #1f2937;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }

            header {
                flex-direction: column;
                align-items: flex-start;
            }

            .logout-btn {
                width: 100%;
            }

            nav {
                gap: 1rem;
            }

            .stats-grid {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }

            .section-header,
            .section-content {
                padding: 1rem;
            }

            table {
                font-size: 0.9rem;
            }

            th, td {
                padding: 0.75rem;
            }

            .button-group {
                gap: 0.5rem;
            }

            button, a.btn {
                padding: 0.625rem 1rem;
                font-size: 0.9rem;
            }
        }

        @media (max-width: 480px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }

            .button-group {
                flex-direction: column;
            }

            button, a.btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="container">
        <header>
            <div class="header-branding">
                <img src="../xmas-logo.png" alt="floinvite">
                <span class="brand-name">flo<span class="brand-name-invite">invite</span></span>
            </div>
            <a href="?logout=1" class="logout-btn">Logout</a>
        </header>

        <!-- Navigation -->
        <nav>
            <a href="index.php" class="active">Dashboard</a>
            <a href="subscribers.php">Subscribers</a>
            <a href="compose.php">New Campaign</a>
        </nav>
    </div>

    <!-- Main Content -->
    <div class="container">
        <!-- Statistics -->
        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-label">Active Subscribers</span>
                <span class="stat-value"><?php echo number_format($stats['total_subscribers']); ?></span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Active Campaigns</span>
                <span class="stat-value"><?php echo $stats['active_campaigns']; ?></span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Emails This Week</span>
                <span class="stat-value"><?php echo number_format($stats['emails_sent_week']); ?></span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Average Open Rate</span>
                <span class="stat-value"><?php echo $stats['open_rate']; ?>%</span>
            </div>
        </div>

        <!-- Recent Campaigns -->
        <div class="section">
            <div class="section-header">
                <h2>Recent Campaigns</h2>
            </div>
            <div class="section-content">
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
                        <a href="compose.php" class="btn btn-primary">Create Your First Campaign</a>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="section">
            <div class="section-header">
                <h2>Quick Actions</h2>
            </div>
            <div class="section-content">
                <div class="button-group">
                    <a href="compose.php" class="btn btn-primary">New Campaign</a>
                    <a href="subscribers.php" class="btn btn-secondary">Manage Subscribers</a>
                    <a href="subscribers.php?action=import" class="btn btn-secondary">Import List</a>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Mark current nav item
        const currentPath = window.location.pathname;
        document.querySelectorAll('nav a').forEach(link => {
            if (currentPath.includes(link.getAttribute('href').split('?')[0])) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    </script>
</body>
</html>
