window.addEventListener("message", (event) => {
  // console.log("Received event:", event);
  switch (event.data.action) {
    case "open":
      // console.log("Opening scoreboard with data:", event.data);
      Open(event.data);
      Setup(event.data); 
      break;
    case "close":
      // console.log("Closing scoreboard.");
      Close();
      break;
    case "setup":
      // console.log("Setting up scoreboard with data:", event.data);
      Setup(event.data);
      break;
  }
});

const Open = (data) => {
  // console.log("currentambulance", data.currentambulance);
  $(".scoreboard-block").fadeIn(150);
  $("#total-players").text(data.players);
  $("#total-in-scope").text(data.currentambulance);
  $("#total-police").text(data.currentCops); 
};

const Close = () => {
  // console.log("Close function called.");
  $(".scoreboard-block").fadeOut(150);
  $.post('https://oc-scoreboard/close', JSON.stringify({}));
};

const Setup = (data) => {
  // console.log("Setup function called with data:", data);
  let onlinePlayersHtml = "";
  let disconnectedPlayersHtml = "";
  let illegalActionsHtml = "";

  // console.log((JSON.stringify(data.onlinePlayers)))

  // Online players section
// Online players section
if (data.onlinePlayers && Object.keys(data.onlinePlayers).length > 0) {
  let playersArray = Object.values(data.onlinePlayers);
  for (let index = 0; index < playersArray.length; index++) {
    let player = playersArray[index];
    if (player && player.name && player.id && player.discord) {
      onlinePlayersHtml += `
        <div class="player-row" data-type=${index}>
          <div class="player-icon-container">
            <i class="fas fa-user player-icon"></i>
          </div>
          <div class="player-list-item">
            <div class="player-name">
              <p>ID: ${player.id}</p>
              <p>Name: ${player.name}</p>
              <p>
                Ping: <i class="fas fa-signal ping-icon"></i> ${player.ping || 0}ms
              </p>
            </div>
            <div class="player-discord">
              <p id="discord-${index}">${player.discord}</p>
              <button class="copy-btn" data-clipboard-text="${player.discord}">
                <i class="fas fa-copy copy-icon"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }
} else {
  onlinePlayersHtml = "<p>No online players.</p>";
}

// Disconnected players section with crash reason
if (data.disconnectedPlayers && data.disconnectedPlayers.length > 0) {
  for (let index = 0; index < data.disconnectedPlayers.length; index++) {
    let player = data.disconnectedPlayers[index];
    if (player && player.name && player.id && player.discord) {
      disconnectedPlayersHtml += `
        <div class="player-row" data-type=${index}>
          <div class="player-icon-container">
            <i class="fas fa-user player-icon"></i>
          </div>
          <div class="player-list-item">
            <div class="player-name">
              <p>PLAYER [${player.id}]</p>
            </div>
            <div class="player-discord">
              <p id="discord-disc-${index}">${player.discord}</p>
              <button class="copy-btn" data-clipboard-text="${player.discord}">
                <i class="fas fa-copy copy-icon"></i>
              </button>
              <button class="reason-btn" data-reason="${player.reason}">
                <i class="fas fa-info-circle reason-icon"></i> Reason
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }
} else {
  disconnectedPlayersHtml = "<p>No disconnected players.</p>";
}

  // Illegal actions section
  if (data.requiredCops && Object.keys(data.requiredCops).length > 0) {
    $.each(data.requiredCops, (index, activity) => {
      const isAvailable = data.currentCops >= activity.minimumPolice && !activity.busy;
      const statusColor = isAvailable ? 'green' : 'red';
      // console.log("Adding illegal action:", activity);
      illegalActionsHtml += `
        <div class="activity-list-item image-card ${isAvailable ? '' : 'locked'}">
          <img src="./images/${activity.image}" class="activity-image" />
          ${!isAvailable ? `<div class="lock-overlay"><i class="fas fa-lock"></i></div>` : ''}
          <div class="activity-label">
            <p>${activity.label}</p>
          </div>
          <div class="activity-requirements">
            ${activity.minimumPolice}/${data.currentCops}
          </div>
        </div>
      `;

    });
  } else {
    illegalActionsHtml = data.noIllegalActionsMessage;
  }

  $("#online-players").html(onlinePlayersHtml);
  $("#disconnected-players").html(disconnectedPlayersHtml);
  $("#illegal-actions").html(illegalActionsHtml);

  // Initialize clipboard.js
  new ClipboardJS('.copy-btn').on('success', function(e) {
    // console.log("Discord ID copied:", e.text);
    e.clearSelection();
  }).on('error', function(e) {
    // console.error("Error copying Discord ID:", e);
  });

  // Event listener for reason buttons
  $('.reason-btn').click(function(event) {
      const reason = $(this).data('reason');
      // console.log("Reason button clicked, reason:", reason);
      const tooltip = $('#reason-tooltip');
      $('#tooltip-text').text(reason);

      // Position the tooltip
      const buttonPosition = $(this).offset();
      const tooltipHeight = tooltip.outerHeight();
      tooltip.css({
          top: buttonPosition.top - tooltipHeight - 10, // 10px above the button
          left: buttonPosition.left + ($(this).outerWidth() / 2) - (tooltip.outerWidth() / 2)
      });

      tooltip.fadeIn(150);
  });

  // Close tooltip when clicking outside of it
  $(document).click(function(event) {
      if (!$(event.target).closest('.reason-btn, .tooltip').length) {
          // console.log("Closing tooltip.");
          $('#reason-tooltip').fadeOut(150);
      }
  });
};

const openTab = (evt, tabName) => {
  // console.log("Opening tab:", tabName);
  $(".tab-content").removeClass("active");
  $(".tab-button").removeClass("active");
  $("#" + tabName).addClass("active");
  evt.currentTarget.className += " active";
};

$(document).ready(() => {
  // console.log("Document ready.");
  $("#exit-button").click(() => {
    // console.log("Exit button clicked.");
    Close();
  });
  $("#esc-button").click(() => {
    // console.log("ESC button clicked.");
    Close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key === 'Esc') {
      // console.log("Escape key pressed.");
      Close();
    }
  });
});
