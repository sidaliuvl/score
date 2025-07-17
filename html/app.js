// Global variables
let isMinimized = false;
let currentData = {};

// Event listeners for NUI messages
window.addEventListener("message", (event) => {
    switch (event.data.action) {
        case "open":
            openDashboard(event.data);
            setupDashboard(event.data);
            break;
        case "close":
            closeDashboard();
            break;
        case "setup":
            setupDashboard(event.data);
            break;
    }
});

// Dashboard control functions
const openDashboard = (data) => {
    currentData = data;
    const dashboard = $("#dashboard");
    const minimized = $("#dashboard-minimized");
    
    minimized.removeClass('show').hide();
    dashboard.removeClass('minimized').addClass('opening').show();
    
    updateTime();
    updateDashboardData(data);
    isMinimized = false;
};

const closeDashboard = () => {
    $("#dashboard").hide();
    $("#dashboard-minimized").removeClass('show').hide();
    $.post('https://oc-scoreboard/close', JSON.stringify({}));
    isMinimized = false;
};

const toggleMinimize = () => {
    const dashboard = $("#dashboard");
    const minimized = $("#dashboard-minimized");
    
    if (!isMinimized) {
        // Minimize
        dashboard.hide();
        minimized.addClass('show').show();
        isMinimized = true;
    } else {
        // Expand
        minimized.removeClass('show').hide();
        dashboard.show();
        isMinimized = false;
    }
};

// Data update functions
const updateDashboardData = (data) => {
    updatePopulationStats(data);
    updateServiceStats(data);
    updateCitizensRegistry(data);
    updateActivities(data);
    updateMinimizedStats(data);
};

const updatePopulationStats = (data) => {
    const totalPlayers = data.players || 0;
    const maxPlayers = 128;
    const percentage = (totalPlayers / maxPlayers) * 100;
    
    $("#total-players").text(totalPlayers);
    $("#capacity-fill").css('width', `${percentage}%`);
    
    // Add animation to the number
    animateNumber("#total-players", 0, totalPlayers, 1000);
};

const updateServiceStats = (data) => {
    const policeCount = data.currentCops || 0;
    const ambulanceCount = data.currentambulance || 0;
    
    $("#police-count").text(policeCount);
    $("#ambulance-count").text(ambulanceCount);
    
    // Update job counts from player data
    updateJobCounts(data.onlinePlayers);
    
    // Animate service numbers
    animateNumber("#police-count", 0, policeCount, 800);
    animateNumber("#ambulance-count", 0, ambulanceCount, 800);
};

const updateJobCounts = (players) => {
    const jobCounts = {
        mechanic: 0,
        taxi: 0,
        electrician: 0,
        farmer: 0
    };

    if (players && Object.keys(players).length > 0) {
        Object.values(players).forEach(player => {
            if (player.job) {
                const job = player.job.toLowerCase();
                if (jobCounts.hasOwnProperty(job)) {
                    jobCounts[job]++;
                }
            }
        });
    }

    $("#mechanic-count").text(jobCounts.mechanic);
    $("#taxi-count").text(jobCounts.taxi);
    $("#electrician-count").text(jobCounts.electrician);
    $("#farmer-count").text(jobCounts.farmer);
};

const updateCitizensRegistry = (data) => {
    let citizensHtml = "";

    if (data.onlinePlayers && Object.keys(data.onlinePlayers).length > 0) {
        let playersArray = Object.values(data.onlinePlayers);
        
        playersArray.forEach((player, index) => {
            if (player && player.id) {
                const jobClass = getJobClass(player.job);
                const pingBars = createPingBars(player.ping);
                
                citizensHtml += `
                    <div class="citizen-row" data-player-id="${player.id}" data-player-job="${(player.job || '').toLowerCase()}" style="animation-delay: ${index * 0.05}s">
                        <div class="citizen-id">${player.id}</div>
                        <div class="citizen-job">
                            <div class="job-dot ${jobClass}"></div>
                            ${player.job || 'Civilian'}
                        </div>
                        <div class="citizen-status">
                            <div class="status-dot"></div>
                            ACTIVE
                        </div>
                        <div class="citizen-ping">
                            <div class="ping-bars">${pingBars}</div>
                            <span class="ping-value">${player.ping || 0}ms</span>
                        </div>
                    </div>
                `;
            }
        });
    } else {
        citizensHtml = '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5); font-family: Orbitron;">No citizens registered</div>';
    }

    $("#registry-body").html(citizensHtml);
    
    // Add staggered animation
    $(".citizen-row").each(function(index) {
        $(this).css({
            'animation': 'fadeInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both'
        });
    });
};

