<?php
/**
 * Floinvite Mail Dashboard
 * Main admin panel for campaign management
 */

require_once 'config.php';
require_once 'logo.php';
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
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Header -->
    <div class="container">
        <header class="mail-hero">
            <div class="header-row">
                <div class="header-branding">
                    <img src="<?php echo htmlspecialchars(get_logo_path()); ?>" alt="floinvite">
                    <span class="brand-name">flo<span class="brand-name-invite">invite</span></span>
                </div>
                <a href="?logout=1" class="logout-btn">Logout</a>
            </div>
        </header>

        <!-- Navigation -->
        <nav class="mail-nav">
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

    <!-- Footer -->
    <div class="container">
        <div style="text-align: center; padding: 2rem 0; border-top: 1px solid #e5e7eb; margin-top: 2rem; color: #6b7280; font-size: 0.875rem;">
            <p style="margin: 0;"><strong><span style="color: #4338ca;">flo</span><span style="color: #10b981;">invite</span></strong> Email Marketing Platform</p>
            <p style="margin: 0.25rem 0 0 0;"><?php echo date('M d, Y'); ?></p>
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
