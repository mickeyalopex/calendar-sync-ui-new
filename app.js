/**                                                                                                                                                                                         
   * Calendar Sync Application                                                                                                                                                                
   * Main JavaScript logic for the setup UI                                                                                                                                                   
   *                                                                                                                                                                                          
   * Data format matches Google Sheets:                                                                                                                                                       
   * - Calendars: calendar_id, calendar_email, calendar_name, calendar_type, access_verified                                                                                                  
   * - Rules: rule_id, source_cal_id, target_cal_id, visibility, enabled                                                                                                                      
   */                                                                                                                                                                                         
                                                                                                                                                                                              
  // Application State                                                                                                                                                                        
  const state = {                                                                                                                                                                             
      user: null,                                                                                                                                                                             
      calendars: [],                                                                                                                                                                          
      rules: [],                                                                                                                                                                              
      deletedCalendars: [],                                                                                                                                                                   
      deletedRules: [],                                                                                                                                                                       
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
                                                                                                                                                                                              
      const savedUser = localStorage.getItem('calendar_sync_user');                                                                                                                           
      if (savedUser) {                                                                                                                                                                        
          const user = JSON.parse(savedUser);                                                                                                                                                 
          if (user.email && user.email.endsWith('@' + CONFIG.ALLOWED_DOMAIN)) {                                                                                                               
              handleUserAuthenticated(user);                                                                                                                                                  
          }                                                                                                                                                                                   
      }                                                                                                                                                                                       
  }                                                                                                                                                                                           
                                                                                                                                                                                              
  function initEventListeners() {                                                                                                                                                             
      elements.signOutBtn()?.addEventListener('click', handleSignOut);                                                                                                                        
      elements.addCalendarBtn()?.addEventListener('click', () => openAddCalendarModal());                                                                                            
      elements.verifyCalendarBtn()?.addEventListener('click', () => onModalPrimaryClick());                                                                                                          
      elements.addRuleBtn()?.addEventListener('click', () => {                                                                                                                                
          populateRuleDropdowns();                                                                                                                                                            
          showModal('add-rule-modal');                                                                                                                                                        
      });                                                                                                                                                                                     
      elements.createRuleBtn()?.addEventListener('click', handleCreateRule);
    document.getElementById('load-calendars-btn')?.addEventListener('click', loadAccountCalendars);                                                                                                                  
      elements.teamShareToggle()?.addEventListener('change', (e) => {                                                                                                                         
          state.teamShareEnabled = e.target.checked;                                                                                                                                          
      });                                                                                                                                                                                     
      elements.saveBtn()?.addEventListener('click', handleSaveConfiguration);                                                                                                                 
                                                                                                                                                                                              
      document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {                                                                                                               
          btn.addEventListener('click', (e) => {                                                                                                                                              
              const modal = e.target.closest('.modal');                                                                                                                                       
              if (modal) hideModal(modal.id);                                                                                                                                                 
          });                                                                                                                                                                                 
      });                                                                                                                                                                                     
                                                                                                                                                                                              
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
          user_id: payload.sub,                                                                                                                                                               
          email: payload.email,                                                                                                                                                               
          name: payload.name,                                                                                                                                                                 
          picture: payload.picture                                                                                                                                                            
      };                                                                                                                                                                                      
                                                                                                                                                                                              
      localStorage.setItem('calendar_sync_user', JSON.stringify(user));                                                                                                                       
      handleUserAuthenticated(user);                                                                                                                                                          
  }                                                                                                                                                                                           
                                                                                                                                                                                              
  function handleUserAuthenticated(user) {                                                                                                                                                    
      state.user = user;                                                                                                                                                                      
                                                                                                                                                                                              
      elements.stepSignin().classList.add('hidden');                                                                                                                                          
      elements.configSections().classList.remove('hidden');                                                                                                                                   
      elements.userInfo().classList.remove('hidden');                                                                                                                                         
      elements.userAvatar().src = user.picture || '';                                                                                                                                         
      elements.userName().textContent = user.name;                                                                                                                                            
      elements.workCalendarEmail().textContent = user.email;                                                                                                                                  
                                                                                                                                                                                              
      // Initialize with empty - will be populated from server or created fresh                                                                                                               
      state.calendars = [];                                                                                                                                                                   
      state.rules = [];                                                                                                                                                                       
      state.deletedCalendars = [];                                                                                                                                                            
      state.deletedRules = [];                                                                                                                                                                
                                                                                                                                                                                              
      loadUserConfiguration();                                                                                                                                                                
      refreshWorkStatus();
  }                                                                                                                                                                                           
                                                                                                                                                                                              
  function handleSignOut() {                                                                                                                                                                  
      state.user = null;                                                                                                                                                                      
      state.calendars = [];                                                                                                                                                                   
      state.rules = [];                                                                                                                                                                       
      state.deletedCalendars = [];                                                                                                                                                            
      state.deletedRules = [];                                                                                                                                                                
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
                                                                                                                                                                                              
  function getCalendarById(calendarId) {                                                                                                                                                      
      return state.calendars.find(c => c.calendar_id === calendarId);                                                                                                                         
  }                                                                                                                                                                                           
                                                                                                                                                                                              
  function renderCalendars() {                                                                                                                                                                
      const list = elements.externalCalendarsList();                                                                                                                                          
      const externalCalendars = state.calendars.filter(c => c.calendar_type === 'external');                                                                                                  
                                                                                                                                                                                              
      if (externalCalendars.length === 0) {                                                                                                                                                   
          list.innerHTML = '<p class="hint">No external calendars added yet.</p>';                                                                                                            
          return;                                                                                                                                                                             
      }                                                                                                                                                                                       
                                                                                                                                                                                              
      list.innerHTML = externalCalendars.map(cal => `                                                                                                                                         
          <div class="calendar-item" data-id="${cal.calendar_id}">                                                                                                                            
              <span class="calendar-icon">📆</span>                                                                                                                                           
              <div style="flex: 1">                                                                                                                                                           
                  <span class="calendar-email">${cal.calendar_email}</span>                                                                                                                   
                  <span class="calendar-name"> - ${cal.calendar_name}</span>                                                                                                                  
              </div>                                                                                                                                                                          
              <span class="calendar-badge ${cal.access_verified ? 'external' : 'pending'}">                                                                                                   
                  ${cal.access_verified ? 'Verified' : 'Pending'}                                                                                                                             
              </span>                                                                                                                                                                         
              <button class="btn btn-small btn-danger" onclick="removeCalendar('${cal.calendar_id}')">                                                                                        
                  Remove                                                                                                                                                                      
              </button>                                                                                                                                                                       
          </div>                                                                                                                                                                              
      `).join('');                                                                                                                                                                            
  }                                                                                                                                                                                           
                                                                                                                                                                                              
  // ==========================================
// OAUTH CONNECT (replaces service-account sharing)
// ==========================================

function buildAuthUrl(loginHint) {
    const p = new URLSearchParams({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        redirect_uri: CONFIG.OAUTH.REDIRECT_URI,
        response_type: 'code',
        scope: CONFIG.OAUTH.SCOPES,
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true',
        login_hint: loginHint || '',
        state: btoa((state.user && state.user.email) || '')
    });
    return CONFIG.OAUTH.AUTH_URL + '?' + p.toString();
}

function openConnectPopup(loginHint) {
    window.open(buildAuthUrl(loginHint), 'cs_connect', 'width=520,height=680');
}

// Check if an account already has a stored OAuth token
async function isAccountConnected(email) {
    try {
        const r = await fetch(CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.CHECK_CONNECTED + '?account=' + encodeURIComponent(email));
        const d = await r.json();
        return !!d.connected;
    } catch (e) { return null; } // null = check failed / unknown
}

// Reflect connection state on the work calendar's Connect button
function setWorkConnected(btn, connected) {
    const hint = document.getElementById('work-connect-hint');
    if (hint) hint.style.display = connected ? 'none' : '';
    if (connected) {
        btn.textContent = '\u2713 Connected';
        btn.disabled = true;
        btn.classList.remove('btn-primary', 'btn-secondary');
        btn.style.background = '#34a853';
        btn.style.color = '#fff';
        btn.style.borderColor = '#34a853';
        btn.style.opacity = '1';
    } else {
        btn.textContent = 'Connect';
        btn.disabled = false;
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-secondary');
        btn.style.background = '';
        btn.style.color = '';
        btn.style.borderColor = '';
        btn.style.opacity = '';
    }
}

async function refreshWorkStatus() {
    if (!state.user) return;
    const btn = document.getElementById('work-connect-btn');
    if (!btn) return;
    // avoid the 'Connect' flash while we check
    if (btn.textContent !== '\u2713 Connected') { btn.textContent = 'Checking\u2026'; btn.disabled = true; }
    const status = await isAccountConnected(state.user.email);
    if (status === null) { // check failed - leave whatever it was, restore a usable label
        if (btn.textContent === 'Checking\u2026') setWorkConnected(btn, false);
        return;
    }
    setWorkConnected(btn, status);
}

// Poll for a token landing shortly after the user connects in the popup
function pollConnected(email, onConnected) {
    let tries = 0;
    const timer = setInterval(async () => {
        tries++;
        if (await isAccountConnected(email)) { clearInterval(timer); onConnected(); }
        else if (tries >= 20) { clearInterval(timer); }
    }, 3000);
}

// Connect the signed-in work calendar's Google account
function connectWork() {
    if (!state.user) { showToast('Please sign in first', 'error'); return; }
    openConnectPopup(state.user.email);
    showToast('Finish connecting in the Google window.', 'success');
    pollConnected(state.user.email, () => { refreshWorkStatus(); showToast('Work calendar connected!', 'success'); });
}

// Connect an external calendar account, then add it
// Reset + open the Add External Calendar modal
function openAddCalendarModal() {
    setModalConnectBtn(false);
    if (elements.calendarEmail()) elements.calendarEmail().value = '';
    const picker = document.getElementById('calendar-picker');
    if (picker) picker.innerHTML = '';
    state._pickerCals = [];
    showModal('add-calendar-modal');
}

// Footer button: 'Connect with Google' before connecting, 'Done' after
function setModalConnectBtn(connected) {
    state._modalConnected = connected;
    const btn = elements.verifyCalendarBtn();
    if (!btn) return;
    btn.textContent = connected ? 'Done' : 'Connect with Google';
}

function onModalPrimaryClick() {
    if (state._modalConnected) { hideModal('add-calendar-modal'); }
    else { handleConnectCalendar(); }
}

async function handleConnectCalendar() {
    const email = elements.calendarEmail().value.trim();
    if (!email) { showToast('Enter the account email first', 'error'); return; }
    // Already connected (token already stored)? Skip the popup, just load the calendars.
    if (await isAccountConnected(email)) {
        showToast('This account is already connected — here are your calendars.', 'success');
        setModalConnectBtn(true);
        loadAccountCalendars();
        return;
    }
    openConnectPopup(email);
    showToast('Sign in and click Allow in the Google window…', 'success');
    pollConnected(email, () => { showToast('Connected — loading your calendars…', 'success'); setModalConnectBtn(true); loadAccountCalendars(); });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Render the picker list, marking calendars already added
function renderPicker() {
    const picker = document.getElementById('calendar-picker');
    if (!picker) return;
    const cals = state._pickerCals || [];
    if (!cals.length) { picker.innerHTML = ''; return; }
    picker.innerHTML = cals.map((c, i) => {
        const added = state.calendars.some(x => x.calendar_email === c.id);
        const badge = c.primary ? ' <span class="calendar-badge">primary</span>' : '';
        const action = added
            ? '<span class="calendar-badge external">✓ Added</span>'
            : `<button class="btn btn-small btn-primary" onclick="addPickedCalendar(${i})">Add</button>`;
        return `
            <div class="calendar-item">
                <span class="calendar-icon">📆</span>
                <div style="flex:1"><span class="calendar-email">${escapeHtml(c.name)}</span>${badge}</div>
                ${action}
            </div>`;
    }).join('');
}

// Load the connected account's calendars into a picker
async function loadAccountCalendars() {
    const email = elements.calendarEmail().value.trim();
    if (!email) { showToast('Enter the account email first', 'error'); return; }
    const picker = document.getElementById('calendar-picker');
    picker.innerHTML = '<p class="hint">Loading…</p>';
    try {
        const res = await fetch(CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.LIST_CALENDARS + '?account=' + encodeURIComponent(email));
        const data = await res.json();
        if (!data.connected) { picker.innerHTML = '<p class="hint">Not connected yet — click “Connect with Google”, finish in the popup, then Load again.</p>'; return; }
        const cals = data.calendars || [];
        if (!cals.length) { picker.innerHTML = '<p class="hint">No calendars found on this account.</p>'; return; }
        state._pickerCals = cals;
        renderPicker();
    } catch (e) {
        picker.innerHTML = '<p class="hint">Failed to load calendars. Try again.</p>';
    }
}

function addPickedCalendar(i) {
    const c = (state._pickerCals || [])[i];
    if (!c) return;
    if (state.calendars.some(x => x.calendar_email === c.id)) { renderPicker(); return; }
    state.calendars.push({
        calendar_id: generateId('cal'),
        calendar_email: c.id,
        calendar_name: c.name,
        calendar_type: 'external',
        access_verified: true
    });
    renderCalendars();
    renderPicker();
    showToast('Added “' + c.name + '”', 'success');
}

function removeCalendar(calendarId) {                                                                                                                                                       
      // Track deletion for existing items (items that came from the server)                                                                                                                  
      const calendar = state.calendars.find(c => c.calendar_id === calendarId);                                                                                                               
      if (calendar && calendarId) {                                                                                                                                                           
          state.deletedCalendars.push(calendarId);                                                                                                                                            
      }                                                                                                                                                                                       
                                                                                                                                                                                              
      // Also track deletion of related rules                                                                                                                                                 
      state.rules.forEach(r => {                                                                                                                                                              
          if (r.source_cal_id === calendarId || r.target_cal_id === calendarId) {                                                                                                             
              if (r.rule_id) {                                                                                                                                                                
                  state.deletedRules.push(r.rule_id);                                                                                                                                         
              }                                                                                                                                                                               
          }                                                                                                                                                                                   
      });                                                                                                                                                                                     
                                                                                                                                                                                              
      state.calendars = state.calendars.filter(c => c.calendar_id !== calendarId);                                                                                                            
      state.rules = state.rules.filter(r =>                                                                                                                                                   
          r.source_cal_id !== calendarId && r.target_cal_id !== calendarId                                                                                                                    
      );                                                                                                                                                                                      
                                                                                                                                                                                              
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
          `<option value="${cal.calendar_id}">${cal.calendar_name} (${cal.calendar_email})</option>`                                                                                          
      ).join('');                                                                                                                                                                             
                                                                                                                                                                                              
      sourceSelect.innerHTML = options;                                                                                                                                                       
      targetSelect.innerHTML = options;                                                                                                                                                       
                                                                                                                                                                                              
      const externalCal = state.calendars.find(c => c.calendar_type === 'external');                                                                                                          
      const workCal = state.calendars.find(c => c.calendar_type === 'work');                                                                                                                  
                                                                                                                                                                                              
      if (externalCal) sourceSelect.value = externalCal.calendar_id;                                                                                                                          
      if (workCal) targetSelect.value = workCal.calendar_id;                                                                                                                                  
  }                                                                                                                                                                                           
                                                                                                                                                                                              
  function renderRules() {                                                                                                                                                                    
      const list = elements.syncRulesList();                                                                                                                                                  
                                                                                                                                                                                              
      if (state.rules.length === 0) {                                                                                                                                                         
          list.innerHTML = '<p class="hint">No sync rules configured yet.</p>';                                                                                                               
          return;                                                                                                                                                                             
      }                                                                                                                                                                                       
                                                                                                                                                                                              
      list.innerHTML = state.rules.map(rule => {                                                                                                                                              
          const sourceCal = getCalendarById(rule.source_cal_id);                                                                                                                              
          const targetCal = getCalendarById(rule.target_cal_id);                                                                                                                              
          const isEnabled = rule.enabled === true || rule.enabled === 'TRUE' || rule.enabled === 'true';                                                                                      
                                                                                                                                                                                              
          return `                                                                                                                                                                            
              <div class="rule-item" data-id="${rule.rule_id}">                                                                                                                               
                  <div class="rule-flow">                                                                                                                                                     
                      <span class="rule-calendar">${sourceCal?.calendar_name || 'Unknown'}</span>                                                                                             
                      <span class="rule-arrow">→</span>                                                                                                                                       
                      <span class="rule-calendar">${targetCal?.calendar_name || 'Unknown'}</span>                                                                                             
                  </div>                                                                                                                                                                      
                  <span class="rule-visibility ${rule.visibility}">${rule.visibility}</span>                                                                                                  
                  <label class="toggle rule-toggle">                                                                                                                                          
                      <input type="checkbox" ${isEnabled ? 'checked' : ''}                                                                                                                    
                             onchange="toggleRule('${rule.rule_id}', this.checked)">                                                                                                          
                      <span class="toggle-slider"></span>                                                                                                                                     
                  </label>                                                                                                                                                                    
                  <button class="btn btn-small btn-danger" onclick="removeRule('${rule.rule_id}')">                                                                                           
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
                                                                                                                                                                                              
      if (state.rules.some(r => r.source_cal_id === sourceId && r.target_cal_id === targetId)) {                                                                                              
          showToast('This rule already exists', 'error');                                                                                                                                     
          return;                                                                                                                                                                             
      }                                                                                                                                                                                       
                                                                                                                                                                                              
      const rule = {                                                                                                                                                                          
          rule_id: generateId('rul'),                                                                                                                                                         
          source_cal_id: sourceId,                                                                                                                                                            
          target_cal_id: targetId,                                                                                                                                                            
          visibility: visibility,                                                                                                                                                             
          enabled: true                                                                                                                                                                       
      };                                                                                                                                                                                      
                                                                                                                                                                                              
      state.rules.push(rule);                                                                                                                                                                 
      renderRules();                                                                                                                                                                          
      hideModal('add-rule-modal');                                                                                                                                                            
      showToast('Sync rule created', 'success');                                                                                                                                              
  }                                                                                                                                                                                           
                                                                                                                                                                                              
  function toggleRule(ruleId, enabled) {                                                                                                                                                      
      const rule = state.rules.find(r => r.rule_id === ruleId);                                                                                                                               
      if (rule) {                                                                                                                                                                             
          rule.enabled = enabled;                                                                                                                                                             
      }                                                                                                                                                                                       
  }                                                                                                                                                                                           
                                                                                                                                                                                              
  function removeRule(ruleId) {                                                                                                                                                               
      // Track deletion for existing items                                                                                                                                                    
      if (ruleId) {                                                                                                                                                                           
          state.deletedRules.push(ruleId);                                                                                                                                                    
      }                                                                                                                                                                                       
                                                                                                                                                                                              
      state.rules = state.rules.filter(r => r.rule_id !== ruleId);                                                                                                                            
      renderRules();                                                                                                                                                                          
      showToast('Rule removed');                                                                                                                                                              
  }                                                                                                                                                                                           
                                                                                                                                                                                              
  // ==========================================                                                                                                                                               
  // CONFIGURATION PERSISTENCE                                                                                                                                                                
  // ==========================================                                                                                                                                               
                                                                                                                                                                                              
  async function loadUserConfiguration() {                                                                                                                                                    
      showLoading('Loading your configuration...');                                                                                                                                           
                                                                                                                                                                                              
      // Reset deletion tracking on load                                                                                                                                                      
      state.deletedCalendars = [];                                                                                                                                                            
      state.deletedRules = [];                                                                                                                                                                
                                                                                                                                                                                              
      try {                                                                                                                                                                                   
          const response = await fetch(CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.GET_CONFIG + `?email=${state.user.email}`);                                                                     
                                                                                                                                                                                              
          if (response.ok) {                                                                                                                                                                  
              const config = await response.json();                                                                                                                                           
                                                                                                                                                                                              
              // Load calendars from server (accept both snake_case and camelCase)                                                                                                            
              if (config.calendars && config.calendars.length > 0) {                                                                                                                          
                  state.calendars = config.calendars.map(c => ({                                                                                                                              
                      calendar_id: c.calendar_id || c.id,                                                                                                                                     
                      calendar_email: c.calendar_email || c.email,                                                                                                                            
                      calendar_name: c.calendar_name || c.name,                                                                                                                               
                      calendar_type: c.calendar_type || c.type,                                                                                                                               
                      access_verified: c.access_verified === true || c.access_verified === 'TRUE' || c.verified === true                                                                      
                  }));                                                                                                                                                                        
              } else {                                                                                                                                                                        
                  // No saved config - create default work calendar                                                                                                                           
                  state.calendars = [{                                                                                                                                                        
                      calendar_id: generateId('cal'),                                                                                                                                         
                      calendar_email: state.user.email,                                                                                                                                       
                      calendar_name: 'Work',                                                                                                                                                  
                      calendar_type: 'work',                                                                                                                                                  
                      access_verified: true                                                                                                                                                   
                  }];                                                                                                                                                                         
              }                                                                                                                                                                               
                                                                                                                                                                                              
              // Load rules from server (accept both snake_case and camelCase)                                                                                                                
              if (config.rules && config.rules.length > 0) {                                                                                                                                  
                  state.rules = config.rules.map(r => ({                                                                                                                                      
                      rule_id: r.rule_id || r.id,                                                                                                                                             
                      source_cal_id: r.source_cal_id || r.sourceCalId,                                                                                                                        
                      target_cal_id: r.target_cal_id || r.targetCalId,                                                                                                                        
                      visibility: r.visibility,                                                                                                                                               
                      enabled: r.enabled === true || r.enabled === 'TRUE' || r.enabled === 'true'                                                                                             
                  }));                                                                                                                                                                        
              }                                                                                                                                                                               
                                                                                                                                                                                              
              // Load team share setting (check both locations)                                                                                                                               
              if (config.user?.team_share_enabled !== undefined || config.teamShareEnabled !== undefined) {                                                                                   
                  state.teamShareEnabled = config.user?.team_share_enabled === true ||                                                                                                        
                                           config.user?.team_share_enabled === 'TRUE' ||                                                                                                      
                                           config.teamShareEnabled === true;                                                                                                                  
                  elements.teamShareToggle().checked = state.teamShareEnabled;                                                                                                                
              }                                                                                                                                                                               
          } else {                                                                                                                                                                            
              // No config found - create default work calendar                                                                                                                               
              state.calendars = [{                                                                                                                                                            
                  calendar_id: generateId('cal'),                                                                                                                                             
                  calendar_email: state.user.email,                                                                                                                                           
                  calendar_name: 'Work',                                                                                                                                                      
                  calendar_type: 'work',                                                                                                                                                      
                  access_verified: true                                                                                                                                                       
              }];                                                                                                                                                                             
          }                                                                                                                                                                                   
      } catch (error) {                                                                                                                                                                       
          console.log('No existing configuration found, starting fresh');                                                                                                                     
          // Create default work calendar                                                                                                                                                     
          state.calendars = [{                                                                                                                                                                
              calendar_id: generateId('cal'),                                                                                                                                                 
              calendar_email: state.user.email,                                                                                                                                               
              calendar_name: 'Work',                                                                                                                                                          
              calendar_type: 'work',                                                                                                                                                          
              access_verified: true                                                                                                                                                           
          }];                                                                                                                                                                                 
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
              user_id: state.user.user_id,                                                                                                                                                    
              email: state.user.email,                                                                                                                                                        
              name: state.user.name,                                                                                                                                                          
              team_share_enabled: state.teamShareEnabled                                                                                                                                      
          },                                                                                                                                                                                  
          calendars: state.calendars,                                                                                                                                                         
          rules: state.rules,                                                                                                                                                                 
          deletedCalendars: state.deletedCalendars,                                                                                                                                           
          deletedRules: state.deletedRules                                                                                                                                                    
      };                                                                                                                                                                                      
                                                                                                                                                                                              
      try {                                                                                                                                                                                   
          const response = await fetch(CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.SAVE_CONFIG, {                                                                                                  
              method: 'POST',                                                                                                                                                                 
              headers: { 'Content-Type': 'application/json' },                                                                                                                                
              body: JSON.stringify(config)                                                                                                                                                    
          });                                                                                                                                                                                 
                                                                                                                                                                                              
          const result = await response.json();                                                                                                                                               
                                                                                                                                                                                              
          if (result.success) {                                                                                                                                                               
              // Clear deletion tracking after successful save                                                                                                                                
              state.deletedCalendars = [];                                                                                                                                                    
              state.deletedRules = [];                                                                                                                                                        
                                                                                                                                                                                              
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
                                                                                                                                                                                              
  // (service-account copy removed — OAuth connect replaces manual sharing)
                                                                                                                                                                                           
                                                                                                                                                                                              
  // Make functions available globally for onclick handlers                                                                                                                                   
  window.removeCalendar = removeCalendar;                                                                                                                                                     
  window.removeRule = removeRule;                                                                                                                                                             
  window.toggleRule = toggleRule;                                                                                                                                                             
  window.connectWork = connectWork;
  window.addPickedCalendar = addPickedCalendar;                                                                                                                                             
                                                   
