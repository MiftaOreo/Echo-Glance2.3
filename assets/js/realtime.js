/**
 * ECHO-GLANCE — Real-Time Polling Engine
 * AJAX polling for notifications, device status, and dashboard data
 */

const EchoGlance = {
    // Configuration
    config: {
        pollingInterval: 3000,
        chartPollingInterval: 10000,
        basePath: '',
        audioEnabled: false,
    },

    // State
    state: {
        lastNotifId: 0,
        pollingTimers: [],
        audioContext: null,
        notifCount: 0,
    },

    // ============================================================
    // INITIALIZATION
    // ============================================================
    init(options = {}) {
        Object.assign(this.config, options);
        this.setupAudio();
        console.log('[ECHO-GLANCE] Real-time engine initialized');
    },

    // ============================================================
    // BLINK PATTERN REFERENCE
    // ============================================================
    BLINK_PATTERNS: {
        layer1: [
            { pattern: 'Kedip 1×, tutup mata ±2 detik', meaning: 'Konfirmasi YA', icon: '✅' },
            { pattern: 'Kedip 2× cepat, interval ≤1 detik', meaning: 'Konfirmasi TIDAK', icon: '❌' },
        ],
        layer2_trigger: 'Kedip panjang ganda (2× tutup mata 1.5 detik, jeda 0.5 detik)',
        menu: [
            'Ingin buang air kecil?',
            'Ingin buang air besar?',
            'Ingin makan?',
            'Ingin minum?',
            'Ingin tidur?',
            'Ingin ganti popok?',
            'Ingin nonton TV?',
            'Merasa sakit/nyeri?',
            'Ingin ubah posisi tubuh?',
        ]
    },

    // Mode descriptions
    MODES: {
        aktif: {
            label: 'AKTIF',
            desc: 'Semua sensor aktif — sesi terapi / kegiatan sehari-hari',
            sensors: { mata: true, mpu: true, fsr: true },
            color: 'success',
        },
        tidak_aktif: {
            label: 'TIDAK AKTIF',
            desc: 'Hanya sensor mata — pasien sedang istirahat/tidur',
            sensors: { mata: true, mpu: false, fsr: false },
            color: 'default',
        }
    },

    // ============================================================
    // DEVICE STATUS
    // ============================================================
    async fetchDeviceStatus() {
        // DUMMY DATA FOR GITHUB PAGES
        this.renderDeviceStatus({
            mode: 'aktif',
            sensors: { mata: true, mpu: true, fsr: true },
            last_updated: new Date().toISOString()
        });
    },

    renderDeviceStatus(data) {
        const mode = data.mode;
        const modeInfo = this.MODES[mode] || this.MODES.tidak_aktif;

        // Mode badge
        const badge = document.getElementById('deviceModeBadge');
        if (badge) {
            if (mode === 'aktif') {
                badge.className = 'status-badge-lg aktif';
                badge.innerHTML = '● ' + modeInfo.label;
            } else {
                badge.className = 'status-badge-lg tidak-aktif';
                badge.innerHTML = '○ ' + modeInfo.label;
            }
        }

        // Mode description
        const modeDesc = document.getElementById('deviceModeDesc');
        if (modeDesc) {
            modeDesc.textContent = modeInfo.desc;
        }

        // Sensor statuses — reflect actual mode behavior
        const sensorMap = {
            'sensorMata': { active: data.sensors.mata, modeActive: modeInfo.sensors.mata },
            'sensorMPU':  { active: data.sensors.mpu,  modeActive: modeInfo.sensors.mpu },
            'sensorFSR':  { active: data.sensors.fsr,  modeActive: modeInfo.sensors.fsr },
        };

        for (const [id, info] of Object.entries(sensorMap)) {
            const el = document.getElementById(id);
            if (el) {
                if (!info.modeActive) {
                    el.className = 'sensor-status';
                    el.style.background = '#F3F4F6';
                    el.style.color = '#9CA3AF';
                    el.textContent = 'SLEEP';
                } else if (info.active) {
                    el.className = 'sensor-status ok';
                    el.style.background = '';
                    el.style.color = '';
                    el.textContent = 'OK';
                } else {
                    el.className = 'sensor-status error';
                    el.style.background = '';
                    el.style.color = '';
                    el.textContent = 'ERROR';
                }
            }
        }

        // Last updated
        const lastUpdated = document.getElementById('deviceLastUpdated');
        if (lastUpdated && data.last_updated) {
            lastUpdated.textContent = 'Terakhir: ' + this.formatTime(data.last_updated);
        }
    },

    // ============================================================
    // NOTIFICATIONS
    // ============================================================
    async fetchNotifications(options = {}) {
        // DUMMY DATA FOR GITHUB PAGES
        const dummyData = [
            { id: 101, jenis_kebutuhan: 'Ingin minum', timestamp: new Date(Date.now() - 5000).toISOString(), is_read: 0 },
            { id: 100, jenis_kebutuhan: 'Merasa sakit/nyeri', timestamp: new Date(Date.now() - 60000).toISOString(), is_read: 1 }
        ];
        if (options.renderTarget) {
            this.renderNotifications(dummyData, options.renderTarget, options.showAction);
        }
        this.updateNotifCount(1);
        return { success: true, data: dummyData, unread_count: 1 };
    },

    renderNotifications(notifications, targetId, showAction = true) {
        const container = document.getElementById(targetId);
        if (!container) return;

        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔔</div>
                    <div class="empty-title">Tidak ada notifikasi</div>
                    <div class="empty-desc">Belum ada kebutuhan pasien saat ini</div>
                </div>`;
            return;
        }

        container.innerHTML = notifications.map((notif, idx) => {
            const urgency = this.getUrgencyClass(notif.jenis_kebutuhan);
            const icon = this.getUrgencyIcon(notif.jenis_kebutuhan);
            const layer = this.getLayer(notif.jenis_kebutuhan);
            const isNew = !notif.is_read && idx < 3;

            return `
                <div class="notif-card ${urgency} ${isNew ? 'new' : ''} animate-fadeInUp stagger-${Math.min(idx + 1, 6)}" 
                     id="notif-${notif.id}" data-id="${notif.id}">
                    <div class="notif-icon">${icon}</div>
                    <div class="notif-content">
                        <div class="notif-title">${this.escapeHtml(notif.jenis_kebutuhan)}</div>
                        <div class="notif-time">
                            ${this.formatTime(notif.timestamp)}
                            <span class="badge ${layer === 2 ? 'badge-layer2' : 'badge-layer1'}" style="font-size:0.5625rem;margin-left:6px;">
                                Layer ${layer}
                            </span>
                        </div>
                    </div>
                    ${showAction && !notif.is_read ? `
                        <div class="notif-action">
                            <button class="btn btn-sm btn-outline" onclick="EchoGlance.markAsRead(${notif.id})" title="Tandai sudah ditangani">
                                ✓
                            </button>
                        </div>
                    ` : ''}
                    ${notif.is_read ? '<div class="notif-action"><span class="badge badge-aktif" style="font-size:0.625rem;">Ditangani</span></div>' : ''}
                </div>`;
        }).join('');
    },

    getUrgencyClass(jenis) {
        const lower = jenis.toLowerCase();
        if (lower.includes('nyeri') || lower.includes('sakit')) return 'notif-urgent';
        if (lower.includes('bak') || lower.includes('bab') || lower.includes('buang air') || lower.includes('popok')) return 'notif-warning';
        if (lower.includes('makan') || lower.includes('minum') || lower.includes('tidur') || lower.includes('posisi') || lower.includes('nonton')) return 'notif-info';
        return 'notif-default';
    },

    getUrgencyIcon(jenis) {
        const lower = jenis.toLowerCase();
        if (lower.includes('nyeri') || lower.includes('sakit')) return '🔴';
        if (lower.includes('buang air kecil') || lower.includes('bak')) return '🚽';
        if (lower.includes('buang air besar') || lower.includes('bab')) return '🚽';
        if (lower.includes('popok') || lower.includes('ganti popok')) return '🩹';
        if (lower.includes('makan')) return '🍽️';
        if (lower.includes('minum')) return '💧';
        if (lower.includes('tidur')) return '😴';
        if (lower.includes('posisi') || lower.includes('ubah posisi')) return '🔄';
        if (lower.includes('nonton') || lower.includes('tv')) return '📺';
        if (lower.includes('perubahan posisi kepala')) return '🧠';
        return '📢';
    },

    /**
     * Determine layer based on notification type
     * Layer 1 = Ya/Tidak confirmations
     * Layer 2 = Menu kebutuhan selections
     */
    getLayer(jenis) {
        const lower = jenis.toLowerCase();
        // Layer 2: specific need from the menu
        const menuKeywords = ['makan', 'minum', 'tidur', 'bak', 'bab', 'buang air', 'popok', 'nonton', 'nyeri', 'sakit', 'posisi'];
        for (const kw of menuKeywords) {
            if (lower.includes(kw)) return 2;
        }
        return 1;
    },

    updateNotifCount(count) {
        const badge = document.getElementById('notifCountBadge');
        if (badge) {
            badge.textContent = count;
            badge.className = 'notification-count' + (count === 0 ? ' zero' : '');
        }
        this.state.notifCount = count;
    },

    onNewNotification(notif) {
        if (this.config.audioEnabled) {
            this.playNotifSound();
        }
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('ECHO-GLANCE', {
                body: notif.jenis_kebutuhan,
                icon: 'assets/img/logo_echo_glance.png'
            });
        }
    },

    async markAsRead(notifId) {
        try {
            const res = await fetch(`${this.config.basePath}api/mark_read.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: notifId })
            });
            const json = await res.json();
            if (json.success) {
                const card = document.getElementById(`notif-${notifId}`);
                if (card) {
                    card.classList.remove('new');
                    const actionDiv = card.querySelector('.notif-action');
                    if (actionDiv) {
                        actionDiv.innerHTML = '<span class="badge badge-aktif" style="font-size:0.625rem;">Ditangani</span>';
                    }
                }
                this.fetchNotifications({ unread: true, renderTarget: null });
            }
        } catch (err) {
            console.error('[ECHO-GLANCE] Mark read error:', err);
        }
    },

    // ============================================================
    // HISTORY TABLE
    // ============================================================
    async fetchHistory(options = {}) {
        // DUMMY DATA FOR GITHUB PAGES
        const dummyData = [
            { timestamp: new Date().toISOString(), command_text: 'Menu > Minum', layer: 'layer_2', response_time_ms: 850 },
            { timestamp: new Date(Date.now()-10000).toISOString(), command_text: 'Konfirmasi YA', layer: 'layer_1', response_time_ms: 400 },
        ];
        if (options.renderTarget) {
            this.renderHistoryTable(dummyData, options.renderTarget, options.startNo || 1);
            if (options.paginationTarget) {
                this.renderPagination(1, 1, options.paginationTarget, options.onPageChange);
            }
        }
        return { success: true, data: dummyData, page: 1, total_pages: 1 };
    },

    renderHistoryTable(data, targetId, startNo = 1) {
        const tbody = document.getElementById(targetId);
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:2rem;">Tidak ada data</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map((item, idx) => {
            const layerClass = item.layer === 'layer_1' ? 'row-layer1' : 'row-layer2';
            const layerLabel = item.layer === 'layer_1' ? 'Layer 1 — Ya/Tidak' : 'Layer 2 — Menu';
            const layerBadge = item.layer === 'layer_1'
                ? '<span class="badge badge-layer1">Layer 1</span>'
                : '<span class="badge badge-layer2">Layer 2</span>';

            let rtClass = 'fast';
            if (item.response_time_ms > 1500) rtClass = 'slow';
            else if (item.response_time_ms > 1000) rtClass = 'medium';

            return `
                <tr class="${layerClass}">
                    <td>${startNo + idx}</td>
                    <td>${this.formatDateTime(item.timestamp)}</td>
                    <td><strong>${this.escapeHtml(item.command_text)}</strong></td>
                    <td>${layerBadge}</td>
                    <td><span class="response-time ${rtClass}">${item.response_time_ms} ms</span></td>
                </tr>`;
        }).join('');
    },

    renderPagination(currentPage, totalPages, targetId, onPageChange) {
        const container = document.getElementById(targetId);
        if (!container || totalPages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        let html = '';
        html += `<button class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} 
                  onclick="${onPageChange}(${currentPage - 1})">‹</button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" 
                          onclick="${onPageChange}(${i})">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += `<span class="page-btn" style="border:none;cursor:default;">…</span>`;
            }
        }

        html += `<button class="page-btn" ${currentPage >= totalPages ? 'disabled' : ''} 
                  onclick="${onPageChange}(${currentPage + 1})">›</button>`;

        container.innerHTML = html;
    },

    // ============================================================
    // KELUARGA HISTORY TABLE
    // ============================================================
    async fetchKeluargaHistory(options = {}) {
        // DUMMY DATA FOR GITHUB PAGES
        const dummyData = [
            { id: 101, jenis_kebutuhan: 'Ingin minum', timestamp: new Date(Date.now() - 5000).toISOString(), is_read: 0 },
            { id: 100, jenis_kebutuhan: 'Merasa sakit/nyeri', timestamp: new Date(Date.now() - 60000).toISOString(), is_read: 1 }
        ];
        if (options.renderTarget) {
            this.renderKeluargaTable(dummyData, options.renderTarget);
            if (options.paginationTarget) {
                this.renderPagination(1, 1, options.paginationTarget, options.onPageChange);
            }
        }
        return { success: true, data: dummyData, page: 1, total_pages: 1 };
    },

    renderKeluargaTable(data, targetId) {
        const tbody = document.getElementById(targetId);
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding:2rem;">Tidak ada data hari ini</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => {
            const statusClass = item.is_read ? 'yes' : 'no';
            const statusText = item.is_read ? '✓ Ditangani' : '— Belum';
            const urgencyBadge = this.getUrgencyBadge(item.jenis_kebutuhan);
            const layer = this.getLayer(item.jenis_kebutuhan);

            return `
                <tr>
                    <td>${this.formatTime(item.timestamp)}</td>
                    <td>
                        ${urgencyBadge} ${this.escapeHtml(item.jenis_kebutuhan)}
                        <span class="badge ${layer === 2 ? 'badge-layer2' : 'badge-layer1'}" style="font-size:0.5625rem;margin-left:4px;">L${layer}</span>
                    </td>
                    <td><span class="status-handled ${statusClass}">${statusText}</span></td>
                    <td>
                        ${!item.is_read ? `<button class="btn btn-sm btn-outline" onclick="EchoGlance.markAsRead(${item.id})">Tangani</button>` : ''}
                    </td>
                </tr>`;
        }).join('');
    },

    getUrgencyBadge(jenis) {
        const lower = jenis.toLowerCase();
        if (lower.includes('nyeri') || lower.includes('sakit')) return '<span class="badge badge-urgent" style="font-size:0.625rem;">Urgent</span>';
        if (lower.includes('bak') || lower.includes('bab') || lower.includes('buang air') || lower.includes('popok')) return '<span class="badge badge-warning" style="font-size:0.625rem;">Perlu</span>';
        return '';
    },

    // ============================================================
    // POLLING ENGINE
    // ============================================================
    startPolling(callbacks, interval) {
        const timer = setInterval(() => {
            callbacks.forEach(cb => cb());
        }, interval || this.config.pollingInterval);
        this.state.pollingTimers.push(timer);
        return timer;
    },

    stopAllPolling() {
        this.state.pollingTimers.forEach(timer => clearInterval(timer));
        this.state.pollingTimers = [];
    },

    // ============================================================
    // AUDIO (Web Audio API)
    // ============================================================
    setupAudio() {
        try {
            this.state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('[ECHO-GLANCE] Web Audio API not supported');
        }
    },

    playNotifSound() {
        if (!this.state.audioContext) return;
        const ctx = this.state.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);

        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.frequency.value = 1100;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.3, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.4);
        }, 200);
    },

    toggleAudio() {
        this.config.audioEnabled = !this.config.audioEnabled;
        const btn = document.getElementById('audioToggleBtn');
        if (btn) {
            btn.classList.toggle('active', this.config.audioEnabled);
            btn.innerHTML = this.config.audioEnabled ? '🔊 Suara Aktif' : '🔇 Suara Mati';
        }
        if (this.config.audioEnabled && this.state.audioContext && this.state.audioContext.state === 'suspended') {
            this.state.audioContext.resume();
        }
    },

    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================
    async adminAction(action, userId) {
        if (!confirm(`Apakah Anda yakin ingin ${action === 'approve' ? 'menyetujui' : 'menolak'} akun ini?`)) {
            return;
        }
        try {
            const res = await fetch(`${this.config.basePath}api/admin_action.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, user_id: userId })
            });
            const json = await res.json();
            if (json.success) {
                const row = document.getElementById(`pending-row-${userId}`);
                if (row) {
                    row.style.transition = 'opacity 0.3s, transform 0.3s';
                    row.style.opacity = '0';
                    row.style.transform = 'translateX(20px)';
                    setTimeout(() => row.remove(), 300);
                }
                this.showToast(json.message, 'success');
            } else {
                this.showToast(json.message || 'Gagal memproses aksi.', 'danger');
            }
        } catch (err) {
            this.showToast('Terjadi kesalahan jaringan.', 'danger');
        }
    },

    // ============================================================
    // TOAST NOTIFICATIONS
    // ============================================================
    showToast(message, type = 'info') {
        document.querySelectorAll('.toast').forEach(t => t.remove());
        const toast = document.createElement('div');
        toast.className = `toast alert alert-${type}`;
        toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'danger' ? '❌' : 'ℹ️'}</span><span>${message}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 50);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // ============================================================
    // UTILITIES
    // ============================================================
    formatTime(datetime) {
        if (!datetime) return '-';
        const d = new Date(datetime);
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    },

    formatDateTime(datetime) {
        if (!datetime) return '-';
        const d = new Date(datetime);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
               ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    requestNotifPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
};

window.EchoGlance = EchoGlance;
