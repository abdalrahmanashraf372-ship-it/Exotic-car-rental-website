const API_BASE_URL = 'http://localhost:3000/api';

let bookings = [];

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');
    successDiv.innerHTML = '';
    errorDiv.innerHTML = `<div class="alert alert-error">${message}</div>`;
    setTimeout(() => {
        errorDiv.innerHTML = '';
    }, 5000);
}

function showSuccess(message) {
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');
    errorDiv.innerHTML = '';
    successDiv.innerHTML = `<div class="alert alert-success">${message}</div>`;
    setTimeout(() => {
        successDiv.innerHTML = '';
    }, 5000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getStatusClass(status) {
    const statusMap = {
        'active': 'status-active',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled'
    };
    return statusMap[status.toLowerCase()] || 'status-active';
}

async function loadBookings() {
    const loadingDiv = document.getElementById('loading');
    const bookingsGrid = document.getElementById('bookings-grid');
    const emptyState = document.getElementById('empty-state');

    loadingDiv.classList.add('active');
    bookingsGrid.innerHTML = '';
    emptyState.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            bookings = await response.json();
            renderBookings();
        } else {
            showError('Failed to load bookings. Please try again.');
        }
    } catch (error) {
        showError('Network error. Please check if the server is running.');
        console.error('Load bookings error:', error);
    } finally {
        loadingDiv.classList.remove('active');
    }
}

function renderBookings() {
    const bookingsGrid = document.getElementById('bookings-grid');
    const emptyState = document.getElementById('empty-state');

    if (bookings.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    bookingsGrid.innerHTML = bookings.map(booking => {
        const car = booking.car || {};
        const canCancel = booking.status.toLowerCase() === 'active';

        return `
            <div class="booking-card">
                <img src="${car.image_url || 'https://via.placeholder.com/200x120?text=Car+Image'}"
                     alt="${car.make} ${car.model}"
                     class="booking-image">
                <div class="booking-info">
                    <h3>${car.make || 'N/A'} ${car.model || ''}</h3>
                    <p class="booking-detail"><strong>Start Date:</strong> ${formatDate(booking.startDate)}</p>
                    <p class="booking-detail"><strong>End Date:</strong> ${formatDate(booking.endDate)}</p>
                    <p class="booking-detail"><strong>Total Price:</strong> $${booking.totalPrice}</p>
                    <span class="booking-status ${getStatusClass(booking.status)}">
                        ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                </div>
                <div>
                    ${canCancel ? `
                        <button class="btn btn-danger" onclick="cancelBooking(${booking.id})">
                            Cancel Booking
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showSuccess('Booking cancelled successfully.');
            await loadBookings();
        } else {
            const data = await response.json();
            showError(data.message || 'Failed to cancel booking. Please try again.');
        }
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Cancel booking error:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    loadBookings();

    document.getElementById('logout-btn').addEventListener('click', logout);
});
