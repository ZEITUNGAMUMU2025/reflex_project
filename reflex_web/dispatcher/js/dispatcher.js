document.addEventListener('DOMContentLoaded', () => {
    Auth.enforceRole('DISPATCHER');

    const tableBody = document.querySelector('#deliveries-table tbody');
    const assignModal = document.getElementById('assign-modal');
    const closeAssignBtn = document.getElementById('close-assign-modal');
    const assignForm = document.getElementById('assign-form');
    const riderSelect = document.getElementById('rider_select');
    const assignError = document.getElementById('assign-error');
    const assignSuccess = document.getElementById('assign-success');
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    let allDeliveries = [];
    let ridersLoaded = false;

    // Load Deliveries
    async function loadDeliveries() {
        try {
            allDeliveries = await API.getDeliveries();
            applyFilter();
            updateSummary();
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="6" class="error-message">Failed to load deliveries.</td></tr>`;
        }
    }

    function updateSummary() {
        document.getElementById('count-pending').textContent = allDeliveries.filter(d => d.status === 'PENDING').length;
        document.getElementById('count-assigned').textContent = allDeliveries.filter(d => d.status === 'ASSIGNED').length;
        document.getElementById('count-picked-up').textContent = allDeliveries.filter(d => d.status === 'PICKED_UP').length;
        document.getElementById('count-delivered').textContent = allDeliveries.filter(d => d.status === 'DELIVERED').length;
    }

    // Filtering
    let currentFilter = 'ALL';
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.status;
            applyFilter();
        });
    });

    function applyFilter() {
        let filtered = allDeliveries;
        if (currentFilter !== 'ALL') {
            filtered = allDeliveries.filter(d => d.status === currentFilter);
        }
        renderDeliveries(filtered);
    }

    function renderDeliveries(deliveries) {
        tableBody.innerHTML = '';
        if (deliveries.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No deliveries found.</td></tr>`;
            return;
        }

        deliveries.forEach(d => {
            const tr = document.createElement('tr');
            
            let actionBtn = '-';
            if (d.status === 'PENDING') {
                actionBtn = `<button class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;" onclick="openAssignModal(${d.id})">Assign Rider</button>`;
            } else if (d.rider_name) {
                actionBtn = `<span style="font-size: 0.8rem; color: var(--text-muted);">Assigned to: ${d.rider_name}</span>`;
            }

            tr.innerHTML = `
                <td>#${d.id}</td>
                <td>
                    <div>${d.customer_name}</div>
                </td>
                <td>${d.delivery_address}</td>
                <td>${d.item_description}</td>
                <td><span class="badge badge-${d.status}">${d.status.replace('_', ' ')}</span></td>
                <td>${actionBtn}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Modal & Assignment Logic
    window.openAssignModal = async function(deliveryId) {
        const delivery = allDeliveries.find(d => d.id === deliveryId);
        if (!delivery) return;

        document.getElementById('modal-delivery-id').textContent = delivery.id;
        document.getElementById('modal-delivery-details').innerHTML = `
            ${delivery.customer_name}<br>
            ${delivery.delivery_address}<br>
            ${delivery.item_description}
        `;
        document.getElementById('delivery_id_input').value = delivery.id;
        
        assignError.style.display = 'none';
        assignSuccess.style.display = 'none';
        assignModal.classList.add('active');

        if (!ridersLoaded) {
            await loadRiders();
        }
    };

    closeAssignBtn.addEventListener('click', () => {
        assignModal.classList.remove('active');
    });

    async function loadRiders() {
        try {
            const riders = await API.getRiders();
            if (riders.length === 0) {
                riderSelect.innerHTML = '<option value="">No riders available</option>';
            } else {
                riderSelect.innerHTML = '<option value="">-- Select Rider --</option>';
                riders.forEach(r => {
                    const opt = document.createElement('option');
                    opt.value = r.id;
                    opt.textContent = r.email || r.username;
                    riderSelect.appendChild(opt);
                });
            }
            ridersLoaded = true;
        } catch (error) {
            console.error(error);
            assignError.textContent = "Failed to fetch available riders.";
            assignError.style.display = 'block';
            riderSelect.innerHTML = '<option value="">Error loading riders</option>';
        }
    }

    assignForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const deliveryId = document.getElementById('delivery_id_input').value;
        const riderId = riderSelect.value;
        const btn = document.querySelector('button[form="assign-form"]');

        if (!riderId) {
            assignError.textContent = "Please select a rider.";
            assignError.style.display = 'block';
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Assigning...';
        assignError.style.display = 'none';

        try {
            await API.assignRider(deliveryId, riderId);
            assignSuccess.textContent = "Rider assigned successfully.";
            assignSuccess.style.display = 'block';
            
            // Reload deliveries after a short delay
            setTimeout(() => {
                assignModal.classList.remove('active');
                loadDeliveries();
            }, 1000);
        } catch (error) {
            assignError.textContent = error.message || "Failed to assign rider.";
            assignError.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Assign Rider';
        }
    });

    loadDeliveries();
});
