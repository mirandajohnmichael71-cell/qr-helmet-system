// ==================== Data Storage ====================
let guards = JSON.parse(localStorage.getItem('guards')) || [];
let riders = JSON.parse(localStorage.getItem('riders')) || [];
let checkIns = JSON.parse(localStorage.getItem('checkIns')) || [];
let currentGuard = JSON.parse(localStorage.getItem('currentGuard')) || null;
let currentRider = JSON.parse(localStorage.getItem('currentRider')) || null;
let currentSlotAssignment = {};

// Initialize with sample data if empty (for testing)
if (guards.length === 0) {
    guards = [
        {
            id: 'G1',
            fullName: 'Juan dela Cruz',
            contactNumber: '09123456789',
            username: 'JuanDeLaCruz',
            password: 'Password123'
        }
    ];
    localStorage.setItem('guards', JSON.stringify(guards));
}

// ==================== Utility Functions ====================
function generateOTP() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let otp = '';
    for (let i = 0; i < 8; i++) {
        otp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return otp;
}

function generateQRCode() {
    return 'QR-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function getAvailableSlot() {
    for (let i = 1; i <= 100; i++) {
        const occupied = checkIns.some(c => c.slotNumber === i && !c.checkOutTime);
        if (!occupied) return i;
    }
    return null;
}

function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-US', options);
}

function updateSlotInfo() {
    const occupied = checkIns.filter(c => !c.checkOutTime).length;
    const unoccupied = 100 - occupied;
    document.getElementById('occupiedSlots').textContent = occupied;
    document.getElementById('unoccupiedSlots').textContent = unoccupied;
}

function clearOnlyErrorField(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.value = '';
    }
}

// ==================== Guard Authentication ====================
const guardLoginForm = document.getElementById('guardLoginForm');
const guardRegisterForm = document.getElementById('guardRegisterForm');

guardLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('guardLoginUsername').value.trim();
    const password = document.getElementById('guardLoginPassword').value.trim();
    
    // Clear previous errors
    document.getElementById('guardLoginUsernameError').textContent = '';
    document.getElementById('guardLoginPasswordError').textContent = '';
    
    let hasError = false;
    
    const guard = guards.find(g => g.username === username);
    
    if (!guard) {
        document.getElementById('guardLoginUsernameError').textContent = 'Username not found';
        hasError = true;
    } else if (guard.password !== password) {
        clearOnlyErrorField('guardLoginPassword');
        document.getElementById('guardLoginPasswordError').textContent = 'Incorrect password';
        hasError = true;
    }
    
    if (hasError) return;
    
    // Check if another guard is already on duty
    const anotherGuardOnDuty = guards.some(g => g.isOnDuty && g.id !== guard.id);
    
    if (anotherGuardOnDuty) {
        alert('Another guard is currently on duty. They must log out first.');
        return;
    }
    
    currentGuard = guard;
    currentGuard.isOnDuty = true;
    localStorage.setItem('currentGuard', JSON.stringify(currentGuard));
    
    showDashboard();
});

guardRegisterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('guardFullName').value.trim();
    const contactNumber = document.getElementById('guardContactNumber').value.trim();
    const username = document.getElementById('guardUsername').value.trim();
    const password = document.getElementById('guardPassword').value.trim();
    
    // Clear previous errors
    document.getElementById('guardFullNameError').textContent = '';
    document.getElementById('guardContactNumberError').textContent = '';
    document.getElementById('guardUsernameError').textContent = '';
    document.getElementById('guardPasswordError').textContent = '';
    
    let hasError = false;
    
    if (!fullName) {
        document.getElementById('guardFullNameError').textContent = 'Full name is required';
        hasError = true;
    }
    
    if (!contactNumber) {
        document.getElementById('guardContactNumberError').textContent = 'Contact number is required';
        hasError = true;
    }
    
    // Username validation: only uppercase and lowercase letters
    const usernameRegex = /^[a-zA-Z]+$/;
    if (!username || !usernameRegex.test(username)) {
        clearOnlyErrorField('guardUsername');
        document.getElementById('guardUsernameError').textContent = 'Username must contain only uppercase and lowercase letters';
        hasError = true;
    } else if (guards.some(g => g.username === username)) {
        clearOnlyErrorField('guardUsername');
        document.getElementById('guardUsernameError').textContent = 'Username already exists';
        hasError = true;
    }
    
    // Password validation: uppercase and lowercase letters
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!password || !passwordRegex.test(password)) {
        clearOnlyErrorField('guardPassword');
        document.getElementById('guardPasswordError').textContent = 'Password must have uppercase, lowercase letters and be at least 8 characters';
        hasError = true;
    }
    
    if (hasError) return;
    
    const newGuard = {
        id: 'G' + (guards.length + 1),
        fullName,
        contactNumber,
        username,
        password,
        isOnDuty: false
    };
    
    guards.push(newGuard);
    localStorage.setItem('guards', JSON.stringify(guards));
    
    alert('Guard registered successfully!');
    guardRegisterForm.reset();
    
    // Switch to login tab
    document.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector('[data-tab="guard-login"]').classList.add('active');
    document.getElementById('guard-login').classList.add('active');
});

