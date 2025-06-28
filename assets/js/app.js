// Öğrenci Bilgi Sistemi - Ana JavaScript Dosyası

// Global değişkenler
let currentUser = null;
let isAuthenticated = false;

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeApp();
    setupEventListeners();
});

// Kimlik doğrulama kontrolü
function checkAuth() {
    const loginStatus = localStorage.getItem('login');
    const currentPage = window.location.pathname;
    
    if (loginStatus !== 'true' && !currentPage.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }
    
    if (loginStatus === 'true' && currentPage.includes('login.html')) {
        window.location.href = 'index.html';
        return;
    }
    
    isAuthenticated = true;
    currentUser = {
        username: 'admin',
        role: 'admin'
    };
}

// Uygulama başlatma
function initializeApp() {
    if (!isAuthenticated) return;
    
    // Aktif menü öğesini işaretle
    highlightActiveMenu();
    
    // Sayfa özel fonksiyonları
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('index.html')) {
        loadDashboard();
    } else if (currentPage.includes('ogrenci-ekle.html')) {
        initializeOgrenciForm();
    } else if (currentPage.includes('notlar.html')) {
        loadNotlar();
    } else if (currentPage.includes('profil.html')) {
        loadProfil();
    }
}

// Event listener'ları kur
function setupEventListeners() {
    // Çıkış butonu
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Mobil menü toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
}

// Aktif menü öğesini işaretle
function highlightActiveMenu() {
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') && currentPage.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        }
    });
}

// Dashboard yükleme
function loadDashboard() {
    const ogrenciler = getOgrenciler();
    const notlar = getNotlar();
    
    // İstatistikleri güncelle
    updateStats(ogrenciler.length, notlar.length);
    
    // Son eklenen öğrencileri göster
    showRecentOgrenciler(ogrenciler.slice(-5));
    
    // Son eklenen notları göster
    showRecentNotlar(notlar.slice(-5));
}

// İstatistikleri güncelle
function updateStats(ogrenciCount, notCount) {
    const ogrenciElement = document.getElementById('ogrenciSayisi');
    const notElement = document.getElementById('notSayisi');
    
    if (ogrenciElement) {
        animateNumber(ogrenciElement, 0, ogrenciCount);
    }
    
    if (notElement) {
        animateNumber(notElement, 0, notCount);
    }
}

