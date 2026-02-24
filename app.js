/**
 * Calendar Sync Application
 * Main JavaScript logic for the setup UI
 */

// Application State
const state = {
    user: null,
    calendars: [],
    rules: [],
    teamShareEnabled: false,
    isLoading: false
};

// DOM Elements
const elements = {
    stepSignin: () => document.getElementById('step-signin'),
    configSections: () => document.getElementById('config-sections'),
    userInfo: () => document.getElementById('user-info'),
    userAvatar: () => document.getElementById('user-avatar'),
    userName: () => document.getElementById('user-name'),
    signOutBtn: () => document.getElementById('sign-out-btn'),
    workCalendarEmail: () => document.getElementById('work-calendar-email'),
    externalCalendarsList: () => document.getElementById('external-calendars-list'),
    addCalendarBtn: () => document.getElementById('add-calendar-btn'),
    addCalendarModal: () => document.getElementById('add-calendar-modal'),
    calendarEmail: () => document.getElementById('calendar-email'),
    calendarName: () => document.getElementById('calendar-name'),
    verifyCalendarBtn: () => document.getElementById('verify-calendar-btn'),
    syncRulesList: () => document.getElementById('sync-rules-list'),
    addRuleBtn: () => document.getElementById('add-rule-btn'),
    addRuleModal: () => document.getElementById('add-rule-modal'),
    ruleSource: () => document.getElementById('rule-source'),
    ruleTarget: () => document.getElementById('rule-target'),
    ruleVisibility: () => document.getElementById('rule-visibility'),
    createRuleBtn: () => document.getElementById('create-rule-btn'),
    teamShareToggle: () => document.getElementById('team-share-toggle'),
    saveBtn: () => document.getElementById('save-btn'),
    saveStatus: () => document.getElementById('save-status'),
    loadingOverlay: () => document.getElementById('loading-overlay'),
    loadingText: () => document.getElementById('loading-text'),
    toastContainer: () => document.getElementById('toast-container')
};

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initGoogleSignIn();
    initEventListeners();
});

function initGoogleSignIn() {
    // Wait for Google Identity Services to load
    if (typeof google === 'undefined') {
        setTimeout(initGoogleSignIn, 100);
        return;
    }

    google.accounts.id.initialize({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
        auto_select: true,
        context: 'signin'
    });

    google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 280
        }
    );

    // Check for existing session
    const savedUser = localStorage.getItem('calendar_sync_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.email && user.email.endsWith('@' + CONFIG.ALLOWED_DOMAIN)) {
            handleUserAuthenticated(user);
        }
    }
}

function initEventListeners() {
    // Sign Out
    elements.signOutBtn()?.addEventListener('click', handleSignOut);

    // Add Calendar Modal
    elements.addCalendarBtn()?.addEventListener('click', () => showModal('add-calendar-modal'));
    elements.verifyCalendarBtn()?.addEventListener('click', handleVerifyCalendar);

    // Add Rule Modal
    elements.addRuleBtn()?.addEventListener('click', () => {
        populateRuleDropdowns();
        showModal('add-rule-modal');
    });
    elements.createRuleBtn()?.addEventListener('click', handleCreateRule);

    // Team Share Toggle
    elements.teamShareToggle()?.addEventListener('change', (e) => {
        state.teamShareEnabled = e.target.checked;
    });

    // Save Button
    elements.saveBtn()?.addEventListener('click', handleSaveConfiguration);

    // Modal Close Buttons
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) hideModal(modal.id);
        });
    });

    // Close modal on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal(modal.id);
        });
    });
}

// ==========================================
// AUTHENTICATION
// ==========================================

function handleGoogleSignIn(response) {
    const payload = parseJwt(response.credential);

    if (!payload.email.endsWith('@' + CONFIG.ALLOWED_DOMAIN)) {
        showToast(`Only @${CONFIG.ALLOWED_DOMAIN} accounts are allowed`, 'error');
        return;
    }

    const user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
    };

    localStorage.setItem('calendar_sync_user', JSON.stringify(user));
    handleUserAuthenticated(user);
}

