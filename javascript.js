const API_BASE_URL = 'http://localhost:5000/api';
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const REQUEST_STATUS_VALUES = ['Active', 'In Progress', 'Fulfilled', 'Cancelled'];
const URGENCY_VALUES = ['Critical', 'High', 'Normal'];
const DONOR_INACTIVITY_DAYS = 45;

function makeRecentDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

const state = {
  donors: [],
  requests: [],
  activeScreen: 'dashboard',
  currentUserId: 'current-user',
  accountStatus: 'Active',
  donorFilters: {
    search: '',
    bloodGroup: 'all',
    availability: 'all',
    city: 'all',
    recentOnly: false
  },
  requestFilters: {
    search: '',
    bloodGroup: 'all',
    urgency: 'all',
    status: 'all',
    city: 'all'
  }
};

function normalizeDonorAvailability(value) {
  const normalized = String(value || 'Available').trim().toLowerCase();
  if (normalized === 'unavailable') return 'unavailable';
  if (normalized === 'temporarily unavailable') return 'temporarily unavailable';
  return 'available';
}

function isDonorAvailable(donor) {
  return normalizeDonorAvailability(donor?.availability) === 'available';
}

function syncCurrentUserAvailability() {
  let updated = false;

  state.donors = state.donors.map((donor) => {
    const isCurrentUserDonor = donor.createdBy && donor.createdBy === state.currentUserId;
    if (!isCurrentUserDonor) {
      return donor;
    }

    const shouldBeUnavailable = state.accountStatus === 'Unavailable';
    const currentStatus = normalizeDonorAvailability(donor.availability);

    if (shouldBeUnavailable && currentStatus !== 'unavailable') {
      updated = true;
      return { ...donor, availability: 'Unavailable', updatedAt: new Date().toISOString() };
    }

    if (!shouldBeUnavailable && currentStatus === 'unavailable') {
      updated = true;
      return { ...donor, availability: 'Available', updatedAt: new Date().toISOString() };
    }

    return donor;
  });

  if (updated) {
    writeStorage('donors', state.donors);
  }
}

const elements = {
  backendStatusDot: document.getElementById('backendStatusDot'),
  backendStatusText: document.getElementById('backendStatusText'),
  accountStatusSelect: document.getElementById('accountStatusSelect'),
  donorList: document.getElementById('donorList'),
  requestList: document.getElementById('requestList'),
  dashboardRequests: document.getElementById('dashboardRequests'),
  dashboardDonors: document.getElementById('dashboardDonors'),
  totalDonorsStat: document.getElementById('totalDonorsStat'),
  availableDonorsStat: document.getElementById('availableDonorsStat'),
  activeRequestsStat: document.getElementById('activeRequestsStat'),
  criticalRequestsStat: document.getElementById('criticalRequestsStat'),
  fulfilledRequestsStat: document.getElementById('fulfilledRequestsStat'),
  donorSearchInput: document.getElementById('donorSearchInput'),
  donorBloodFilter: document.getElementById('donorBloodFilter'),
  donorAvailabilityFilter: document.getElementById('donorAvailabilityFilter'),
  donorCityFilter: document.getElementById('donorCityFilter'),
  donorQuickFilter: document.getElementById('donorQuickFilter'),
  donorResultCount: document.getElementById('donorResultCount'),
  requestSearchInput: document.getElementById('requestSearchInput'),
  requestBloodFilter: document.getElementById('requestBloodFilter'),
  requestUrgencyFilter: document.getElementById('requestUrgencyFilter'),
  requestCityFilter: document.getElementById('requestCityFilter'),
  requestStatusFilter: document.getElementById('requestStatusFilter'),
  requestQuickFilter: document.getElementById('requestQuickFilter'),
  donorForm: document.getElementById('donorForm'),
  donorFormError: document.getElementById('donorFormError'),
  donorFormSuccess: document.getElementById('donorFormSuccess'),
  requestForm: document.getElementById('requestForm'),
  requestFormError: document.getElementById('requestFormError'),
  requestFormSuccess: document.getElementById('requestFormSuccess'),
  detailModal: document.getElementById('detailModal'),
  detailModalTitle: document.getElementById('detailModalTitle'),
  detailModalBody: document.getElementById('detailModalBody'),
  modalBackdrop: document.querySelector('.modal-backdrop'),
  toastContainer: document.getElementById('toastContainer')
};

