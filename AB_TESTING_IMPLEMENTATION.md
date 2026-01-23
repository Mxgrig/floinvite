# A/B Testing Implementation for Floinvite Email Marketing

## Overview
Implement A/B testing capabilities to optimize email campaign performance by testing different subject lines, content, and send times.

## Current System Analysis
- **Compose Interface**: `public/floinvite-mail/compose.php`
- **Sending Logic**: `public/floinvite-mail/send.php`
- **Database**: `campaigns` and `campaign_sends` tables
- **Tracking**: Open/click tracking already implemented

## A/B Testing Features to Add

### 1. Campaign Variants Table
Add new database table for storing test variants:

```sql
CREATE TABLE campaign_variants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT,
    variant_name VARCHAR(50), -- 'A', 'B', 'C'
    subject_line VARCHAR(255),
    html_content TEXT,
    test_percentage DECIMAL(5,2), -- 33.33 for 1/3 split
    winner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);
```

### 2. Enhanced Compose Interface

#### New Fields in compose.php
```php
<!-- A/B Testing Section -->
<div class="ab-testing-section" style="display:none;">
    <h3>A/B Testing Setup</h3>

    <label><input type="checkbox" id="enable_ab"> Enable A/B Testing</label>

    <div id="variant-setup" style="display:none;">
        <h4>Variant A (Control)</h4>
        <input type="text" name="subject_a" placeholder="Subject Line A" required>

        <h4>Variant B (Test)</h4>
        <input type="text" name="subject_b" placeholder="Subject Line B" required>

        <h4>Optional Variant C</h4>
        <input type="text" name="subject_c" placeholder="Subject Line C">

        <label>Test Distribution:
            <select name="test_split">
                <option value="50-50">50% A / 50% B</option>
                <option value="33-33-33">33% A / 33% B / 33% C</option>
                <option value="70-30">70% A / 30% B</option>
            </select>
        </label>

        <label>Test Duration:
            <select name="test_duration">
                <option value="1">1 hour</option>
                <option value="24">24 hours</option>
                <option value="168">1 week</option>
            </select>
        </label>
    </div>
</div>
```

#### JavaScript Toggle
```javascript
document.getElementById('enable_ab').addEventListener('change', function() {
    document.getElementById('variant-setup').style.display =
        this.checked ? 'block' : 'none';
});
```

### 3. Modified Sending Logic

#### Update send.php
```php
// Check if campaign has A/B testing enabled
$ab_enabled = isset($_POST['enable_ab']) && $_POST['enable_ab'] == '1';

if ($ab_enabled) {
    // Create campaign variants
    $variants = [
        'A' => ['subject' => $_POST['subject_a'], 'content' => $html_content],
        'B' => ['subject' => $_POST['subject_b'], 'content' => $html_content]
    ];

    if (!empty($_POST['subject_c'])) {
        $variants['C'] = ['subject' => $_POST['subject_c'], 'content' => $html_content];
    }

    // Calculate test distribution
    $test_split = explode('-', $_POST['test_split']);
    $variant_counts = array_map('intval', $test_split);

    // Save variants to database
    foreach ($variants as $name => $data) {
        $percentage = $variant_counts[array_search($name, array_keys($variants))] ?? 33.33;

        $stmt = $pdo->prepare("
            INSERT INTO campaign_variants
            (campaign_id, variant_name, subject_line, html_content, test_percentage)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$campaign_id, $name, $data['subject'], $data['content'], $percentage]);
    }

    // Send test batch only
    send_ab_test_batch($campaign_id, $subscribers, $variant_counts);

} else {
    // Normal sending logic
    send_normal_campaign($campaign_id, $subscribers, $subject, $html_content);
}
```

### 4. A/B Test Batch Sending Function
```php
function send_ab_test_batch($campaign_id, $subscribers, $variant_counts) {
    global $pdo;

    // Get variants
    $stmt = $pdo->prepare("SELECT * FROM campaign_variants WHERE campaign_id = ?");
    $stmt->execute([$campaign_id]);
    $variants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate split
    $total_percentage = array_sum(array_column($variants, 'test_percentage'));
    $test_size = ceil(count($subscribers) * ($total_percentage / 100));

    // Randomly assign subscribers to variants
    shuffle($subscribers);
    $test_subscribers = array_slice($subscribers, 0, $test_size);

    $variant_index = 0;
    $variant_counts = array_map(function($v) { return ceil($test_size * $v['test_percentage'] / 100); }, $variants);

    foreach ($test_subscribers as $subscriber) {
        $variant = $variants[$variant_index % count($variants)];

        // Send with variant subject/content
        send_email_variant($subscriber, $variant);

        $variant_counts[$variant_index]--;
        if ($variant_counts[$variant_index] <= 0) {
            $variant_index++;
        }
    }
}
```

