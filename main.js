/**
 * MStreet Finance — Loan Application Form
 * Handles multi-step form navigation, validation, and API integration.
 */

// =============================================================================
// CONFIG
// =============================================================================

const API_BASE_URL = 'https://mstreetwebsiteapi.vercel.app';

// =============================================================================
// STATE
// =============================================================================

let currentStep = 1;
const totalSteps = 4;
let applicationId = null;

// =============================================================================
// DOM ELEMENTS
// =============================================================================

const form = document.getElementById('loanApplicationForm');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const progressFill = document.getElementById('progressFill');
const formNavigation = document.getElementById('formNavigation');
const debugOutput = document.getElementById('debugOutput');
const debugToggle = document.getElementById('debugToggle');
const debugContent = document.getElementById('debugContent');
const toastContainer = document.getElementById('toastContainer');
const newApplicationBtn = document.getElementById('newApplicationBtn');

// =============================================================================
// STEP NAVIGATION
// =============================================================================

function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach((el) => {
        el.classList.remove('active');
    });

    // Show target step
    const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    // Update progress
    currentStep = step;
    updateProgressBar();
    updateStepDots();
    updateNavigationButtons();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressBar() {
    const percentage = currentStep <= totalSteps
        ? (currentStep / totalSteps) * 100
        : 100;
    progressFill.style.width = `${percentage}%`;
}

function updateStepDots() {
    document.querySelectorAll('.step-dot').forEach((dot) => {
        const step = parseInt(dot.dataset.step);
        dot.classList.remove('active', 'completed');

        if (step === currentStep) {
            dot.classList.add('active');
        } else if (step < currentStep) {
            dot.classList.add('completed');
        }
    });
}

function updateNavigationButtons() {
    // Hide navigation on success screen
    if (currentStep > totalSteps) {
        formNavigation.classList.add('hidden');
        return;
    }
    formNavigation.classList.remove('hidden');

    // Previous button
    prevBtn.disabled = currentStep === 1;

    // Next vs Submit
    if (currentStep === totalSteps) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
}

// =============================================================================
// VALIDATION
// =============================================================================

function validateStep(step) {
    let isValid = true;

    if (step === 1) {
        const firstName = document.getElementById('first_name');
        const lastName = document.getElementById('last_name');
        const phone = document.getElementById('phone_number');

        if (!firstName.value.trim()) {
            showFieldError(firstName, 'First name is required');
            isValid = false;
        } else {
            clearFieldError(firstName);
        }

        if (!lastName.value.trim()) {
            showFieldError(lastName, 'Last name is required');
            isValid = false;
        } else {
            clearFieldError(lastName);
        }

        if (!phone.value.trim()) {
            showFieldError(phone, 'Phone number is required');
            isValid = false;
        } else if (!/^\d{10}$/.test(phone.value.trim())) {
            showFieldError(phone, 'Enter 10 digits after +234');
            isValid = false;
        } else {
            clearFieldError(phone);
        }
    }

    return isValid;
}

function showFieldError(input, message) {
    input.classList.add('error');
    // Remove existing error message
    const existing = input.parentElement.querySelector('.field-error');
    if (existing) existing.remove();

    const errorEl = document.createElement('span');
    errorEl.className = 'field-error visible';
    errorEl.textContent = message;
    input.parentElement.appendChild(errorEl);
}

function clearFieldError(input) {
    input.classList.remove('error');
    const existing = input.parentElement.querySelector('.field-error');
    if (existing) existing.remove();
}

// =============================================================================
// FORM DATA COLLECTION
// =============================================================================