// Sayı animasyonu
function animateNumber(element, start, end) {
    const duration = 1000;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Son eklenen öğrencileri göster
function showRecentOgrenciler(ogrenciler) {
    const container = document.getElementById('recentOgrenciler');
    if (!container) return;
    
    if (ogrenciler.length === 0) {
        container.innerHTML = '<p class="text-muted">Henüz öğrenci eklenmemiş.</p>';
        return;
    }
    
    let html = '<div class="table-responsive"><table class="table">';
    html += '<thead><tr><th>Ad Soyad</th><th>Numara</th><th>Bölüm</th><th>E-posta</th></tr></thead><tbody>';
    
    ogrenciler.forEach(ogrenci => {
        html += `<tr>
            <td>${escapeHtml(ogrenci.ad)} ${escapeHtml(ogrenci.soyad)}</td>
            <td>${escapeHtml(ogrenci.numara)}</td>
            <td>${escapeHtml(ogrenci.bolum)}</td>
            <td>${escapeHtml(ogrenci.email)}</td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// Son eklenen notları göster
function showRecentNotlar(notlar) {
    const container = document.getElementById('recentNotlar');
    if (!container) return;
    
    if (notlar.length === 0) {
        container.innerHTML = '<p class="text-muted">Henüz not eklenmemiş.</p>';
        return;
    }
    
    let html = '<div class="table-responsive"><table class="table">';
    html += '<thead><tr><th>Öğrenci No</th><th>Ders</th><th>Not</th></tr></thead><tbody>';
    
    notlar.forEach(not => {
        html += `<tr>
            <td>${escapeHtml(not.no)}</td>
            <td>${escapeHtml(not.ders)}</td>
            <td><span class="badge bg-primary">${escapeHtml(not.puan)}</span></td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// Öğrenci form başlatma
function initializeOgrenciForm() {
    const form = document.getElementById('ogrenciForm');
    if (form) {
        form.addEventListener('submit', handleOgrenciEkle);
    }
}

// Öğrenci ekleme işlemi
function handleOgrenciEkle(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const ogrenci = {
        id: generateId(),
        ad: formData.get('ad').trim(),
        soyad: formData.get('soyad').trim(),
        numara: formData.get('numara').trim(),
        email: formData.get('email').trim(),
        bolum: formData.get('bolum'),
        createdAt: new Date().toISOString()
    };
    
    // Validasyon
    if (!validateOgrenci(ogrenci)) {
        return;
    }
    
    // Öğrenci numarası kontrolü
    const existingOgrenciler = getOgrenciler();
    if (existingOgrenciler.some(o => o.numara === ogrenci.numara)) {
        showAlert('Bu öğrenci numarası zaten kullanılıyor!', 'danger');
        return;
    }
    
    // Kaydetme
    existingOgrenciler.push(ogrenci);
    localStorage.setItem('ogrenciler', JSON.stringify(existingOgrenciler));
    
    showAlert('Öğrenci başarıyla eklendi!', 'success');
    e.target.reset();
    
    // Dashboard'a yönlendir
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Öğrenci validasyonu
function validateOgrenci(ogrenci) {
    if (!ogrenci.ad || ogrenci.ad.length < 2) {
        showAlert('Ad en az 2 karakter olmalıdır!', 'danger');
        return false;
    }
    
    if (!ogrenci.soyad || ogrenci.soyad.length < 2) {
        showAlert('Soyad en az 2 karakter olmalıdır!', 'danger');
        return false;
    }
    
    if (!ogrenci.numara || !/^\d{8,}$/.test(ogrenci.numara)) {
        showAlert('Geçerli bir öğrenci numarası giriniz!', 'danger');
        return false;
    }
    
    if (!ogrenci.email || !isValidEmail(ogrenci.email)) {
        showAlert('Geçerli bir e-posta adresi giriniz!', 'danger');
        return false;
    }
    
    if (!ogrenci.bolum) {
        showAlert('Lütfen bölüm seçiniz!', 'danger');
        return false;
    }
    
    return true;
}

// Not ekleme işlemi
function handleNotEkle(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const not = {
        id: generateId(),
        no: formData.get('no').trim(),
        ders: formData.get('ders').trim(),
        puan: parseFloat(formData.get('puan')),
        createdAt: new Date().toISOString()
    };
    
    // Validasyon
    if (!validateNot(not)) {
        return;
    }
    
    // Öğrenci kontrolü
    const ogrenciler = getOgrenciler();
    if (!ogrenciler.some(o => o.numara === not.no)) {
        showAlert('Bu öğrenci numarası bulunamadı!', 'danger');
        return;
    }
    
    // Kaydetme
    const existingNotlar = getNotlar();
    existingNotlar.push(not);
    localStorage.setItem('notlar', JSON.stringify(existingNotlar));
    
    showAlert('Not başarıyla eklendi!', 'success');
    e.target.reset();
    
    // Notları yeniden yükle
    loadNotlar();
}

// Not validasyonu
function validateNot(not) {
    if (!not.no || !/^\d{8,}$/.test(not.no)) {
        showAlert('Geçerli bir öğrenci numarası giriniz!', 'danger');
        return false;
    }
    
    if (!not.ders || not.ders.length < 2) {
        showAlert('Ders adı en az 2 karakter olmalıdır!', 'danger');
        return false;
    }
    
    if (!not.puan || not.puan < 0 || not.puan > 100) {
        showAlert('Not 0-100 arasında olmalıdır!', 'danger');
        return false;
    }
    
    return true;
}

// Notları yükle
function loadNotlar() {
    const notlar = getNotlar();
    const container = document.getElementById('notListesi');
    
    if (!container) return;
    
    if (notlar.length === 0) {
        container.innerHTML = '<p class="text-muted">Henüz not eklenmemiş.</p>';
        return;
    }
    
    let html = '<div class="table-responsive"><table class="table">';
    html += '<thead><tr><th>Öğrenci No</th><th>Ders</th><th>Not</th><th>Tarih</th><th>İşlemler</th></tr></thead><tbody>';
    
    notlar.forEach(not => {
        const date = new Date(not.createdAt).toLocaleDateString('tr-TR');
        html += `<tr>
            <td>${escapeHtml(not.no)}</td>
            <td>${escapeHtml(not.ders)}</td>
            <td><span class="badge bg-primary">${escapeHtml(not.puan)}</span></td>
            <td>${date}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteNot('${not.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// Not silme
function deleteNot(id) {
    if (!confirm('Bu notu silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    const notlar = getNotlar().filter(not => not.id !== id);
    localStorage.setItem('notlar', JSON.stringify(notlar));
    
    showAlert('Not başarıyla silindi!', 'success');
    loadNotlar();
}

// Profil yükleme
function loadProfil() {
    const ogrenciler = getOgrenciler();
    const container = document.getElementById('profilBilgi');
    
    if (!container) return;
    
    if (ogrenciler.length === 0) {
        container.innerHTML = '<p class="text-muted">Henüz öğrenci eklenmemiş.</p>';
        return;
    }
    
    const sonOgrenci = ogrenciler[ogrenciler.length - 1];
    const notlar = getNotlar().filter(not => not.no === sonOgrenci.numara);
    const ortalama = notlar.length > 0 ? 
        (notlar.reduce((sum, not) => sum + not.puan, 0) / notlar.length).toFixed(2) : 0;
    
    container.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-user me-2"></i>Öğrenci Bilgileri</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Ad Soyad:</strong> ${escapeHtml(sonOgrenci.ad)} ${escapeHtml(sonOgrenci.soyad)}</p>
                        <p><strong>Öğrenci No:</strong> ${escapeHtml(sonOgrenci.numara)}</p>
                        <p><strong>Bölüm:</strong> ${escapeHtml(sonOgrenci.bolum)}</p>
                        <p><strong>E-posta:</strong> ${escapeHtml(sonOgrenci.email)}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-chart-bar me-2"></i>Not İstatistikleri</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Toplam Not:</strong> ${notlar.length}</p>
                        <p><strong>Ortalama:</strong> ${ortalama}</p>
                        <p><strong>En Yüksek:</strong> ${notlar.length > 0 ? Math.max(...notlar.map(n => n.puan)) : 0}</p>
                        <p><strong>En Düşük:</strong> ${notlar.length > 0 ? Math.min(...notlar.map(n => n.puan)) : 0}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Yardımcı fonksiyonlar
function getOgrenciler() {
    return JSON.parse(localStorage.getItem('ogrenciler')) || [];
}

function getNotlar() {
    return JSON.parse(localStorage.getItem('notlar')) || [];
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer') || createAlertContainer();
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // 5 saniye sonra otomatik kaldır
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alertContainer';
    container.className = 'position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('login');
        window.location.href = 'login.html';
    }
}

function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('show');
    }
}

// Global fonksiyonlar (HTML'den çağrılabilir)
window.ogrenciEkle = handleOgrenciEkle;
window.notEkle = handleNotEkle;
window.deleteNot = deleteNot;
window.logout = logout;
window.toggleMobileMenu = toggleMobileMenu;
