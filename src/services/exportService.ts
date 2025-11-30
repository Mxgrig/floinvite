/**
 * Export Service
 * Handles exporting guest and host data to various formats
 * Supports: CSV, JSON, HTML
 */

import { Guest, Host } from '../types';

export class ExportService {
  /**
   * Export guests to CSV format
   */
  static exportGuestsToCSV(guests: Guest[], filename: string = 'guests.csv'): void {
    const headers = [
      'Name',
      'Company',
      'Email',
      'Phone',
      'Host ID',
      'Check-In Time',
      'Check-Out Time',
      'Status',
      'Visit Count',
      'Pre-Registered'
    ];

    const rows = guests.map(g => [
      this.escapeCSV(g.name),
      this.escapeCSV(g.company || ''),
      this.escapeCSV(g.email || ''),
      this.escapeCSV(g.phone || ''),
      this.escapeCSV(g.hostId),
      g.checkInTime,
      g.checkOutTime || '',
      g.status,
      g.visitCount || 0,
      g.preRegistered ? 'Yes' : 'No'
    ]);

    this.downloadCSV([headers, ...rows], filename);
  }

  /**
   * Export hosts to CSV format
   */
  static exportHostsToCSV(hosts: Host[], filename: string = 'hosts.csv'): void {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Department',
      'Email Notifications',
      'SMS Notifications',
      'SMS Carrier'
    ];

    const rows = hosts.map(h => [
      this.escapeCSV(h.name),
      this.escapeCSV(h.email),
      this.escapeCSV(h.phone || ''),
      this.escapeCSV(h.department || ''),
      h.notifyByEmail ? 'Yes' : 'No',
      h.notifyBySMS ? 'Yes' : 'No',
      this.escapeCSV(h.smsCarrier || '')
    ]);

    this.downloadCSV([headers, ...rows], filename);
  }

  /**
   * Export guests to JSON format
   */
  static exportGuestsToJSON(guests: Guest[], filename: string = 'guests.json'): void {
    const data = {
      exportDate: new Date().toISOString(),
      recordCount: guests.length,
      guests
    };

    this.downloadJSON(data, filename);
  }

  /**
   * Export hosts to JSON format
   */
  static exportHostsToJSON(hosts: Host[], filename: string = 'hosts.json'): void {
    const data = {
      exportDate: new Date().toISOString(),
      recordCount: hosts.length,
      hosts
    };

    this.downloadJSON(data, filename);
  }

  /**
   * Export guests to HTML table
   */
  static exportGuestsToHTML(guests: Guest[], filename: string = 'guests.html'): void {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Guests Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #4f46e5; color: white; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .header { margin-bottom: 20px; }
        .date { color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Guest Check-In Report</h1>
        <p class="date">Generated: ${new Date().toLocaleString()}</p>
        <p>Total Records: ${guests.length}</p>
    </div>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Check-In Time</th>
                <th>Check-Out Time</th>
                <th>Status</th>
                <th>Visits</th>
            </tr>
        </thead>
        <tbody>
            ${guests
              .map(
                g => `
            <tr>
                <td>${this.escapeHTML(g.name)}</td>
                <td>${this.escapeHTML(g.company || '')}</td>
                <td>${this.escapeHTML(g.email || '')}</td>
                <td>${this.escapeHTML(g.phone || '')}</td>
                <td>${new Date(g.checkInTime).toLocaleString()}</td>
                <td>${g.checkOutTime ? new Date(g.checkOutTime).toLocaleString() : '-'}</td>
                <td>${g.status}</td>
                <td>${g.visitCount || 0}</td>
            </tr>
            `
              )
              .join('')}
        </tbody>
    </table>
</body>
</html>
    `;

    this.downloadHTML(html, filename);
  }

  /**
   * Generate summary report as HTML
   */
  static generateSummaryReport(guests: Guest[], hosts: Host[]): string {
    const today = new Date().toDateString();
    const todayGuests = guests.filter(
      g => new Date(g.checkInTime).toDateString() === today
    );

    const checkedIn = todayGuests.filter(g => g.status === 'Checked In').length;
    const checkedOut = todayGuests.filter(g => g.status === 'Checked Out').length;
    const noShow = todayGuests.filter(g => g.status === 'No Show').length;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Daily Summary Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f9fafb; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        h1 { color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 36px; font-weight: bold; }
        .stat-label { font-size: 14px; margin-top: 10px; opacity: 0.9; }
        .stat-box.success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .stat-box.warning { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); }
        .stat-box.danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 12px; text-align: left; }
        th { background: #f3f4f6; font-weight: 600; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Floinvite - Daily Summary Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        
        <div class="stats">
            <div class="stat-box">
                <div class="stat-number">${todayGuests.length}</div>
                <div class="stat-label">Total Visitors Today</div>
            </div>
            <div class="stat-box success">
                <div class="stat-number">${checkedIn}</div>
                <div class="stat-label">Currently Checked In</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${checkedOut}</div>
                <div class="stat-label">Checked Out</div>
            </div>
            <div class="stat-box danger">
                <div class="stat-number">${noShow}</div>
                <div class="stat-label">No Shows</div>
            </div>
        </div>

        <h2>Today's Check-Ins</h2>
        ${
          todayGuests.length > 0
            ? `
        <table>
            <thead>
                <tr>
                    <th>Visitor Name</th>
                    <th>Company</th>
                    <th>Host</th>
                    <th>Time</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${todayGuests
                  .map(g => {
                    const host = hosts.find(h => h.id === g.hostId);
                    return `
                <tr>
                    <td>${this.escapeHTML(g.name)}</td>
                    <td>${this.escapeHTML(g.company || '-')}</td>
                    <td>${this.escapeHTML(host?.name || 'Unknown')}</td>
                    <td>${new Date(g.checkInTime).toLocaleTimeString()}</td>
                    <td><strong>${g.status}</strong></td>
                </tr>
                `;
                  })
                  .join('')}
            </tbody>
        </table>
        `
            : '<p>No visitors today.</p>'
        }

        <div class="footer">
            <p>This report was automatically generated by Floinvite.</p>
            <p>Total Hosts: ${hosts.length} | Total Records in System: ${guests.length}</p>
        </div>
    </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * PRIVATE HELPERS
   */

  private static escapeCSV(str: string): string {
    if (!str) return '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private static escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private static downloadCSV(rows: string[][], filename: string): void {
    const csv = rows.map(row => row.join(',')).join('\n');
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  private static downloadJSON(data: any, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    this.downloadFile(json, filename, 'application/json;charset=utf-8;');
  }

  private static downloadHTML(html: string, filename: string): void {
    this.downloadFile(html, filename, 'text/html;charset=utf-8;');
  }

  private static downloadFile(
    content: string,
    filename: string,
    mimeType: string
  ): void {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}