// ==================== Auth Tab Switching ====================
document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        const container = e.target.closest('.guard-auth-container, .rider-auth-container');
        
        container.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
        container.querySelectorAll('.auth-tab-content').forEach(content => content.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});

// ==================== Rider Authentication ====================
const riderTypeSelect = document.getElementById('riderType');
const studentNumberGroup = document.getElementById('studentNumberGroup');

riderTypeSelect.addEventListener('change', () => {
    if (riderTypeSelect.value === 'student') {
        studentNumberGroup.style.display = 'block';
    } else {
        studentNumberGroup.style.display = 'none';
    }
});

const riderLoginForm = document.getElementById('riderLoginForm');
const riderRegisterForm = document.getElementById('riderRegisterForm');

riderLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('riderLoginUsername').value.trim();
    const password = document.getElementById('riderLoginPassword').value.trim();
    
    // Clear previous errors
    document.getElementById('riderLoginUsernameError').textContent = '';
    document.getElementById('riderLoginPasswordError').textContent = '';
    
    let hasError = false;
    
    const rider = riders.find(r => r.username === username);
    
    if (!rider) {
        document.getElementById('riderLoginUsernameError').textContent = 'Username not found';
        hasError = true;
    } else if (rider.password !== password) {
        clearOnlyErrorField('riderLoginPassword');
        document.getElementById('riderLoginPasswordError').textContent = 'Incorrect password';
        hasError = true;
    }
    
    if (hasError) return;
    
    currentRider = rider;
    localStorage.setItem('currentRider', JSON.stringify(currentRider));
    
    document.getElementById('riderAuthModal').classList.remove('active');
    showCheckInSuccess(rider);
});

riderRegisterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('riderFullName').value.trim();
    const contactNumber = document.getElementById('riderContactNumber').value.trim();
    const helmetBrand = document.getElementById('helmetBrand').value.trim();
    const helmetColor = document.getElementById('helmetColor').value.trim();
    const helmetDescription = document.getElementById('helmetDescription').value.trim();
    const username = document.getElementById('riderUsername').value.trim();
    const password = document.getElementById('riderPassword').value.trim();
    const userType = document.getElementById('riderType').value;
    const studentNumber = document.getElementById('studentNumber').value.trim();
    
    // Clear previous errors
    document.getElementById('riderFullNameError').textContent = '';
    document.getElementById('riderContactNumberError').textContent = '';
    document.getElementById('helmetBrandError').textContent = '';
    document.getElementById('helmetColorError').textContent = '';
    document.getElementById('helmetDescriptionError').textContent = '';
    document.getElementById('riderUsernameError').textContent = '';
    document.getElementById('riderPasswordError').textContent = '';
    document.getElementById('riderTypeError').textContent = '';
    document.getElementById('studentNumberError').textContent = '';
    
    let hasError = false;
    
    if (!fullName) {
        document.getElementById('riderFullNameError').textContent = 'Full name is required';
        hasError = true;
    }
    
    if (!contactNumber) {
        document.getElementById('riderContactNumberError').textContent = 'Contact number is required';
        hasError = true;
    }
    
    if (!helmetBrand) {
        document.getElementById('helmetBrandError').textContent = 'Helmet brand is required';
        hasError = true;
    }
    
    if (!helmetColor) {
        document.getElementById('helmetColorError').textContent = 'Helmet color is required';
        hasError = true;
    }
    
    if (!helmetDescription) {
        document.getElementById('helmetDescriptionError').textContent = 'Helmet description is required';
        hasError = true;
    }
    
    // Username validation: exactly 10 characters, uppercase, lowercase, numbers
    const usernameRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10}$/;
    if (!username || !usernameRegex.test(username)) {
        clearOnlyErrorField('riderUsername');
        document.getElementById('riderUsernameError').textContent = 'Username must be exactly 10 characters with uppercase, lowercase, and numbers';
        hasError = true;
    } else if (riders.some(r => r.username === username)) {
        clearOnlyErrorField('riderUsername');
        document.getElementById('riderUsernameError').textContent = 'Username already exists';
        hasError = true;
    }
    
    // Password validation: min 8 characters, uppercase, lowercase, numbers, special characters
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password || !passwordRegex.test(password)) {
        clearOnlyErrorField('riderPassword');
        document.getElementById('riderPasswordError').textContent = 'Password must have uppercase, lowercase, numbers, special characters and be at least 8 characters';
        hasError = true;
    }
    
    if (!userType) {
        document.getElementById('riderTypeError').textContent = 'User type is required';
        hasError = true;
    }
    
    if (userType === 'student' && !studentNumber) {
        document.getElementById('studentNumberError').textContent = 'Student number is required';
        hasError = true;
    }
    
    if (hasError) return;
    
    // Check if rider already has a helmet checked in
    const existingCheckIn = checkIns.find(c => 
        c.riderId === username && !c.checkOutTime
    );
    
    const helmetDetailsKey = `${helmetBrand}-${helmetColor}`;
    
    if (existingCheckIn && existingCheckIn.helmetDetails === helmetDetailsKey) {
        clearOnlyErrorField('riderUsername');
        const messageDiv = document.getElementById('checkInMessage');
        messageDiv.textContent = 'Check in failed: the details are already checked in please check out first before checking in another helmet';
        messageDiv.classList.add('error');
        return;
    }
    
    const newRider = {
        id: 'R' + (riders.length + 1),
        fullName,
        contactNumber,
        helmetBrand,
        helmetColor,
        helmetDescription,
        username,
        password,
        userType,
        studentNumber: userType === 'student' ? studentNumber : null,
        registrationDate: new Date().toISOString()
    };
    
    riders.push(newRider);
    localStorage.setItem('riders', JSON.stringify(riders));
    
    currentRider = newRider;
    localStorage.setItem('currentRider', JSON.stringify(currentRider));
    
    document.getElementById('riderAuthModal').classList.remove('active');
    generateOfficialReceipt(newRider);
});

// ==================== Rider Auth Modal ====================
document.getElementById('openRiderAuthBtn').addEventListener('click', () => {
    document.getElementById('riderAuthModal').classList.add('active');
});

document.getElementById('closeRiderAuthBtn').addEventListener('click', () => {
    document.getElementById('riderAuthModal').classList.remove('active');
});

// ==================== Receipt Generation ====================
function generateOfficialReceipt(rider) {
    const slot = getAvailableSlot();
    if (!slot) {
        alert('No available slots. System is full.');
        return;
    }
    
    const otp = generateOTP();
    const qrCode = generateQRCode();
    
    const checkInRecord = {
        id: 'CI' + Date.now(),
        riderId: rider.username,
        riderName: rider.fullName,
        riderContact: rider.contactNumber,
        riderType: rider.userType,
        studentNumber: rider.studentNumber || 'N/A',
        helmetBrand: rider.helmetBrand,
        helmetColor: rider.helmetColor,
        helmetDescription: rider.helmetDescription,
        helmetDetails: `${rider.helmetBrand}-${rider.helmetColor}`,
        slotNumber: slot,
        otp: otp,
        qrCode: qrCode,
        checkInTime: new Date().toISOString(),
        checkOutTime: null,
        guardOnDuty: currentGuard.fullName
    };
    
    checkIns.push(checkInRecord);
    localStorage.setItem('checkIns', JSON.stringify(checkIns));
    
    updateSlotInfo();
    updateActivityLog();
    
    showReceipt(checkInRecord);
}

