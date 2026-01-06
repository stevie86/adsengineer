// Simple status checker for AdsEngineer Shopify plugin
(function() {
    'use strict';

    const statusIndicator = document.getElementById('statusIndicator');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const shopifyStatus = document.getElementById('shopifyStatus');
    const adsengineerStatus = document.getElementById('adsengineerStatus');
    const lastCheck = document.getElementById('lastCheck');
    const version = document.getElementById('version');

    function updateStatus(connected, checking = false) {
        statusIndicator.className = 'status-indicator';
        
        if (checking) {
            statusIndicator.classList.add('status-checking');
            statusIcon.textContent = '⏳';
            statusText.textContent = 'Checking connection...';
        } else if (connected) {
            statusIndicator.classList.add('status-active');
            statusIcon.textContent = '✅';
            statusText.textContent = 'Connection Active';
        } else {
            statusIndicator.classList.add('status-inactive');
            statusIcon.textContent = '❌';
            statusText.textContent = 'Connection Issues';
        }
    }

    async function checkStatus() {
        try {
            updateStatus(false, true); // Show checking state
            
            const response = await fetch('/api/status');
            const data = await response.json();
            
            // Update status display
            updateStatus(data.adsengineer_connected);
            
            // Update details
            adsengineerStatus.textContent = data.adsengineer_connected ? '✅ Connected' : '❌ Disconnected';
            lastCheck.textContent = new Date(data.last_check).toLocaleString();
            version.textContent = data.version || '1.0.0';
            
            // Shopify is always connected (we're running in Shopify)
            shopifyStatus.textContent = '✅ Connected';
            
        } catch (error) {
            console.error('Status check failed:', error);
            updateStatus(false);
            adsengineerStatus.textContent = '❌ Error: ' + error.message;
            lastCheck.textContent = new Date().toLocaleString();
        }
    }

    // Check status on page load
    checkStatus();
    
    // Check status every 30 seconds
    setInterval(checkStatus, 30000);
    
    // Allow manual refresh
    statusIndicator.addEventListener('click', function() {
        checkStatus();
    });
    
    // Show tooltip on hover
    statusIndicator.title = 'Click to refresh connection status';
    
})();