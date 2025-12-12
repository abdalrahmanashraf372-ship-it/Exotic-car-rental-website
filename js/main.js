const API_BASE_URL = 'http://localhost:3000/api';

let cars = [];
let favorites = [];
let selectedCar = null;

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

async function loadCars() {
    const loadingDiv = document.getElementById('loading');
    const carGrid = document.getElementById('car-grid');
    const emptyState = document.getElementById('empty-state');

    loadingDiv.classList.add('active');
    carGrid.innerHTML = '';
    emptyState.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/cars`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            cars = await response.json();
            await loadFavorites();
            renderCars();
        } else {
            showError('Failed to load cars. Please try again.');
        }
    } catch (error) {
        showError('Network error. Please check if the server is running.');
        console.error('Load cars error:', error);
    } finally {
        loadingDiv.classList.remove('active');
    }
}

async function loadFavorites() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/favorites`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            favorites = await response.json();
        }
    } catch (error) {
        console.error('Load favorites error:', error);
    }
}

function isFavorite(carId) {
    return favorites.some(fav => fav.id === carId);
}

function renderCars() {
    const carGrid = document.getElementById('car-grid');
    const emptyState = document.getElementById('empty-state');

    if (cars.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    carGrid.innerHTML = cars.map(car => `
        <div class="car-card">
            <img src="${car.image_url || 'https://via.placeholder.com/400x200?text=Car+Image'}"
                 alt="${car.make} ${car.model}"
                 class="car-image">
            <div class="car-content">
                <div class="car-header">
                    <div>
                        <h3 class="car-title">${car.make} ${car.model}</h3>
                        <p class="car-year">${car.year}</p>
                    </div>
                    <button class="btn-icon ${isFavorite(car.id) ? 'active' : ''}"
                            onclick="toggleFavorite(${car.id})"
                            aria-label="Toggle favorite">
                        ${isFavorite(car.id) ? '⭐' : '☆'}
                    </button>
                </div>
                <div class="car-details">
                    ${car.description ? `<p class="car-detail">${car.description}</p>` : ''}
                </div>
                <div class="car-footer">
                    <div class="car-price">
                        $${car.price}
                        <span class="car-price-unit">/ day</span>
                    </div>
                    <button class="btn btn-primary btn-small" onclick="openBookingModal(${car.id})">
                        Book Now
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function toggleFavorite(carId) {
    const isFav = isFavorite(carId);
    const method = isFav ? 'DELETE' : 'POST';

    try {
        const response = await fetch(`${API_BASE_URL}/users/favorites/${carId}`, {
            method: method,
            headers: getAuthHeaders()
        });

        if (response.ok) {
            await loadFavorites();
            renderCars();
            showSuccess(isFav ? 'Removed from favorites' : 'Added to favorites');
        } else {
            showError('Failed to update favorites. Please try again.');
        }
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Toggle favorite error:', error);
    }
}

function openBookingModal(carId) {
    selectedCar = cars.find(car => car.id === carId);
    if (!selectedCar) return;

    const modal = document.getElementById('booking-modal');
    const carInfo = document.getElementById('modal-car-info');

    carInfo.innerHTML = `
        <div style="margin-bottom: 1.5rem; padding: 1rem; background-color: var(--bg-color); border-radius: 0.5rem;">
            <h3 style="margin-bottom: 0.5rem;">${selectedCar.make} ${selectedCar.model}</h3>
            <p style="color: var(--text-secondary);">${selectedCar.year} • $${selectedCar.price}/day</p>
        </div>
    `;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date').setAttribute('min', today);
    document.getElementById('end-date').setAttribute('min', today);
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('total-price').textContent = '$0';

    modal.classList.add('active');
}

function closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    modal.classList.remove('active');
    selectedCar = null;
}

function calculateTotalPrice() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    if (startDate && endDate && selectedCar) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        if (days > 0) {
            const total = days * selectedCar.price;
            document.getElementById('total-price').textContent = `$${total}`;
            return total;
        }
    }

    document.getElementById('total-price').textContent = '$0';
    return 0;
}

async function handleBooking(event) {
    event.preventDefault();

    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    if (!selectedCar) return;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
        showError('End date must be after start date.');
        return;
    }

    const confirmBtn = document.getElementById('confirm-booking');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Booking...';

    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                carId: selectedCar.id,
                startDate: startDate,
                endDate: endDate
            })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Booking confirmed! Check "My Bookings" to view details.');
            closeBookingModal();
        } else {
            showError(data.message || 'Booking failed. Please try again.');
        }
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Booking error:', error);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Booking';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    loadCars();

    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('close-modal').addEventListener('click', closeBookingModal);
    document.getElementById('cancel-booking').addEventListener('click', closeBookingModal);
    document.getElementById('booking-form').addEventListener('submit', handleBooking);

    document.getElementById('start-date').addEventListener('change', () => {
        const startDate = document.getElementById('start-date').value;
        document.getElementById('end-date').setAttribute('min', startDate);
        calculateTotalPrice();
    });

    document.getElementById('end-date').addEventListener('change', calculateTotalPrice);

    document.getElementById('booking-modal').addEventListener('click', (e) => {
        if (e.target.id === 'booking-modal') {
            closeBookingModal();
        }
    });
});
