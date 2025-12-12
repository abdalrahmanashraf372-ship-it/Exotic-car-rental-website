const API_BASE_URL = 'http://localhost:3000/api';

let profile = null;
let favorites = [];

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        errorDiv.innerHTML = '';
    }, 5000);
}

function showSuccess(message) {
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');
    errorDiv.innerHTML = '';
    successDiv.innerHTML = `<div class="alert alert-success">${message}</div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        successDiv.innerHTML = '';
    }, 5000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

async function loadProfile() {
    const loadingDiv = document.getElementById('loading-profile');
    const profileInfo = document.getElementById('profile-info');

    loadingDiv.classList.add('active');

    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            profile = await response.json();
            renderProfile();
            populateUpdateForm();
        } else {
            showError('Failed to load profile. Please try again.');
        }
    } catch (error) {
        showError('Network error. Please check if the server is running.');
        console.error('Load profile error:', error);
    } finally {
        loadingDiv.classList.remove('active');
    }
}

function renderProfile() {
    const profileInfo = document.getElementById('profile-info');

    profileInfo.innerHTML = `
        <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${profile.name || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${profile.email || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${profile.phone || 'N/A'}</span>
        </div>
    `;
}

function populateUpdateForm() {
    document.getElementById('update-name').value = profile.name || '';
    document.getElementById('update-email').value = profile.email || '';
    document.getElementById('update-phone').value = profile.phone || '';
}

async function handleUpdateProfile(event) {
    event.preventDefault();

    const name = document.getElementById('update-name').value;
    const phone = document.getElementById('update-phone').value;
    const updateBtn = document.getElementById('update-btn');

    updateBtn.disabled = true;
    updateBtn.textContent = 'Updating...';

    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, phone })
        });

        if (response.ok) {
            const updatedProfile = await response.json();
            profile = updatedProfile;
            renderProfile();
            showSuccess('Profile updated successfully!');
        } else {
            const data = await response.json();
            showError(data.message || 'Failed to update profile. Please try again.');
        }
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Update profile error:', error);
    } finally {
        updateBtn.disabled = false;
        updateBtn.textContent = 'Update Profile';
    }
}

async function loadFavorites() {
    const loadingDiv = document.getElementById('loading-favorites');
    const favoritesGrid = document.getElementById('favorites-grid');
    const emptyState = document.getElementById('favorites-empty');

    loadingDiv.classList.add('active');
    favoritesGrid.innerHTML = '';
    emptyState.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/users/favorites`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            favorites = await response.json();
            renderFavorites();
        } else {
            showError('Failed to load favorites. Please try again.');
        }
    } catch (error) {
        showError('Network error. Please check if the server is running.');
        console.error('Load favorites error:', error);
    } finally {
        loadingDiv.classList.remove('active');
    }
}

function renderFavorites() {
    const favoritesGrid = document.getElementById('favorites-grid');
    const emptyState = document.getElementById('favorites-empty');

    if (favorites.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    favoritesGrid.innerHTML = favorites.map(car => `
        <div class="favorite-card">
            <img src="${car.image_url || 'https://via.placeholder.com/250x150?text=Car+Image'}"
                 alt="${car.make} ${car.model}"
                 class="favorite-image">
            <div class="favorite-content">
                <h3 class="favorite-title">${car.make} ${car.model}</h3>
                <p class="favorite-price">$${car.price}/day</p>
            </div>
            <button class="btn btn-danger btn-small favorite-remove"
                    onclick="removeFavorite(${car.id})">
                Remove
            </button>
        </div>
    `).join('');
}

async function removeFavorite(carId) {
    if (!confirm('Remove this car from your favorites?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/favorites/${carId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showSuccess('Car removed from favorites.');
            await loadFavorites();
        } else {
            showError('Failed to remove favorite. Please try again.');
        }
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Remove favorite error:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    loadProfile();
    loadFavorites();

    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('update-profile-form').addEventListener('submit', handleUpdateProfile);
});
