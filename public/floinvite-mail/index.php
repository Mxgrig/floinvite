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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>Email Marketing Dashboard - Floinvite</title>

    <!-- Tailwind CSS (CDN) -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Tailwind Dark Mode Config -->
    <script>
      if (localStorage.getItem('theme') === 'dark' || 
          (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    </script>

    <style>
      body {
        background: #0b1220;
        color: rgba(255, 255, 255, 0.95);
      }
    </style>
</head>
<body class="bg-slate-950 text-white">
    <!-- Header -->
    <header class="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Top Row: Logo & Logout -->
            <div class="flex justify-between items-center py-4">
                <div class="flex items-center gap-3">
                    <img src="../xmas-logo.png" alt="floinvite" class="w-8 h-8">
                    <span class="text-lg font-bold">flo<span class="text-indigo-500">invite</span></span>
                </div>
                <a href="?logout=1" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">
                    Logout
                </a>
            </div>

            <!-- Navigation -->
            <nav class="flex gap-6 border-t border-slate-800 pt-4 pb-4 flex-wrap">
                <a href="index.php" class="text-indigo-500 border-b-2 border-indigo-500 pb-2 font-semibold">Dashboard</a>
                <a href="subscribers.php" class="text-slate-400 hover:text-white transition-colors">Subscribers</a>
                <a href="compose.php" class="text-slate-400 hover:text-white transition-colors">New Campaign</a>
            </nav>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Statistics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="backdrop-blur-xl bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900/70 transition-colors">
                <h3 class="text-sm uppercase font-semibold text-slate-400 tracking-wider mb-2">Active Subscribers</h3>
                <div class="text-4xl font-bold text-indigo-500 mb-2"><?php echo number_format($stats['total_subscribers']); ?></div>
                <p class="text-xs text-slate-500">Subscribed and active</p>
            </div>

            <div class="backdrop-blur-xl bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900/70 transition-colors">
                <h3 class="text-sm uppercase font-semibold text-slate-400 tracking-wider mb-2">Active Campaigns</h3>
                <div class="text-4xl font-bold text-indigo-500 mb-2"><?php echo $stats['active_campaigns']; ?></div>
                <p class="text-xs text-slate-500">Draft, scheduled, or sending</p>
            </div>

            <div class="backdrop-blur-xl bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900/70 transition-colors">
                <h3 class="text-sm uppercase font-semibold text-slate-400 tracking-wider mb-2">Emails This Week</h3>
                <div class="text-4xl font-bold text-indigo-500 mb-2"><?php echo number_format($stats['emails_sent_week']); ?></div>
                <p class="text-xs text-slate-500">Successfully sent</p>
            </div>

            <div class="backdrop-blur-xl bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900/70 transition-colors">
                <h3 class="text-sm uppercase font-semibold text-slate-400 tracking-wider mb-2">Open Rate</h3>
                <div class="text-4xl font-bold text-indigo-500 mb-2"><?php echo $stats['open_rate']; ?>%</div>
                <p class="text-xs text-slate-500">Average across campaigns</p>
            </div>
        </div>

        <!-- Recent Campaigns Section -->
        <div class="backdrop-blur-xl bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden mb-8">
            <div class="p-6 border-b border-slate-800">
                <h2 class="text-xl font-bold">Recent Campaigns</h2>
            </div>

            <?php if (count($recent_campaigns) > 0): ?>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="border-b border-slate-800 bg-slate-800/50">
                            <tr>
                                <th class="px-6 py-3 text-left font-semibold text-slate-300">Campaign</th>
                                <th class="px-6 py-3 text-left font-semibold text-slate-300">Status</th>
                                <th class="px-6 py-3 text-left font-semibold text-slate-300">Recipients</th>
                                <th class="px-6 py-3 text-left font-semibold text-slate-300">Sent</th>
                                <th class="px-6 py-3 text-left font-semibold text-slate-300">Opens</th>
                                <th class="px-6 py-3 text-left font-semibold text-slate-300">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($recent_campaigns as $campaign): ?>
                                <tr class="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                    <td class="px-6 py-3 font-medium"><?php echo htmlspecialchars($campaign['name']); ?></td>
                                    <td class="px-6 py-3">
                                        <?php
                                        $status = $campaign['status'];
                                        $status_styles = [
                                            'draft' => 'bg-slate-700 text-slate-100',
                                            'scheduled' => 'bg-amber-900 text-amber-200',
                                            'sending' => 'bg-blue-900 text-blue-200',
                                            'completed' => 'bg-green-900 text-green-200'
                                        ];
                                        $style = $status_styles[$status] ?? 'bg-slate-700 text-slate-100';
                                        ?>
                                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold <?php echo $style; ?>">
                                            <?php echo ucfirst($status); ?>
                                        </span>
                                    </td>
                                    <td class="px-6 py-3"><?php echo $campaign['recipient_count']; ?></td>
                                    <td class="px-6 py-3"><?php echo $campaign['sent_count']; ?></td>
                                    <td class="px-6 py-3"><?php echo $campaign['opened_count']; ?></td>
                                    <td class="px-6 py-3 text-slate-400"><?php echo date('M d, Y', strtotime($campaign['created_at'])); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php else: ?>
                <div class="p-12 text-center">
                    <p class="text-slate-400 mb-4">No campaigns yet</p>
                    <a href="compose.php" class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">
                        Create Your First Campaign
                    </a>
                </div>
            <?php endif; ?>
        </div>

        <!-- Quick Actions -->
        <div class="backdrop-blur-xl bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 class="text-xl font-bold mb-4">Quick Actions</h2>
            <div class="flex flex-wrap gap-3">
                <a href="compose.php" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">
                    New Campaign
                </a>
                <a href="subscribers.php" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors">
                    Manage Subscribers
                </a>
                <a href="subscribers.php?action=import" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors">
                    Import List
                </a>
            </div>
        </div>
    </main>

    <script>
        // Mark current page in nav
        const currentPath = window.location.pathname;
        document.querySelectorAll('nav a').forEach(link => {
            const href = link.getAttribute('href');
            if (currentPath.includes(href.split('?')[0])) {
                link.classList.add('text-indigo-500');
                link.classList.add('border-b-2');
                link.classList.add('border-indigo-500');
                link.classList.add('pb-2');
            }
        });
    </script>
</body>
</html>