function handleUserAuthenticated(user) {
    state.user = user;

    // Update UI
    elements.stepSignin().classList.add('hidden');
    elements.configSections().classList.remove('hidden');
    elements.userInfo().classList.remove('hidden');
    elements.userAvatar().src = user.picture || '';
    elements.userName().textContent = user.name;
    elements.workCalendarEmail().textContent = user.email;

    // Add work calendar to state
    state.calendars = [{
        id: generateId('cal'),
        email: user.email,
        name: 'Work',
        type: 'work',
        verified: true
    }];

    // Load existing configuration
    loadUserConfiguration();
}

function handleSignOut() {
    state.user = null;
    state.calendars = [];
    state.rules = [];
    state.teamShareEnabled = false;

    localStorage.removeItem('calendar_sync_user');

    google.accounts.id.disableAutoSelect();

    elements.stepSignin().classList.remove('hidden');
    elements.configSections().classList.add('hidden');
    elements.userInfo().classList.add('hidden');

    showToast('Signed out successfully');
}

// ==========================================
// CALENDAR MANAGEMENT
// ==========================================

function renderCalendars() {
    const list = elements.externalCalendarsList();
    const externalCalendars = state.calendars.filter(c => c.type === 'external');

    if (externalCalendars.length === 0) {
        list.innerHTML = '<p class="hint">No external calendars added yet.</p>';
        return;
    }

    list.innerHTML = externalCalendars.map(cal => `
        <div class="calendar-item" data-id="${cal.id}">
            <span class="calendar-icon">📆</span>
            <div style="flex: 1">
                <span class="calendar-email">${cal.email}</span>
                <span class="calendar-name"> - ${cal.name}</span>
            </div>
            <span class="calendar-badge ${cal.verified ? 'external' : 'pending'}">
                ${cal.verified ? 'Verified' : 'Pending'}
            </span>
            <button class="btn btn-small btn-danger" onclick="removeCalendar('${cal.id}')">
                Remove
            </button>
        </div>
    `).join('');
}

async function handleVerifyCalendar() {
    const email = elements.calendarEmail().value.trim();
    const name = elements.calendarName().value.trim();

    if (!email) {
        showToast('Please enter a calendar email', 'error');
        return;
    }

    if (!name) {
        showToast('Please enter a display name', 'error');
        return;
    }

    // Check if already added
    if (state.calendars.some(c => c.email === email)) {
        showToast('This calendar is already added', 'error');
        return;
    }

    showLoading('Verifying calendar access...');

    try {
        // Call n8n webhook to verify access
        const response = await fetch(CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.VERIFY_CALENDAR, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail: state.user.email,
                calendarEmail: email
            })
        });

        const result = await response.json();

        const calendar = {
            id: generateId('cal'),
            email: email,
            name: name,
            type: 'external',
            verified: result.success === true
        };

        state.calendars.push(calendar);
        renderCalendars();
        hideModal('add-calendar-modal');

        // Clear form
        elements.calendarEmail().value = '';
        elements.calendarName().value = '';

        if (result.success) {
            showToast(`Calendar "${name}" added and verified!`, 'success');
        } else {
            showToast(`Calendar added but not verified. Please check sharing settings.`, 'warning');
        }
    } catch (error) {
        console.error('Verification error:', error);

        // Add anyway (verification can happen later)
        const calendar = {
            id: generateId('cal'),
            email: email,
            name: name,
            type: 'external',
            verified: false
        };

        state.calendars.push(calendar);
        renderCalendars();
        hideModal('add-calendar-modal');

        elements.calendarEmail().value = '';
        elements.calendarName().value = '';

        showToast(`Calendar added. Verification will happen on first sync.`);
    } finally {
        hideLoading();
    }
}