function showReceipt(checkInRecord) {
    const receiptContent = document.getElementById('receiptContent');
    const checkInTime = new Date(checkInRecord.checkInTime);
    
    receiptContent.innerHTML = `
        <div class="receipt">
            <div class="receipt-header">
                <div class="receipt-title">OFFICIAL RECEIPT</div>
                <div class="receipt-subtitle">Helmet Check-In Confirmation</div>
            </div>
            
            <div class="receipt-section">
                <div class="receipt-section-title">Rider Information</div>
                <div class="receipt-item">
                    <span class="receipt-item-label">Full Name:</span>
                    <span>${checkInRecord.riderName}</span>
                </div>
                <div class="receipt-item">
                    <span class="receipt-item-label">Contact Number:</span>
                    <span>${checkInRecord.riderContact}</span>
                </div>
                <div class="receipt-item">
                    <span class="receipt-item-label">User Type:</span>
                    <span>${checkInRecord.riderType.toUpperCase()}</span>
                </div>
                ${checkInRecord.studentNumber !== 'N/A' ? `
                <div class="receipt-item">
                    <span class="receipt-item-label">Student Number:</span>
                    <span>${checkInRecord.studentNumber}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="receipt-section">
                <div class="receipt-section-title">Helmet Information</div>
                <div class="receipt-item">
                    <span class="receipt-item-label">Brand:</span>
                    <span>${checkInRecord.helmetBrand}</span>
                </div>
                <div class="receipt-item">
                    <span class="receipt-item-label">Color:</span>
                    <span>${checkInRecord.helmetColor}</span>
                </div>
                <div class="receipt-item">
                    <span class="receipt-item-label">Description:</span>
                    <span>${checkInRecord.helmetDescription}</span>
                </div>
            </div>
            
            <div class="receipt-section">
                <div class="receipt-section-title">Slot & Security</div>
                <div class="receipt-item">
                    <span class="receipt-item-label">Slot Number:</span>
                    <span>#${checkInRecord.slotNumber}</span>
                </div>
                <div class="receipt-item">
                    <span class="receipt-item-label">Check-In Time:</span>
                    <span>${checkInTime.toLocaleString()}</span>
                </div>
            </div>
            
            <div class="receipt-qr-section">
                <div class="receipt-section-title">One-Time Password (OTP)</div>
                <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #667eea; margin: 15px 0;">
                    ${checkInRecord.otp}
                </div>
                <div class="receipt-section-title">QR Code</div>
                <svg id="qrCodeSvg" style="max-width: 150px;"></svg>
            </div>
            
            <div class="receipt-footer">
                <p>Keep this receipt safe. You will need the OTP or QR code to check out your helmet.</p>
                <p>Guard on Duty: ${checkInRecord.guardOnDuty}</p>
                <p style="margin-top: 10px; font-size: 10px;">Receipt ID: ${checkInRecord.id}</p>
            </div>
        </div>
    `;
    
    // Generate QR code
    const qrSvg = document.getElementById('qrCodeSvg');
    generateQRCodeVisual(checkInRecord.qrCode, qrSvg);
    
    document.getElementById('receiptModal').classList.add('active');
}

function generateQRCodeVisual(text, element) {
    // Simple QR-like visual representation
    const size = 150;
    const cellSize = size / 20;
    let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
    
    // White background
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;
    
    // Border
    svg += `<rect width="${size}" height="${size}" fill="none" stroke="black" stroke-width="2"/>`;
    
    // Random pattern for demo
    for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
            const hash = (text.charCodeAt(0) + i * 20 + j) % 2;
            if (hash === 0) {
                const x = i * cellSize;
                const y = j * cellSize;
                svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
            }
        }
    }
    
    svg += '</svg>';
    element.innerHTML = svg;
}

document.getElementById('printReceiptBtn').addEventListener('click', () => {
    window.print();
});

document.getElementById('closeReceiptBtn').addEventListener('click', () => {
    document.getElementById('receiptModal').classList.remove('active');
});

document.getElementById('closeReceiptModalBtn').addEventListener('click', () => {
    document.getElementById('receiptModal').classList.remove('active');
});

// ==================== Dashboard ====================
function showDashboard() {
    document.getElementById('guardAuthModal').classList.remove('active');
    document.getElementById('mainDashboard').classList.remove('hidden');
    
    document.getElementById('guardName').textContent = currentGuard.fullName;
    document.getElementById('guardStatusLight').classList.add('active');
    document.getElementById('guardStatusLight').classList.remove('inactive');
    
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    updateSlotInfo();
    updateActivityLog();
}

function showCheckInSuccess(rider) {
    const messageDiv = document.getElementById('checkInMessage');
    messageDiv.innerHTML = `<div class="message-success">✓ Welcome ${rider.fullName}! You are now logged in.</div>`;
}

// ==================== Activity Log ====================
function updateActivityLog() {
    const tableBody = document.getElementById('activityTableBody');
    tableBody.innerHTML = '';
    
    checkIns.forEach(checkIn => {
        const checkInDate = new Date(checkIn.checkInTime);
        const checkOutDate = checkIn.checkOutTime ? new Date(checkIn.checkOutTime) : null;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${checkIn.riderName}</td>
            <td>${checkIn.riderContact}</td>
            <td>${checkIn.riderType}</td>
            <td>${checkIn.helmetBrand} - ${checkIn.helmetColor}</td>
            <td>#${checkIn.slotNumber}</td>
            <td>${checkInDate.toLocaleString()}</td>
            <td>${checkOutDate ? checkOutDate.toLocaleString() : '-'}</td>
            <td>
                <span class="status-badge ${checkIn.checkOutTime ? 'inactive' : 'active'}">
                    ${checkIn.checkOutTime ? 'Checked Out' : 'Checked In'}
                </span>
            </td>
            <td>
                <button class="action-btn" onclick="reprintReceipt('${checkIn.id}')">Reprint</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function reprintReceipt(checkInId) {
    const checkIn = checkIns.find(c => c.id === checkInId);
    if (checkIn) {
        showReceipt(checkIn);
    }
}

window.reprintReceipt = reprintReceipt;

// Activity Log Search
document.getElementById('activitySearch').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const tableBody = document.getElementById('activityTableBody');
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// ==================== Check Out ====================
document.querySelectorAll('input[name="checkoutMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        document.querySelectorAll('.check-out-method-content').forEach(content => {
            content.classList.remove('active');
        });
        
        if (e.target.value === 'qr') {
            document.getElementById('qrScannerContainer').classList.add('active');
            initQRScanner();
        } else {
            document.getElementById('otpInputContainer').classList.add('active');
        }
    });
});

let html5QrcodeScanner = null;

function initQRScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.render(onQRCodeSuccess, onQRCodeError);
        return;
    }
    
    html5QrcodeScanner = new Html5QrcodeScanner(
        "scanner-wrapper",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
    );
    
    html5QrcodeScanner.render(onQRCodeSuccess, onQRCodeError);
}

function onQRCodeSuccess(qrCodeMessage) {
    const checkIn = checkIns.find(c => c.qrCode === qrCodeMessage && !c.checkOutTime);
    
    if (checkIn) {
        performCheckOut(checkIn);
    }
}

function onQRCodeError(error) {
    // Silently fail
}

document.getElementById('submitOtpBtn').addEventListener('click', () => {
    const otp = document.getElementById('otpInput').value.trim();
    const checkIn = checkIns.find(c => c.otp === otp && !c.checkOutTime);
    
    if (checkIn) {
        performCheckOut(checkIn);
    } else {
        const messageDiv = document.getElementById('checkOutMessage');
        messageDiv.textContent = 'Invalid OTP or already checked out';
        messageDiv.classList.add('error');
        messageDiv.classList.remove('success');
    }
});

function performCheckOut(checkIn) {
    checkIn.checkOutTime = new Date().toISOString();
    localStorage.setItem('checkIns', JSON.stringify(checkIns));
    
    updateSlotInfo();
    updateActivityLog();
    
    const messageDiv = document.getElementById('checkOutMessage');
    messageDiv.textContent = '✓ Account successfully checked out. Your helmet has been released.';
    messageDiv.classList.add('success');
    messageDiv.classList.remove('error');
    
    // Auto logout after check out
    setTimeout(() => {
        document.getElementById('riderAuthModal').classList.remove('active');
        currentRider = null;
        localStorage.removeItem('currentRider');
        messageDiv.textContent = '';
        messageDiv.classList.remove('success', 'error');
        document.getElementById('otpInput').value = '';
    }, 3000);
}

// ==================== Dashboard Tabs ====================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        if (tabName === 'check-out' && !html5QrcodeScanner) {
            initQRScanner();
        }
    });
});

// ==================== Logout ====================
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        currentGuard.isOnDuty = false;
        
        // Update guard in array
        const guardIndex = guards.findIndex(g => g.id === currentGuard.id);
        if (guardIndex !== -1) {
            guards[guardIndex] = currentGuard;
            localStorage.setItem('guards', JSON.stringify(guards));
        }
        
        currentGuard = null;
        currentRider = null;
        localStorage.removeItem('currentGuard');
        localStorage.removeItem('currentRider');
        
        document.getElementById('mainDashboard').classList.add('hidden');
        document.getElementById('guardAuthModal').classList.add('active');
        
        // Reset forms
        document.getElementById('guardLoginForm').reset();
        document.getElementById('riderAuthModal').classList.remove('active');
    }
});

// ==================== Initialize ====================
window.addEventListener('load', () => {
    if (localStorage.getItem('currentGuard')) {
        currentGuard = JSON.parse(localStorage.getItem('currentGuard'));
        showDashboard();
    }
});