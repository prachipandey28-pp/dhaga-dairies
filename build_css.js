const fs = require('fs');
const path = require('path');

const srcFile = 'C:/Users/anshu pandey/.gemini/antigravity/scratch/dhaga_backup_assets/original_backup/dhaga_diaries_with_product_reviews.html';
const html = fs.readFileSync(srcFile, 'utf8');

// Extract all <style> blocks
const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
let match;
let css = '';
while ((match = styleRegex.exec(html)) !== null) {
  css += match[1] + '\n\n';
}

// Replace footer base64 with /images/footer_bg.png
css = css.replace(/url\(["']?data:image\/png;base64,[^"'\)]+["']?\)/g, (m) => {
  if (m.length > 3000000) {
    return 'url("/images/footer_bg.png")';
  } else {
    return 'url("/images/nav_bg.png")';
  }
});

// Additional styles for checkout modal, admin layout, and responsive components
const additionalCss = `
/* ==========================================================
   Checkout & E-commerce Modal Enhancements
   ========================================================== */
.checkout-modal {
  width: min(650px, 95vw);
  max-height: 92vh;
  overflow-y: auto;
  border: 1px solid #d8b66d;
}
.checkout-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 20px;
}
@media(max-width: 680px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
}
.order-summary-box {
  background: #fcf8f2;
  border: 1px solid #ead9c7;
  border-radius: 12px;
  padding: 16px;
}
.order-item-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0e2d3;
}
.order-item-mini:last-child {
  border-bottom: 0;
}
.order-item-mini img, .order-item-mini .thumb {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  object-fit: cover;
  background: #eee1d3;
  display: grid;
  place-items: center;
  font-size: 20px;
}
.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--muted);
  margin-top: 6px;
}
.summary-line.total {
  border-top: 2px dashed #e2caa8;
  padding-top: 10px;
  margin-top: 12px;
  font-size: 17px;
  font-weight: 700;
  color: #570606;
}

/* ==========================================================
   Admin Navigation & Multi-Tab Dashboard Styling
   ========================================================== */
.admin-nav-tabs {
  display: flex;
  gap: 8px;
  margin: 20px 0;
  border-bottom: 2px solid #e5cfaa;
  padding-bottom: 2px;
  overflow-x: auto;
}
.admin-tab {
  padding: 10px 18px;
  font-weight: 600;
  font-size: 14px;
  border: 0;
  border-radius: 8px 8px 0 0;
  background: transparent;
  color: #634d47;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.admin-tab:hover {
  color: #570606;
  background: #f7ede0;
}
.admin-tab.active {
  background: #570606;
  color: #fff4e0 !important;
  box-shadow: 0 4px 12px rgba(87,6,6,0.18);
}
.admin-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.badge-success { background: #dafbe4; color: #15693b; }
.badge-warning { background: #fef0c7; color: #8f5808; }
.badge-danger { background: #fde8e8; color: #9b1c1c; }
.badge-info { background: #e0f2fe; color: #0369a1; }

.status-select {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #d4b58e;
  font-size: 12px;
  background: #fff;
  color: #40241f;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #ebd9c5;
}
.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
  background: white;
}
.admin-table th {
  background: #fcf7ef;
  color: #570606;
  padding: 12px 14px;
  font-weight: 600;
  border-bottom: 2px solid #ecdac8;
}
.admin-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f5ede4;
  vertical-align: middle;
}
.admin-table tr:hover td {
  background: #fffdfa;
}
.action-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
}
.btn-sm {
  padding: 6px 12px !important;
  font-size: 12px !important;
  border-radius: 6px !important;
}
.btn-danger-sm {
  background: #fff3f3 !important;
  border: 1px solid #f0b8b8 !important;
  color: #991b1b !important;
  padding: 6px 12px !important;
  font-size: 12px !important;
  border-radius: 6px !important;
  cursor: pointer;
}
.btn-danger-sm:hover {
  background: #991b1b !important;
  color: white !important;
}

/* Product Preview Modal */
.preview-card {
  max-width: 320px;
  margin: 15px auto;
}

/* Verified purchase checkmark */
.verified-badge {
  color: #15803d;
  font-size: 11px;
  font-weight: 600;
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
`;

css += '\n' + additionalCss;

fs.writeFileSync('C:/Users/anshu pandey/.gemini/antigravity/scratch/dhaga-diaries/src/app/globals.css', css, 'utf8');
console.log('globals.css written! Length:', css.length);