function removeCalendar(id) {
    // Remove calendar
    state.calendars = state.calendars.filter(c => c.id !== id);

    // Remove rules that use this calendar
    state.rules = state.rules.filter(r => r.sourceCalId !== id && r.targetCalId !== id);

    renderCalendars();
    renderRules();
    showToast('Calendar removed');
}

// ==========================================
// SYNC RULES MANAGEMENT
// ==========================================

function populateRuleDropdowns() {
    const sourceSelect = elements.ruleSource();
    const targetSelect = elements.ruleTarget();

    const options = state.calendars.map(cal =>
        `<option value="${cal.id}">${cal.name} (${cal.email})</option>`
    ).join('');

    sourceSelect.innerHTML = options;
    targetSelect.innerHTML = options;

    // Default: first external → work
    const externalCal = state.calendars.find(c => c.type === 'external');
    const workCal = state.calendars.find(c => c.type === 'work');

    if (externalCal) sourceSelect.value = externalCal.id;
    if (workCal) targetSelect.value = workCal.id;
}

function renderRules() {
    const list = elements.syncRulesList();

    if (state.rules.length === 0) {
        list.innerHTML = '<p class="hint">No sync rules configured yet.</p>';
        return;
    }

    // Helper function to find calendar by ID (checks multiple possible ID fields)
    const findCalendar = (calId) => {
        return state.calendars.find(c =>
            c.id === calId ||
            c.calendar_id === calId ||
            c.email === calId ||
            c.calendar_email === calId
        );
    };

    list.innerHTML = state.rules.map(rule => {
        const sourceCal = findCalendar(rule.sourceCalId);
        const targetCal = findCalendar(rule.targetCalId);

        return `
            <div class="rule-item" data-id="${rule.id}">
                <div class="rule-flow">
                    <span class="rule-calendar">${sourceCal?.name || sourceCal?.calendar_name || 'Unknown'}</span>
                    <span class="rule-arrow">→</span>
                    <span class="rule-calendar">${targetCal?.name || targetCal?.calendar_name || 'Unknown'}</span>
                </div>
                <span class="rule-visibility ${rule.visibility}">${rule.visibility}</span>
                <label class="toggle rule-toggle">
                    <input type="checkbox" ${rule.enabled ? 'checked' : ''}
                           onchange="toggleRule('${rule.id}', this.checked)">
                    <span class="toggle-slider"></span>
                </label>
                <button class="btn btn-small btn-danger" onclick="removeRule('${rule.id}')">
                    Remove
                </button>
            </div>
        `;
    }).join('');
}

function handleCreateRule() {
    const sourceId = elements.ruleSource().value;
    const targetId = elements.ruleTarget().value;
    const visibility = elements.ruleVisibility().value;

    if (sourceId === targetId) {
        showToast('Source and target cannot be the same', 'error');
        return;
    }

    // Check for duplicate rule
    if (state.rules.some(r => r.sourceCalId === sourceId && r.targetCalId === targetId)) {
        showToast('This rule already exists', 'error');
        return;
    }

    const rule = {
        id: generateId('rul'),
        sourceCalId: sourceId,
        targetCalId: targetId,
        visibility: visibility,
        enabled: true
    };

    state.rules.push(rule);
    renderRules();
    hideModal('add-rule-modal');
    showToast('Sync rule created', 'success');
}

function toggleRule(id, enabled) {
    const rule = state.rules.find(r => r.id === id);
    if (rule) {
        rule.enabled = enabled;
    }
}

function removeRule(id) {
    state.rules = state.rules.filter(r => r.id !== id);
    renderRules();
    showToast('Rule removed');
}

// ==========================================
// CONFIGURATION PERSISTENCE
// ==========================================

