document.addEventListener('DOMContentLoaded', () => {
    Auth.enforceRole('RETAILER');

    const tableBody = document.querySelector('#deliveries-table tbody');
    const createModal = document.getElementById('create-modal');
    const openModalBtn = document.getElementById('open-create-modal');
    const closeModalBtn = document.getElementById('close-create-modal');
    const createForm = document.getElementById('create-form');
    const createError = document.getElementById('create-error');

    // Load Data
    async function loadDeliveries() {
        try {
            const deliveries = await API.getDeliveries();
            renderDeliveries(deliveries);
            updateSummary(deliveries);
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="6" class="error-message">Failed to load deliveries.</td></tr>`;
        }
    }

    function renderDeliveries(deliveries) {
        tableBody.innerHTML = '';
        if (deliveries.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No deliveries found.</td></tr>`;
            return;
        }

        deliveries.forEach(d => {
            const tr = document.createElement('tr');
            const riderName = d.rider_name || '-';
            tr.innerHTML = `
                <td>#${d.id}</td>
                <td>
                    <div>${d.customer_name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${d.customer_phone}</div>
                </td>
                <td>${d.delivery_address}</td>
                <td>${d.item_description}</td>
                <td>${riderName}</td>
                <td><span class="badge badge-${d.status}">${d.status.replace('_', ' ')}</span></td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function updateSummary(deliveries) {
        document.getElementById('count-total').textContent = deliveries.length;
        document.getElementById('count-pending').textContent = deliveries.filter(d => d.status === 'PENDING').length;
        document.getElementById('count-assigned').textContent = deliveries.filter(d => d.status === 'ASSIGNED').length;
        document.getElementById('count-delivered').textContent = deliveries.filter(d => d.status === 'DELIVERED').length;
    }

    // Modal logic
    openModalBtn.addEventListener('click', () => {
        createModal.classList.add('active');
        createError.style.display = 'none';
        createForm.reset();
    });

    closeModalBtn.addEventListener('click', () => {
        createModal.classList.remove('active');
    });

    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            customer_name: document.getElementById('customer_name').value,
            customer_phone: document.getElementById('customer_phone').value,
            delivery_address: document.getElementById('delivery_address').value,
            item_description: document.getElementById('item_description').value
        };

        const btn = document.getElementById('create-delivery-btn');
        btn.textContent = 'Creating...';
        btn.disabled = true;

        try {
            await API.createDelivery(data);
            createModal.classList.remove('active');
            loadDeliveries();
        } catch (error) {
            createError.textContent = error.message || 'Failed to create delivery.';
            createError.style.display = 'block';
        } finally {
            btn.textContent = 'Create Delivery';
            btn.disabled = false;
        }
    });

    loadDeliveries();
});
