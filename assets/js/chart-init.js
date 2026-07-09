/**
 * ECHO-GLANCE — Chart Initialization (Chart.js)
 * MPU6050 Line Chart & FSR402 Mixed (Bar + Line) Chart
 */

const EchoCharts = {
    charts: {},

    // ============================================================
    // MPU6050 LINE CHART
    // ============================================================
    async initMPUChart(canvasId, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const data = await this.fetchMPUData(options);
        if (!data) return;

        const labels = data.map(d => {
            const date = new Date(d.timestamp);
            return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        });

        const pitchData = data.map(d => parseFloat(d.pitch));
        const rollData = data.map(d => parseFloat(d.roll));

        // Find event annotations (pitch or roll > 15°)
        const annotations = {};
        data.forEach((d, i) => {
            if (d.event_label) {
                annotations[`event${i}`] = {
                    type: 'point',
                    xValue: i,
                    yValue: parseFloat(d.pitch),
                    backgroundColor: 'rgba(242, 114, 30, 0.8)',
                    borderColor: '#F2721E',
                    borderWidth: 2,
                    radius: 8,
                    pointStyle: 'triangle',
                };
            }
        });

        if (this.charts.mpu) {
            this.charts.mpu.destroy();
        }

        this.charts.mpu = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Pitch (°)',
                        data: pitchData,
                        borderColor: '#2541B2',
                        backgroundColor: 'rgba(37, 65, 178, 0.08)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#2541B2',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                    },
                    {
                        label: 'Roll (°)',
                        data: rollData,
                        borderColor: '#F2721E',
                        backgroundColor: 'rgba(242, 114, 30, 0.08)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#F2721E',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                plugins: {
                    legend: {
                        display: false, // Using custom legend
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 46, 0.9)',
                        titleFont: { family: 'Inter', size: 12, weight: '600' },
                        bodyFont: { family: 'Inter', size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            afterBody: function(context) {
                                const idx = context[0].dataIndex;
                                if (data[idx] && data[idx].event_label) {
                                    return '\n⚠ ' + data[idx].event_label;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { family: 'Inter', size: 11 },
                            color: '#9CA3AF',
                            maxRotation: 45,
                            maxTicksLimit: 12,
                        },
                        border: { display: false },
                    },
                    y: {
                        grid: {
                            color: 'rgba(229, 231, 235, 0.5)',
                            drawBorder: false,
                        },
                        ticks: {
                            font: { family: 'Inter', size: 11 },
                            color: '#9CA3AF',
                            callback: v => v + '°',
                        },
                        border: { display: false },
                        title: {
                            display: true,
                            text: 'Derajat Sudut (°)',
                            font: { family: 'Inter', size: 11, weight: '500' },
                            color: '#6B7280',
                        }
                    }
                }
            }
        });
    },

    async fetchMPUData(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.range) params.set('range', options.range);
            if (options.from) params.set('from', options.from);
            if (options.to) params.set('to', options.to);

            const res = await fetch(`api/get_mpu_data.php?${params}`);
            const json = await res.json();
            return json.success ? json.data : null;
        } catch (err) {
            console.error('[ECHO-GLANCE] MPU data fetch error:', err);
            return null;
        }
    },

    // ============================================================
    // FSR402 MIXED CHART (Bar + Line Baseline)
    // ============================================================
    async initFSRChart(canvasId, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const result = await this.fetchFSRData(options);
        if (!result) return;

        const data = result.data;
        const baseline = result.baseline;

        const labels = data.map(d => {
            const dateStr = new Date(d.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
            return `${dateStr} (${d.sesi_label})`;
        });

        const forceData = data.map(d => parseFloat(d.gaya_rata_rata));
        const barColors = forceData.map(f => f >= baseline ? 'rgba(22, 163, 74, 0.7)' : 'rgba(220, 38, 38, 0.7)');
        const barBorders = forceData.map(f => f >= baseline ? '#16A34A' : '#DC2626');

        // Baseline line (horizontal)
        const baselineData = new Array(labels.length).fill(baseline);

        if (this.charts.fsr) {
            this.charts.fsr.destroy();
        }

        this.charts.fsr = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Gaya Rata-rata (gram)',
                        data: forceData,
                        backgroundColor: barColors,
                        borderColor: barBorders,
                        borderWidth: 1.5,
                        borderRadius: 6,
                        barPercentage: 0.6,
                        order: 2,
                    },
                    {
                        label: `Baseline (${baseline} g)`,
                        data: baselineData,
                        type: 'line',
                        borderColor: '#DC2626',
                        borderWidth: 2,
                        borderDash: [6, 4],
                        pointRadius: 0,
                        fill: false,
                        order: 1,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 46, 0.9)',
                        titleFont: { family: 'Inter', size: 12, weight: '600' },
                        bodyFont: { family: 'Inter', size: 12 },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            afterBody: function(context) {
                                const idx = context[0].dataIndex;
                                if (data[idx]) {
                                    return `\nGerakan/mnt: ${data[idx].jumlah_gerakan}\nStd Dev: ${parseFloat(data[idx].standar_deviasi).toFixed(1)}`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { family: 'Inter', size: 10 },
                            color: '#9CA3AF',
                            maxRotation: 45,
                        },
                        border: { display: false },
                    },
                    y: {
                        grid: {
                            color: 'rgba(229, 231, 235, 0.5)',
                            drawBorder: false,
                        },
                        ticks: {
                            font: { family: 'Inter', size: 11 },
                            color: '#9CA3AF',
                            callback: v => v + ' g',
                        },
                        border: { display: false },
                        title: {
                            display: true,
                            text: 'Gaya Rata-rata (gram)',
                            font: { family: 'Inter', size: 11, weight: '500' },
                            color: '#6B7280',
                        }
                    }
                }
            }
        });

        // Update metric cards
        this.updateFSRMetrics(result.today_stats);
    },

    async fetchFSRData(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.from) params.set('from', options.from);
            if (options.to) params.set('to', options.to);

            const res = await fetch(`api/get_fsr_data.php?${params}`);
            const json = await res.json();
            return json.success ? json : null;
        } catch (err) {
            console.error('[ECHO-GLANCE] FSR data fetch error:', err);
            return null;
        }
    },

    updateFSRMetrics(stats) {
        const avgForce = document.getElementById('metricAvgForce');
        const avgMov = document.getElementById('metricAvgMovements');
        const avgStd = document.getElementById('metricStdDev');

        if (avgForce) avgForce.textContent = stats.avg_force + ' g';
        if (avgMov) avgMov.textContent = stats.avg_movements;
        if (avgStd) avgStd.textContent = stats.avg_std_dev;
    },

    // ============================================================
    // REFRESH CHARTS WITH DATE RANGE
    // ============================================================
    async refreshCharts(from, to) {
        await this.initMPUChart('mpuChart', { from, to });
        await this.initFSRChart('fsrChart', { from, to });
    },

    // Destroy all charts
    destroyAll() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
};

window.EchoCharts = EchoCharts;