const updateActivities = (data) => {
    let activitiesHtml = "";

    if (data.requiredCops && Object.keys(data.requiredCops).length > 0) {
        Object.values(data.requiredCops).forEach((activity, index) => {
            const isAvailable = data.currentCops >= activity.minimumPolice && !activity.busy;
            const lockedClass = isAvailable ? '' : 'locked';
            const lockOverlay = isAvailable ? '' : '<div class="lock-overlay"><i class="fas fa-lock"></i></div>';
            
            activitiesHtml += `
                <div class="activity-card ${lockedClass}" style="animation-delay: ${index * 0.1}s">
                    <img src="./images/${activity.image}" class="activity-image" alt="${activity.label}" />
                    <div class="activity-overlay">
                        <div class="activity-title">${activity.label}</div>
                        <div class="activity-requirements">${activity.minimumPolice}/${data.currentCops}</div>
                    </div>
                    ${lockOverlay}
                </div>
            `;
        });
    } else {
        activitiesHtml = '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5); font-family: Orbitron;">No activities available</div>';
    }

    $("#activities-container").html(activitiesHtml);
    
    // Add staggered animation
    $(".activity-card").each(function(index) {
        $(this).css({
            'animation': 'slideInRight 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both'
        });
    });
};

const updateMinimizedStats = (data) => {
    $("#mini-population").text(`${data.players || 0}/128`);
    $("#mini-police").text(data.currentCops || 0);
    $("#mini-ambulance").text(data.currentambulance || 0);
};

// Utility functions
const getJobClass = (job) => {
    if (!job) return 'default';
    
    const jobLower = job.toLowerCase();
    const jobMap = {
        'police': 'police',
        'ambulance': 'ambulance',
        'taxi': 'taxi',
        'mechanic': 'mechanic',
        'farmer': 'farmer',
        'fisherman': 'fisherman',
        'teacher': 'teacher',
        'driver': 'driver',
        'lumberjack': 'lumberjack',
        'electrician': 'electrician'
    };
    
    return jobMap[jobLower] || 'default';
};

const createPingBars = (ping) => {
    const pingValue = parseInt(ping) || 0;
    let barsHtml = '';
    let barClass = '';
    
    if (pingValue <= 50) barClass = '';
    else if (pingValue <= 100) barClass = 'medium';
    else barClass = 'high';
    
    const barCount = Math.min(4, Math.max(1, Math.ceil(pingValue / 25)));
    
    for (let i = 0; i < 4; i++) {
        const opacity = i < barCount ? '1' : '0.3';
        barsHtml += `<div class="ping-bar ${barClass}" style="opacity: ${opacity}"></div>`;
    }
    
    return barsHtml;
};

const animateNumber = (selector, start, end, duration) => {
    const element = $(selector);
    const startTime = performance.now();
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * easeOutCubic(progress));
        element.text(current);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
};

const easeOutCubic = (t) => {
    return 1 - Math.pow(1 - t, 3);
};

const updateTime = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    $("#current-time").text(timeString);
};

// Search functionality
const setupSearch = () => {
    $("#search-input").on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        
        $(".citizen-row").each(function() {
            const playerId = $(this).data('player-id') ? $(this).data('player-id').toString() : '';
            const playerJob = $(this).data('player-job') || '';
            
            const matches = playerId.includes(searchTerm) || playerJob.includes(searchTerm);
            
            if (matches) {
                $(this).fadeIn(200);
            } else {
                $(this).fadeOut(200);
            }
        });
    });
    
    // Enhanced search animations
    $("#search-input").on('focus', function() {
        $(this).parent().addClass('focused');
    }).on('blur', function() {
        $(this).parent().removeClass('focused');
    });
};

// Main setup function
const setupDashboard = (data) => {
    updateDashboardData(data);
    setupSearch();
    setupAnimations();
    
    // Update time every second
    setInterval(updateTime, 1000);
};

const setupAnimations = () => {
    // Add entrance animations with staggered delays
    $(".citizen-row").each(function(index) {
        $(this).css({
            'animation-delay': `${index * 0.03}s`,
            'animation': 'fadeInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both'
        });
    });
    
    $(".activity-card").each(function(index) {
        $(this).css({
            'animation-delay': `${index * 0.1}s`,
            'animation': 'slideInRight 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both'
        });
    });
    
    $(".service-card, .mini-service").each(function(index) {
        $(this).css({
            'animation-delay': `${index * 0.08}s`,
            'animation': 'slideInLeft 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both'
        });
    });
};

// Document ready
$(document).ready(() => {
    // Control button events
    $("#minimize-btn").click(() => {
        toggleMinimize();
    });
    
    $("#expand-btn").click(() => {
        toggleMinimize();
    });
    
    $("#close-btn, #mini-close-btn").click(() => {
        closeDashboard();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' || event.key === 'Esc') {
            closeDashboard();
        }
        if (event.key === 'Tab' && event.ctrlKey) {
            event.preventDefault();
            toggleMinimize();
        }
        if (event.key === 'm' && event.ctrlKey) {
            event.preventDefault();
            toggleMinimize();
        }
    });
    
    // Enhanced hover effects for activity cards
    $(document).on('mouseenter', '.activity-card', function() {
        if (!$(this).hasClass('locked')) {
            $(this).addClass('hovered');
        }
    }).on('mouseleave', '.activity-card', function() {
        $(this).removeClass('hovered');
    });
    
    // Service card click effects
    $(document).on('click', '.service-card, .mini-service', function() {
        $(this).addClass('clicked');
        setTimeout(() => {
            $(this).removeClass('clicked');
        }, 200);
    });
    
    // Initialize time display
    updateTime();
});