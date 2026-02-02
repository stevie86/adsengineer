# Current WooCommerce Plugin UI Patterns

## Visual Layout Breakdown

### Plugin 1: `adsengineer-woocommerce.php` (Main Plugin)
**Location:** Settings > AdsEngineer

```
┌─────────────────────────────────────────────────────────────┐
│ AdsEngineer for WooCommerce                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Configure your AdsEngineer integration to automatically     │
│ track WooCommerce orders.                                   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ FORM SECTION                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Webhook URL                                                 │
│ [https://your-domain.workers.dev/webhooks/woo]             │
│                                                              │
│ Your AdsEngineer webhook URL. Leave empty to use the       │
│ default.                                                    │
│ Default: https://adsengineer-cloud.adsengineer.workers.dev │
│                                                              │
│ [Save Settings]                                             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Setup Instructions                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. Enter your AdsEngineer webhook URL above                │
│ 2. Make sure your site can capture GCLID parameters        │
│ 3. Orders will be automatically sent to AdsEngineer        │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ GCLID Capture                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ To capture Google Ads click IDs, add this code to your     │
│ theme's functions.php or use a plugin:                     │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ // Capture GCLID on page load                           │ │
│ │ function capture_gclid() {                              │ │
│ │     if (isset($_GET['gclid'])) {                        │ │
│ │         setcookie('gclid', $_GET['gclid'],             │ │
│ │         time() + (86400 * 30), "/");                    │ │
│ │     }                                                    │ │
│ │ }                                                        │ │
│ │ add_action('init', 'capture_gclid');                    │ │
│ │                                                          │ │
│ │ // Save GCLID to order meta                             │ │
│ │ function save_gclid_to_order($order_id) {               │ │
│ │     if (isset($_COOKIE['gclid'])) {                     │ │
│ │         $order = wc_get_order($order_id);               │ │
│ │         $order->update_meta_data('_gclid',              │ │
│ │         $_COOKIE['gclid']);                             │ │
│ │         $order->save();                                 │ │
│ │     }                                                    │ │
│ │ }                                                        │ │
│ │ add_action('woocommerce_checkout_update_order_meta',    │ │
│ │     'save_gclid_to_order');                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Plugin 2: `adsengineer-tracking.php` (Tracking Plugin)
**Location:** Top-level menu > AdsEngineer

```
┌─────────────────────────────────────────────────────────────┐
│ AdsEngineer Configuration                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Site ID                                                     │
│ [                                                    ]      │
│                                                              │
│ [Save Changes]                                              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Webhook Setup                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ To finish setup:                                            │
│                                                              │
│ 1. Go to WooCommerce > Settings > Advanced > Webhooks      │
│ 2. Click Add Webhook                                        │
│ 3. Name: AdsEngineer Order Created                         │
│ 4. Status: Active                                           │
│ 5. Topic: Order created                                     │
│ 6. Delivery URL: https://adsengineer-cloud.adsengineer...  │
│ 7. Secret: (Copy from your AdsEngineer Dashboard)          │
│ 8. Save Hook                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## HTML Structure Patterns

### Form Table Pattern (Both Plugins)
```html
<table class="form-table">
  <tr>
    <th scope="row">Field Label</th>
    <td>
      <input type="text" name="field_name" value="..." class="regular-text" />
      <p class="description">Help text here</p>
    </td>
  </tr>
</table>
```

### CSS Classes Applied
```
.wrap                    → Main container (WordPress admin page)
.form-table              → Table for form fields
.regular-text            → Standard input field width
.description             → Help text styling
.notice.notice-success   → Success message (green box)
.error                   → Error message (red box)
```

---

## Form Field Types Currently Used

### Input Fields
```php
// Text input
<input type="text" name="field_name" value="..." class="regular-text" />

// URL input
<input type="url" name="field_name" value="..." class="regular-text" />
```

### Buttons
```php
// WordPress standard button
<?php submit_button('Save Settings'); ?>
<?php submit_button('Save Changes'); ?>
```

### Security
```php
// Nonce field (main plugin)
<?php wp_nonce_field('adsengineer_settings'); ?>

// Settings API (tracking plugin)
<?php settings_fields('adsengineer_options'); ?>
```

---

## Data Handling Patterns