const demoData = {
  donors: [
    { id: 'd1', name: 'Aisha Kapoor', bloodGroup: 'O+', phone: '9876543210', email: 'aisha@example.com', location: 'MG Road', city: 'Mangalore', availability: 'Available', lastDonationDate: makeRecentDate(12), donationCount: 4, age: 28, gender: 'Female', additionalInfo: 'Available on weekends and evenings.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'd2', name: 'Rohan Mehta', bloodGroup: 'A+', phone: '9123456780', email: 'rohan@example.com', location: 'Kankanady', city: 'Mangalore', availability: 'Available', lastDonationDate: makeRecentDate(18), donationCount: 3, age: 31, gender: 'Male', additionalInfo: 'Confirmed available for emergency response.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'd3', name: 'Neha Rao', bloodGroup: 'B+', phone: '9876501234', email: 'neha@example.com', location: 'Whitefield', city: 'Bengaluru', availability: 'Temporarily unavailable', lastDonationDate: makeRecentDate(40), donationCount: 2, age: 26, gender: 'Female', additionalInfo: 'Recovering from surgery, unavailable for 2 weeks.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'd4', name: 'David Correia', bloodGroup: 'AB+', phone: '9988776655', email: 'david@example.com', location: 'Koramangala', city: 'Bengaluru', availability: 'Available', lastDonationDate: makeRecentDate(9), donationCount: 5, age: 34, gender: 'Male', additionalInfo: 'Ready for matched emergency calls.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'd5', name: 'Priya Sen', bloodGroup: 'O-', phone: '9777665544', email: 'priya@example.com', location: 'Banjara Hills', city: 'Hyderabad', availability: 'Available', lastDonationDate: makeRecentDate(27), donationCount: 2, age: 29, gender: 'Female', additionalInfo: 'Available within 30 minutes of notification.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'd6', name: 'Farhan Ali', bloodGroup: 'A-', phone: '9666554433', email: 'farhan@example.com', location: 'Andheri', city: 'Mumbai', availability: 'Available', lastDonationDate: makeRecentDate(21), donationCount: 6, age: 35, gender: 'Male', additionalInfo: 'Prefers emergency calls before 7 PM.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'd7', name: 'Sonia Nair', bloodGroup: 'B-', phone: '9443322110', email: 'sonia@example.com', location: 'Kochi', city: 'Kochi', availability: 'Available', lastDonationDate: makeRecentDate(14), donationCount: 3, age: 27, gender: 'Female', additionalInfo: 'Recently confirmed availability.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'd8', name: 'Vikram Shah', bloodGroup: 'AB-', phone: '9011223344', email: 'vikram@example.com', location: 'Vashi', city: 'Mumbai', availability: 'Temporarily unavailable', lastDonationDate: makeRecentDate(60), donationCount: 1, age: 41, gender: 'Male', additionalInfo: 'Unavailable due to travel.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'd9', name: 'Lavanya Iyer', bloodGroup: 'O+', phone: '9876541122', email: 'lavanya@example.com', location: 'Indiranagar', city: 'Bengaluru', availability: 'Available', lastDonationDate: makeRecentDate(7), donationCount: 4, age: 33, gender: 'Female', additionalInfo: 'Available this week for urgent requests.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'd10', name: 'Kabir Das', bloodGroup: 'A+', phone: '9765432109', email: 'kabir@example.com', location: 'Banashankari', city: 'Bengaluru', availability: 'Available', lastDonationDate: makeRecentDate(20), donationCount: 7, age: 30, gender: 'Male', additionalInfo: 'Open for emergency donation coordination.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ],
  requests: [
    { id: 'r1', requiredBloodGroup: 'O+', requiredQuantity: 2, patientName: 'Nandana Pillai', hospitalName: 'City Care Hospital', location: 'MG Road', city: 'Mangalore', requiredDate: makeRecentDate(2), requiredTime: '18:30', emergencyDescription: 'Acute anemia following surgery.', contactPerson: 'Ritu Pillai', contactPhone: '9988476621', urgency: 'Critical', status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'r2', requiredBloodGroup: 'A+', requiredQuantity: 3, patientName: 'Amit Joshi', hospitalName: 'CarePoint Medical', location: 'Koramangala', city: 'Bengaluru', requiredDate: makeRecentDate(4), requiredTime: '21:00', emergencyDescription: 'Post-accident transfusion urgent.', contactPerson: 'Sonia Joshi', contactPhone: '9876512345', urgency: 'High', status: 'In Progress', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'r3', requiredBloodGroup: 'B-', requiredQuantity: 2, patientName: 'Rohit Mathur', hospitalName: 'Metro Life Centre', location: 'Andheri', city: 'Mumbai', requiredDate: makeRecentDate(6), requiredTime: '15:00', emergencyDescription: 'Blood requirement for oncology treatment.', contactPerson: 'Leena Mathur', contactPhone: '9765612346', urgency: 'Normal', status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'r4', requiredBloodGroup: 'O-', requiredQuantity: 4, patientName: 'Sana Qureshi', hospitalName: 'LifeSpring Hospital', location: 'Banjara Hills', city: 'Hyderabad', requiredDate: makeRecentDate(10), requiredTime: '09:15', emergencyDescription: 'Emergency trauma response and transfusion required.', contactPerson: 'Imran Qureshi', contactPhone: '9012345678', urgency: 'Critical', status: 'Fulfilled', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'r5', requiredBloodGroup: 'AB+', requiredQuantity: 1, patientName: 'Meera Shinde', hospitalName: 'Sahara General', location: 'Kochi', city: 'Kochi', requiredDate: makeRecentDate(3), requiredTime: '12:00', emergencyDescription: 'Low blood reserves for procedure.', contactPerson: 'Nikhil Shinde', contactPhone: '9667054321', urgency: 'High', status: 'Cancelled', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ]
};

init();

async function init() {
  bindEvents();
  await checkBackendConnectivity();

  const savedDonors = readStorage('donors', []);
  const savedRequests = readStorage('requests', []);
  const savedAccountStatus = readStorage('bloodbridge-account-status', 'Active');
  const savedUserId = readStorage('bloodbridge-current-user', 'current-user');

  state.currentUserId = savedUserId || 'current-user';

  const validSavedDonors = Array.isArray(savedDonors) ? savedDonors.filter((donor) => donor && donor.name && donor.bloodGroup) : [];
  const validSavedRequests = Array.isArray(savedRequests) ? savedRequests.filter((request) => request && request.patientName && request.requiredBloodGroup) : [];

  const mergedDonors = [...demoData.donors, ...validSavedDonors];
  const dedupedDonors = mergedDonors.filter((donor, index, list) => list.findIndex((item) => item.id === donor.id) === index);

  state.accountStatus = savedAccountStatus || 'Active';
  state.donors = dedupedDonors.length ? dedupedDonors : demoData.donors;
  state.requests = validSavedRequests.length ? validSavedRequests : demoData.requests;
  syncCurrentUserAvailability();

  if (elements.accountStatusSelect) {
    elements.accountStatusSelect.value = state.accountStatus;
  }

  writeStorage('donors', state.donors);
  writeStorage('requests', state.requests);

  populateCityOptions();
  renderAll();
}

function bindEvents() {
  document.querySelectorAll('.nav-item').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      showScreen(target);
      document.querySelectorAll('.nav-item').forEach((node) => node.classList.toggle('active', node === tab));
    });
  });

  document.getElementById('refreshDataBtn').addEventListener('click', async () => {
    showToast('Refreshing data...', 'info');
    await checkBackendConnectivity();
    state.donors = readStorage('donors', demoData.donors);
    state.requests = readStorage('requests', demoData.requests);
    populateCityOptions();
    renderAll();
    showToast('Data refreshed successfully!', 'success');
  });

  document.getElementById('registerDonorFromListBtn').addEventListener('click', () => showScreen('donor-form-section'));
  document.getElementById('createRequestFromListBtn').addEventListener('click', () => showScreen('request-form-section'));

  if (elements.donorQuickFilter) {
    elements.donorQuickFilter.addEventListener('change', () => {
      applyDonorQuickFilter();
    });
  }

  if (elements.requestQuickFilter) {
    elements.requestQuickFilter.addEventListener('change', () => {
      applyRequestQuickFilter();
    });
  }

  if (elements.accountStatusSelect) {
    elements.accountStatusSelect.addEventListener('change', (event) => {
      state.accountStatus = event.target.value;
      writeStorage('bloodbridge-account-status', state.accountStatus);
      syncCurrentUserAvailability();
      renderDonors();
      renderAll();
      showToast(`Account marked as ${state.accountStatus}.`, 'info');
    });
  }

  document.getElementById('applyDonorFiltersBtn').addEventListener('click', () => {
    state.donorFilters.search = elements.donorSearchInput.value.trim();
    state.donorFilters.bloodGroup = elements.donorBloodFilter.value;
    state.donorFilters.availability = elements.donorAvailabilityFilter.value;
    state.donorFilters.city = elements.donorCityFilter.value;
    state.donorFilters.recentOnly = false;
    renderDonors();
    showToast('Filters applied!', 'success');
  });

  document.getElementById('resetDonorFiltersBtn').addEventListener('click', () => {
    state.donorFilters = { search: '', bloodGroup: 'all', availability: 'all', city: 'all', recentOnly: false };
    elements.donorSearchInput.value = '';
    elements.donorBloodFilter.value = 'all';
    elements.donorAvailabilityFilter.value = 'all';
    elements.donorCityFilter.value = 'all';
    elements.donorQuickFilter.value = 'all';
    renderDonors();
    showToast('Filters cleared!', 'success');
  });

  elements.requestSearchInput.addEventListener('input', (event) => {
    state.requestFilters.search = event.target.value.trim();
    renderRequests();
  });

  elements.requestBloodFilter.addEventListener('change', (event) => {
    state.requestFilters.bloodGroup = event.target.value;
    renderRequests();
  });

  elements.requestUrgencyFilter.addEventListener('change', (event) => {
    state.requestFilters.urgency = event.target.value;
    renderRequests();
  });

  elements.requestStatusFilter.addEventListener('change', (event) => {
    state.requestFilters.status = event.target.value;
    renderRequests();
  });

  document.getElementById('applyRequestFiltersBtn').addEventListener('click', () => {
    state.requestFilters.search = elements.requestSearchInput.value.trim();
    state.requestFilters.bloodGroup = elements.requestBloodFilter.value;
    state.requestFilters.urgency = elements.requestUrgencyFilter.value;
    state.requestFilters.city = elements.requestCityFilter.value;
    state.requestFilters.status = elements.requestStatusFilter.value;
    renderRequests();
    showToast('Filters applied!', 'success');
  });

  document.getElementById('resetRequestFiltersBtn').addEventListener('click', () => {
    state.requestFilters = { search: '', bloodGroup: 'all', urgency: 'all', status: 'all', city: 'all' };
    elements.requestSearchInput.value = '';
    elements.requestBloodFilter.value = 'all';
    elements.requestUrgencyFilter.value = 'all';
    elements.requestCityFilter.value = 'all';
    elements.requestStatusFilter.value = 'all';
    elements.requestQuickFilter.value = 'all';
    renderRequests();
    showToast('Filters cleared!', 'success');
  });

  elements.donorSearchInput.addEventListener('input', (event) => {
    state.donorFilters.search = event.target.value.trim();
    renderDonors();
  });

  elements.requestSearchInput.addEventListener('input', (event) => {
    state.requestFilters.search = event.target.value.trim();
    renderRequests();
  });

  elements.donorBloodFilter.addEventListener('change', (event) => {
    state.donorFilters.bloodGroup = event.target.value;
    renderDonors();
  });

  elements.donorAvailabilityFilter.addEventListener('change', (event) => {
    state.donorFilters.availability = event.target.value;
    renderDonors();
  });

  elements.donorCityFilter.addEventListener('change', (event) => {
    state.donorFilters.city = event.target.value;
    renderDonors();
  });

  elements.requestBloodFilter.addEventListener('change', (event) => {
    state.requestFilters.bloodGroup = event.target.value;
    renderRequests();
  });

  elements.requestUrgencyFilter.addEventListener('change', (event) => {
    state.requestFilters.urgency = event.target.value;
    renderRequests();
  });

  elements.requestStatusFilter.addEventListener('change', (event) => {
    state.requestFilters.status = event.target.value;
    renderRequests();
  });

  if (elements.requestCityFilter) {
    elements.requestCityFilter.addEventListener('change', (event) => {
      state.requestFilters.city = event.target.value;
      renderRequests();
    });
  }

  elements.donorForm.addEventListener('submit', handleDonorSubmit);
  elements.requestForm.addEventListener('submit', handleRequestSubmit);

  document.getElementById('closeDetailModalBtn').addEventListener('click', closeDetailModal);
  document.getElementById('donorForm').addEventListener('reset', () => {
    document.getElementById('donorForm').removeAttribute('data-edit-id');
    elements.donorFormError.textContent = '';
  });
  document.getElementById('requestForm').addEventListener('reset', () => {
    document.getElementById('requestForm').removeAttribute('data-edit-id');
    elements.requestFormError.textContent = '';
  });
  elements.detailModal.addEventListener('click', (event) => {
    if (event.target.dataset.closeModal === 'true') {
      closeDetailModal();
    }
  });
}

