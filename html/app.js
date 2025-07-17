// Global variables
let isMinimized = false;
let currentData = {};

// Event listeners for NUI messages
window.addEventListener("message", (event) => {
    switch (event.data.action) {
        case "open":
            openScoreboard(event.data);
            break;
        case "close":
            closeScoreboard();
            break;
        case "setup":
            updateScoreboardData(event.data);
            break;
    }
});

// Scoreboard control functions
const openScoreboard = (data) => {
    currentData = data;
    const scoreboard = $("#scoreboard");
    const mini = $("#scoreboard-mini");
    
    mini.removeClass('show').hide();
    scoreboard.addClass('show').show();
    
    updateScoreboardData(data);
    isMinimized = false;
};

const closeScoreboard = () => {
    $("#scoreboard").removeClass('show').hide();
    $("#scoreboard-mini").removeClass('show').hide();
    $.post('https://oc-scoreboard/close', JSON.stringify({}));
    isMinimized = false;
};

const toggleMinimize = () => {
    const scoreboard = $("#scoreboard");
    const mini = $("#scoreboard-mini");
    
    if (!isMinimized) {
        // Minimize
        scoreboard.removeClass('show').hide();
        mini.addClass('show').show();
        isMinimized = true;
    } else {
        // Expand
        mini.removeClass('show').hide();
        scoreboard.addClass('show').show();
        isMinimized = false;
    }
};

// Data update functions
const updateScoreboardData = (data) => {
    updatePlayerCount(data);
    updateJobStats(data);
    updatePlayersList(data);
    updateMiniStats(data);
};

const updatePlayerCount = (data) => {
    const totalPlayers = data.players || 0;
    $("#current-players").text(totalPlayers);
    
    // Animate number
    animateNumber("#current-players", 0, totalPlayers, 800);
};

const updateJobStats = (data) => {
    const policeCount = data.currentCops || 0;
    const ambulanceCount = data.currentambulance || 0;
    
    $("#police-count").text(policeCount);
    $("#ambulance-count").text(ambulanceCount);
    
    // Update other job counts from player data
    updateOtherJobCounts(data.onlinePlayers);
    
    // Animate numbers
    animateNumber("#police-count", 0, policeCount, 600);
    animateNumber("#ambulance-count", 0, ambulanceCount, 600);
};

const updateOtherJobCounts = (players) => {
    const jobCounts = {
        mechanic: 0,
        taxi: 0
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
};

const updatePlayersList = (data) => {
    let playersHtml = "";

    if (data.onlinePlayers && Object.keys(data.onlinePlayers).length > 0) {
        let playersArray = Object.values(data.onlinePlayers);
        
        playersArray.forEach((player, index) => {
            if (player && player.id) {
                const jobClass = getJobClass(player.job);
                const pingBars = createPingBars(player.ping);
                
                playersHtml += `
                    <div class="player-row" data-player-id="${player.id}" data-player-job="${(player.job || '').toLowerCase()}" style="animation-delay: ${index * 0.02}s">
                        <div class="player-id">${player.id}</div>
                        <div class="player-job">
                            <div class="job-dot ${jobClass}"></div>
                            ${player.job || 'Civilian'}
                        </div>
                        <div class="player-status">
                            <div class="status-dot"></div>
                            Online
                        </div>
                        <div class="player-ping">
                            <div class="ping-bars">${pingBars}</div>
                            <span class="ping-value">${player.ping || 0}ms</span>
                        </div>
                    </div>
                `;
            }
        });
    } else {
        playersHtml = '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">No players online</div>';
    }

    $("#players-list").html(playersHtml);
    
    // Add entrance animation
    $(".player-row").each(function(index) {
        $(this).css({
            'animation': `slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.02}s both`
        });
    });
};

const updateMiniStats = (data) => {
    $("#mini-players").text(`${data.players || 0}/128`);
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

// Search functionality
const setupSearch = () => {
    $("#search-input").on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        
        $(".player-row").each(function() {
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
};

// Document ready
$(document).ready(() => {
    // Control button events
    $("#close-btn").click(() => {
        closeScoreboard();
    });
    
    $("#expand-btn").click(() => {
        toggleMinimize();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' || event.key === 'Esc') {
            closeScoreboard();
        }
        if (event.key === 'Tab' && event.ctrlKey) {
            event.preventDefault();
            toggleMinimize();
        }
    });
    
    // Setup search functionality
    setupSearch();
    
    // Enhanced hover effects
    $(document).on('mouseenter', '.job-card', function() {
        $(this).addClass('hovered');
    }).on('mouseleave', '.job-card', function() {
        $(this).removeClass('hovered');
    });
    
    $(document).on('mouseenter', '.player-row', function() {
        $(this).addClass('hovered');
    }).on('mouseleave', '.player-row', function() {
        $(this).removeClass('hovered');
    });
});