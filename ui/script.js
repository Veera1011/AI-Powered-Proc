document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const fileStatus = document.getElementById('file-status');
    const fileNameSpan = fileStatus?.querySelector('.file-name');
    const cancelFileBtn = document.getElementById('cancel-file');
    const html = document.documentElement;

    // View & Sidebar Elements
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const viewTitle = document.querySelector('.view-title');
    const stocksTableBody = document.querySelector('#stocks-table tbody');
    const refreshStocksBtn = document.getElementById('refresh-stocks');
    const addItemBtn = document.getElementById('add-item-btn');

    // Chat side panel (Widget)
    const chatSidePanel = document.querySelector('.chat-side-panel');
    const miniStockList = document.querySelector('.mini-stock-list');
    const toggleSidePanelBtn = document.getElementById('toggle-side-panel');

    // Modals
    const stockModal = document.getElementById('stock-modal');
    const saleModal = document.getElementById('sale-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const stockForm = document.getElementById('stock-form');
    const saleForm = document.getElementById('sale-form');

    // Settings Elements
    const systemPromptTextarea = document.getElementById('system-prompt');
    const savePromptBtn = document.getElementById('save-prompt');
    const resetPromptBtn = document.getElementById('reset-prompt');

    let selectedFile = null;
    let defaultPrompt = ''; // We'll fetch this from the service

    // --- SweetAlert2 Helpers ---
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: 'var(--bg-sidebar)',
        color: 'var(--text-main)',
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    function showSuccess(msg) {
        Toast.fire({ icon: 'success', title: msg });
    }

    function showError(msg) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: msg,
            background: 'var(--bg-sidebar)',
            color: 'var(--text-main)',
            confirmButtonColor: 'var(--accent-blue)'
        });
    }

    // --- Sidebar Toggle Logic ---
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    }

    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

    // --- Chat Side Panel (Mobile Toggle) ---
    if (toggleSidePanelBtn) {
        toggleSidePanelBtn.addEventListener('click', () => {
            chatSidePanel.classList.toggle('active');
        });
    }

    // --- Modal Logic ---
    function openModal(modal) {
        modal.classList.add('active');
    }

    function closeModal() {
        stockModal.classList.remove('active');
        saleModal.classList.remove('active');
        stockForm.reset();
        saleForm.reset();
        document.getElementById('stock-id').value = '';
        document.getElementById('sale-item-id').value = '';
    }

    closeModalBtns.forEach(btn => btn.addEventListener('click', closeModal));
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) closeModal();
    });

    // Add Item Click
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            document.getElementById('modal-title').textContent = 'Add New Item';
            openModal(stockModal);
        });
    }

    // --- Marked Config ---
    marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false
    });

    // --- Theme Logic ---
    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        themeToggle.innerHTML = theme === 'dark' ? `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        ` : `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        `;
    }

    // --- View Navigation ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.dataset.view;

            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            if (viewTitle) {
                const subTitle = viewName === 'chat' ? 'Expert' : 'Dashboard';
                viewTitle.innerHTML = `${viewName.charAt(0).toUpperCase() + viewName.slice(1)} <span>${subTitle}</span>`;
            }

            views.forEach(v => v.style.display = 'none');
            document.getElementById(`${viewName}-view`).style.display = 'flex';

            if (viewName === 'inventory') {
                loadStocks();
            } else if (viewName === 'chat') {
                loadMiniStocks();
            } else if (viewName === 'settings') {
                fetchPrompt();
            }

            if (sidebar.classList.contains('active')) {
                toggleSidebar();
            }

            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('active');
                if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            }
        });
    });

    // --- CRUD Stock Logic ---
    async function fetchStocksData() {
        const response = await fetch('/agent/stocks');
        return await response.json();
    }

    async function loadStocks() {
        stocksTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--text-muted);">Syncing stock data...</td></tr>';
        try {
            const stocks = await fetchStocksData();
            if (!stocks || stocks.length === 0) {
                stocksTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--text-muted);">No stocks available. Add an item to get started.</td></tr>';
                return;
            }

            stocksTableBody.innerHTML = '';
            stocks.forEach(stock => {
                const tr = document.createElement('tr');
                const isLow = stock.quantity <= (stock.threshold || 10);
                const statusClass = isLow ? 'status-low' : 'status-ok';
                const statusText = isLow ? 'Low Stock' : 'Good';

                tr.innerHTML = `
                    <td><strong>${stock.name}</strong></td>
                    <td>${stock.quantity}</td>
                    <td><span style="color: var(--text-muted)">${stock.unit || 'units'}</span></td>
                    <td>${stock.threshold || 10}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon sale-btn" title="Record Sale">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a4.5 4.5 0 0 0 0 9h5a4.5 4.5 0 0 1 0 9H6"></path></svg>
                            </button>
                            <button class="btn-icon edit-btn" title="Edit">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn-icon delete-btn delete" title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        </div>
                    </td>
                `;

                tr.querySelector('.edit-btn').addEventListener('click', () => editItem(stock));
                tr.querySelector('.delete-btn').addEventListener('click', () => deleteItem(stock));
                tr.querySelector('.sale-btn').addEventListener('click', () => recordSaleModal(stock));

                stocksTableBody.appendChild(tr);
            });
        } catch (error) {
            stocksTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #ff3b30;">Failed to load data.</td></tr>';
        }
    }

    async function editItem(stock) {
        document.getElementById('modal-title').textContent = 'Edit Item';
        document.getElementById('stock-id').value = stock._id;
        document.getElementById('item-name').value = stock.name;
        document.getElementById('item-qty').value = stock.quantity;
        document.getElementById('item-unit').value = stock.unit;
        document.getElementById('item-threshold').value = stock.threshold || 10;
        openModal(stockModal);
    }

    async function deleteItem(stock) {
        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${stock.name}. This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff3b30',
            cancelButtonColor: 'var(--border-color)',
            confirmButtonText: 'Yes, delete it!',
            background: 'var(--bg-sidebar)',
            color: 'var(--text-main)'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetch(`/agent/stocks/${stock._id}`, { method: 'DELETE' });
                    showSuccess(`${stock.name} deleted successfully.`);
                    loadStocks();
                    loadMiniStocks();
                } catch (error) {
                    showError('Failed to delete item');
                }
            }
        });
    }

    async function recordSaleModal(stock) {
        document.getElementById('sale-item-id').value = stock._id;
        document.getElementById('sale-item-name').value = stock.name;
        document.getElementById('sale-qty').value = 1;
        document.getElementById('sale-date').valueAsDate = new Date();
        openModal(saleModal);
    }

    stockForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('stock-id').value;
        const data = {
            name: document.getElementById('item-name').value,
            quantity: Number(document.getElementById('item-qty').value),
            unit: document.getElementById('item-unit').value,
            threshold: Number(document.getElementById('item-threshold').value)
        };

        const url = id ? `/agent/stocks/${id}` : '/agent/stocks';
        const method = id ? 'PATCH' : 'POST';

        try {
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            closeModal();
            showSuccess(`Item ${id ? 'updated' : 'added'} successfully.`);
            loadStocks();
            loadMiniStocks();
        } catch (error) {
            showError('Failed to save item');
        }
    });

    saleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            itemId: document.getElementById('sale-item-id').value,
            quantity: Number(document.getElementById('sale-qty').value),
            date: document.getElementById('sale-date').value
        };

        try {
            await fetch('/agent/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            closeModal();
            showSuccess('Sale recorded successfully.');
            loadStocks();
            loadMiniStocks();
        } catch (error) {
            showError('Failed to record sale');
        }
    });

    // --- Prompt Management ---
    async function fetchPrompt() {
        try {
            const response = await fetch('/agent/prompt');
            const data = await response.json();
            systemPromptTextarea.value = data.prompt;
            if (!defaultPrompt) defaultPrompt = data.prompt;
        } catch (error) {
            showError('Failed to fetch AI configuration');
        }
    }

    if (savePromptBtn) {
        savePromptBtn.addEventListener('click', async () => {
            const newPrompt = systemPromptTextarea.value;
            try {
                const response = await fetch('/agent/prompt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: newPrompt })
                });
                if (response.ok) {
                    showSuccess('AI instructions updated successfully.');
                }
            } catch (error) {
                showError('Failed to update AI configuration');
            }
        });
    }

    if (resetPromptBtn) {
        resetPromptBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Reset Prompt?',
                text: 'This will revert all custom AI instructions to the initial defaults.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: 'var(--accent-blue)',
                cancelButtonColor: 'var(--border-color)',
                confirmButtonText: 'Yes, reset it!',
                background: 'var(--bg-sidebar)',
                color: 'var(--text-main)'
            }).then((result) => {
                if (result.isConfirmed) {
                    systemPromptTextarea.value = defaultPrompt;
                    showSuccess('Prompt reset to default values.');
                }
            });
        });
    }

    // --- Mini Stock Widget Sync ---
    async function loadMiniStocks() {
        if (!miniStockList) return;
        try {
            const stocks = await fetchStocksData();
            if (!stocks || stocks.length === 0) {
                miniStockList.innerHTML = '<p style="font-size: 11px; color: var(--text-muted); padding: 10px;">No stocks tracked yet.</p>';
                return;
            }

            miniStockList.innerHTML = '';
            const sorted = [...stocks].sort((a, b) => (a.quantity <= a.threshold ? -1 : 1));

            sorted.slice(0, 15).forEach(stock => {
                const isLow = stock.quantity <= (stock.threshold || 10);
                const div = document.createElement('div');
                div.className = 'mini-stock-item';
                div.innerHTML = `
                    <div class="mini-stock-info">
                        <h4>${stock.name}</h4>
                        <p>${stock.unit || 'units'}</p>
                    </div>
                    <div class="mini-stock-actions">
                        <div class="mini-stock-qty ${isLow ? 'low' : ''}">${stock.quantity}</div>
                        <button class="mini-sale-btn" title="Record Sale">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a4.5 4.5 0 0 0 0 9h5a4.5 4.5 0 0 1 0 9H6"></path></svg>
                        </button>
                    </div>
                `;
                div.querySelector('.mini-sale-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    recordSaleModal(stock);
                });
                miniStockList.appendChild(div);
            });
        } catch (error) {
            miniStockList.innerHTML = '<p style="font-size: 11px; color: #ff3b30; padding: 10px;">Failed to sync.</p>';
        }
    }

    if (refreshStocksBtn) refreshStocksBtn.addEventListener('click', loadStocks);

    // --- Load History ---
    async function loadHistory() {
        try {
            const response = await fetch('/agent/history');
            const history = await response.json();
            if (history && history.length > 0) {
                chatBox.innerHTML = '';
                history.forEach(msg => addMessage(msg.content, msg.role, false));
            } else {
                addMessage("Hello! I'm Veera's AI Procurement Expert. How can I assist you today?", "ai", false);
            }
            loadMiniStocks();
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    loadHistory();

    // --- Chat Logic ---
    function addMessage(content, role, animate = true, charts = []) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        if (!animate) messageDiv.style.animation = 'none';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'bubble-content';

        if (role === 'ai') {
            contentDiv.innerHTML = marked.parse(content);

            // Render any charts provided with the message
            if (charts && charts.length > 0) {
                charts.forEach(chartData => {
                    const chartContainer = document.createElement('div');
                    chartContainer.className = 'chart-wrapper';
                    const canvas = document.createElement('canvas');
                    chartContainer.appendChild(canvas);
                    contentDiv.appendChild(chartContainer);

                    renderChart(canvas, chartData);
                });
            }
        } else {
            contentDiv.textContent = content;
        }

        messageDiv.appendChild(contentDiv);
        chatBox.appendChild(messageDiv);

        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    }

    function renderChart(canvas, data) {
        const ctx = canvas.getContext('2d');
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#ffffff' : '#1d1d1f';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        // Setup Chart.js
        new Chart(ctx, {
            type: data.chartType,
            data: {
                labels: data.labels,
                datasets: data.datasets.map(ds => ({
                    ...ds,
                    borderWidth: 2,
                    tension: 0.4,
                    borderColor: ds.borderColor || 'var(--accent-blue)',
                    backgroundColor: ds.backgroundColor || (data.chartType === 'pie' ? undefined : 'rgba(0, 122, 255, 0.1)')
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: data.title,
                        color: textColor,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        labels: { color: textColor }
                    }
                },
                scales: data.chartType !== 'pie' ? {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    }
                } : {}
            }
        });
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text && !selectedFile) return;

        if (selectedFile) {
            handleFileUpload(selectedFile, text);
            return;
        }

        addMessage(text, 'user');
        userInput.value = '';
        setLoading(true);

        try {
            const response = await fetch('/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();
            addMessage(data.text, 'ai', true, data.charts);
            loadMiniStocks();
        } catch (error) {
            addMessage("Error connecting to server. Please try again.", 'ai');
        } finally {
            setLoading(false);
        }
    }

    async function handleFileUpload(file, message) {
        const displayPrompt = message ? `📄 ${file.name}\n\n${message}` : `📄 ${file.name}`;
        addMessage(displayPrompt, 'user');

        const formData = new FormData();
        formData.append('file', file);
        if (message) formData.append('message', message);

        resetFile();
        userInput.value = '';
        setLoading(true);

        try {
            const response = await fetch('/agent/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            addMessage(data.text, 'ai', true, data.charts);
            loadMiniStocks();
            showSuccess('File uploaded and analyzed.');
        } catch (error) {
            showError('File upload failed.');
        } finally {
            setLoading(false);
        }
    }

    function setLoading(isLoading) {
        sendBtn.disabled = isLoading;
        userInput.disabled = isLoading;
        if (isLoading) {
            const loader = document.createElement('div');
            loader.id = 'ai-loading';
            loader.className = 'message ai loading';
            loader.innerHTML = `
                <div class="bubble-content">
                    <div class="typing-indicator"><span></span><span></span><span></span></div>
                </div>
            `;
            chatBox.appendChild(loader);
            chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
        } else {
            const loader = document.getElementById('ai-loading');
            if (loader) loader.remove();
        }
    }

    function resetFile() {
        selectedFile = null;
        if (fileStatus) fileStatus.style.display = 'none';
        fileInput.value = '';
    }

    // --- Events ---
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            if (fileNameSpan) fileNameSpan.textContent = selectedFile.name;
            if (fileStatus) fileStatus.style.display = 'flex';
            userInput.focus();
        }
    });

    if (cancelFileBtn) cancelFileBtn.addEventListener('click', resetFile);

    document.querySelector('.new-chat-btn').addEventListener('click', () => {
        Swal.fire({
            title: 'Clear Chat?',
            text: 'Are you sure you want to clear the conversation history?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: 'var(--accent-blue)',
            cancelButtonColor: 'var(--border-color)',
            confirmButtonText: 'Yes, clear it!',
            background: 'var(--bg-sidebar)',
            color: 'var(--text-main)'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetch('/agent/clear', { method: 'POST' });
                    chatBox.innerHTML = '';
                    addMessage("History cleared. How can I help you from here?", "ai", false);
                    resetFile();
                    loadMiniStocks();
                    showSuccess('History cleared.');
                } catch (error) {
                    showError('Failed to clear history.');
                }
            }
        });
    });
});