function showScreen(targetId) {
  state.activeScreen = targetId;
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.toggle('active', screen.id === targetId);
  });
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(`bloodbridge-${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, data) {
  localStorage.setItem(`bloodbridge-${key}`, JSON.stringify(data));
}

async function checkBackendConnectivity() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    if (response.ok) {
      elements.backendStatusDot.classList.add('online');
      elements.backendStatusDot.classList.remove('offline');
      elements.backendStatusText.textContent = 'Backend connected';
      return true;
    }
  } catch (error) {
    elements.backendStatusDot.classList.add('offline');
    elements.backendStatusDot.classList.remove('online');
    elements.backendStatusText.textContent = 'Demo mode active';
    return false;
  }

  elements.backendStatusDot.classList.add('offline');
  elements.backendStatusDot.classList.remove('online');
  elements.backendStatusText.textContent = 'Demo mode active';
  return false;
}

function renderAll() {
  renderDashboard();
  renderDonors();
  renderRequests();
  populateCityOptions();
}

function renderDashboard() {
  const totalDonors = state.donors.length;
  const availableDonors = state.donors.filter((donor) => donor.availability === 'Available').length;
  const activeRequests = state.requests.filter((request) => request.status === 'Active').length;
  const criticalRequests = state.requests.filter((request) => request.urgency === 'Critical').length;
  const fulfilledRequests = state.requests.filter((request) => request.status === 'Fulfilled').length;

  elements.totalDonorsStat.textContent = totalDonors;
  elements.availableDonorsStat.textContent = availableDonors;
  elements.activeRequestsStat.textContent = activeRequests;
  elements.criticalRequestsStat.textContent = criticalRequests;
  elements.fulfilledRequestsStat.textContent = fulfilledRequests;

  const recentRequests = [...state.requests]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  elements.dashboardRequests.innerHTML = recentRequests.length
    ? recentRequests.map((request) => `
        <div class="request-mini-card">
          <div class="request-mini-header">
            <div>
              <h4>${request.patientName}</h4>
            </div>
            <span class="urgency-badge ${request.urgency.toLowerCase()}">${request.urgency}</span>
          </div>
          <div class="meta-line">
            <span class="blood-badge">${request.requiredBloodGroup}</span>
            <span class="status-badge ${statusClass(request.status)}">${request.status}</span>
          </div>
          <div class="meta-line">
            <span>${request.requiredQuantity} units</span>
            <span>${request.hospitalName}</span>
          </div>
          <div class="meta-line">
            <span>${request.city}</span>
            <span>${request.requiredDate} • ${request.requiredTime}</span>
          </div>
          <div class="card-actions">
            <button type="button" data-request-detail="${request.id}">View details</button>
            <button type="button" data-find-demand="${request.id}">Find Donors</button>
          </div>
        </div>
      `).join('')
    : '<div class="empty-state">No active emergency requests.</div>';

  const recentDonors = [...state.donors].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

  elements.dashboardDonors.innerHTML = recentDonors.length
    ? recentDonors.map((donor) => `
        <div class="donor-mini-card">
          <div class="donor-mini-header">
            <h4>${donor.name}</h4>
            <span class="status-badge ${donor.availability === 'Available' ? 'available' : 'unavailable'}">${donor.availability}</span>
          </div>
          <div class="meta-line">
            <span class="blood-badge">${donor.bloodGroup}</span>
            <span>${donor.city}</span>
          </div>
          <div class="meta-line">
            <span>Match status</span>
            <span>${getBestMatchForDonor(donor)?.matchLabel || 'Awaiting review'}</span>
          </div>
        </div>
      `).join('')
    : '<div class="empty-state">No donors available yet.</div>';

  bindDashboardActions();
}

function bindDashboardActions() {
  document.querySelectorAll('[data-request-detail]').forEach((button) => {
    button.addEventListener('click', () => openRequestDetails(button.dataset.requestDetail));
  });

  document.querySelectorAll('[data-find-demand]').forEach((button) => {
    button.addEventListener('click', () => {
      const request = state.requests.find((item) => item.id === button.dataset.findDemand);
      if (request) {
        showScreen('requests-section');
        const matches = getSmartDonorMatches(request);
        openRequestDetails(request.id, matches);
      }
    });
  });
}

function populateCityOptions() {
  const cities = [...new Set([...state.donors.map((donor) => donor.city), ...state.requests.map((request) => request.city)])].filter(Boolean).sort();

  const cityOptions = ['<option value="all">All cities</option>']
    .concat(cities.map((city) => `<option value="${city}">${city}</option>`))
    .join('');

  elements.donorCityFilter.innerHTML = cityOptions;
  elements.donorCityFilter.value = state.donorFilters.city;

  if (elements.requestCityFilter) {
    elements.requestCityFilter.innerHTML = cityOptions;
    elements.requestCityFilter.value = state.requestFilters.city;
  }
}

function applyDonorQuickFilter() {
  const preset = elements.donorQuickFilter.value;
  const preferredCity = state.donors.find((donor) => donor.city)?.city || 'all';

  state.donorFilters = {
    ...state.donorFilters,
    bloodGroup: 'all',
    availability: 'all',
    city: 'all',
    recentOnly: false
  };

  if (preset === 'available') {
    state.donorFilters.availability = 'available';
  } else if (preset === 'recent') {
    state.donorFilters.availability = 'available';
    state.donorFilters.recentOnly = true;
  } else if (preset === 'city') {
    state.donorFilters.city = preferredCity;
    state.donorFilters.availability = 'available';
  }

  elements.donorBloodFilter.value = state.donorFilters.bloodGroup;
  elements.donorAvailabilityFilter.value = state.donorFilters.availability;
  elements.donorCityFilter.value = state.donorFilters.city;
  renderDonors();
}

function applyRequestQuickFilter() {
  const preset = elements.requestQuickFilter.value;
  const preferredCity = state.requests.find((request) => request.city)?.city || 'all';

  state.requestFilters = {
    ...state.requestFilters,
    bloodGroup: 'all',
    urgency: 'all',
    status: 'all',
    city: 'all'
  };

  if (preset === 'critical') {
    state.requestFilters.urgency = 'Critical';
  } else if (preset === 'active') {
    state.requestFilters.status = 'Active';
  } else if (preset === 'city') {
    state.requestFilters.city = preferredCity;
  }

  elements.requestBloodFilter.value = state.requestFilters.bloodGroup;
  elements.requestUrgencyFilter.value = state.requestFilters.urgency;
  elements.requestCityFilter.value = state.requestFilters.city;
  elements.requestStatusFilter.value = state.requestFilters.status;
  renderRequests();
}

function getFilteredDonors() {
  const search = state.donorFilters.search.toLowerCase();
  const bloodGroup = state.donorFilters.bloodGroup;
  const availability = state.donorFilters.availability;
  const city = state.donorFilters.city;
  const recentOnly = state.donorFilters.recentOnly;

  return state.donors.filter((donor) => {
    const donorStatus = normalizeDonorAvailability(donor.availability);

    if (donorStatus !== 'available') {
      return false;
    }

    const formattedDate = donor.lastDonationDate || new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const daysSinceDonation = daysSince(formattedDate);
    const isActive = Number.isFinite(daysSinceDonation) ? daysSinceDonation <= DONOR_INACTIVITY_DAYS : true;

    if (!isActive && donor.availability !== 'Available') {
      return false;
    }

    const queryMatch = !search || [donor.name, donor.city, donor.location, donor.bloodGroup, donor.phone].join(' ').toLowerCase().includes(search);
    const bloodMatch = bloodGroup === 'all' || donor.bloodGroup === bloodGroup;
    const normalizedAvailability = availability.toLowerCase();
    const availabilityMatch = availability === 'all' || normalizedAvailability === 'available' || (normalizedAvailability === 'temporarily unavailable' && donorStatus === 'temporarily unavailable') || (normalizedAvailability === 'unavailable' && donorStatus === 'unavailable');
    const cityMatch = city === 'all' || donor.city === city;
    const recentMatch = !recentOnly || daysSinceDonation <= 45;
    return queryMatch && bloodMatch && availabilityMatch && cityMatch && recentMatch;
  });
}

function renderDonors() {
  const donors = getFilteredDonors();
  elements.donorResultCount.textContent = `${donors.length} donor${donors.length === 1 ? '' : 's'} found`;

  if (!donors.length) {
    elements.donorList.innerHTML = '<div class="empty-state">No donors found. <button class="btn btn-primary" type="button" data-show-register>Register a Donor</button></div>';
    const button = elements.donorList.querySelector('[data-show-register]');
    if (button) {
      button.addEventListener('click', () => showScreen('donor-form-section'));
    }
    return;
  }

  elements.donorList.innerHTML = donors
    .map((donor) => {
      const match = getBestMatchForDonor(donor);
      const canDelete = donor.createdBy === state.currentUserId || !donor.createdBy;
      return `
        <article class="donor-card">
          <div class="donor-card-header">
            <span class="blood-badge">${donor.bloodGroup}</span>
            <span class="status-badge ${donor.availability === 'Available' ? 'available' : 'unavailable'}">${donor.availability}</span>
          </div>
          <h3>${donor.name}</h3>
          <p>${donor.location}, ${donor.city}</p>
          <p>Phone: ${donor.phone}</p>
          <p>Donated ${donor.donationCount || 1} times • Last: ${formatDate(donor.lastDonationDate)}</p>
          <p class="motivation-note">Thank you for helping save lives. Your next donation can make a real difference.</p>
          <div class="match-detail-box">
            <h4>Match status</h4>
            <div class="score-pill">${match ? `${match.score}% MATCH` : 'Not ranked yet'}</div>
          </div>
          <div class="card-actions">
            <button type="button" data-donor-view="${donor.id}">View</button>
            <button type="button" class="danger" data-donor-delete="${donor.id}" ${canDelete ? '' : 'disabled'}>${canDelete ? 'Delete' : 'Delete disabled'}</button>
          </div>
        </article>
      `;
    })
    .join('');

  bindDonorCardButtons();
}

function bindDonorCardButtons() {
  document.querySelectorAll('[data-donor-view]').forEach((button) => {
    button.addEventListener('click', () => viewDonorDetails(button.dataset.donorView));
  });

  document.querySelectorAll('[data-donor-delete]').forEach((button) => {
    if (!button.disabled) {
      button.addEventListener('click', () => deleteDonor(button.dataset.donorDelete));
    }
  });
}

function getFilteredRequests() {
  const search = state.requestFilters.search.toLowerCase();
  const bloodGroup = state.requestFilters.bloodGroup;
  const urgency = state.requestFilters.urgency;
  const status = state.requestFilters.status;
  const city = state.requestFilters.city;

  return state.requests.filter((request) => {
    const queryMatch = !search || [request.patientName, request.hospitalName, request.city, request.location, request.requiredBloodGroup, request.contactPerson].join(' ').toLowerCase().includes(search);
    const bloodMatch = bloodGroup === 'all' || request.requiredBloodGroup === bloodGroup;
    const urgencyMatch = urgency === 'all' || request.urgency === urgency;
    const statusMatch = status === 'all' || request.status === status;
    const cityMatch = city === 'all' || request.city === city;
    return queryMatch && bloodMatch && urgencyMatch && statusMatch && cityMatch;
  });
}

function renderRequests() {
  const requests = getFilteredRequests();

  if (!requests.length) {
    elements.requestList.innerHTML = '<div class="empty-state">No active emergency requests. <button class="btn btn-primary" type="button" data-show-request-form>Create Emergency Request</button></div>';
    const button = elements.requestList.querySelector('[data-show-request-form]');
    if (button) {
      button.addEventListener('click', () => showScreen('request-form-section'));
    }
    return;
  }

  elements.requestList.innerHTML = requests
    .sort((a, b) => {
      const urgencyOrder = { Critical: 3, High: 2, Normal: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    })
    .map((request) => {
      const canDelete = request.createdBy === state.currentUserId || !request.createdBy;
      const canUpdateStatus = request.createdBy === state.currentUserId || !request.createdBy;
      return `
        <article class="request-card">
          <div class="request-card-header">
            <span class="blood-badge">${request.requiredBloodGroup}</span>
            <span class="urgency-badge ${request.urgency.toLowerCase()}">${request.urgency}</span>
          </div>

          <h3>${request.patientName}</h3>
          <p>${request.hospitalName} • ${request.location}, ${request.city}</p>
          <p>${request.requiredDate} at ${request.requiredTime}</p>
          <div class="meta-row">
            <span class="status-badge ${statusClass(request.status)}">${request.status}</span>
            <span>${request.requiredQuantity} units remaining</span>
          </div>
          <div class="card-actions">
            <button type="button" data-request-view="${request.id}">View details</button>
            <button type="button" data-request-match="${request.id}">Find Best Donors</button>
            <button type="button" data-request-status="${request.id}" ${canUpdateStatus ? '' : 'disabled'}>${canUpdateStatus ? 'Update status' : 'Update disabled'}</button>
            <button type="button" class="danger" data-request-delete="${request.id}" ${canDelete ? '' : 'disabled'}>${canDelete ? 'Delete' : 'Delete disabled'}</button>
          </div>
        </article>
      `;
    })
    .join('');

  bindRequestCardButtons();
}

function bindRequestCardButtons() {
  document.querySelectorAll('[data-request-view]').forEach((button) => {
    button.addEventListener('click', () => openRequestDetails(button.dataset.requestView));
  });

  document.querySelectorAll('[data-request-match]').forEach((button) => {
    button.addEventListener('click', () => {
      const request = state.requests.find((item) => item.id === button.dataset.requestMatch);
      if (request) findBestDonors(request);
    });
  });

  document.querySelectorAll('[data-request-status]').forEach((button) => {
    if (!button.disabled) {
      button.addEventListener('click', () => updateRequestStatusFlow(button.dataset.requestStatus));
    }
  });

  document.querySelectorAll('[data-request-delete]').forEach((button) => {
    if (!button.disabled) {
      button.addEventListener('click', () => deleteRequest(button.dataset.requestDelete));
    }
  });
}

function handleDonorSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.donorForm);
  const payload = Object.fromEntries(formData.entries());
  const validationResult = validateDonorPayload(payload, formData);

  if (!validationResult.valid) {
    elements.donorFormError.textContent = validationResult.message;
    elements.donorFormSuccess.style.display = 'none';
    return;
  }

  const donorId = elements.donorForm.dataset.editId;

  if (donorId) {
    const donor = state.donors.find((item) => item.id === donorId);
    if (!donor) {
      showToast('Donor not found for update.', 'error');
      return;
    }

    Object.assign(donor, {
      name: payload.name.trim(),
      bloodGroup: payload.bloodGroup,
      phone: payload.phone.trim(),
      email: payload.email.trim(),
      location: payload.location.trim(),
      city: payload.city.trim(),
      availability: payload.availability,
      lastDonationDate: payload.lastDonationDate,
      donationCount: Number(payload.donationCount || donor.donationCount || 1),
      age: Number(payload.age),
      gender: payload.gender || 'Prefer not to say',
      additionalInfo: payload.additionalInfo?.trim() || '',
      proof: payload.proof || donor.proof,
      updatedAt: new Date().toISOString()
    });

    writeStorage('donors', state.donors);
    elements.donorForm.reset();
    elements.donorForm.removeAttribute('data-edit-id');
    elements.donorFormError.textContent = '';
    
    // Show success message
    elements.donorFormSuccess.textContent = '✓ Donor updated successfully!';
    elements.donorFormSuccess.style.display = 'block';
    showToast('Donor updated successfully.', 'success');
    showPopupMessage(`Donor ${donor.name} has been updated successfully!`, 'success');
    
    setTimeout(() => {
      renderAll();
      showScreen('donors-section');
    }, 1500);
    return;
  }

  const donorRecord = {
    id: crypto.randomUUID(),
    name: payload.name.trim(),
    bloodGroup: payload.bloodGroup,
    phone: payload.phone.trim(),
    email: payload.email.trim(),
    location: payload.location.trim(),
    city: payload.city.trim(),
    availability: payload.availability,
    lastDonationDate: payload.lastDonationDate,
    donationCount: Number(payload.donationCount || 1),
    age: Number(payload.age),
    gender: payload.gender || 'Prefer not to say',
    additionalInfo: payload.additionalInfo?.trim() || '',
    createdBy: state.currentUserId,
    proof: payload.proof,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.donors.push(donorRecord);
  writeStorage('donors', state.donors);
  elements.donorForm.reset();
  elements.donorFormError.textContent = '';
  
  // Show success message
  elements.donorFormSuccess.textContent = '✓ Donor registered successfully! Proof verified.';
  elements.donorFormSuccess.style.display = 'block';
  showToast('Donor registered successfully.', 'success');
  showPopupMessage(`Welcome! ${donorRecord.name} has been registered as a blood donor.\n\nProof of identity has been verified.\n\nYou will receive notifications when your blood is needed.`, 'success');
  
  setTimeout(() => {
    renderAll();
    showScreen('donors-section');
  }, 1500);
}

function handleRequestSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.requestForm);
  const payload = Object.fromEntries(formData.entries());
  const validationResult = validateRequestPayload(payload, formData);

  if (!validationResult.valid) {
    elements.requestFormError.textContent = validationResult.message;
    elements.requestFormSuccess.style.display = 'none';
    return;
  }

  const requestId = elements.requestForm.dataset.editId;
  const fulfilledUnits = Number(payload.fulfilledUnits || 0);
  const requestedUnits = Number(payload.requiredQuantity);
  const remainingQuantity = Math.max(0, requestedUnits - fulfilledUnits);

  if (requestId) {
    const request = state.requests.find((item) => item.id === requestId);
    if (!request) {
      showToast('Request not found for update.', 'error');
      return;
    }

    Object.assign(request, {
      requiredBloodGroup: payload.requiredBloodGroup,
      requiredQuantity: remainingQuantity,
      patientName: payload.patientName.trim(),
      hospitalName: payload.hospitalName.trim(),
      location: payload.location.trim(),
      city: payload.city.trim(),
      requiredDate: payload.requiredDate,
      requiredTime: payload.requiredTime,
      emergencyDescription: payload.emergencyDescription.trim(),
      contactPerson: payload.contactPerson.trim(),
      contactPhone: payload.contactPhone.trim(),
      urgency: payload.urgency,
      requesterType: payload.requesterType,
      fulfilledUnits: fulfilledUnits,
      requestProof: payload.requestProof || request.requestProof,
      updatedAt: new Date().toISOString()
    });

    writeStorage('requests', state.requests);
    elements.requestForm.reset();
    elements.requestForm.removeAttribute('data-edit-id');
    elements.requestFormError.textContent = '';
    
    // Show success message
    elements.requestFormSuccess.textContent = '✓ Request updated successfully!';
    elements.requestFormSuccess.style.display = 'block';
    showToast('Emergency request updated.', 'success');
    showPopupMessage(`Emergency request for ${request.patientName} has been updated successfully!`, 'success');
    
    setTimeout(() => {
      renderAll();
      showScreen('requests-section');
    }, 1500);
    return;
  }

  const requestRecord = {
    id: crypto.randomUUID(),
    requiredBloodGroup: payload.requiredBloodGroup,
    requiredQuantity: remainingQuantity,
    patientName: payload.patientName.trim(),
    hospitalName: payload.hospitalName.trim(),
    location: payload.location.trim(),
    city: payload.city.trim(),
    requiredDate: payload.requiredDate,
    requiredTime: payload.requiredTime,
    emergencyDescription: payload.emergencyDescription.trim(),
    contactPerson: payload.contactPerson.trim(),
    contactPhone: payload.contactPhone.trim(),
    urgency: payload.urgency,
    requesterType: payload.requesterType,
    fulfilledUnits: fulfilledUnits,
    requestProof: payload.requestProof,
    createdBy: state.currentUserId,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.requests.push(requestRecord);
  writeStorage('requests', state.requests);
  elements.requestForm.reset();
  elements.requestFormError.textContent = '';
  
  // Show success message
  elements.requestFormSuccess.textContent = `✓ Emergency request created for ${requestRecord.patientName}! Proof verified.`;
  elements.requestFormSuccess.style.display = 'block';
  showToast('Emergency request created.', 'success');
  showPopupMessage(`Emergency request has been created successfully!\n\nPatient: ${requestRecord.patientName}\nBlood Group Needed: ${requestRecord.requiredBloodGroup}\nUrgency: ${requestRecord.urgency}\n\nSearching for available donors...`, 'info');
  
  setTimeout(() => {
    renderAll();
    // Auto-show donor matches
    const matches = getSmartDonorMatches(requestRecord);
    if (matches.length > 0) {
      showPopupMessage(`✓ Found ${matches.length} compatible donors!\n\n${matches.map(m => `${m.name} (${m.score}% match)`).join('\n')}`, 'success');
    } else {
      showPopupMessage('No compatible donors currently available. Request has been registered for future matching.', 'warning');
    }
    showScreen('requests-section');
  }, 1500);
}

function validateDonorPayload(payload, formData) {
  if (!payload.name || !payload.bloodGroup || !payload.phone || !payload.email || !payload.location || !payload.city || !payload.availability || !payload.lastDonationDate || !payload.age || !payload.donationCount) {
    return { valid: false, message: 'Please fill in all required donor fields.' };
  }

  // Check if proof file is provided
  const proofFile = formData.get('proof');
  if (!proofFile || proofFile.size === 0) {
    return { valid: false, message: 'Proof of identity (ID/Aadhar) is required for all donors.' };
  }

  const validFileTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (!validFileTypes.includes(proofFile.type)) {
    return { valid: false, message: 'Proof must be a PDF or image file (JPEG/PNG).' };
  }

  if (proofFile.size > 5 * 1024 * 1024) {
    return { valid: false, message: 'Proof file must be less than 5MB.' };
  }

  if (!BLOOD_GROUPS.includes(payload.bloodGroup)) {
    return { valid: false, message: 'Please choose a valid blood group.' };
  }

  if (!/^[0-9+\-\s]{8,15}$/.test(payload.phone.trim())) {
    return { valid: false, message: 'Please enter a valid phone number.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }

  const age = Number(payload.age);
  if (!Number.isInteger(age) || age < 18 || age > 65) {
    return { valid: false, message: 'Age must be a whole number between 18 and 65.' };
  }

  const donationCount = Number(payload.donationCount);
  if (!Number.isInteger(donationCount) || donationCount < 1 || donationCount > 50) {
    return { valid: false, message: 'Times donated must be between 1 and 50.' };
  }

  const donationDate = new Date(payload.lastDonationDate);
  const today = new Date();
  if (Number.isNaN(donationDate.getTime())) {
    return { valid: false, message: 'Please provide a valid last donation date.' };
  }

  const diffInDays = (today - donationDate) / (1000 * 60 * 60 * 24);
  if (diffInDays < 0) {
    return { valid: false, message: 'Last donation date cannot be in the future.' };
  }

  if (payload.availability !== 'Available' && payload.availability !== 'Temporarily unavailable') {
    return { valid: false, message: 'Availability must be selected from the provided options.' };
  }

  const editId = document.getElementById('donorForm').dataset.editId;
  const duplicate = state.donors.some((donor) => donor.id !== editId && donor.email.toLowerCase() === payload.email.trim().toLowerCase());
  if (duplicate) {
    return { valid: false, message: 'A donor with this email already exists.' };
  }

  return { valid: true };
}

function validateRequestPayload(payload, formData) {
  if (!payload.requiredBloodGroup || !payload.requiredQuantity || !payload.patientName || !payload.hospitalName || !payload.location || !payload.city || !payload.requiredDate || !payload.requiredTime || !payload.emergencyDescription || !payload.contactPerson || !payload.contactPhone || !payload.urgency || !payload.requesterType) {
    return { valid: false, message: 'Please fill in all required emergency request fields.' };
  }

  const fulfilledUnits = Number(payload.fulfilledUnits || 0);
  if (!Number.isInteger(fulfilledUnits) || fulfilledUnits < 0 || fulfilledUnits > 20) {
    return { valid: false, message: 'Units already fulfilled must be between 0 and 20.' };
  }

  const proofFile = formData.get('requestProof');
  if (!proofFile || proofFile.size === 0) {
    return { valid: false, message: 'Proof of medical requirement is mandatory for all requesters.' };
  }

  const validFileTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (!validFileTypes.includes(proofFile.type)) {
    return { valid: false, message: 'Proof must be a PDF or image file (JPEG/PNG).' };
  }

  if (proofFile.size > 5 * 1024 * 1024) {
    return { valid: false, message: 'Proof file must be less than 5MB.' };
  }

  if (!BLOOD_GROUPS.includes(payload.requiredBloodGroup)) {
    return { valid: false, message: 'Please select a valid blood group.' };
  }

  const quantity = Number(payload.requiredQuantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return { valid: false, message: 'Required quantity must be between 1 and 20 units.' };
  }

  const remaining = quantity - fulfilledUnits;
  if (remaining < 0) {
    return { valid: false, message: 'Fulfilled units cannot be more than the required quantity.' };
  }

  if (!/^[0-9+\-\s]{8,15}$/.test(payload.contactPhone.trim())) {
    return { valid: false, message: 'Please enter a valid contact phone number.' };
  }

  if (!URGENCY_VALUES.includes(payload.urgency)) {
    return { valid: false, message: 'Please select a valid urgency level.' };
  }

  const date = new Date(payload.requiredDate);
  if (Number.isNaN(date.getTime())) {
    return { valid: false, message: 'Please provide a valid required date.' };
  }

  return { valid: true };
}

function viewDonorDetails(id) {
  const donor = state.donors.find((item) => item.id === id);
  if (!donor) {
    showToast('Donor not found.', 'error');
    return;
  }

  const match = getBestMatchForDonor(donor);
  elements.detailModalTitle.textContent = donor.name;
  elements.detailModalBody.innerHTML = `
    <div class="detail-section">
      <div class="detail-grid">
        <div class="detail-item"><span>Blood Group</span><strong>${donor.bloodGroup}</strong></div>
        <div class="detail-item"><span>Availability</span><strong>${donor.availability}</strong></div>
        <div class="detail-item"><span>Location</span><strong>${donor.location}, ${donor.city}</strong></div>
        <div class="detail-item"><span>Age</span><strong>${donor.age}</strong></div>
        <div class="detail-item"><span>Phone</span><strong>${donor.phone}</strong></div>
        <div class="detail-item"><span>Email</span><strong>${donor.email}</strong></div>
        <div class="detail-item"><span>Last Donation</span><strong>${formatDate(donor.lastDonationDate)}</strong></div>
        <div class="detail-item"><span>Gender</span><strong>${donor.gender}</strong></div>
      </div>
    </div>

    <div class="detail-section">
      <h4>Additional information</h4>
      <p>${donor.additionalInfo || 'No additional information provided.'}</p>
    </div>

    <div class="detail-section">
      <h4>Donation history</h4>
      <div class="detail-grid">
        <div class="detail-item"><span>Times donated</span><strong>${donor.donationCount || 1}</strong></div>
        <div class="detail-item"><span>Last donation</span><strong>${formatDate(donor.lastDonationDate)}</strong></div>
      </div>
      <p class="match-legend">Thank you for donating. Your kindness can save multiple lives. A new donation can be scheduled after the recommended recovery period.</p>
    </div>

    <div class="detail-section">
      <button type="button" data-modal-delete="${donor.id}" ${donor.createdBy === state.currentUserId || !donor.createdBy ? '' : 'disabled'}>${donor.createdBy === state.currentUserId || !donor.createdBy ? 'Delete donor' : 'Delete disabled'}</button>
      <button type="button" data-contact-donor="${donor.id}">Contact donor</button>
    </div>
  `;

  bindDetailActions();
  elements.detailModal.classList.remove('hidden');
  elements.detailModal.setAttribute('aria-hidden', 'false');
}

function bindDetailActions() {
  const deleteBtn = document.querySelector('[data-modal-delete]');
  const contactBtn = document.querySelector('[data-contact-donor]');

  if (deleteBtn && !deleteBtn.disabled) {
    deleteBtn.addEventListener('click', () => deleteDonor(deleteBtn.dataset.modalDelete));
  }

  if (contactBtn) {
    contactBtn.addEventListener('click', () => {
      const donor = state.donors.find((item) => item.id === contactBtn.dataset.contactDonor);
      if (donor) {
        showToast(`Contacting ${donor.name} at ${donor.phone}.`, 'info');
      }
    });
  }
}

function closeDetailModal() {
  elements.detailModal.classList.add('hidden');
  elements.detailModal.setAttribute('aria-hidden', 'true');
}

function editDonor(id) {
  const donor = state.donors.find((item) => item.id === id);
  if (!donor) {
    showToast('Donor not found.', 'error');
    return;
  }

  const form = elements.donorForm;
  form.name.value = donor.name;
  form.bloodGroup.value = donor.bloodGroup;
  form.phone.value = donor.phone;
  form.email.value = donor.email;
  form.location.value = donor.location;
  form.city.value = donor.city;
  form.availability.value = donor.availability;
  form.lastDonationDate.value = donor.lastDonationDate;
  form.donationCount.value = donor.donationCount || 1;
  form.age.value = donor.age;
  form.gender.value = donor.gender || '';
  form.additionalInfo.value = donor.additionalInfo || '';
  form.dataset.editId = donor.id;
  showScreen('donor-form-section');
  showToast('Donor details loaded for editing.', 'info');
}

function editRequest(id) {
  const request = state.requests.find((item) => item.id === id);
  if (!request) {
    showToast('Request not found.', 'error');
    return;
  }

  const form = elements.requestForm;
  form.requiredBloodGroup.value = request.requiredBloodGroup;
  form.requiredQuantity.value = request.requiredQuantity;
  form.patientName.value = request.patientName;
  form.hospitalName.value = request.hospitalName;
  form.location.value = request.location;
  form.city.value = request.city;
  form.requiredDate.value = request.requiredDate;
  form.requiredTime.value = request.requiredTime;
  form.emergencyDescription.value = request.emergencyDescription;
  form.contactPerson.value = request.contactPerson;
  form.contactPhone.value = request.contactPhone;
  form.urgency.value = request.urgency;
  form.dataset.editId = request.id;
  showScreen('request-form-section');
  showToast('Request details loaded for editing.', 'info');
}

function deleteDonor(id) {
  const donor = state.donors.find((item) => item.id === id);
  if (!donor) {
    showToast('Donor not found.', 'error');
    return;
  }

  if (donor.createdBy && donor.createdBy !== state.currentUserId) {
    showToast('Only the donor can remove their own name from the list.', 'error');
    return;
  }

  const confirmed = window.confirm(`Delete donor ${donor.name}?`);
  if (!confirmed) return;

  state.donors = state.donors.filter((item) => item.id !== id);
  writeStorage('donors', state.donors);
  closeDetailModal();
  renderAll();
  showToast('Donor deleted.', 'success');
}

function deleteRequest(id) {
  const request = state.requests.find((item) => item.id === id);
  if (!request) {
    showToast('Request not found.', 'error');
    return;
  }

  if (request.createdBy && request.createdBy !== state.currentUserId) {
    showToast('Only the patient who sent this request can remove it after the need is fulfilled.', 'error');
    return;
  }

  const confirmed = window.confirm(`Delete emergency request for ${request.patientName}?`);
  if (!confirmed) return;

  state.requests = state.requests.filter((item) => item.id !== id);
  writeStorage('requests', state.requests);
  closeDetailModal();
  renderAll();
  showToast('Request deleted.', 'success');
}

function openRequestDetails(id, matches = null) {
  const request = state.requests.find((item) => item.id === id);
  if (!request) {
    showToast('Request not found.', 'error');
    return;
  }

  const bestMatches = matches || getSmartDonorMatches(request);
  const matchRows = bestMatches.length
    ? bestMatches.map((match) => `
        <li class="match-row">
          <div>
            <strong>${match.name}</strong><br>
            <small>${match.bloodGroup} • ${match.city} • ${match.phone}</small>
          </div>
          <span class="match-score">${match.score}%</span>
        </li>
      `).join('')
    : '<li>No compatible donors available.</li>';

  elements.detailModalTitle.textContent = `Request #${request.id.slice(0, 6).toUpperCase()}`;
  elements.detailModalBody.innerHTML = `
    <div class="detail-section">
      <div class="detail-grid">
        <div class="detail-item"><span>Patient</span><strong>${request.patientName}</strong></div>
        <div class="detail-item"><span>Blood Group</span><strong>${request.requiredBloodGroup}</strong></div>
        <div class="detail-item"><span>Quantity remaining</span><strong>${request.requiredQuantity} units</strong></div>
        <div class="detail-item"><span>Urgency</span><strong>${request.urgency}</strong></div>
        <div class="detail-item"><span>Hospital</span><strong>${request.hospitalName}</strong></div>
        <div class="detail-item"><span>Location</span><strong>${request.location}, ${request.city}</strong></div>
        <div class="detail-item"><span>Required Date</span><strong>${request.requiredDate}</strong></div>
        <div class="detail-item"><span>Required Time</span><strong>${request.requiredTime}</strong></div>
        <div class="detail-item"><span>Contact Person</span><strong>${request.contactPerson}</strong></div>
        <div class="detail-item"><span>Contact Phone</span><strong>${request.contactPhone}</strong></div>
        <div class="detail-item"><span>Status</span><strong>${request.status}</strong></div>
        <div class="detail-item"><span>Created</span><strong>${formatDateTime(request.createdAt)}</strong></div>
      </div>
    </div>

    <div class="detail-section">
      <h4>Emergency description</h4>
      <p>${request.emergencyDescription}</p>
    </div>

    <div class="detail-section">
      <h4>Smart Donor Match</h4>
      <ul class="match-list">${matchRows}</ul>
      <p class="match-legend">Application-level scoring: exact blood group match, availability, city match, and recent donation recency.</p>
    </div>

    <div class="card-actions">
      <button type="button" data-request-delete-detail="${request.id}" ${request.createdBy === state.currentUserId || !request.createdBy ? '' : 'disabled'}>${request.createdBy === state.currentUserId || !request.createdBy ? 'Delete request' : 'Delete disabled'}</button>
      <button type="button" data-request-status-detail="${request.id}" ${request.createdBy === state.currentUserId || !request.createdBy ? '' : 'disabled'}>${request.createdBy === state.currentUserId || !request.createdBy ? 'Update status' : 'Update disabled'}</button>
    </div>
  `;

  document.querySelector('[data-request-delete-detail]')?.addEventListener('click', () => deleteRequest(request.id));
  const statusDetailBtn = document.querySelector('[data-request-status-detail]');
  if (statusDetailBtn && !statusDetailBtn.disabled) {
    statusDetailBtn.addEventListener('click', () => updateRequestStatusFlow(request.id));
  }

  elements.detailModal.classList.remove('hidden');
  elements.detailModal.setAttribute('aria-hidden', 'false');
}