async function loadUserConfiguration() {
    showLoading('Loading your configuration...');

    try {
        const response = await fetch(CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.GET_CONFIG + `?email=${state.user.email}`);

        if (response.ok) {
            const config = await response.json();
            console.log('Server config:', config);
            console.log('Server rules:', config.rules);

            if (config.calendars) {
                // Find work calendar from server (preserves the ID used in rules)
                const serverWorkCal = config.calendars.find(c =>
                    c.type === 'work' || c.calendar_type === 'work'
                );

                // Use server's work calendar ID if available, otherwise keep the new one
                const workCal = serverWorkCal ? {
                    id: serverWorkCal.id || serverWorkCal.calendar_id,
                    email: state.user.email,
                    name: 'Work',
                    type: 'work',
                    verified: true
                } : state.calendars[0];

                // Map server format (snake_case) to client format (camelCase)
                const externalCalendars = config.calendars
                    .filter(c => c.type === 'external' || c.calendar_type === 'external')
                    .map(c => ({
                        id: c.id || c.calendar_id,
                        email: c.email || c.calendar_email,
                        name: c.name || c.calendar_name,
                        type: 'external',
                        verified: c.verified !== false
                    }));
                state.calendars = [workCal, ...externalCalendars];
            }

            if (config.rules) {
                // Map server format (snake_case) to client format (camelCase)
                state.rules = config.rules.map(r => {
                    console.log('Mapping rule:', r);
                    return {
                        id: r.id || r.rule_id,
                        sourceCalId: r.sourceCalId || r.source_cal_id,
                        targetCalId: r.targetCalId || r.target_cal_id,
                        visibility: r.visibility || 'censored',
                        enabled: r.enabled === true || r.enabled === 'TRUE' || r.enabled === 'true'
                    };
                });
                console.log('Mapped rules:', state.rules);
            }

            if (config.teamShareEnabled !== undefined) {
                state.teamShareEnabled = config.teamShareEnabled;
                elements.teamShareToggle().checked = state.teamShareEnabled;
            }
        }
    } catch (error) {
        console.log('No existing configuration found, starting fresh');
    } finally {
        renderCalendars();
        renderRules();
        hideLoading();
    }
}

async function handleSaveConfiguration() {
    if (state.calendars.length < 2) {
        showToast('Please add at least one external calendar', 'error');
        return;
    }

    if (state.rules.length === 0) {
        showToast('Please create at least one sync rule', 'error');
        return;
    }

    showLoading('Saving configuration...');
    elements.saveStatus().textContent = '';
    elements.saveStatus().className = 'save-status';

    const config = {
        user: {
            id: state.user.id,
            email: state.user.email,
            name: state.user.name
        },
        calendars: state.calendars,
        rules: state.rules,
        teamShareEnabled: state.teamShareEnabled
    };

    try {
        const response = await fetch(CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.SAVE_CONFIG, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        const result = await response.json();

        if (result.success) {
            elements.saveStatus().textContent = 'Configuration saved successfully!';
            elements.saveStatus().classList.add('success');
            showToast('Configuration saved! Sync will start within 5 minutes.', 'success');
        } else {
            throw new Error(result.error || 'Failed to save configuration');
        }
    } catch (error) {
        console.error('Save error:', error);
        elements.saveStatus().textContent = 'Error: ' + error.message;
        elements.saveStatus().classList.add('error');
        showToast('Failed to save configuration', 'error');
    } finally {
        hideLoading();
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function generateId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
}

function showModal(id) {
    document.getElementById(id)?.classList.remove('hidden');
}

function hideModal(id) {
    document.getElementById(id)?.classList.add('hidden');
}

function showLoading(text = 'Loading...') {
    elements.loadingText().textContent = text;
    elements.loadingOverlay().classList.remove('hidden');
    state.isLoading = true;
}

function hideLoading() {
    elements.loadingOverlay().classList.add('hidden');
    state.isLoading = false;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    elements.toastContainer().appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function copyServiceAccount() {
    navigator.clipboard.writeText(CONFIG.SERVICE_ACCOUNT_EMAIL);
    showToast('Service account email copied!', 'success');
}

// Make functions available globally for onclick handlers
window.removeCalendar = removeCalendar;
window.removeRule = removeRule;
window.toggleRule = toggleRule;
window.copyServiceAccount = copyServiceAccount;
