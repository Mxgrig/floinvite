<?php
/**
 * Subscriber Management
 * Add, edit, delete, and import subscribers
 */

require_once 'config.php';
require_auth();

$db = get_db();
$message = '';
$action = $_GET['action'] ?? '';

// Get subscribers with pagination
$page = max(1, intval($_GET['page'] ?? 1));
$limit = 50;
$offset = ($page - 1) * $limit;

$result = $db->query("SELECT COUNT(*) as count FROM subscribers");
$total = $result->fetch()['count'] ?? 0;
$pages = ceil($total / $limit);

$stmt = $db->prepare("
    SELECT id, email, name, company, status, created_at
    FROM subscribers
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
");
$stmt->bindValue(1, $limit, PDO::PARAM_INT);
$stmt->bindValue(2, $offset, PDO::PARAM_INT);
$stmt->execute();
$subscribers = $stmt->fetchAll();

// Handle add subscriber
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'add') {
    $email = trim($_POST['email'] ?? '');
    $name = trim($_POST['name'] ?? '');
    $company = trim($_POST['company'] ?? '');

    if (!validate_email($email)) {
        $message = 'Invalid email address';
    } else {
        try {
            $stmt = $db->prepare("
                INSERT INTO subscribers (email, name, company, status)
                VALUES (?, ?, ?, 'active')
            ");
            $stmt->execute([$email, $name, $company]);
            $message = 'Subscriber added successfully';
            log_activity('subscriber_added', ['email' => $email]);
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'UNIQUE') !== false) {
                $message = 'This email is already subscribed';
            } else {
                $message = 'Error adding subscriber';
            }
        }
    }
}

// Handle delete subscriber
if ($_GET['delete'] ?? false) {
    $id = intval($_GET['delete']);
    try {
        $stmt = $db->prepare("DELETE FROM subscribers WHERE id = ?");
        $stmt->execute([$id]);
        $message = 'Subscriber deleted';
        log_activity('subscriber_deleted', ['id' => $id]);
    } catch (Exception $e) {
        $message = 'Error deleting subscriber';
    }
}

// Handle import CSV
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_FILES['csv_file'] ?? false) {
    $file = $_FILES['csv_file'];

    if ($file['error'] === 0 && strpos($file['type'], 'csv') !== false) {
        $handle = fopen($file['tmp_name'], 'r');
        $count = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if ($count === 0 && ($row[0] === 'email' || $row[0] === 'Email')) {
                // Skip header row
                $count++;
                continue;
            }

            $email = trim($row[0] ?? '');
            $name = trim($row[1] ?? '');
            $company = trim($row[2] ?? '');

            if (validate_email($email)) {
                try {
                    $stmt = $db->prepare("
                        INSERT INTO subscribers (email, name, company, status)
                        VALUES (?, ?, ?, 'active')
                    ");
                    $stmt->execute([$email, $name, $company]);
                    $count++;
                } catch (PDOException $e) {
                    $skipped++;
                }
            } else {
                $skipped++;
            }
        }

        fclose($handle);
        $message = "Imported $count subscribers (skipped $skipped invalid rows)";
        log_activity('subscribers_imported', ['count' => $count, 'skipped' => $skipped]);
    } else {
        $message = 'Please upload a valid CSV file';
    }
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Subscribers - Floinvite Mail</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            border-bottom: 1px solid var(--border-color);
        }

        .tab-btn {
            padding: 0.75rem 1.5rem;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            font-weight: 600;
            color: var(--text-tertiary);
            transition: all 0.2s;
        }

        .tab-btn.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: var(--bg-secondary);
            padding: 1.5rem;
            border-radius: var(--radius-lg);
            border: 1px solid var(--border-color);
            text-align: center;
        }

        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-primary);
        }

        .stat-label {
            color: var(--text-tertiary);
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }

        .file-input-wrapper {
            position: relative;
            display: inline-block;
        }

        .file-input-wrapper input[type="file"] {
            position: absolute;
            opacity: 0;
            width: 100%;
            height: 100%;
        }

        .file-input-label {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: var(--primary);
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
        }

        .file-input-label:hover {
            background: var(--primary-dark);
        }

        .help-text {
            color: var(--text-tertiary);
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }
    </style>