function findBestDonors(request) {
  const matches = getSmartDonorMatches(request);
  const donorSummary = matches.length
    ? matches.map((match) => `${match.name} (${match.score}%)`).join(', ')
    : 'No suitable donors';

  showToast(`Matching donors found: ${donorSummary}`, 'info');
  openRequestDetails(request.id, matches);
}

function getCompatibleBloodGroups(bloodGroup) {
  const compatibilityMap = {
    'O-': ['O-'],
    'O+': ['O+', 'O-'],
    'A-': ['A-', 'O-'],
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
  };

  return compatibilityMap[bloodGroup] || [bloodGroup];
}

function getSmartDonorMatches(request) {
  const allowedBloodGroups = getCompatibleBloodGroups(request.requiredBloodGroup);

  const candidateDonors = state.donors.filter((donor) => {
    const bloodMatch = allowedBloodGroups.includes(donor.bloodGroup);
    const available = donor.availability === 'Available';
    const donationDate = donor.lastDonationDate || new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const notInactive = daysSince(donationDate) <= DONOR_INACTIVITY_DAYS;
    return bloodMatch && available && notInactive;
  });

  const scored = candidateDonors.map((donor) => {
    let score = 0;
    const reasons = [];

    if (donor.bloodGroup === request.requiredBloodGroup) {
      score += 50;
      reasons.push('✓ Blood group match');
    } else {
      score += 30;
      reasons.push('✓ Compatible donor type');
    }

    if (donor.availability === 'Available') {
      score += 20;
      reasons.push('✓ Available now');
    }

    if (donor.city === request.city) {
      score += 20;
      reasons.push('✓ Same city');
    }

    if (donor.lastDonationDate && daysSince(donor.lastDonationDate) <= 120) {
      score += 10;
      reasons.push('✓ Recent availability confirmation');
    }

    return {
      ...donor,
      score: Math.min(score, 100),
      reasons
    };
  });

  const topMatches = scored.sort((a, b) => b.score - a.score).slice(0, 5);

  if (topMatches.length > 0) {
    const matchSummary = topMatches.map((match) => `${match.name} (${match.bloodGroup}) - ${match.score}% match`).join('\n');
    showPopupMessage(`✓ BLOOD MATCH FOUND!\n\nWe found ${topMatches.length} compatible donor(s) for:\nBlood Group: ${request.requiredBloodGroup}\nUrgency: ${request.urgency}\n\n${matchSummary}`, 'success');
  }

  return topMatches;
}