function collectFormData() {
    const phoneRaw = document.getElementById('phone_number').value.trim();
    const phone = phoneRaw ? `+234${phoneRaw}` : '';

    const data = {
        // Step 1: Personal Info
        title: document.getElementById('title').value || undefined,
        gender: document.getElementById('gender').value || undefined,
        first_name: document.getElementById('first_name').value.trim(),
        middle_name: document.getElementById('middle_name').value.trim() || undefined,
        last_name: document.getElementById('last_name').value.trim(),
        marital_status: document.getElementById('marital_status').value || undefined,
        date_of_birth: document.getElementById('date_of_birth').value || undefined,
        phone_number: phone,
        email: document.getElementById('email').value.trim() || undefined,
        home_address: document.getElementById('home_address').value.trim() || undefined,
        bvn: document.getElementById('bvn').value.trim() || undefined,
        nin: document.getElementById('nin').value.trim() || undefined,

        // Step 2: Employment
        employment_type: document.getElementById('employment_type').value,
        employer: document.getElementById('employer').value.trim() || undefined,
        office_email: document.getElementById('office_email').value.trim() || undefined,
        office_address: document.getElementById('office_address').value.trim() || undefined,
        nature_of_business: document.getElementById('nature_of_business').value.trim() || undefined,
        business_name: document.getElementById('business_name').value.trim() || undefined,
        business_address: document.getElementById('business_address').value.trim() || undefined,

        // Step 3: Next of Kin
        nok_first_name: document.getElementById('nok_first_name').value.trim() || undefined,
        nok_middle_name: document.getElementById('nok_middle_name').value.trim() || undefined,
        nok_last_name: document.getElementById('nok_last_name').value.trim() || undefined,
        nok_relationship: document.getElementById('nok_relationship').value.trim() || undefined,
        nok_mobile_number: document.getElementById('nok_mobile_number').value.trim() || undefined,
        nok_email: document.getElementById('nok_email').value.trim() || undefined,

        // Step 4: ID type
        id_type: document.getElementById('id_type').value || undefined,
    };

    // Remove undefined values
    Object.keys(data).forEach((key) => {
        if (data[key] === undefined) delete data[key];
    });

    return data;
}

// =============================================================================
// API CALLS
// =============================================================================

async function submitApplication() {
    const data = collectFormData();

    logToDebug('POST /api/applications', 'info', JSON.stringify(data, null, 2));

    const response = await fetch(`${API_BASE_URL}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
        logToDebug(`Error ${response.status}`, 'error', JSON.stringify(result, null, 2));
        throw new Error(result.error?.message || 'Failed to submit application');
    }

    logToDebug('Application Created ✅', 'success', JSON.stringify(result, null, 2));
    return result;
}

async function uploadDocuments(appId) {
    const formData = new FormData();
    let hasFiles = false;

    const idDoc = document.getElementById('id_document').files[0];
    const utilityBill = document.getElementById('utility_bill').files[0];
    const passportPhoto = document.getElementById('passport_photo').files[0];

    if (idDoc) { formData.append('id_document', idDoc); hasFiles = true; }
    if (utilityBill) { formData.append('utility_bill', utilityBill); hasFiles = true; }
    if (passportPhoto) { formData.append('passport_photo', passportPhoto); hasFiles = true; }

    if (!hasFiles) {
        logToDebug('No files to upload — skipping', 'info');
        return null;
    }

    logToDebug(`POST /api/applications/${appId}/documents`, 'info', `Uploading ${Object.keys(formData).length} file(s)...`);

    const response = await fetch(`${API_BASE_URL}/api/applications/${appId}/documents`, {
        method: 'POST',
        body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
        logToDebug(`Upload Error ${response.status}`, 'error', JSON.stringify(result, null, 2));
        throw new Error(result.error?.message || 'Failed to upload documents');
    }

    logToDebug('Documents Uploaded ✅', 'success', JSON.stringify(result, null, 2));
    return result;
}

// =============================================================================
// FORM SUBMISSION
// =============================================================================

async function handleSubmit() {
    submitBtn.classList.add('loading');
    submitBtn.textContent = 'Submitting...';

    try {
        // Step 1: Submit application data
        showToast('Submitting application...', 'info');
        const appResult = await submitApplication();
        applicationId = appResult.data.id;

        // Step 2: Upload documents
        showToast('Uploading documents...', 'info');
        await uploadDocuments(applicationId);

        // Show success
        document.getElementById('referenceNumber').textContent = appResult.data.reference_no;
        showToast('Application submitted successfully!', 'success');
        goToStep(5); // Success screen

    } catch (error) {
        showToast(error.message, 'error');
        logToDebug('Submission Failed', 'error', error.message);
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
      Submit Application
    `;
    }
}

// =============================================================================
// EMPLOYMENT TOGGLE
// =============================================================================

function setupEmploymentToggle() {
    const employedBtn = document.getElementById('toggleEmployed');
    const selfEmployedBtn = document.getElementById('toggleSelfEmployed');
    const employedFields = document.getElementById('employedFields');
    const selfEmployedFields = document.getElementById('selfEmployedFields');
    const employmentTypeInput = document.getElementById('employment_type');

    employedBtn.addEventListener('click', () => {
        employedBtn.classList.add('active');
        selfEmployedBtn.classList.remove('active');
        employedFields.classList.remove('hidden');
        selfEmployedFields.classList.add('hidden');
        employmentTypeInput.value = 'employed';
    });

    selfEmployedBtn.addEventListener('click', () => {
        selfEmployedBtn.classList.add('active');
        employedBtn.classList.remove('active');
        selfEmployedFields.classList.remove('hidden');
        employedFields.classList.add('hidden');
        employmentTypeInput.value = 'self_employed';
    });
}

