<?php
/**
 * Local Dev Version - index.php with mock data
 * Shows actual HTML/CSS/structure without database
 */

session_start();
$_SESSION['admin_logged_in'] = true;
$_SESSION['last_activity'] = time();

require_once 'logo.php';

// Mock data - replaces database queries
$stats = [
    'total_subscribers' => 1234,
    'active_campaigns' => 5,
    'completed_campaigns' => 12,
    'emails_sent_week' => 3456,
    'open_rate' => 34.5
];

$recent_campaigns = [
    [
        'id' => 1,
        'name' => 'Welcome Series',
        'status' => 'completed',
        'recipient_count' => 500,
        'sent_count' => 500,
        'opened_count' => 175,
        'created_at' => '2026-01-01 10:30:00'
    ],
    [
        'id' => 2,
        'name' => 'New Year Sale',
        'status' => 'sending',
        'recipient_count' => 1200,
        'sent_count' => 450,
        'opened_count' => 120,
        'created_at' => '2025-12-31 15:45:00'
    ],
    [
        'id' => 3,
        'name' => 'Holiday Promo',
        'status' => 'draft',
        'recipient_count' => 800,
        'sent_count' => 0,
        'opened_count' => 0,
        'created_at' => '2025-12-20 09:15:00'
    ]
];

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
    <title>Email Marketing Dashboard - floinvite</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Header -->
    <div class="container">
        <header class="mail-hero">
            <div class="header-row">
                <div class="header-branding">
                    <img src="<?php echo htmlspecialchars(get_logo_path()); ?>" alt="floinvite">
                    <span class="brand-wordmark">
                        <span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span>
                    </span>
                </div>
                <a href="?logout=1" class="logout-btn">Logout</a>
            </div>
        </header>

        <!-- Navigation -->
        <nav class="mail-nav">
            <a href="index-local.php" class="active">Dashboard</a>
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
                    <a href="compose-local.php" class="btn btn-primary">New Campaign</a>
                    <a href="subscribers.php" class="btn btn-secondary">Manage Subscribers</a>
                    <a href="subscribers.php?action=import" class="btn btn-secondary">Import List</a>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="container">
        <footer class="mail-footer">
            <p>© <?php echo date('Y'); ?> <span class="brand-wordmark"><span class="brand-wordmark-flo">flo</span><span class="brand-wordmark-invite">invite</span></span>. All rights reserved.</p>
        </footer>
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
