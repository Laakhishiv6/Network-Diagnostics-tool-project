let currentTool = 'speedtest';
let testHistory = JSON.parse(localStorage.getItem('networkTestHistory')) || [];

// Initialize the dashboard
function initDashboard() {
    showTool('speedtest');
    loadQuickStats();
}

// Show specific tool
function showTool(toolName) {
    // Hide all tool sections
    document.querySelectorAll('.tool-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all tool cards
    document.querySelectorAll('.tool-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Show selected tool
    document.getElementById(toolName).classList.add('active');
    document.querySelector(`[onclick="showTool('${toolName}')"]`).classList.add('active');
    
    currentTool = toolName;
    
    // Load tool-specific data
    if (toolName === 'networkinfo') {
        loadNetworkInfo();
    }
}

// Speed Test Function
async function startSpeedTest() {
    const resultDiv = document.getElementById("speedtestResult");
    const loadingDiv = document.getElementById("speedtestLoading");
    const progressBar = document.getElementById("speedtestProgress");
    const startBtn = document.querySelector("#speedtest .btn");
    
    // Reset and show loading
    resultDiv.style.display = "none";
    loadingDiv.style.display = "block";
    startBtn.disabled = true;
    startBtn.innerHTML = "Testing...";
    progressBar.style.width = "0%";
    
    try {
        updateProgress(progressBar, 20);
        
        const response = await fetch('/api/speedtest');
        updateProgress(progressBar, 80);
        
        const data = await response.json();
        updateProgress(progressBar, 100);
        
        if (data.error) {
            showError(resultDiv, data.error);
        } else {
            displaySpeedTestResults(resultDiv, data);
            saveToHistory('speedtest', data);
            loadQuickStats();
        }
    } catch (error) {
        showError(resultDiv, error.message);
    } finally {
        setTimeout(() => {
            loadingDiv.style.display = "none";
            startBtn.disabled = false;
            startBtn.innerHTML = "Start Speed Test";
        }, 1000);
    }
}

// Ping Tool
async function startPingTest() {
    const host = document.getElementById('pingHost').value || '8.8.8.8';
    const count = document.getElementById('pingCount').value || 4;
    const resultDiv = document.getElementById("pingResult");
    const loadingDiv = document.getElementById("pingLoading");
    
    resultDiv.innerHTML = '';
    loadingDiv.style.display = 'block';
    
    try {
        const response = await fetch('/api/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host, count })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultDiv.innerHTML = `<div class="terminal">${formatTerminalOutput(data.output)}</div>`;
        } else {
            resultDiv.innerHTML = `<div class="error">Ping failed: ${data.error}</div>`;
        }
        
        saveToHistory('ping', { host, count, ...data });
    } catch (error) {
        resultDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Traceroute Tool
async function startTraceroute() {
    const host = document.getElementById('tracerouteHost').value || 'google.com';
    const resultDiv = document.getElementById("tracerouteResult");
    const loadingDiv = document.getElementById("tracerouteLoading");
    
    resultDiv.innerHTML = '';
    loadingDiv.style.display = 'block';
    
    try {
        const response = await fetch('/api/traceroute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultDiv.innerHTML = `<div class="terminal">${formatTerminalOutput(data.output)}</div>`;
        } else {
            resultDiv.innerHTML = `<div class="error">Traceroute failed: ${data.error}</div>`;
        }
        
        saveToHistory('traceroute', { host, ...data });
    } catch (error) {
        resultDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Port Scan Tool
async function startPortScan() {
    const host = document.getElementById('portScanHost').value || 'google.com';
    const port = parseInt(document.getElementById('portScanPort').value) || 80;
    const resultDiv = document.getElementById("portScanResult");
    const loadingDiv = document.getElementById("portScanLoading");
    
    resultDiv.innerHTML = '';
    loadingDiv.style.display = 'block';
    
    try {
        const response = await fetch('/api/portscan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host, port })
        });
        
        const data = await response.json();
        
        if (data.error) {
            resultDiv.innerHTML = `<div class="error">Port scan failed: ${data.error}</div>`;
        } else {
            const statusClass = data.open ? 'port-open' : 'port-closed';
            resultDiv.innerHTML = `
                <div class="result-card">
                    <h3>Port Scan Results</h3>
                    <p><strong>Host:</strong> ${data.host}</p>
                    <p><strong>Port:</strong> ${data.port}</p>
                    <p><strong>Status:</strong> <span class="port-status ${statusClass}">${data.status}</span></p>
                </div>
            `;
        }
        
        saveToHistory('portscan', { host, port, ...data });
    } catch (error) {
        resultDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// DNS Lookup Tool
async function startDNSLookup() {
    const domain = document.getElementById('dnsDomain').value || 'google.com';
    const resultDiv = document.getElementById("dnsResult");
    const loadingDiv = document.getElementById("dnsLoading");
    
    resultDiv.innerHTML = '';
    loadingDiv.style.display = 'block';
    
    try {
        const response = await fetch('/api/dns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain })
        });
        
        const data = await response.json();
        
        if (data.error) {
            resultDiv.innerHTML = `<div class="error">DNS lookup failed: ${data.error}</div>`;
        } else {
            let ipsHTML = data.ips.map(ip => `<div class="terminal-line">${ip}</div>`).join('');
            resultDiv.innerHTML = `
                <div class="result-card">
                    <h3>DNS Lookup Results</h3>
                    <p><strong>Domain:</strong> ${data.domain}</p>
                    <p><strong>Found IPs:</strong> ${data.count}</p>
                    <div class="terminal">${ipsHTML}</div>
                </div>
            `;
        }
        
        saveToHistory('dns', { domain, ...data });
    } catch (error) {
        resultDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Website Status Checker
async function checkWebsiteStatus() {
    const url = document.getElementById('websiteUrl').value || 'https://google.com';
    const resultDiv = document.getElementById("websiteResult");
    const loadingDiv = document.getElementById("websiteLoading");
    
    resultDiv.innerHTML = '';
    loadingDiv.style.display = 'block';
    
    try {
        const response = await fetch('/api/website', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        
        if (data.error) {
            resultDiv.innerHTML = `<div class="error">Website check failed: ${data.error}</div>`;
        } else {
            const statusClass = data.status_code === 200 ? 'status-online' : 'status-warning';
            resultDiv.innerHTML = `
                <div class="result-card">
                    <h3>Website Status</h3>
                    <p><span class="status-indicator ${statusClass}"></span><strong>Status:</strong> ${data.status} (${data.status_code})</p>
                    <p><strong>URL:</strong> ${data.url}</p>
                    <p><strong>Response Time:</strong> ${data.response_time} ms</p>
                </div>
            `;
        }
        
        saveToHistory('website', { url, ...data });
    } catch (error) {
        resultDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Network Information
async function loadNetworkInfo() {
    const resultDiv = document.getElementById("networkInfoResult");
    const loadingDiv = document.getElementById("networkInfoLoading");
    
    resultDiv.innerHTML = '';
    loadingDiv.style.display = 'block';
    
    try {
        const response = await fetch('/api/networkinfo');
        const data = await response.json();
        
        if (data.error) {
            resultDiv.innerHTML = `<div class="error">Failed to load network info: ${data.error}</div>`;
        } else {
            displayNetworkInfo(resultDiv, data);
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Display Functions
function displaySpeedTestResults(container, data) {
    const { speed_results, ip_info, network_info, test_duration } = data;
    
    const downloadQuality = getSpeedQuality(speed_results.download_speed, 'download');
    const uploadQuality = getSpeedQuality(speed_results.upload_speed, 'upload');
    const pingQuality = getPingQuality(speed_results.ping);
    
    container.innerHTML = `
        <div class="result-grid">
            <div class="result-card">
                <h3>Download Speed</h3>
                <div class="speed-value">${speed_results.download_speed}</div>
                <div class="speed-unit">Mbps</div>
                <div class="quality ${downloadQuality}">${downloadQuality.toUpperCase()}</div>
            </div>
            
            <div class="result-card">
                <h3>Upload Speed</h3>
                <div class="speed-value">${speed_results.upload_speed}</div>
                <div class="speed-unit">Mbps</div>
                <div class="quality ${uploadQuality}">${uploadQuality.toUpperCase()}</div>
            </div>
            
            <div class="result-card">
                <h3>Ping</h3>
                <div class="speed-value">${speed_results.ping}</div>
                <div class="speed-unit">ms</div>
                <div class="quality ${pingQuality}">${pingQuality.toUpperCase()}</div>
            </div>
        </div>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>Connection Details</h3>
                <div class="detail-item">
                    <span class="detail-label">IP Address:</span>
                    <span class="detail-value">${ip_info.ip}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">ISP:</span>
                    <span class="detail-value">${ip_info.org}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">${ip_info.city}, ${ip_info.region}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Test Server:</span>
                    <span class="detail-value">${speed_results.server}</span>
                </div>
            </div>
            
            <div class="info-card">
                <h3>System Information</h3>
                <div class="detail-item">
                    <span class="detail-label">Hostname:</span>
                    <span class="detail-value">${network_info.hostname}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Local IP:</span>
                    <span class="detail-value">${network_info.local_ip}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Platform:</span>
                    <span class="detail-value">${network_info.platform}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Test Duration:</span>
                    <span class="detail-value">${test_duration}s</span>
                </div>
            </div>
        </div>
    `;
    container.style.display = 'block';
}

function displayNetworkInfo(container, data) {
    const { ip_info, network_info } = data;
    
    container.innerHTML = `
        <div class="info-grid">
            <div class="info-card">
                <h3>Public IP Information</h3>
                ${Object.entries(ip_info).map(([key, value]) => `
                    <div class="detail-item">
                        <span class="detail-label">${formatKey(key)}:</span>
                        <span class="detail-value">${value}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="info-card">
                <h3>Local System Information</h3>
                ${Object.entries(network_info).map(([key, value]) => `
                    <div class="detail-item">
                        <span class="detail-label">${formatKey(key)}:</span>
                        <span class="detail-value">${value}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Utility Functions
function updateProgress(progressBar, percentage) {
    progressBar.style.width = percentage + "%";
}

function showError(container, errorMessage) {
    container.innerHTML = `
        <div class="error">
            <h3>Test Failed</h3>
            <p>${errorMessage}</p>
        </div>
    `;
    container.style.display = "block";
}

function formatTerminalOutput(output) {
    return output.split('\n').map(line => 
        `<div class="terminal-line">${line}</div>`
    ).join('');
}

function formatKey(key) {
    return key.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function getSpeedQuality(speed, type) {
    if (type === 'download') {
        if (speed > 50) return 'excellent';
        if (speed > 25) return 'good';
        if (speed > 10) return 'fair';
        return 'poor';
    } else {
        if (speed > 20) return 'excellent';
        if (speed > 10) return 'good';
        if (speed > 5) return 'fair';
        return 'poor';
    }
}

function getPingQuality(ping) {
    if (ping < 30) return 'excellent';
    if (ping < 60) return 'good';
    if (ping < 100) return 'fair';
    return 'poor';
}

function saveToHistory(tool, data) {
    const testResult = {
        tool,
        data,
        timestamp: new Date().toISOString(),
        id: Date.now()
    };
    
    testHistory.unshift(testResult);
    testHistory = testHistory.slice(0, 20); // Keep last 20 tests
    
    localStorage.setItem('networkTestHistory', JSON.stringify(testHistory));
}

function loadQuickStats() {
    const stats = calculateQuickStats();
    const statsContainer = document.getElementById('quickStats');
    
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.totalTests}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.avgDownload || 'N/A'}</div>
                <div class="stat-label">Avg Download (Mbps)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.avgPing || 'N/A'}</div>
                <div class="stat-label">Avg Ping (ms)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.lastTest}</div>
                <div class="stat-label">Last Test</div>
            </div>
        `;
    }
}

function calculateQuickStats() {
    const speedTests = testHistory.filter(test => test.tool === 'speedtest');
    const totalTests = testHistory.length;
    
    let avgDownload = null;
    let avgPing = null;
    
    if (speedTests.length > 0) {
        avgDownload = (speedTests.reduce((sum, test) => 
            sum + test.data.speed_results.download_speed, 0) / speedTests.length).toFixed(1);
        avgPing = (speedTests.reduce((sum, test) => 
            sum + test.data.speed_results.ping, 0) / speedTests.length).toFixed(1);
    }
    
    const lastTest = testHistory.length > 0 ? 
        new Date(testHistory[0].timestamp).toLocaleDateString() : 'Never';
    
    return { totalTests, avgDownload, avgPing, lastTest };
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initDashboard);