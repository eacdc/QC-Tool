(function() {
  'use strict';

  // API Configuration: use local backend when testing on localhost, else production
  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:'
  );
  const API_BASE_URL = isLocal ? 'http://localhost:3001/api' : 'https://cdcapi.onrender.com/api';

  // Set current year in footer
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // State management
  const state = {
    currentUsername: null,
    currentUserId: null,
    currentLedgerId: null,
    selectedDatabase: null,
    machines: [],
    currentScreen: 'login',
    dashboard: {
      startDate: null,
      endDate: null,
      data: [],
      filteredData: [],
    },
    jobCardSearch: {
      lastJobNo: '',
      viewMode: 'process',
      processRows: [],
      userRows: [],
    },
  };

  // Session storage keys
  const SESSION_KEY = 'qc_session';
  const SESSION_ID_KEY = 'qc_session_id';

  // DOM Elements
  const elements = {
    // Sections
    loginSection: document.getElementById('login-section'),
    runningProcessesSection: document.getElementById('running-processes-section'),
    auditFormSection: document.getElementById('audit-form-section'),
    
    // Login
    loginForm: document.getElementById('login-form'),
    usernameInput: document.getElementById('username'),
    databaseSelect: document.getElementById('database'),
    loginError: document.getElementById('login-error'),
    
    // Header
    userInfo: document.getElementById('user-info'),
    logoutBtn: document.getElementById('btn-logout'),
    
    // Running Processes
    runningProcessesList: document.getElementById('running-processes-list'),
    noRunningProcesses: document.getElementById('no-running-processes'),
    runningProcessesCount: document.getElementById('running-processes-count'),
    jobCardNumberInput: document.getElementById('job-card-number-input'),
    btnJobCardSearch: document.getElementById('btn-job-card-search'),
    jobCardSearchError: document.getElementById('job-card-search-error'),
    jobCardResultsModal: document.getElementById('job-card-results-modal'),
    jobCardResultsModalTitle: document.getElementById('job-card-results-modal-title'),
    jobCardModalEmpty: document.getElementById('job-card-modal-empty'),
    jobCardModalTableWrap: document.getElementById('job-card-modal-table-wrap'),
    jobCardModalTableHead: document.getElementById('job-card-modal-table-head'),
    jobCardModalTableBody: document.getElementById('job-card-modal-table-body'),
    btnJobCardResultsClose: document.getElementById('btn-job-card-results-close'),
    btnJobCardResultsDone: document.getElementById('btn-job-card-results-done'),
    btnJobCardViewProcess: document.getElementById('btn-job-card-view-process'),
    btnJobCardViewUser: document.getElementById('btn-job-card-view-user'),
    
    // Audit Form
    inspectionForm: document.getElementById('inspection-form'),
    inspectionFields: document.getElementById('inspection-fields'),
    auditProcessName: document.getElementById('audit-process-name'),
    auditJobNumber: document.getElementById('audit-job-number'),
    auditOperator: document.getElementById('audit-operator'),
    auditMachine: document.getElementById('audit-machine'),
    btnBackToProcesses: document.getElementById('btn-back-to-processes'),
    btnCancelAudit: document.getElementById('btn-cancel-audit'),
    
    // Dashboard
    dashboardBtn: document.getElementById('btn-dashboard'),
    dashboardModal: document.getElementById('dashboard-modal'),
    dashboardModalForm: document.getElementById('dashboard-modal-form'),
    dashboardStartDateInput: document.getElementById('dashboard-start-date'),
    dashboardEndDateInput: document.getElementById('dashboard-end-date'),
    dashboardModalClose: document.getElementById('btn-dashboard-modal-close'),
    dashboardModalCancel: document.getElementById('btn-dashboard-cancel'),
    dashboardSection: document.getElementById('dashboard-section'),
    dashboardTableContainer: document.getElementById('dashboard-table-container'),
    dashboardTableHead: document.getElementById('dashboard-table-head'),
    dashboardTableBody: document.getElementById('dashboard-table-body'),
    dashboardPersonFilter: document.getElementById('dashboard-person-filter'),
    dashboardFetchBtn: document.getElementById('btn-dashboard-fetch'),
    dashboardEmptyState: document.getElementById('dashboard-empty-state'),
    dashboardDateRange: document.getElementById('dashboard-date-range'),
    btnBackToProcessesFromDashboard: document.getElementById('btn-back-to-processes-from-dashboard'),
    dashboardAuditDetailModal: document.getElementById('dashboard-audit-detail-modal'),
    dashboardAuditDetailModalTitle: document.getElementById('dashboard-audit-detail-modal-title'),
    dashboardAuditDetailEmpty: document.getElementById('dashboard-audit-detail-empty'),
    dashboardAuditDetailTableWrap: document.getElementById('dashboard-audit-detail-table-wrap'),
    dashboardAuditDetailTableHead: document.getElementById('dashboard-audit-detail-table-head'),
    dashboardAuditDetailTableBody: document.getElementById('dashboard-audit-detail-table-body'),
    btnDashboardAuditDetailClose: document.getElementById('btn-dashboard-audit-detail-close'),
    btnDashboardAuditDetailDone: document.getElementById('btn-dashboard-audit-detail-done'),

    // Loading
    loadingOverlay: document.getElementById('loading-overlay'),
  };

  // Helper Functions
  function showLoading() {
    if (elements.loadingOverlay) {
      elements.loadingOverlay.classList.remove('hidden');
    }
  }

  function hideLoading() {
    elements.loadingOverlay?.classList.add('hidden');
  }

  const DEFAULT_DASHBOARD_RANGE_DAYS = 30;

  function formatDateForInput(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatDateTimeForDisplay(value) {
    if (value === null || value === undefined || value === '') return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDateTimeInIST(value) {
    if (value === null || value === undefined || value === '') return '';
    const raw = String(value).trim();
    if (!raw) return '';
    if (/\bIST\b/i.test(raw)) return raw;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }) + ' IST';
  }

  function getDefaultDashboardRange() {
    const end = new Date();
    const start = new Date(end.getTime() - DEFAULT_DASHBOARD_RANGE_DAYS * 24 * 60 * 60 * 1000);
    return {
      start: formatDateForInput(start),
      end: formatDateForInput(end),
    };
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) {
      return '-';
    }
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function humanizeKey(key) {
    if (!key) return '';
    return key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .replace(/^./, (char) => char.toUpperCase())
      .trim();
  }

  function getRowUserName(row) {
    if (!row) return '';
    return (
      row.UserName ??
      row.Username ??
      row.username ??
      row.QCPerson ??
      row.QCName ??
      row.Inspector ??
      row.InspectorName ??
      row.User ??
      ''
    );
  }

  function getRowUserId(row) {
    if (row == null) return null;
    const id = row.UserID ?? row.userid ?? row.UserId ?? row.user_id;
    if (id != null && id !== '') {
      const n = parseInt(id, 10);
      if (!Number.isNaN(n)) return n;
    }
    return null;
  }

  function isEntryCountColumn(col) {
    if (!col || typeof col !== 'string') return false;
    const k = col.toLowerCase().replace(/[\s_]/g, '');
    return k === 'entrycount';
  }

  function formatTableCellValue(value) {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value.toLocaleString();
    }
    if (value instanceof Date) {
      return formatDateTimeForDisplay(value);
    }
    if (typeof value === 'string') {
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}/;
      if (isoDatePattern.test(value)) {
        return formatDateTimeForDisplay(value);
      }
    }
    return value;
  }

  function setDashboardModalValues() {
    if (!elements.dashboardStartDateInput || !elements.dashboardEndDateInput) return;
    const currentStart = state.dashboard.startDate;
    const currentEnd = state.dashboard.endDate;
    if (currentStart && currentEnd) {
      elements.dashboardStartDateInput.value = currentStart;
      elements.dashboardEndDateInput.value = currentEnd;
      return;
    }
    const defaults = getDefaultDashboardRange();
    elements.dashboardStartDateInput.value = defaults.start;
    elements.dashboardEndDateInput.value = defaults.end;
  }

  function openDashboardModal() {
    if (!elements.dashboardModal) return;
    setDashboardModalValues();
    elements.dashboardModal.classList.remove('hidden');
    elements.dashboardStartDateInput?.focus();
  }

  function closeDashboardModal() {
    elements.dashboardModal?.classList.add('hidden');
  }

  function resetDashboardState() {
    state.dashboard = {
      startDate: null,
      endDate: null,
      data: [],
      filteredData: [],
    };
    if (elements.dashboardTableHead) elements.dashboardTableHead.innerHTML = '';
    if (elements.dashboardTableBody) elements.dashboardTableBody.innerHTML = '';
    elements.dashboardTableContainer?.classList.add('hidden');
    elements.dashboardEmptyState?.classList.add('hidden');
    if (elements.dashboardDateRange) elements.dashboardDateRange.textContent = '';
    if (elements.dashboardPersonFilter) elements.dashboardPersonFilter.innerHTML = '<option value="">All QC Persons</option>';
  }

  function updateDashboardDateRangeLabel() {
    if (!elements.dashboardDateRange) return;
    if (state.dashboard.startDate && state.dashboard.endDate) {
      elements.dashboardDateRange.textContent = `${formatDateForDisplay(state.dashboard.startDate)} – ${formatDateForDisplay(state.dashboard.endDate)}`;
    } else {
      elements.dashboardDateRange.textContent = '';
    }
  }

  function showError(message, element = elements.loginError) {
    if (element) {
      element.textContent = message;
    }
  }

  function clearError(element = elements.loginError) {
    if (element) {
      element.textContent = '';
    }
  }

  // Session Management
  function saveSession(sessionData) {
    try {
      const sessionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      localStorage.setItem(SESSION_ID_KEY, sessionId);
      console.log('Session saved:', sessionId);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  function loadSession() {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      clearSession();
    }
    return null;
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_ID_KEY);
      console.log('Session cleared');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  function getSessionId() {
    return localStorage.getItem(SESSION_ID_KEY);
  }

  function restoreSession() {
    const sessionData = loadSession();
    if (sessionData) {
      state.currentUsername = sessionData.username;
      state.currentUserId = sessionData.userId;
      state.currentLedgerId = sessionData.ledgerId;
      state.selectedDatabase = sessionData.database;
      state.machines = sessionData.machines || [];
      
      updateUserInfo();
      showRunningProcessesSection();
      console.log('Session restored for user:', sessionData.username);
      return true;
    }
    return false;
  }

  // Cross-tab session synchronization
  window.addEventListener('storage', (event) => {
    if (event.key === SESSION_KEY) {
      if (event.newValue === null) {
        console.log('Session cleared in another tab, logging out...');
        logout();
      } else if (event.oldValue !== null) {
        const newSession = JSON.parse(event.newValue);
        const currentSessionId = getSessionId();
        const newSessionId = localStorage.getItem(SESSION_ID_KEY);
        
        if (currentSessionId && newSessionId && currentSessionId !== newSessionId) {
          console.log('New login detected in another tab, logging out current session...');
          state.currentUsername = null;
          state.currentUserId = null;
          state.currentLedgerId = null;
          state.selectedDatabase = null;
          state.machines = [];
          
          if (elements.userInfo) {
            elements.userInfo.classList.add('hidden');
          }
          if (elements.logoutBtn) {
            elements.logoutBtn.classList.add('hidden');
          }
          
          alert('You have been logged out because a new login was detected in another tab.');
          
          showSection(elements.loginSection, 'login');
        }
      }
    }
  });

  function showSection(section, screenName = null) {
    // Hide all sections
    if (elements.loginSection) elements.loginSection.classList.add('hidden');
    if (elements.runningProcessesSection) elements.runningProcessesSection.classList.add('hidden');
    if (elements.auditFormSection) elements.auditFormSection.classList.add('hidden');
    if (elements.dashboardSection) elements.dashboardSection.classList.add('hidden');
    
    // Show target section
    if (section) {
      section.classList.remove('hidden');
      
      if (screenName) {
        state.currentScreen = screenName;
      }
      
      // Show/hide logout button
      if (screenName !== 'login') {
        if (elements.logoutBtn) {
          elements.logoutBtn.classList.remove('hidden');
        }
        if (elements.dashboardBtn && state.currentUsername) {
          elements.dashboardBtn.classList.remove('hidden');
        }
      } else {
        if (elements.logoutBtn) {
          elements.logoutBtn.classList.add('hidden');
        }
        if (elements.dashboardBtn) {
          elements.dashboardBtn.classList.add('hidden');
        }
      }
    }
  }

  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}/${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('This feature is not available on the server (404). Deploy the latest backend and try again.');
          }
          throw new Error(`Request failed (${response.status}). The server may need to be updated.`);
        }
        console.error('API Request Error:', parseErr);
        throw new Error('Invalid response from server. Try again or contact support.');
      }

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - Operation took too long. Please try again.');
      }
      if (error instanceof SyntaxError) {
        throw new Error('Server returned an error page. Deploy the latest backend and try again.');
      }
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Authentication
  async function login(username, database) {
    showLoading();
    clearError();
    
    try {
      const data = await apiRequest(`auth/login?username=${encodeURIComponent(username)}&database=${encodeURIComponent(database)}&_t=${Date.now()}`);
      
      if (data.status === true) {
        state.currentUsername = username;
        state.currentUserId = data.userId;
        state.currentLedgerId = data.ledgerId;
        state.selectedDatabase = database;
        state.machines = data.machines || [];
        
        const sessionData = {
          username,
          userId: data.userId,
          ledgerId: data.ledgerId,
          database,
          machines: data.machines || [],
        };
        saveSession(sessionData);
        
        updateUserInfo();
        showRunningProcessesSection();
        return true;
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      showError(error.message);
      return false;
    } finally {
      hideLoading();
    }
  }

  function updateUserInfo() {
    if (elements.userInfo) {
      elements.userInfo.textContent = `${state.currentUsername} (${state.selectedDatabase})`;
      elements.userInfo.classList.remove('hidden');
    }
    if (elements.logoutBtn) {
      elements.logoutBtn.classList.remove('hidden');
    }
    if (elements.dashboardBtn) {
      elements.dashboardBtn.classList.remove('hidden');
    }
  }

  function logout() {
    state.currentUsername = null;
    state.currentUserId = null;
    state.currentLedgerId = null;
    state.selectedDatabase = null;
    state.machines = [];
    resetDashboardState();
    
    if (elements.userInfo) {
      elements.userInfo.classList.add('hidden');
    }
    if (elements.logoutBtn) {
      elements.logoutBtn.classList.add('hidden');
    }
    if (elements.dashboardBtn) {
      elements.dashboardBtn.classList.add('hidden');
    }
    closeDashboardModal();
    
    clearSession();
    showSection(elements.loginSection, 'login');
  }

  // Fetch running machines from backend
  async function fetchRunningProcesses() {
    try {
      const data = await apiRequest('machine-status/latest', {
        method: 'POST',
        body: JSON.stringify({
          database: state.selectedDatabase,
        }),
      });
      
      if (data.status === true) {
        return data.data || [];
      } else {
        throw new Error(data.error || 'Failed to fetch running processes');
      }
    } catch (error) {
      console.error('Error fetching running processes:', error);
      throw error;
    }
  }

  async function fetchJobCardEntries(jobBookingNo, viewMode = 'process') {
    if (!jobBookingNo || !String(jobBookingNo).trim()) {
      throw new Error('Job card number is required');
    }
    if (!state.selectedDatabase) {
      throw new Error('Database selection missing. Please log in again.');
    }
    const data = await apiRequest('reports/qc-job-card-entries', {
      method: 'POST',
      body: JSON.stringify({
        database: state.selectedDatabase,
        jobBookingNo: String(jobBookingNo).trim(),
        viewMode: viewMode === 'user' ? 'user' : 'process',
      }),
    });
    if (data.status === true && Array.isArray(data.data)) {
      return data.data;
    }
    throw new Error(data.error || 'Failed to load job card entries');
  }

  function setJobCardViewMode(viewMode) {
    const nextMode = viewMode === 'user' ? 'user' : 'process';
    state.jobCardSearch.viewMode = nextMode;
    if (elements.btnJobCardViewProcess) {
      const active = nextMode === 'process';
      elements.btnJobCardViewProcess.classList.toggle('active', active);
      elements.btnJobCardViewProcess.setAttribute('aria-pressed', String(active));
    }
    if (elements.btnJobCardViewUser) {
      const active = nextMode === 'user';
      elements.btnJobCardViewUser.classList.toggle('active', active);
      elements.btnJobCardViewUser.setAttribute('aria-pressed', String(active));
    }
  }

  async function fetchInspectorAuditDetail(startDate, endDate, userId) {
    if (!state.selectedDatabase) {
      throw new Error('Database selection missing. Please log in again.');
    }
    const data = await apiRequest('reports/qc-inspector-audit-detail', {
      method: 'POST',
      body: JSON.stringify({
        database: state.selectedDatabase,
        startDate,
        endDate,
        userId: Number(userId),
      }),
    });
    if (data.status === true && Array.isArray(data.data)) {
      return data.data;
    }
    throw new Error(data.error || 'Failed to load audit detail');
  }

  async function fetchInspectorPerformanceReport(startDate, endDate) {
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }
    if (!state.selectedDatabase) {
      throw new Error('Database selection missing. Please log in again.');
    }

    try {
      const data = await apiRequest('reports/qc-inspector-performance', {
        method: 'POST',
        body: JSON.stringify({
          database: state.selectedDatabase,
          startDate,
          endDate,
        }),
      });

      if (data.status === true) {
        if (Array.isArray(data.data)) {
          return data.data;
        }
        if (Array.isArray(data.records)) {
          return data.records;
        }
        return [];
      }

      throw new Error(data.error || 'Failed to load dashboard data');
    } catch (error) {
      console.error('Error fetching inspector performance:', error);
      throw error;
    }
  }

  // Render running processes
  function renderRunningProcesses(machineStatuses) {
    const runningMachines = machineStatuses.filter(status => 
      status.MachineStatus && status.MachineStatus.toLowerCase() === 'running'
    );

    // Update count
    if (elements.runningProcessesCount) {
      elements.runningProcessesCount.textContent = runningMachines.length;
    }

    if (runningMachines.length === 0) {
      if (elements.runningProcessesList) elements.runningProcessesList.classList.add('hidden');
      if (elements.noRunningProcesses) elements.noRunningProcesses.classList.remove('hidden');
      return;
    }

    if (elements.runningProcessesList) elements.runningProcessesList.classList.remove('hidden');
    if (elements.noRunningProcesses) elements.noRunningProcesses.classList.add('hidden');

    // Sort by LastUpdated (oldest to newest)
    const sortedMachines = runningMachines.sort((a, b) => {
      const aTime = new Date(a.LastUpadted || a.LastUpdated || 0).getTime();
      const bTime = new Date(b.LastUpadted || b.LastUpdated || 0).getTime();
      return aTime - bTime;
    });

    const html = sortedMachines.map((status, index) => {
      const processName = status.Process || 'N/A';
      const jobNumber = status.Jobnumber || 'N/A';
      const operatorName = status.UserID || status.EmployeeName || status.Employee || status.UserName || status.Username || 'N/A';
      const machineName = status.MachineNmae || status.MachineName || 'Unknown Machine';
      const jobName = status['Job Name'] || status.JobName || 'N/A';
      const lastUpdated = status.LastUpadted || status.LastUpdated || 'N/A';

      return `
        <div class="running-process-card">
          <div class="process-card-header">
            <div class="process-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div class="process-card-info">
              <h4>${processName}</h4>
              <span class="status-badge running">Running</span>
            </div>
          </div>
          <div class="process-card-details">
            <div class="detail-item">
              <svg class="detail-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
              </svg>
              <div class="detail-content">
                <div class="detail-label">Machine</div>
                <div class="detail-value">${machineName}</div>
              </div>
            </div>
            <div class="detail-item">
              <svg class="detail-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
              <div class="detail-content">
                <div class="detail-label">Job Number</div>
                <div class="detail-value">${jobNumber}</div>
              </div>
            </div>
            <div class="detail-item">
              <svg class="detail-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <div class="detail-content">
                <div class="detail-label">Operator</div>
                <div class="detail-value">${operatorName}</div>
              </div>
            </div>
            <div class="detail-item">
              <svg class="detail-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
              </svg>
              <div class="detail-content">
                <div class="detail-label">Job Name</div>
                <div class="detail-value">${jobName}</div>
              </div>
            </div>
            <div class="detail-item">
              <svg class="detail-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
              <div class="detail-content">
                <div class="detail-label">Last Updated</div>
                <div class="detail-value">${lastUpdated}</div>
              </div>
            </div>
          </div>
          <div class="process-card-actions">
            <button class="btn-start-audit" data-process-index="${index}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
              </svg>
              Start Audit
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (elements.runningProcessesList) {
      elements.runningProcessesList.innerHTML = html;

      // Add event listeners for Start Audit buttons
      elements.runningProcessesList.querySelectorAll('.btn-start-audit').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.processIndex);
          const process = sortedMachines[index];
          handleStartAudit(process);
        });
      });
    }
  }

  function populateDashboardFilterOptions(data = []) {
    if (!elements.dashboardPersonFilter) return;
    const names = Array.from(
      new Set(
        data
          .map(item => getRowUserName(item))
          .filter(name => name && String(name).trim().length > 0)
          .map(name => String(name).trim())
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    const options = [
      '<option value="">All QC Persons</option>',
      ...names.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`),
    ];

    elements.dashboardPersonFilter.innerHTML = options.join('');
    elements.dashboardPersonFilter.value = '';
  }

  function renderDashboardTable(rows = []) {
    if (!elements.dashboardTableContainer || !elements.dashboardTableHead || !elements.dashboardTableBody) return;

    if (!rows || rows.length === 0) {
      elements.dashboardTableContainer.classList.add('hidden');
      elements.dashboardEmptyState?.classList.remove('hidden');
      elements.dashboardTableHead.innerHTML = '';
      elements.dashboardTableBody.innerHTML = '';
      return;
    }

    elements.dashboardEmptyState?.classList.add('hidden');
    elements.dashboardTableContainer.classList.remove('hidden');

    const excludedColumns = new Set(['userid', 'user_id', 'user id']);
    const columns = [];
    rows.forEach(row => {
      Object.keys(row || {}).forEach((key) => {
        if (!columns.includes(key) && !excludedColumns.has(key.toLowerCase())) {
          columns.push(key);
        }
      });
    });

    if (columns.length === 0) {
      elements.dashboardTableContainer.classList.add('hidden');
      elements.dashboardEmptyState?.classList.remove('hidden');
      return;
    }

    const headerHtml = `<tr>${columns.map(col => `<th>${escapeHtml(humanizeKey(col))}</th>`).join('')}</tr>`;
    elements.dashboardTableHead.innerHTML = headerHtml;

    const bodyHtml = rows.map((row, rowIndex) => {
      const cells = columns.map(col => {
        const cellValue = formatTableCellValue(row?.[col]);
        const displayVal = escapeHtml(cellValue);
        if (isEntryCountColumn(col)) {
          return `<td><button type="button" class="entry-count-link" data-row-index="${rowIndex}" title="View audit detail">${displayVal}</button></td>`;
        }
        return `<td>${displayVal}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    elements.dashboardTableBody.innerHTML = bodyHtml;
  }

  function renderDashboardAuditDetailInModal(rows = [], title = '') {
    const titleEl = elements.dashboardAuditDetailModalTitle;
    const emptyEl = elements.dashboardAuditDetailEmpty;
    const wrapEl = elements.dashboardAuditDetailTableWrap;
    const headEl = elements.dashboardAuditDetailTableHead;
    const bodyEl = elements.dashboardAuditDetailTableBody;
    if (!titleEl || !emptyEl || !wrapEl || !headEl || !bodyEl) return;

    if (titleEl) titleEl.textContent = title || 'Audit detail';

    if (!rows || rows.length === 0) {
      emptyEl.classList.remove('hidden');
      wrapEl.classList.add('hidden');
      headEl.innerHTML = '';
      bodyEl.innerHTML = '';
      return;
    }

    emptyEl.classList.add('hidden');
    wrapEl.classList.remove('hidden');

    const columns = [];
    rows.forEach(row => {
      Object.keys(row || {}).forEach((key) => {
        if (!columns.includes(key)) columns.push(key);
      });
    });

    const headerHtml = `<tr>${columns.map(col => `<th>${escapeHtml(humanizeKey(col))}</th>`).join('')}</tr>`;
    headEl.innerHTML = headerHtml;

    const bodyHtml = rows.map(row => {
      const cells = columns.map(col => {
        const cellValue = formatTableCellValue(row?.[col]);
        return `<td>${escapeHtml(cellValue)}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    bodyEl.innerHTML = bodyHtml;
  }

  function openDashboardAuditDetailModal() {
    elements.dashboardAuditDetailModal?.classList.remove('hidden');
  }

  function closeDashboardAuditDetailModal() {
    elements.dashboardAuditDetailModal?.classList.add('hidden');
  }

  function renderJobCardTableInModal(rows = [], jobBookingNo = '') {
    const titleEl = elements.jobCardResultsModalTitle;
    const emptyEl = elements.jobCardModalEmpty;
    const wrapEl = elements.jobCardModalTableWrap;
    const headEl = elements.jobCardModalTableHead;
    const bodyEl = elements.jobCardModalTableBody;
    if (!titleEl || !emptyEl || !wrapEl || !headEl || !bodyEl) return;

    if (titleEl) titleEl.textContent = jobBookingNo ? `QC entries for ${escapeHtml(jobBookingNo)}` : 'QC entries';

    if (!rows || rows.length === 0) {
      emptyEl.classList.remove('hidden');
      wrapEl.classList.add('hidden');
      headEl.innerHTML = '';
      bodyEl.innerHTML = '';
      return;
    }

    emptyEl.classList.add('hidden');
    wrapEl.classList.remove('hidden');

    // Fixed columns as requested for QC job-card search output.
    const headerHtml = `
      <tr>
        <th class="jobcard-expand-col"></th>
        <th>Process Name</th>
        <th>Parameter Name</th>
        <th>Number of OK</th>
        <th>Number of Not OK</th>
        <th>Inspection Start At (IST)</th>
        <th>Inspection End At (IST)</th>
      </tr>
    `;
    headEl.innerHTML = headerHtml;

    const groups = new Map();
    rows.forEach((row) => {
      const processName = String(row?.ProcessName ?? row?.processName ?? 'Unknown Process').trim() || 'Unknown Process';
      if (!groups.has(processName)) groups.set(processName, []);
      groups.get(processName).push(row || {});
    });

    const groupEntries = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const bodyParts = [];

    const parseDateMs = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const cleaned = String(value).replace(/\s*IST\s*$/i, '').trim();
      const dt = new Date(cleaned);
      if (Number.isNaN(dt.getTime())) return null;
      return dt.getTime();
    };

    groupEntries.forEach(([processName, groupRows], groupIndex) => {
      const groupId = `group-${groupIndex}`;
      const sumOk = groupRows.reduce((acc, row) => {
        const v = Number(row?.['Number of OK'] ?? row?.NumberOfOK ?? row?.OKCount ?? row?.okCount ?? 0);
        return acc + (Number.isFinite(v) ? v : 0);
      }, 0);
      const sumNotOk = groupRows.reduce((acc, row) => {
        const v = Number(row?.['Number of Not OK'] ?? row?.NumberOfNotOK ?? row?.NotOKCount ?? row?.notOkCount ?? 0);
        return acc + (Number.isFinite(v) ? v : 0);
      }, 0);
      let minStartMs = null;
      let maxEndMs = null;
      groupRows.forEach((row) => {
        const startMs = parseDateMs(row?.['Inspection Start At'] ?? row?.InspectionStartAt ?? row?.inspectionStartAt ?? '');
        const endMs = parseDateMs(row?.['Inspection End At'] ?? row?.InspectionEndAt ?? row?.inspectionEndAt ?? '');
        if (startMs != null && (minStartMs == null || startMs < minStartMs)) minStartMs = startMs;
        if (endMs != null && (maxEndMs == null || endMs > maxEndMs)) maxEndMs = endMs;
      });
      const minStartText = minStartMs == null ? '-' : formatDateTimeInIST(new Date(minStartMs));
      const maxEndText = maxEndMs == null ? '-' : formatDateTimeInIST(new Date(maxEndMs));

      bodyParts.push(`
        <tr class="jobcard-group-row" data-group-id="${groupId}">
          <td class="jobcard-expand-cell">
            <button type="button" class="jobcard-group-toggle" data-group-id="${groupId}" aria-expanded="false" aria-label="Expand ${escapeHtml(processName)} group">+</button>
          </td>
          <td class="jobcard-group-name">${escapeHtml(processName)}</td>
          <td class="jobcard-group-summary">Summary (${escapeHtml(groupRows.length)} parameter(s))</td>
          <td class="jobcard-group-summary">${escapeHtml(formatTableCellValue(sumOk))}</td>
          <td class="jobcard-group-summary">${escapeHtml(formatTableCellValue(sumNotOk))}</td>
          <td class="jobcard-group-summary">${escapeHtml(minStartText)}</td>
          <td class="jobcard-group-summary">${escapeHtml(maxEndText)}</td>
        </tr>
      `);

      groupRows.forEach((row) => {
        const parameterName = row?.ParameterName ?? row?.parameterName ?? '-';
        const okCount = row?.['Number of OK'] ?? row?.NumberOfOK ?? row?.OKCount ?? row?.okCount ?? 0;
        const notOkCount = row?.['Number of Not OK'] ?? row?.NumberOfNotOK ?? row?.NotOKCount ?? row?.notOkCount ?? 0;
        const inspectionStartAt = row?.['Inspection Start At'] ?? row?.InspectionStartAt ?? row?.inspectionStartAt ?? '';
        const inspectionEndAt = row?.['Inspection End At'] ?? row?.InspectionEndAt ?? row?.inspectionEndAt ?? '';

        bodyParts.push(`
          <tr class="jobcard-detail-row hidden" data-parent-group="${groupId}">
            <td></td>
            <td>${escapeHtml(processName)}</td>
            <td>${escapeHtml(formatTableCellValue(parameterName))}</td>
            <td>${escapeHtml(formatTableCellValue(okCount))}</td>
            <td>${escapeHtml(formatTableCellValue(notOkCount))}</td>
            <td>${escapeHtml(formatDateTimeInIST(inspectionStartAt))}</td>
            <td>${escapeHtml(formatDateTimeInIST(inspectionEndAt))}</td>
          </tr>
        `);
      });
    });

    bodyEl.innerHTML = bodyParts.join('');

    bodyEl.querySelectorAll('.jobcard-group-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const groupId = btn.getAttribute('data-group-id');
        if (!groupId) return;
        const targetRows = bodyEl.querySelectorAll(`.jobcard-detail-row[data-parent-group="${groupId}"]`);
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        const nextExpanded = !isExpanded;

        targetRows.forEach((row) => {
          row.classList.toggle('hidden', !nextExpanded);
        });
        btn.textContent = nextExpanded ? '−' : '+';
        btn.setAttribute('aria-expanded', String(nextExpanded));
      });
    });
  }

  function renderUserWiseJobCardTableInModal(rows = [], jobBookingNo = '') {
    const titleEl = elements.jobCardResultsModalTitle;
    const emptyEl = elements.jobCardModalEmpty;
    const wrapEl = elements.jobCardModalTableWrap;
    const headEl = elements.jobCardModalTableHead;
    const bodyEl = elements.jobCardModalTableBody;
    if (!titleEl || !emptyEl || !wrapEl || !headEl || !bodyEl) return;

    titleEl.textContent = jobBookingNo ? `QC entries for ${escapeHtml(jobBookingNo)} (User-wise)` : 'QC entries (User-wise)';

    if (!rows || rows.length === 0) {
      emptyEl.classList.remove('hidden');
      wrapEl.classList.add('hidden');
      headEl.innerHTML = '';
      bodyEl.innerHTML = '';
      return;
    }

    emptyEl.classList.add('hidden');
    wrapEl.classList.remove('hidden');

    headEl.innerHTML = `
      <tr>
        <th>User Name</th>
        <th>Entry Date</th>
        <th>Entry Count</th>
        <th>First Entry At (IST)</th>
        <th>Last Entry At (IST)</th>
        <th>Entries Per Hour</th>
      </tr>
    `;

    const bodyHtml = rows.map((row) => {
      const userName = row?.UserName ?? row?.userName ?? '-';
      const entryDate = row?.EntryDate ?? row?.entryDate ?? '';
      const entryCount = row?.EntryCount ?? row?.entryCount ?? 0;
      const firstEntryAt = row?.FirstEntryAt ?? row?.firstEntryAt ?? '';
      const lastEntryAt = row?.LastEntryAt ?? row?.lastEntryAt ?? '';
      const entriesPerHour = row?.EntriesPerHour ?? row?.entriesPerHour ?? null;
      const formattedEntriesPerHour = entriesPerHour === null || entriesPerHour === undefined || entriesPerHour === ''
        ? '-'
        : Number(entriesPerHour).toLocaleString(undefined, { maximumFractionDigits: 4 });
      return `
        <tr>
          <td>${escapeHtml(formatTableCellValue(userName))}</td>
          <td>${escapeHtml(formatDateTimeInIST(entryDate))}</td>
          <td>${escapeHtml(formatTableCellValue(entryCount))}</td>
          <td>${escapeHtml(formatDateTimeInIST(firstEntryAt))}</td>
          <td>${escapeHtml(formatDateTimeInIST(lastEntryAt))}</td>
          <td>${escapeHtml(formattedEntriesPerHour)}</td>
        </tr>
      `;
    }).join('');

    bodyEl.innerHTML = bodyHtml;
  }

  function openJobCardResultsModal() {
    elements.jobCardResultsModal?.classList.remove('hidden');
  }

  function closeJobCardResultsModal() {
    elements.jobCardResultsModal?.classList.add('hidden');
  }

  function applyDashboardFilter() {
    const selected = elements.dashboardPersonFilter?.value || '';
    if (!Array.isArray(state.dashboard.data) || state.dashboard.data.length === 0) {
      renderDashboardTable([]);
      return;
    }

    let filtered = state.dashboard.data;
    if (selected) {
      const selectedLower = selected.toLowerCase();
      filtered = state.dashboard.data.filter(row => {
        const name = String(getRowUserName(row) || '').trim().toLowerCase();
        return name === selectedLower;
      });
    }

    state.dashboard.filteredData = filtered;
    renderDashboardTable(filtered);
  }

  function showDashboardSection() {
    showSection(elements.dashboardSection, 'dashboard');
  }

  async function loadDashboardData(startDate, endDate) {
    showLoading();
    try {
      const rows = await fetchInspectorPerformanceReport(startDate, endDate);
      state.dashboard.startDate = startDate;
      state.dashboard.endDate = endDate;
      state.dashboard.data = rows;
      state.dashboard.filteredData = rows;
      
      populateDashboardFilterOptions(rows);
      updateDashboardDateRangeLabel();
      renderDashboardTable(rows);
      closeDashboardModal();
      showDashboardSection();
    } catch (error) {
      alert('Failed to load dashboard data: ' + error.message);
    } finally {
      hideLoading();
    }
  }

  async function handleDashboardModalSubmit(event) {
    event?.preventDefault();
    const startDate = elements.dashboardStartDateInput?.value;
    const endDate = elements.dashboardEndDateInput?.value;

    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date cannot be after end date.');
      return;
    }

    await loadDashboardData(startDate, endDate);
  }

  // Fetch inspection template for audit
  async function fetchInspectionTemplate(processId) {
    try {
      const data = await apiRequest('qc/inspection-template', {
        method: 'POST',
        body: JSON.stringify({
          processId: processId,
          database: state.selectedDatabase,
        }),
      });
      
      if (data.status === true) {
        return data.data || [];
      } else {
        throw new Error(data.error || 'Failed to fetch inspection template');
      }
    } catch (error) {
      console.error('Error fetching inspection template:', error);
      throw error;
    }
  }

  // Save Process Inspection
  async function saveInspection(inspectionData) {
    try {
      const data = await apiRequest('qc/save-inspection', {
        method: 'POST',
        body: JSON.stringify({
          userId: state.currentUserId || 2, // Use logged in user or default to 2
          productionId: inspectionData.productionId,
          processId: inspectionData.processId,
          jobBookingJobCardContentsId: inspectionData.jobBookingJobCardContentsId,
          jobBookingId: inspectionData.jobBookingId, // From GetLatestMachineStatusPerMachine
          items: inspectionData.items,
          database: state.selectedDatabase,
        }),
      });
      
      if (data.status === true) {
        return data;
      } else {
        throw new Error(data.error || 'Failed to save inspection');
      }
    } catch (error) {
      console.error('Error saving inspection:', error);
      throw error;
    }
  }

  // Generate dynamic form fields based on inspection template
  function generateInspectionForm(inspectionData) {
    if (!elements.inspectionFields) return;
    
    elements.inspectionFields.innerHTML = '';
    
    inspectionData.forEach((item, index) => {
      const parameter = item.parameter || item.Parameter || '';
      const fieldType = item.fieldType || item.FieldType || 'Text Field';
      const options = item.options || item.Options || null;
      
      const fieldWrapper = document.createElement('div');
      fieldWrapper.className = 'inspection-field';
      
      const label = document.createElement('label');
      label.textContent = parameter;
      label.setAttribute('for', `field-${index}`);
      
      const required = document.createElement('span');
      required.className = 'required-indicator';
      required.textContent = '*';
      label.appendChild(required);
      
      let inputElement;
      
      // Combo Field with non-empty options → dropdown; otherwise (Text Field or Combo with empty options) → manual text entry
      const hasOptions = options && Array.isArray(options) && options.length > 0;
      const useDropdown = (fieldType === 'Combo Field' || fieldType === 'Combo field') && hasOptions;
      
      if (useDropdown) {
        // Create dropdown/select field
        inputElement = document.createElement('select');
        inputElement.id = `field-${index}`;
        inputElement.name = parameter;
        inputElement.required = true;
        inputElement.className = 'form-select';
        
        // Add placeholder option
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = '-- Select --';
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        inputElement.appendChild(placeholderOption);
        
        // Add options
        options.forEach(optionValue => {
          const option = document.createElement('option');
          option.value = optionValue;
          option.textContent = optionValue;
          inputElement.appendChild(option);
        });
      } else {
        // Text Field, or Combo Field with empty/blank options → allow manual entry
        inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.id = `field-${index}`;
        inputElement.name = parameter;
        inputElement.required = true;
        inputElement.className = 'form-input';
        inputElement.placeholder = `Enter ${parameter}`;
      }
      
      fieldWrapper.appendChild(label);
      fieldWrapper.appendChild(inputElement);
      elements.inspectionFields.appendChild(fieldWrapper);
    });
  }

  // Handle Start Audit button click
  async function handleStartAudit(process) {
    const processName = process.Process || 'N/A';
    const jobNumber = process.Jobnumber || 'N/A';
    const operatorName = process.UserID || process.EmployeeName || process.Employee || 'N/A';
    const machineName = process.MachineNmae || process.MachineName || 'N/A';
    const processId = process.ProcessID || null;
    
    console.log('Starting audit for process:', {
      processName,
      jobNumber,
      operatorName,
      machineName,
      processId,
      fullProcess: process
    });

    showLoading();

    try {
      // Call the inspection template endpoint with the actual ProcessID from the process data
      const inspectionData = await fetchInspectionTemplate(processId);
      
      hideLoading();
      
      console.log('Inspection Template Data:', inspectionData);
      
      // Display the inspection template data
      if (inspectionData && inspectionData.length > 0) {
        // Store current process data for form submission
        state.currentAuditProcess = process;
        state.currentInspectionTemplate = inspectionData;
        
        // Update audit form info
        if (elements.auditProcessName) elements.auditProcessName.textContent = processName;
        if (elements.auditJobNumber) elements.auditJobNumber.textContent = jobNumber;
        if (elements.auditOperator) elements.auditOperator.textContent = operatorName;
        if (elements.auditMachine) elements.auditMachine.textContent = machineName;
        
        // Generate form fields
        generateInspectionForm(inspectionData);
        
        // Show audit form section
        showSection(elements.auditFormSection, 'audit-form');
        
        // Scroll to top of the page
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
      } else {
        alert('No inspection template found for this process.');
      }
      
    } catch (error) {
      hideLoading();
      alert('Error loading inspection template: ' + error.message);
    }
  }

  // Handle audit form submission
  if (elements.inspectionForm) {
    elements.inspectionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Collect form data
      const formData = new FormData(elements.inspectionForm);
      
      // Structure the output as per requirement
      const structuredAuditData = [];
      
      state.currentInspectionTemplate.forEach((item, index) => {
        const parameter = item.parameter || item.Parameter || '';
        const fieldType = item.fieldType || item.FieldType || 'Text Field';
        const options = item.options || item.Options || null;
        const result = formData.get(parameter) || '';
        const hasOptions = options && Array.isArray(options) && options.length > 0;
        // Combo Field with empty options was rendered as text input → send as Text Field so SP does not validate "value in options"
        const effectiveFieldType = (fieldType === 'Combo Field' || fieldType === 'Combo field') && !hasOptions
          ? 'Text Field'
          : fieldType;
        
        const dataItem = {
          parameter: parameter,
          result: result,
          inputFieldType: effectiveFieldType
        };
        
        // Add defaultValue for Combo Field types (only when options exist)
        if (hasOptions) {
          dataItem.defaultValue = options.join('|');
        }
        
        structuredAuditData.push(dataItem);
      });
      
      console.log('Audit Form Submitted - Structured Data:');
      console.log(JSON.stringify(structuredAuditData, null, 2));
      
      const processInfo = {
        processName: state.currentAuditProcess?.Process || 'N/A',
        jobNumber: state.currentAuditProcess?.Jobnumber || 'N/A',
        operator: state.currentAuditProcess?.UserID || state.currentAuditProcess?.EmployeeName || 'N/A',
        machine: state.currentAuditProcess?.MachineNmae || state.currentAuditProcess?.MachineName || 'N/A',
        productionId: state.currentAuditProcess?.ProductionID || state.currentAuditProcess?.Productionid,
        jobBookingJobCardContentsId: state.currentAuditProcess?.JobBookingJobCardContentsID || state.currentAuditProcess?.Jobbookingjobcardcontentsid,
        processId: state.currentAuditProcess?.ProcessID,
        jobBookingId: state.currentAuditProcess?.JobBookingID || state.currentAuditProcess?.Jobbookingid
      };
      
      console.log('\nProcess Information:', processInfo);
      
      // Show loading state
      showLoading();
      
      try {
        // Save the inspection
        const saveResult = await saveInspection({
          productionId: processInfo.productionId,
          processId: processInfo.processId,
          jobBookingJobCardContentsId: processInfo.jobBookingJobCardContentsId,
          jobBookingId: processInfo.jobBookingId, // Use actual JobBookingID from process data
          items: structuredAuditData
        });
        
        hideLoading();
        
        console.log('Inspection saved successfully:', saveResult);
        let successMsg = 'Audit submitted successfully!\n\nInspection has been saved to the database.';
        const voucherNo = saveResult.voucherNumber || (saveResult.result && saveResult.result[0] && (saveResult.result[0].voucherNo || saveResult.result[0].VoucherNo || saveResult.result[0].VoucherNumber || saveResult.result[0].VoucherNum || saveResult.result[0].VoucherCode || saveResult.result[0].voucherNumber));
        if (voucherNo) {
          successMsg += '\n\nVoucher No: ' + voucherNo;
        }
        alert(successMsg);
        
        // Return to running processes
        showRunningProcessesSection();
        
      } catch (error) {
        hideLoading();
        console.error('Error saving inspection:', error);
        alert('Failed to save inspection: ' + error.message + '\n\nPlease try again.');
      }
    });
  }

  // Back to processes button
  if (elements.btnBackToProcesses) {
    elements.btnBackToProcesses.addEventListener('click', () => {
      showRunningProcessesSection();
    });
  }

  // Cancel audit button
  if (elements.btnCancelAudit) {
    elements.btnCancelAudit.addEventListener('click', () => {
      if (confirm('Are you sure you want to cancel this audit? All entered data will be lost.')) {
        showRunningProcessesSection();
      }
    });
  }

  // Show running processes section
  async function showRunningProcessesSection() {
    closeDashboardModal();
    showSection(elements.runningProcessesSection, 'running-processes');
    showLoading();

    try {
      const machineStatuses = await fetchRunningProcesses();
      renderRunningProcesses(machineStatuses);
    } catch (error) {
      alert('Error loading running processes: ' + error.message);
      logout();
    } finally {
      hideLoading();
    }
  }

  // Event Listeners
  if (elements.dashboardBtn) {
    elements.dashboardBtn.addEventListener('click', () => {
      if (!state.currentUsername) {
        alert('Please log in to open the dashboard.');
        return;
      }
      openDashboardModal();
    });
  }

  if (elements.dashboardModalClose) {
    elements.dashboardModalClose.addEventListener('click', closeDashboardModal);
  }

  if (elements.dashboardModalCancel) {
    elements.dashboardModalCancel.addEventListener('click', closeDashboardModal);
  }

  if (elements.dashboardModal) {
    elements.dashboardModal.addEventListener('click', (event) => {
      if (event.target === elements.dashboardModal) {
        closeDashboardModal();
      }
    });
  }

  if (elements.dashboardModalForm) {
    elements.dashboardModalForm.addEventListener('submit', handleDashboardModalSubmit);
  }

  if (elements.dashboardFetchBtn) {
    elements.dashboardFetchBtn.addEventListener('click', (event) => {
      event.preventDefault();
      applyDashboardFilter();
    });
  }

  if (elements.dashboardTableBody) {
    elements.dashboardTableBody.addEventListener('click', async (e) => {
      const btn = e.target.closest('.entry-count-link');
      if (!btn) return;
      const rowIndex = btn.getAttribute('data-row-index');
      if (rowIndex == null) return;
      const rows = state.dashboard.filteredData || state.dashboard.data || [];
      const row = rows[parseInt(rowIndex, 10)];
      if (!row) return;
      const userId = getRowUserId(row);
      if (userId == null) {
        alert('User ID is not available for this row. The dashboard report may need to return UserID.');
        return;
      }
      const startDate = state.dashboard.startDate;
      const endDate = state.dashboard.endDate;
      if (!startDate || !endDate) {
        alert('Date range is missing. Please open the dashboard again and select a date range.');
        return;
      }
      const userName = getRowUserName(row) || 'Inspector';
      showLoading();
      try {
        const detailRows = await fetchInspectorAuditDetail(startDate, endDate, userId);
        const title = `Audit detail: ${userName} (${startDate} – ${endDate})`;
        renderDashboardAuditDetailInModal(detailRows, title);
        openDashboardAuditDetailModal();
      } catch (err) {
        alert('Failed to load audit detail: ' + (err.message || 'Unknown error'));
      } finally {
        hideLoading();
      }
    });
  }

  if (elements.btnDashboardAuditDetailClose) {
    elements.btnDashboardAuditDetailClose.addEventListener('click', closeDashboardAuditDetailModal);
  }
  if (elements.btnDashboardAuditDetailDone) {
    elements.btnDashboardAuditDetailDone.addEventListener('click', closeDashboardAuditDetailModal);
  }
  if (elements.dashboardAuditDetailModal) {
    elements.dashboardAuditDetailModal.addEventListener('click', (e) => {
      if (e.target === elements.dashboardAuditDetailModal) closeDashboardAuditDetailModal();
    });
  }

  if (elements.btnBackToProcessesFromDashboard) {
    elements.btnBackToProcessesFromDashboard.addEventListener('click', () => {
      showRunningProcessesSection();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && elements.dashboardModal && !elements.dashboardModal.classList.contains('hidden')) {
      closeDashboardModal();
    }
  });

  if (elements.loginForm) {
    elements.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = elements.usernameInput.value.trim();
      const database = elements.databaseSelect.value;
      
      if (!username || !database) {
        showError('Please enter username and select database');
        return;
      }
      
      await login(username, database);
    });
  }

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', logout);
  }

  async function handleJobCardSearch() {
    const jobNo = elements.jobCardNumberInput?.value?.trim() || '';
    if (elements.jobCardSearchError) elements.jobCardSearchError.textContent = '';
    if (!jobNo) {
      if (elements.jobCardSearchError) {
        elements.jobCardSearchError.textContent = 'Please enter a job card number.';
      }
      return;
    }
    if (!/^\d{4}$/.test(jobNo)) {
      if (elements.jobCardSearchError) {
        elements.jobCardSearchError.textContent = 'Please enter exactly 4 digits for job card number.';
      }
      return;
    }
    showLoading();
    try {
      const [processRows, userRows] = await Promise.all([
        fetchJobCardEntries(jobNo, 'process'),
        fetchJobCardEntries(jobNo, 'user'),
      ]);
      state.jobCardSearch.lastJobNo = jobNo;
      state.jobCardSearch.processRows = processRows;
      state.jobCardSearch.userRows = userRows;
      setJobCardViewMode('process');
      renderJobCardTableInModal(processRows, jobNo);
      openJobCardResultsModal();
    } catch (err) {
      if (elements.jobCardSearchError) {
        elements.jobCardSearchError.textContent = err.message || 'Search failed.';
      }
    } finally {
      hideLoading();
    }
  }

  if (elements.btnJobCardSearch) {
    elements.btnJobCardSearch.addEventListener('click', handleJobCardSearch);
  }
  if (elements.jobCardNumberInput) {
    elements.jobCardNumberInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleJobCardSearch();
      }
    });
  }

  if (elements.btnJobCardResultsClose) {
    elements.btnJobCardResultsClose.addEventListener('click', closeJobCardResultsModal);
  }
  if (elements.btnJobCardResultsDone) {
    elements.btnJobCardResultsDone.addEventListener('click', closeJobCardResultsModal);
  }
  if (elements.jobCardResultsModal) {
    elements.jobCardResultsModal.addEventListener('click', (e) => {
      if (e.target === elements.jobCardResultsModal) closeJobCardResultsModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.jobCardResultsModal && !elements.jobCardResultsModal.classList.contains('hidden')) {
      closeJobCardResultsModal();
    }
  });

  if (elements.btnJobCardViewProcess) {
    elements.btnJobCardViewProcess.addEventListener('click', () => {
      setJobCardViewMode('process');
      renderJobCardTableInModal(state.jobCardSearch.processRows || [], state.jobCardSearch.lastJobNo || '');
    });
  }

  if (elements.btnJobCardViewUser) {
    elements.btnJobCardViewUser.addEventListener('click', () => {
      setJobCardViewMode('user');
      renderUserWiseJobCardTableInModal(state.jobCardSearch.userRows || [], state.jobCardSearch.lastJobNo || '');
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.dashboardAuditDetailModal && !elements.dashboardAuditDetailModal.classList.contains('hidden')) {
      closeDashboardAuditDetailModal();
    }
  });

  // Initialize app
  hideLoading();
  
  // Try to restore session from localStorage
  const sessionRestored = restoreSession();
  
  // If no session, show login screen
  if (!sessionRestored) {
    showSection(elements.loginSection, 'login');
  }
})();