function getBestMatchForDonor(donor) {
  const topRequest = [...state.requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  if (!topRequest) return null;
  const candidate = getSmartDonorMatches(topRequest).find((match) => match.id === donor.id);
  return candidate ? { score: candidate.score, reasons: candidate.reasons, matchLabel: `${candidate.score}% match` } : null;
}

function updateRequestStatusFlow(id) {
  const request = state.requests.find((item) => item.id === id);
  if (!request) {
    showToast('Request not found.', 'error');
    return;
  }

  if (request.createdBy && request.createdBy !== state.currentUserId) {
    showToast('Only the patient who created this request can update its status.', 'error');
    return;
  }

  const nextStatus = window.prompt(`Update status for ${request.patientName}. Choose one: Active, In Progress, Fulfilled, Cancelled`, request.status);
  if (!nextStatus) return;

  const trimmedStatus = nextStatus.trim();
  if (!REQUEST_STATUS_VALUES.includes(trimmedStatus)) {
    showToast('Invalid status value. Please choose a valid request status.', 'error');
    return;
  }

  if (trimmedStatus === 'Fulfilled') {
    state.requests = state.requests.filter((item) => item.id !== id);
    writeStorage('requests', state.requests);
    closeDetailModal();
    renderAll();
    showToast('Request fulfilled and removed from active list.', 'success');
    return;
  }

  request.status = trimmedStatus;
  request.updatedAt = new Date().toISOString();
  writeStorage('requests', state.requests);
  renderAll();
  showToast('Request status updated.', 'success');
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

function showPopupMessage(message, type = 'info') {
  // Create a custom popup/modal for important messages
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 10000;
    max-width: 500px;
    min-width: 300px;
    text-align: center;
    font-family: Inter, sans-serif;
    border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
  `;
  
  const title = document.createElement('h3');
  title.textContent = type === 'success' ? '✓ Success' : type === 'error' ? '✗ Error' : type === 'warning' ? '⚠ Warning' : 'ℹ Information';
  title.style.cssText = `margin: 0 0 15px 0; color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};`;
  
  const msg = document.createElement('p');
  msg.textContent = message;
  msg.style.cssText = 'margin: 0 0 20px 0; line-height: 1.5; color: #333;';
  
  const btn = document.createElement('button');
  btn.textContent = 'OK';
  btn.style.cssText = `
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    border: none;
    padding: 10px 30px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: 600;
  `;
  btn.onclick = () => popup.remove();
  
  popup.appendChild(title);
  popup.appendChild(msg);
  popup.appendChild(btn);
  document.body.appendChild(popup);
  
  // Auto-close after 5 seconds if no interaction
  setTimeout(() => popup.remove(), 5000);
}

function statusClass(status) {
  const map = {
    Active: 'active',
    'In Progress': 'progress',
    Fulfilled: 'fulfilled',
    Cancelled: 'cancelled'
  };
  return map[status] || 'active';
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function daysSince(dateString) {
  const date = new Date(dateString);
  const diff = new Date() - date;
  return Math.max(0, diff / (1000 * 60 * 60 * 24));
}

window.addEventListener('DOMContentLoaded', () => {
  renderAll();
});