### 5. Tracking & Analytics

#### Enhanced Tracking Pixel
Update `track.php` to include variant tracking:

```php
// Extract variant from tracking ID
// tracking_id format: campaign_id-variant-subscriber_id-timestamp
$tracking_parts = explode('-', $_GET['id']);
$variant = $tracking_parts[1]; // 'A', 'B', or 'C'

// Update tracking with variant
$stmt = $pdo->prepare("
    UPDATE email_opens
    SET variant = ?, opened_at = NOW()
    WHERE tracking_id = ?
");
$stmt->execute([$variant, $_GET['id']]);
```

#### Analytics Dashboard
Create `ab-analytics.php` for viewing test results:

```php
// Get variant performance
$stmt = $pdo->prepare("
    SELECT
        v.variant_name,
        COUNT(DISTINCT o.subscriber_id) as opens,
        COUNT(DISTINCT c.subscriber_id) as clicks,
        COUNT(DISTINCT s.subscriber_id) as sent
    FROM campaign_variants v
    LEFT JOIN email_opens o ON o.variant = v.variant_name AND o.campaign_id = v.campaign_id
    LEFT JOIN email_clicks c ON c.variant = v.variant_name AND c.campaign_id = v.campaign_id
    LEFT JOIN campaign_sends s ON s.campaign_id = v.campaign_id
    WHERE v.campaign_id = ?
    GROUP BY v.variant_name
");

$stmt->execute([$campaign_id]);
$results = $stmt->fetchAll();

// Calculate winner
$winner = determine_winner($results);
if ($winner) {
    // Mark winner in database
    $stmt = $pdo->update("UPDATE campaign_variants SET winner = 1 WHERE campaign_id = ? AND variant_name = ?", [$campaign_id, $winner]);
    // Send remaining emails with winner variant
    send_remaining_with_winner($campaign_id, $winner);
}
```

### 6. Winner Determination Logic
```php
function determine_winner($results) {
    $best_variant = null;
    $best_score = 0;

    foreach ($results as $result) {
        // Calculate engagement score (opens + clicks * 2)
        $score = $result['opens'] + ($result['clicks'] * 2);

        if ($score > $best_score) {
            $best_score = $score;
            $best_variant = $result['variant_name'];
        }
    }

    return $best_variant;
}
```

### 7. Automated Winner Deployment
```php
function send_remaining_with_winner($campaign_id, $winner_variant) {
    global $pdo;

    // Get winner variant data
    $stmt = $pdo->prepare("SELECT * FROM campaign_variants WHERE campaign_id = ? AND variant_name = ?");
    $stmt->execute([$campaign_id, $winner_variant]);
    $winner = $stmt->fetch();

    // Get remaining subscribers (not in test batch)
    $stmt = $pdo->prepare("
        SELECT s.* FROM subscribers s
        LEFT JOIN campaign_sends cs ON cs.subscriber_id = s.id AND cs.campaign_id = ?
        WHERE cs.id IS NULL AND s.status = 'active'
    ");
    $stmt->execute([$campaign_id]);
    $remaining_subscribers = $stmt->fetchAll();

    // Send to remaining subscribers with winner variant
    foreach ($remaining_subscribers as $subscriber) {
        send_email_variant($subscriber, $winner);
    }
}
```

## Implementation Priority

### Phase 1: Basic A/B Testing
- Add campaign_variants table
- Modify compose.php for variant input
- Update send.php for test batch creation

### Phase 2: Analytics Dashboard
- Create ab-analytics.php
- Add variant tracking to opens/clicks
- Implement winner determination

### Phase 3: Automation
- Automatic winner deployment
- Scheduled test completion checks
- Performance reporting

## Testing Checklist

- [ ] Create test campaign with 2 variants
- [ ] Send to small subscriber list (10-20)
- [ ] Verify variant distribution
- [ ] Check tracking pixel includes variant
- [ ] Confirm analytics show variant performance
- [ ] Test winner auto-deployment

## Benefits

- **Data-Driven Optimization**: Test subject lines, content, and timing
- **Improved Performance**: 10-30% better open/click rates
- **Automated Learning**: System improves over time
- **Risk Reduction**: Test on small groups before full send

This implementation provides robust A/B testing capabilities while building on the existing email marketing infrastructure.