</head>
<body>
    <header class="mail-hero">
        <div class="container">
            <a href="index.php" class="back-link">← Back to Dashboard</a>
            <h1>Manage Subscribers</h1>
            <nav class="nav mail-nav">
                <a href="index.php">Dashboard</a>
                <a href="subscribers.php" class="active">Subscribers</a>
                <a href="compose.php">New Campaign</a>
            </nav>
        </div>
    </header>

    <div class="container">
        <?php if ($message): ?>
            <div class="message"><?php echo htmlspecialchars($message); ?></div>
        <?php endif; ?>

        <!-- Statistics -->
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value"><?php echo number_format($total); ?></div>
                <div class="stat-label">Total Subscribers</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?php echo $pages; ?></div>
                <div class="stat-label">Pages</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">
                    <?php
                        $result = $db->query("SELECT COUNT(*) as count FROM subscribers WHERE status = 'unsubscribed'");
                        echo number_format($result->fetch()['count'] ?? 0);
                    ?>
                </div>
                <div class="stat-label">Unsubscribed</div>
            </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
            <button class="tab-btn active" onclick="showTab('list')">Subscriber List</button>
            <button class="tab-btn" onclick="showTab('add')">Add Subscriber</button>
            <button class="tab-btn" onclick="showTab('import')">Import CSV</button>
        </div>

        <!-- List Tab -->
        <div id="list-tab" class="section">
            <h2>Subscribers</h2>
            <?php if (count($subscribers) > 0): ?>
                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Name</th>
                            <th>Company</th>
                            <th>Status</th>
                            <th>Subscribed</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($subscribers as $sub): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($sub['email']); ?></td>
                                <td><?php echo htmlspecialchars($sub['name'] ?? '-'); ?></td>
                                <td><?php echo htmlspecialchars($sub['company'] ?? '-'); ?></td>
                                <td>
                                    <span class="status-badge <?php echo $sub['status'] !== 'active' ? $sub['status'] : ''; ?>">
                                        <?php echo ucfirst($sub['status']); ?>
                                    </span>
                                </td>
                                <td><?php echo date('M d, Y', strtotime($sub['created_at'])); ?></td>
                                <td>
                                    <a href="?delete=<?php echo $sub['id']; ?>" class="btn-danger" onclick="return confirm('Delete this subscriber?')">Delete</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

                <!-- Pagination -->
                <div class="pagination">
                    <?php if ($page > 1): ?>
                        <a href="?page=1">First</a>
                        <a href="?page=<?php echo $page - 1; ?>">Previous</a>
                    <?php endif; ?>

                    <?php for ($i = max(1, $page - 2); $i <= min($pages, $page + 2); $i++): ?>
                        <?php if ($i === $page): ?>
                            <span class="current"><?php echo $i; ?></span>
                        <?php else: ?>
                            <a href="?page=<?php echo $i; ?>"><?php echo $i; ?></a>
                        <?php endif; ?>
                    <?php endfor; ?>

                    <?php if ($page < $pages): ?>
                        <a href="?page=<?php echo $page + 1; ?>">Next</a>
                        <a href="?page=<?php echo $pages; ?>">Last</a>
                    <?php endif; ?>
                </div>
            <?php else: ?>
                <div class="empty-state">
                    <p>No subscribers yet. Add your first subscriber to get started!</p>
                </div>
            <?php endif; ?>
        </div>

        <!-- Add Tab -->
        <div id="add-tab" class="section" style="display: none;">
            <h2>Add New Subscriber</h2>
            <form method="POST" action="?action=add">
                <div class="form-row">
                    <div class="form-group">
                        <label for="email">Email Address *</label>
                        <input type="email" id="email" name="email" required placeholder="subscriber@example.com">
                    </div>
                    <div class="form-group">
                        <label for="name">Full Name</label>
                        <input type="text" id="name" name="name" placeholder="John Doe">
                    </div>
                </div>

                <div class="form-group">
                    <label for="company">Company</label>
                    <input type="text" id="company" name="company" placeholder="Company Name">
                </div>

                <button type="submit" class="btn-primary">Add Subscriber</button>
            </form>
        </div>

        <!-- Import Tab -->
        <div id="import-tab" class="section" style="display: none;">
            <h2>Import Subscribers from CSV</h2>
            <form method="POST" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="csv_file">CSV File</label>
                    <div class="file-input-wrapper">
                        <input type="file" id="csv_file" name="csv_file" accept=".csv" required>
                        <label for="csv_file" class="file-input-label">Choose CSV File</label>
                    </div>
                    <p class="help-text">CSV format: email, name (optional), company (optional)</p>
                </div>

                <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-lg); border-left: 4px solid var(--primary);">
                    <strong>Format Example:</strong>
                    <pre style="margin-top: 0.5rem; overflow-x: auto;">email,name,company
john@example.com,John Doe,ACME Corp
jane@example.com,Jane Smith,Tech Inc</pre>
                </div>

                <button type="submit" class="btn-primary">Import Subscribers</button>
            </form>
        </div>
    </div>

    <script>
        function showTab(tab) {
            document.querySelectorAll('.section').forEach(el => el.style.display = 'none');
            document.getElementById(tab + '-tab').style.display = 'block';

            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            event.target.classList.add('active');
        }

        // Update file input label with selected file name
        document.addEventListener('change', function(e) {
            if (e.target.type === 'file') {
                const label = e.target.nextElementSibling;
                if (e.target.files[0]) {
                    label.textContent = e.target.files[0].name;
                }
            }
        });
    </script>

    <!-- Footer -->
    <div class="container">
        <div style="text-align: center; padding: 2rem 0; border-top: 1px solid #e5e7eb; margin-top: 2rem; color: #6b7280; font-size: 0.875rem;">
            <p style="margin: 0;"><strong><span style="color: #4338ca;">flo</span><span style="color: #10b981;">invite</span></strong> Email Marketing Platform</p>
            <p style="margin: 0.25rem 0 0 0;"><?php echo date('M d, Y'); ?></p>
        </div>
    </div>
</body>
</html>