### Main Plugin (Custom Handler)
```php
// Form submission
if (isset($_POST['submit'])) {
  update_option('adsengineer_webhook_url', sanitize_text_field($_POST['adsengineer_webhook_url']));
  echo '<div class="notice notice-success"><p>Settings saved successfully!</p></div>';
}

// Retrieval
$webhook_url = get_option('adsengineer_webhook_url', '');
```

### Tracking Plugin (Settings API)
```php
// Registration
register_setting('adsengineer_options', 'adsengineer_site_id');

// Form
<form method="post" action="options.php">
  <?php settings_fields('adsengineer_options'); ?>
  <?php do_settings_sections('adsengineer_options'); ?>
</form>

// Retrieval
get_option('adsengineer_site_id')
```

---

## Styling Approach

### Current Approach
- **No custom CSS files** - Relies on WordPress admin theme
- **Inline HTML** - All markup in PHP
- **Standard WordPress classes** - Uses built-in styling
- **Responsive** - Inherits from WordPress admin theme

### CSS Cascade
```
WordPress Admin Theme
  ↓
.wrap (container)
  ↓
.form-table (form layout)
  ↓
.regular-text (input fields)
  ↓
.description (help text)
```

---

## Form Submission Flow

### Main Plugin Flow
```
User fills form
    ↓
Clicks "Save Settings"
    ↓
POST to same page (action="")
    ↓
PHP checks $_POST['submit']
    ↓
Sanitizes input with sanitize_text_field()
    ↓
Saves to options table with update_option()
    ↓
Displays success notice
    ↓
Page reloads with saved values
```

### Tracking Plugin Flow
```
User fills form
    ↓
Clicks "Save Changes"
    ↓
POST to options.php (WordPress Settings API)
    ↓
WordPress validates nonce
    ↓
WordPress sanitizes based on register_setting()
    ↓
WordPress saves to options table
    ↓
WordPress displays success message
    ↓
Page reloads with saved values
```

---

## Accessibility Features

### Current Implementation
✅ `<th scope="row">` for table headers  
✅ `<label>` implied through table structure  
✅ `placeholder` attributes for hints  
✅ `type="url"` for semantic input type  
✅ Proper escaping with `esc_attr()`  

### Missing Features
❌ Explicit `<label>` elements  
❌ `aria-describedby` for help text  
❌ `aria-required` for required fields  
❌ `aria-invalid` for error states  
❌ Keyboard navigation indicators  

---

## Responsive Behavior

### Desktop (Current)
- Form table displays normally
- Input fields use `.regular-text` width
- Code blocks in `<pre>` tags

### Mobile (Inherited from WordPress)
- WordPress admin theme handles responsiveness
- Form table may stack on small screens
- Input fields adapt to viewport

---

## Color & Visual Hierarchy

### Current Colors (From WordPress Admin)
- **Background:** White
- **Text:** Dark gray (#333)
- **Headings:** Dark gray (#000)
- **Links:** Blue (#0073aa)
- **Success:** Green (#46b450)
- **Error:** Red (#dc3545)
- **Borders:** Light gray (#ddd)

### Visual Hierarchy
```
H1 (Page Title)
  ↓
Paragraph (Description)
  ↓
Form Section
  ├─ Field Label (th)
  ├─ Input Field
  └─ Help Text (p.description)
  ↓
H2 (Section Title)
  ↓
Content (ol, p, pre)
```

---

## Key Takeaways

### Strengths
1. ✅ Uses WordPress admin standards
2. ✅ Proper security (nonces, sanitization)
3. ✅ Responsive design (inherited)
4. ✅ Accessible table structure
5. ✅ Clear help text

### Weaknesses
1. ❌ Minimal visual design
2. ❌ No custom branding
3. ❌ Two separate pages (confusing)
4. ❌ No status indicators
5. ❌ Code snippets hard to copy
6. ❌ No form validation feedback
7. ❌ No error handling display

### Opportunities for Enhancement
1. 🎨 Add custom CSS for branding
2. 🔧 Consolidate settings pages
3. ✨ Add status/health indicators
4. 📋 Improve code snippet UX
5. 🔍 Add form validation
6. 📊 Add configuration status
7. 🎯 Better visual hierarchy
