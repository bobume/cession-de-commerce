// App state
let appState = {
    categories: [],
    allListings: [],
    currentCategory: null,
    currentListing: null,
};

// DOM Elements
const categoriesList = document.getElementById('categories-list');
const listingsGrid = document.getElementById('listings-grid');
const listingsView = document.getElementById('listings-view');
const detailView = document.getElementById('detail-view');
const backBtn = document.getElementById('back-btn');
const categoryTitle = document.getElementById('category-title');
const listingsCount = document.getElementById('listings-count');
const listingDetail = document.getElementById('listing-detail');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    backBtn.addEventListener('click', showListingsView);
});

// Load categories
async function loadCategories() {
    try {
        const response = await fetch('categories.json');
        const data = await response.json();
        appState.categories = data.categories || [];
        renderCategories();

        // Load all listings index
        const annoncesResponse = await fetch('annonces.json');
        appState.allListings = await annoncesResponse.json();

        // Load first category by default
        if (appState.categories.length > 0) {
            selectCategory(appState.categories[0]);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        categoriesList.innerHTML = '<p style="color: red;">Erreur du chargement</p>';
    }
}

// Render categories
function renderCategories() {
    categoriesList.innerHTML = '';

    appState.categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = cat;
        btn.addEventListener('click', () => selectCategory(cat));
        categoriesList.appendChild(btn);
    });
}

// Select category
async function selectCategory(category) {
    appState.currentCategory = category;

    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === category) {
            btn.classList.add('active');
        }
    });

    // Load and display listings
    await loadListings(category);
    showListingsView();
}

// Load listings for category
async function loadListings(category) {
    try {
        // Convert category name to filename
        const filename = sanitizeFilename(category) + '.json';
        const response = await fetch(filename);
        const listings = await response.json();

        categoryTitle.textContent = category;
        listingsCount.textContent = `${listings.length} annonce(s)`;

        renderListings(listings);
    } catch (error) {
        console.error('Error loading listings:', error);
        listingsGrid.innerHTML = '<p style="color: red;">Erreur du chargement des annonces</p>';
    }
}

// Render listings
function renderListings(listings) {
    listingsGrid.innerHTML = '';

    listings.forEach(listing => {
        const card = createListingCard(listing);
        card.addEventListener('click', () => showListing(listing));
        listingsGrid.appendChild(card);
    });
}

// Create listing card
function createListingCard(listing) {
    const div = document.createElement('div');
    div.className = 'listing-card';

    const imageHtml = listing.image_url
        ? `<img src="${listing.image_url}" alt="${listing.title}">`
        : '<p>Pas d\'image</p>';

    const categoryTags = (listing.categories || [])
        .map(cat => `<span class="category-tag">${cat}</span>`)
        .join('');

    div.innerHTML = `
        <div class="listing-image">${imageHtml}</div>
        <div class="listing-info">
            <h3 class="listing-title">${listing.title}</h3>
            <div class="listing-meta">
                <span>📅 ${formatDate(listing.date)}</span>
                <span>👤 ${listing.author}</span>
            </div>
            <div class="listing-categories">${categoryTags}</div>
        </div>
    `;

    return div;
}

// Show listing detail
function showListing(listing) {
    appState.currentListing = listing;

    const imageHtml = listing.image_url
        ? `<div class="detail-image"><img src="${listing.image_url}" alt="${listing.title}"></div>`
        : '';

    const categoryTags = (listing.categories || [])
        .map(cat => `<span class="category-tag">${cat}</span>`)
        .join('');

    const contentHtml = listing.content
        ? `<div class="detail-content">${listing.content}</div>`
        : '<p>Aucune description disponible</p>';

    listingDetail.innerHTML = `
        <div class="detail-header">
            <h1 class="detail-title">${listing.title}</h1>
            <div class="detail-meta">
                <div class="detail-meta-item">
                    <span class="detail-meta-label">Date</span>
                    <span class="detail-meta-value">${formatDate(listing.date)}</span>
                </div>
                <div class="detail-meta-item">
                    <span class="detail-meta-label">Auteur</span>
                    <span class="detail-meta-value">${listing.author}</span>
                </div>
                <div class="detail-meta-item">
                    <span class="detail-meta-label">Statut</span>
                    <span class="detail-meta-value">${listing.status === 'publish' ? 'Publié' : 'En attente'}</span>
                </div>
            </div>
            <div class="listing-categories">${categoryTags}</div>
        </div>

        ${imageHtml}

        ${contentHtml}

        <div class="detail-footer">
            <div>
                <p style="color: #6b7280; margin-bottom: 8px;">Pour plus d'infos:</p>
                <p><strong>${listing.author}</strong></p>
            </div>
            <button class="contact-btn" onclick="alert('Formulaire de contact: prochainement!')">Me contacter</button>
        </div>
    `;

    detailView.classList.add('active');
    listingsView.classList.remove('active');
    window.scrollTo(0, 0);
}

// Show listings view
function showListingsView() {
    listingsView.classList.add('active');
    detailView.classList.remove('active');
    window.scrollTo(0, 0);
}

// ---- MODAL FORMULAIRE VENDEUR ----

const API_URL = 'https://cdc.candidia.be';

function openModal() {
    document.getElementById('modal-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal(event) {
    if (event && event.target !== document.getElementById('modal-overlay')) return;
    document.getElementById('modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
}

async function submitAnnonce(event) {
    event.preventDefault();

    const btn = document.getElementById('btn-submit');
    const status = document.getElementById('form-status');

    const payload = {
        titre: document.getElementById('f-titre').value.trim(),
        type_commerce: document.getElementById('f-type').value.trim(),
        ville: document.getElementById('f-ville').value.trim(),
        prix: parseFloat(document.getElementById('f-prix').value) || null,
        description: document.getElementById('f-description').value.trim(),
        telephone: document.getElementById('f-telephone').value.trim() || null,
        email: document.getElementById('f-email').value.trim(),
    };

    btn.disabled = true;
    btn.textContent = 'Envoi en cours...';
    status.className = 'form-status';
    status.textContent = '';

    try {
        const response = await fetch(`${API_URL}/api/annonce`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data.statut === 'accepté') {
            status.className = 'form-status success';
            status.textContent = 'Votre annonce a été reçue et sera publiée après modération. Merci !';
            document.getElementById('form-annonce').reset();
        } else if (data.statut === 'rejeté') {
            status.className = 'form-status error';
            status.textContent = `Annonce refusée : ${data.raison}`;
        } else {
            throw new Error('Réponse inattendue');
        }
    } catch (err) {
        status.className = 'form-status error';
        status.textContent = 'Une erreur est survenue. Veuillez réessayer dans quelques instants.';
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Envoyer mon annonce';
    }
}

// ---- FIN MODAL ----

// Utility: Sanitize filename
function sanitizeFilename(str) {
    return str.toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

// Utility: Format date
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-BE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
}
