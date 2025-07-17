window.addEventListener("message", (event) => {
  switch (event.data.action) {
    case "open":
      Open(event.data);
      Setup(event.data); 
      break;
    case "close":
      Close();
      break;
    case "setup":
      Setup(event.data);
      break;
  }
});

const Open = (data) => {
  $(".scoreboard-block").fadeIn(150);
  updatePlayerCounts(data);
};

const Close = () => {
  $(".scoreboard-block").fadeOut(150);
  $.post('https://oc-scoreboard/close', JSON.stringify({}));
};

const updatePlayerCounts = (data) => {
  $("#total-players-count").text(`${data.players} / 128`);
  $("#police-count").text(`${data.currentCops} Online`);
  $("#ambulance-count").text(`${data.currentambulance} Online`);
  
  // Update other job counts based on data
  updateJobCounts(data.onlinePlayers);
};

const updateJobCounts = (players) => {
  const jobCounts = {
    mechanic: 0,
    taxi: 0,
    electrician: 0
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

  $("#mechanic-count").text(`${jobCounts.mechanic} Online`);
  $("#taxi-count").text(`${jobCounts.taxi} Online`);
  $("#electrician-count").text(`${jobCounts.electrician} Online`);
};

const getJobIndicatorClass = (job) => {
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

const Setup = (data) => {
  setupPlayerTable(data);
  setupIllegalActivities(data);
  setupSearch();
};

const setupPlayerTable = (data) => {
  let playersHtml = "";

  if (data.onlinePlayers && Object.keys(data.onlinePlayers).length > 0) {
    let playersArray = Object.values(data.onlinePlayers);
    
    playersArray.forEach((player, index) => {
      if (player && player.name && player.id) {
        const jobClass = getJobIndicatorClass(player.job);
        const pingBars = createPingBars(player.ping);
        
        playersHtml += `
          <tr data-player-id="${player.id}" data-player-name="${player.name.toLowerCase()}" data-player-job="${(player.job || '').toLowerCase()}">
            <td class="player-id">${player.id}</td>
            <td class="player-name">${player.name}</td>
            <td class="player-job">
              <div class="job-indicator ${jobClass}"></div>
              ${player.job || 'Civilian'}
            </td>
            <td>
              <div class="ping-display">
                <div class="ping-bars">${pingBars}</div>
                <span>${player.ping || 0}ms</span>
              </div>
            </td>
          </tr>
        `;
      }
    });
  } else {
    playersHtml = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">No online players</td></tr>';
  }

  $("#player-table-body").html(playersHtml);
};

const setupIllegalActivities = (data) => {
  let activitiesHtml = "";

  if (data.requiredCops && Object.keys(data.requiredCops).length > 0) {
    Object.values(data.requiredCops).forEach((activity, index) => {
      const isAvailable = data.currentCops >= activity.minimumPolice && !activity.busy;
      const lockedClass = isAvailable ? '' : 'locked';
      const lockOverlay = isAvailable ? '' : '<div class="lock-overlay"><i class="fas fa-lock"></i></div>';
      
      activitiesHtml += `
        <div class="activity-card ${lockedClass}">
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
    activitiesHtml = '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">No illegal activities available</div>';
  }

  $("#illegal-activities-list").html(activitiesHtml);
};

const setupSearch = () => {
  $("#search-input").on('input', function() {
    const searchTerm = $(this).val().toLowerCase();
    
    $("#player-table-body tr").each(function() {
      const playerId = $(this).data('player-id') ? $(this).data('player-id').toString() : '';
      const playerName = $(this).data('player-name') || '';
      const playerJob = $(this).data('player-job') || '';
      
      const matches = playerId.includes(searchTerm) || 
                     playerName.includes(searchTerm) || 
                     playerJob.includes(searchTerm);
      
      $(this).toggle(matches);
    });
  });
};

$(document).ready(() => {
  $("#exit-button").click(() => {
    Close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key === 'Esc') {
      Close();
    }
  });
});