// =============================================================================
// FILE UPLOADS
// =============================================================================

function setupFileUploads() {
    const fileConfigs = [
        { input: 'id_document', zone: 'idDocumentZone', preview: 'idDocumentPreview' },
        { input: 'utility_bill', zone: 'utilityBillZone', preview: 'utilityBillPreview' },
        { input: 'passport_photo', zone: 'passportPhotoZone', preview: 'passportPhotoPreview' },
    ];

    fileConfigs.forEach(({ input, zone, preview }) => {
        const inputEl = document.getElementById(input);
        const zoneEl = document.getElementById(zone);
        const previewEl = document.getElementById(preview);

        inputEl.addEventListener('change', () => {
            if (inputEl.files.length > 0) {
                const file = inputEl.files[0];
                zoneEl.classList.add('has-file');
                zoneEl.querySelector('.file-upload-content').classList.add('hidden');
                previewEl.classList.remove('hidden');
                previewEl.querySelector('.file-name').textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            }
        });
    });

    // Remove file buttons
    document.querySelectorAll('.file-remove').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.dataset.target;
            const inputEl = document.getElementById(targetId);
            inputEl.value = '';

            const zoneEl = inputEl.closest('.file-upload-zone');
            zoneEl.classList.remove('has-file');
            zoneEl.querySelector('.file-upload-content').classList.remove('hidden');
            zoneEl.querySelector('.file-preview').classList.add('hidden');
        });
    });
}

// =============================================================================
// DEBUG PANEL
// =============================================================================

function logToDebug(title, type = 'info', data = '') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `
    <div class="log-timestamp">${timestamp}</div>
    <strong>${title}</strong>
    ${data ? `<pre>${data}</pre>` : ''}
  `;

    // Clear initial placeholder
    if (debugOutput.textContent === 'Waiting for API calls...') {
        debugOutput.textContent = '';
    }

    debugOutput.appendChild(entry);
    debugContent.scrollTop = debugContent.scrollHeight;
}

function setupDebugPanel() {
    debugToggle.addEventListener('click', () => {
        const isVisible = !debugContent.classList.contains('hidden');
        debugContent.classList.toggle('hidden');
        debugToggle.textContent = isVisible ? 'Show' : 'Hide';
    });
}

// =============================================================================
// TOAST NOTIFICATIONS
// =============================================================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

// Next button
nextBtn.addEventListener('click', () => {
    if (validateStep(currentStep)) {
        goToStep(currentStep + 1);
    }
});

// Previous button
prevBtn.addEventListener('click', () => {
    if (currentStep > 1) {
        goToStep(currentStep - 1);
    }
});

// Submit button
submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleSubmit();
});

// Form submit (prevent default)
form.addEventListener('submit', (e) => {
    e.preventDefault();
});

// New application button
newApplicationBtn.addEventListener('click', () => {
    form.reset();
    applicationId = null;
    debugOutput.textContent = 'Waiting for API calls...';

    // Reset file upload zones
    document.querySelectorAll('.file-upload-zone').forEach((zone) => {
        zone.classList.remove('has-file');
        zone.querySelector('.file-upload-content').classList.remove('hidden');
        zone.querySelector('.file-preview').classList.add('hidden');
    });

    // Reset employment toggle
    document.getElementById('toggleEmployed').classList.add('active');
    document.getElementById('toggleSelfEmployed').classList.remove('active');
    document.getElementById('employedFields').classList.remove('hidden');
    document.getElementById('selfEmployedFields').classList.add('hidden');
    document.getElementById('employment_type').value = 'employed';

    goToStep(1);
});

// Clear errors on input
document.querySelectorAll('input, select').forEach((el) => {
    el.addEventListener('input', () => clearFieldError(el));
});

// =============================================================================
// INITIALIZE
// =============================================================================

setupEmploymentToggle();
setupFileUploads();
setupDebugPanel();
updateProgressBar();
updateNavigationButtons();

console.log('🏦 MStreet Finance — Loan Application Form ready');
console.log(`📡 API Target: ${API_BASE_URL}`);
