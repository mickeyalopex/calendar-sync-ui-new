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
      calendars: [],  // Array of {calendar_id, calendar_email, calendar_name, calendar_type, access_verified}                                                                                
      rules: [],      // Array of {rule_id, source_cal_id, target_cal_id, visibility, enabled}                                                                                                
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
      elements.addCalendarBtn()?.addEventListener('click', () => showModal('add-calendar-modal'));                                                                                            
      elements.verifyCalendarBtn()?.addEventListener('click', handleVerifyCalendar);                                                                                                          
      elements.addRuleBtn()?.addEventListener('click', () => {                                                                                                                                
          populateRuleDropdowns();                                                                                                                                                            
          showModal('add-rule-modal');                                                                                                                                                        
      });                                                                                                                                                                                     
      elements.createRuleBtn()?.addEventListener('click', handleCreateRule);                                                                                                                  
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
                                                                                                                                                                                              
      if (state.calendars.some(c => c.calendar_email === email)) {                                                                                                                            
          showToast('This calendar is already added', 'error');                                                                                                                               
          return;                                                                                                                                                                             
      }                                                                                                                                                                                       
                                                                                                                                                                                              
      showLoading('Verifying calendar access...');                                                                                                                                            
                                                                                                                                                                                              
      try {                                                                                                                                                                                   
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
              calendar_id: generateId('cal'),                                                                                                                                                 
              calendar_email: email,                                                                                                                                                          
              calendar_name: name,                                                                                                                                                            
              calendar_type: 'external',                                                                                                                                                      
              access_verified: result.success === true                                                                                                                                        
          };                                                                                                                                                                                  
                                                                                                                                                                                              
          state.calendars.push(calendar);                                                                                                                                                     
          renderCalendars();                                                                                                                                                                  
          hideModal('add-calendar-modal');                                                                                                                                                    
                                                                                                                                                                                              
          elements.calendarEmail().value = '';                                                                                                                                                
          elements.calendarName().value = '';                                                                                                                                                 
                                                                                                                                                                                              
          if (result.success) {                                                                                                                                                               
              showToast(`Calendar "${name}" added and verified!`, 'success');                                                                                                                 
          } else {                                                                                                                                                                            
              showToast(`Calendar added but not verified. Please check sharing settings.`, 'warning');                                                                                        
          }                                                                                                                                                                                   
      } catch (error) {                                                                                                                                                                       
          console.error('Verification error:', error);                                                                                                                                        
                                                                                                                                                                                              
          const calendar = {                                                                                                                                                                  
              calendar_id: generateId('cal'),                                                                                                                                                 
              calendar_email: email,                                                                                                                                                          
              calendar_name: name,                                                                                                                                                            
              calendar_type: 'external',                                                                                                                                                      
              access_verified: false                                                                                                                                                          
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
                                                                                                                                                                                              
  function removeCalendar(calendarId) {                                                                                                                                                       
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
      state.rules = state.rules.filter(r => r.rule_id !== ruleId);                                                                                                                            
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
                                                                                                                                                                                              
      // Format data for server (already in correct format)                                                                                                                                   
      const config = {                                                                                                                                                                        
          user: {                                                                                                                                                                             
              user_id: state.user.user_id,                                                                                                                                                    
              email: state.user.email,                                                                                                                                                        
              name: state.user.name,                                                                                                                                                          
              team_share_enabled: state.teamShareEnabled                                                                                                                                      
          },                                                                                                                                                                                  
          calendars: state.calendars,                                                                                                                                                         
          rules: state.rules                                                                                                                                                                  
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
