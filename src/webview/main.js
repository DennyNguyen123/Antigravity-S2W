// @ts-check

(function() {
    // Acquire VS Code API
    // @ts-ignore
    const vscode = acquireVsCodeApi();

    // Global Error Safety
    window.onerror = function(message, source, lineno, colno, error) {
        vscode.postMessage({ 
            command: 'debug', 
            message: `CRITICAL JS ERROR: ${message} at ${lineno}:${colno}` 
        });
    };

    // vscode.postMessage({ command: 'debug', message: 'Main.js Execution Started' });

    // DOM Elements
    /** @type {HTMLSelectElement | null} */
    const sourceSelect = /** @type {any} */ (document.getElementById('skill-source'));
    /** @type {HTMLButtonElement | null} */
    const generateBtn = /** @type {any} */ (document.getElementById('generate-btn'));
    
    /** @type {HTMLButtonElement | null} */
    const installBtn = /** @type {any} */ (document.getElementById('install-btn'));
    /** @type {HTMLButtonElement | null} */
    const downloadUrlBtn = /** @type {any} */ (document.getElementById('download-url-btn'));
    
    /** @type {HTMLElement | null} */
    const statusTextGen = document.getElementById('generation-status'); // Rename for clarity
    /** @type {HTMLElement | null} */
    const statusTextInstall = document.getElementById('install-status'); // New status area
    /** @type {HTMLElement | null} */
    const workflowList = document.getElementById('workflow-list');
    /** @type {HTMLElement | null} */
    const refreshBtn = document.getElementById('refresh-btn');

    // State
    let locale = 'en'; // Default
    /** @type {Array<any>} */
    let sources = [];


    // --- Message Handling ---
    window.addEventListener('message', event => {
        const message = event.data;
        
        // GLOBAL DEBUG PROBE
        // vscode.postMessage({ 
        //     command: 'debug', 
        //     message: `[Frontend RAW] Received command: ${message.command}` 
        // });

        switch (message.command) {
            case 'init':
                locale = message.locale;
                sources = message.sources;
                renderSourceOptions(sources);
                updateWorkflowList(message.workflows);
                break;
            case 'status':
                // Backend sends generic 'status', usually checks active operation
                // We'll default to generator unless we know better, or add a 'target' field to backend messages later.
                // For now, if the message text contains "Install" or "Zip", show in installer.
                const target = (message.text.toLowerCase().includes('install') || message.text.toLowerCase().includes('zip')) 
                               ? 'install' : 'gen';
                
                // Show the status message
                showStatus(message.text, message.type, target);
                
                // CRITICAL FIX: Re-enable buttons so user can retry on error
                if (target === 'gen' && generateBtn) {
                    /** @type {HTMLButtonElement} */(generateBtn).disabled = false;
                }
                if (target === 'install' && installBtn) {
                     /** @type {HTMLButtonElement} */(installBtn).disabled = false;
                }

                if (message.type === 'success') {
                     // Request refresh after success
                     vscode.postMessage({ command: 'refresh' });
                }
                break;
            case 'refresh':
                // vscode.postMessage({ command: 'debug', message: '[Frontend-CASE] Processing refresh...' });
                updateWorkflowList(message.workflows);
                break;
            case 'addCustomSource':
                // Add the new custom source to our list
                const newSource = {
                    type: 'custom',
                    path: typeof message.path === 'string' ? message.path : String(message.path),
                    exists: true
                };
                
                // Check if already exists to avoid dupes
                const existingIdx = sources.findIndex(s => s.path === message.path);
                if (existingIdx >= 0) {
                    sources[existingIdx] = newSource; // Update just in case
                } else {
                    sources.push(newSource);
                }
                
                // Re-render
                renderSourceOptions(sources);
                
                // Auto-select the new custom source
                if (sourceSelect) {
                    // Find the option with this path value (we used type as value before, need to handle custom specifically)
                    // Actually renderSourceOptions uses type as value. For custom, if we have multiple, this might be tricky.
                    // Let's modify renderSourceOptions to use PATH or INDEX as value to be unique?
                    // Or keep it simple: we assume only one "active" custom source at a time? 
                    // Better: The user asked for "Custom Folder" option.
                    // Implementation: We'll select the option that corresponds to this path.
                    // renderSourceOptions logic needs a tweak to support unique values for custom sources if we allow multiple.
                    // For now, let's just re-render and select the last one which is likely the one we just added.
                    
                    // We need to identify it. Let's make the value unique in renderSourceOptions.
                    const options = sourceSelect.options;
                    for (let i = 0; i < options.length; i++) {
                        if (options[i].text.includes(shortenPath(String(message.path)))) {
                            sourceSelect.selectedIndex = i;
                            break;
                        }
                    }
                }
                break;
        }
    });

    // --- Interaction Logic ---
    
    // 1. Initial Request
    // vscode.postMessage({ command: 'debug', message: 'WebView Initializing...' });
    vscode.postMessage({ command: 'getConfigs' });

    // 2. Generator Logic
    if (generateBtn && sourceSelect) {
        generateBtn.addEventListener('click', () => {
            const selectedValue = sourceSelect.value;
            // Ignore if it's the placeholder prompt
            if (selectedValue && selectedValue !== '__SELECT_CUSTOM__') {
                setLoading(true, 'gen');
                // Value IS the path now (except for custom prompt)
                vscode.postMessage({ 
                    command: 'generate', 
                    sourcePath: selectedValue
                });
            }
        });
    }

    // 3. Install Logic (Button Mode)
    // 3. Install Logic (Button Mode)
    // installBtn is already defined at top scope
    if (installBtn) {
        installBtn.addEventListener('click', () => {
             // Fallback to file picker if users click instead of drag
             // But we can't trigger native file picker from Webview easily without backend help.
             // Let's send a command to backend to open dialog.
             vscode.postMessage({ command: 'openFilePicker' });
        });
    } else {
         vscode.postMessage({ command: 'debug', message: 'CRITICAL: Install Button element NOT found.' });
    }

    if (downloadUrlBtn) {
        downloadUrlBtn.addEventListener('click', () => {
             // Toggle Input Container
             const container = document.getElementById('url-input-container');
             if (container) {
                 if (container.style.display === 'none') {
                     container.style.display = 'block';
                 } else {
                     container.style.display = 'none';
                 }
             }
        });
    }

    const confirmDownloadBtn = document.getElementById('confirm-download-btn');
    if (confirmDownloadBtn) {
    if (confirmDownloadBtn) {
        const triggerDownload = () => {
            const urlInput = /** @type {HTMLInputElement | null} */ (document.getElementById('url-input'));
            const url = urlInput ? urlInput.value.trim() : '';
            
            if (url) {
                setLoading(true, 'install');
                vscode.postMessage({ command: 'downloadUrl', url: url });
            }
        };

        confirmDownloadBtn.addEventListener('click', triggerDownload);

        const urlInput = document.getElementById('url-input');
        if (urlInput) {
            urlInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    triggerDownload();
                }
            });
        }
    }
    }

    // 4. Refresh & List Logic
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'refresh' });
        });
    }

    // --- Rendering Helpers ---

    /**
     * @param {any[]} sourcesData
     */
    function renderSourceOptions(sourcesData) {
        if (!sourceSelect) return;
        sourceSelect.innerHTML = '';
        
        // 1. Render Normal Sources (and previously added Custom ones)
        if (sourcesData.length > 0) {
            sourcesData.forEach((/** @type {any} */ src, /** @type {any} */ index) => {
                const opt = document.createElement('option');
                // Use PATH as the value to be unique and direct
                const safePath = String(src.path);
                opt.value = safePath; 
                if (src.type === 'custom') {
                     opt.text = `[Custom] ${shortenPath(safePath)}`;
                } else {
                     opt.text = `${src.type.toUpperCase()} Skills (${shortenPath(safePath)})`;
                }
                
                // Keep selection logic simple: if this was the selected one? 
                // We rely on the drop down state or default.
                // If it's the first one, select it by default.
                if (index === 0) opt.selected = true;
                
                sourceSelect.add(opt);
            });
            if(generateBtn) {
                 /** @type {HTMLButtonElement} */(generateBtn).disabled = false;
            }
        } else {
             if(generateBtn) {
                 /** @type {HTMLButtonElement} */(generateBtn).disabled = true;
             }
        }

        // 2. Append the "Select Custom..." Option
        const customOpt = document.createElement('option');
        customOpt.value = '__SELECT_CUSTOM__';
        customOpt.text = '📂 Select Custom Folder...';
        customOpt.style.fontWeight = 'bold';
        sourceSelect.add(customOpt);
    }
    
    // Handle Dropdown Change for Custom Selection
    if (sourceSelect) {
        sourceSelect.addEventListener('change', () => {
             if (sourceSelect.value === '__SELECT_CUSTOM__') {
                 vscode.postMessage({ command: 'selectCustomSource' });
                 // Reset selection to something valid if possible? 
                 // Or just wait for the new one to be added.
                 // Ideally, we keep it as is until the new one arrives.
             }
        });
    }

    /**
     * @param {any[]} workflows
     */
    function updateWorkflowList(workflows) {
        // Debug: Log what we received
        // vscode.postMessage({ 
        //     command: 'debug', 
        //     message: `[Frontend] updateWorkflowList received: ${JSON.stringify(workflows)}` 
        // });

        if (!workflowList) return;
        workflowList.innerHTML = '';
        
        // Check array validity
        if (!Array.isArray(workflows)) {
             vscode.postMessage({ command: 'debug', message: '[Frontend] Error: workflows is not an array' });
             workflowList.innerHTML = '<li class="empty-state">Error: Invalid data received.</li>';
             return;
        }

        // Render Table Header
        if (workflows && workflows.length > 0) {
            const header = document.createElement('li');
            header.className = 'workflow-header';
            
            // Name Column Header with Resizer
            const colNameHeader = document.createElement('div');
            colNameHeader.className = 'col-name';
            colNameHeader.textContent = 'Name';
            colNameHeader.style.position = 'relative'; // Anchor for resizer

            const resizer = document.createElement('div');
            resizer.className = 'resizer';
            
            // Drag Logic
            resizer.addEventListener('mousedown', initResize);
            
            /** @param {MouseEvent} e */
            function initResize(e) {
                e.preventDefault(); // Prevent text selection
                resizer.classList.add('resizing');
                
                const startX = e.clientX;
                const startWidth = colNameHeader.getBoundingClientRect().width;
                
                /** @param {MouseEvent} moveEvent */
                const onMouseMove = (moveEvent) => {
                    const newWidth = startWidth + (moveEvent.clientX - startX);
                    // Set CSS variable on the list container to update all rows
                    if (workflowList && newWidth > 50 && newWidth < 400) { // Min/Max constraints
                        workflowList.style.setProperty('--name-col-width', `${newWidth}px`);
                    }
                };
                
                const onMouseUp = () => {
                    resizer.classList.remove('resizing');
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }

            colNameHeader.appendChild(resizer);
            header.appendChild(colNameHeader);
            
            // Description Column Header
            const colDescHeader = document.createElement('div');
            colDescHeader.className = 'col-desc';
            colDescHeader.textContent = 'Description';
            header.appendChild(colDescHeader);

            // Action Column Header
            const colActionHeader = document.createElement('div');
            colActionHeader.className = 'col-action';
            colActionHeader.textContent = 'Action';
            header.appendChild(colActionHeader);

            workflowList.appendChild(header);
        } else {
            workflowList.innerHTML = '<li class="empty-state">No active workflows.</li>';
            return;
        }

        workflows.forEach((/** @type {{ name: string; filename: string; description: string; enabled: boolean }} */ wf) => {
            const li = document.createElement('li');
            li.className = 'workflow-row';
            if (!wf.enabled) {
                li.classList.add('disabled');
            }
            
            // Name Column
            const colName = document.createElement('div');
            colName.className = 'col-name';
            colName.textContent = wf.name; // Already stripped by backend
            colName.title = wf.filename;

            // Description Column
            const colDesc = document.createElement('div');
            colDesc.className = 'col-desc';
            colDesc.textContent = wf.description || '-';
            colDesc.title = wf.description;

            // Action Column
            const colAction = document.createElement('div');
            colAction.className = 'col-action';

            // Toggle Button
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'action-btn toggle-btn';
            toggleBtn.innerHTML = wf.enabled ? '⏻' : '○'; // Power icon or circle
            toggleBtn.title = wf.enabled ? 'Disable' : 'Enable';
            toggleBtn.onclick = () => {
                vscode.postMessage({ command: 'toggle', filename: wf.filename });
            };

            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.innerHTML = '✎';
            editBtn.title = 'Edit Workflow';
            // Only allow editing if enabled, or allow both? User didn't specify. 
            // Enabling edit for disabled files works if VS Code can open .disable files as text. 
            // Usually safest to allow.
            editBtn.onclick = () => {
                vscode.postMessage({ command: 'openFile', filename: wf.filename });
            };

            const delBtn = document.createElement('button');
            delBtn.className = 'action-btn delete-btn';
            delBtn.innerHTML = '✕';
            delBtn.title = 'Delete Workflow';
            delBtn.onclick = () => {
                // Note: confirm() may not work in Webview, so we skip it
                // Backend should handle confirmation if needed
                vscode.postMessage({ command: 'delete', filename: wf.filename });
            };

            colAction.appendChild(toggleBtn);
            colAction.appendChild(editBtn);
            colAction.appendChild(delBtn);

            li.appendChild(colName);
            li.appendChild(colDesc);
            li.appendChild(colAction);
            
            workflowList.appendChild(li);
        });
    }

    /**
     * @param {boolean} isLoading
     * @param {'gen'|'install'} target
     */
    function setLoading(isLoading, target = 'gen') {
        if (target === 'gen' && generateBtn) {
            generateBtn.disabled = isLoading;
            showStatus(isLoading ? 'Processing...' : '', 'info', 'gen');
        }
        if (target === 'install' && installBtn) {
            /** @type {HTMLButtonElement} */(installBtn).disabled = isLoading;
            showStatus(isLoading ? 'Waiting for selection...' : '', 'info', 'install');
        }
    }

    /**
     * @param {string} text
     * @param {'success'|'error'|'info'} type
     * @param {'gen'|'install'} target
     */
    function showStatus(text, type, target = 'gen') {
        const el = target === 'install' ? statusTextInstall : statusTextGen;
        if (!el) return;

        el.textContent = text;
        el.className = 'status-text ' + (type || 'info'); // Reset classes
        
        if (!text) {
            el.classList.add('hidden');
        } else {
            el.classList.remove('hidden');
            // Persistent: We DO NOT remove the text after a timeout.
        }
    }

    /**
     * @param {string} path
     * @returns {string}
     */
    function shortenPath(path) {
        if (!path) return '';
        if (path.length > 40) {
            return '...' + path.slice(-35);
        }
        return path;
    }

})();
