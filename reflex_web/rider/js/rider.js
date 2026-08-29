document.addEventListener('DOMContentLoaded', () => {
    Auth.enforceRole('RIDER');

    const container = document.getElementById('deliveries-container');
    const errorMsg = document.getElementById('error-message');
    
    async function loadDeliveries() {
        try {
            const deliveries = await API.getDeliveries();
            renderDeliveries(deliveries);
            updateSummary(deliveries);
        } catch (error) {
            container.innerHTML = `<div class="error-message">Failed to load deliveries.</div>`;
        }
    }

    function updateSummary(deliveries) {
        document.getElementById('count-assigned').textContent = deliveries.filter(d => d.status === 'ASSIGNED').length;
        document.getElementById('count-picked-up').textContent = deliveries.filter(d => d.status === 'PICKED_UP').length;
        document.getElementById('count-delivered').textContent = deliveries.filter(d => d.status === 'DELIVERED').length;
    }

    function renderDeliveries(deliveries) {
        container.innerHTML = '';
        
        // Hide delivered items from active list usually, but for MVP we show all assigned to them
        if (deliveries.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted);">No deliveries assigned to you.</div>`;
            return;
        }

        deliveries.forEach(d => {
            const card = document.createElement('div');
            card.className = 'mobile-card';
            
            let actionHtml = '';
            if (d.status === 'ASSIGNED') {
                actionHtml = `<button class="btn btn-primary btn-block" onclick="updateStatus(${d.id}, 'PICKED_UP')">Mark as Picked Up</button>`;
            } else if (d.status === 'PICKED_UP') {
                actionHtml = `<button class="btn btn-primary btn-block" style="background-color: var(--status-delivered);" onclick="updateStatus(${d.id}, 'DELIVERED')">Mark as Delivered</button>`;
            } else if (d.status === 'DELIVERED') {
                actionHtml = `<div style="text-align:center; color: var(--status-delivered); font-weight: 600;">Delivered ✓</div>`;
            }

            card.innerHTML = `
                <div class="flex justify-between align-center mb-1">
                    <strong>#${d.id}</strong>
                    <span class="badge badge-${d.status}">${d.status.replace('_', ' ')}</span>
                </div>
                
                <div class="detail-row mt-2">
                    <span class="detail-label">Customer</span>
                    <span class="detail-value text-right">
                        ${d.customer_name}<br>
                        <a href="tel:${d.customer_phone}" style="color: var(--primary-color); text-decoration: none;">${d.customer_phone}</a>
                    </span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Address</span>
                    <span class="detail-value text-right" style="max-width: 60%;">${d.delivery_address}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Item</span>
                    <span class="detail-value">${d.item_description}</span>
                </div>
                
                <div class="action-bar">
                    ${actionHtml}
                </div>
            `;
            container.appendChild(card);
        });
    }

    window.updateStatus = async function(deliveryId, newStatus) {
        errorMsg.style.display = 'none';
        
        try {
            await API.updateDeliveryStatus(deliveryId, newStatus);
            // Refresh
            loadDeliveries();
        } catch (error) {
            errorMsg.textContent = error.message || `Failed to update status to ${newStatus}.`;
            errorMsg.style.display = 'block';
            window.scrollTo(0, 0);
        }
    };

    loadDeliveries();
});
