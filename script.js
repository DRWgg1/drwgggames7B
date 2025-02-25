// ========= Utility-funktioner för localStorage =========

function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function setData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getUsers() { return getData('users'); }
function setUsers(users) { setData('users', users); }

function getGames() { return getData('games'); }
function setGames(games) { setData('games', games); }

function getMessages() { return getData('messages'); }
function setMessages(messages) { setData('messages', messages); }

function getCurrentUserId() {
  return localStorage.getItem('currentUser');
}

function setCurrentUserId(id) {
  localStorage.setItem('currentUser', id);
}

function getCurrentUser() {
  const uid = getCurrentUserId();
  if (!uid) return null;
  const users = getUsers();
  return users.find(u => u.id === uid) || null;
}

function updateUser(updatedUser) {
  let users = getUsers();
  users = users.map(u => u.id === updatedUser.id ? updatedUser : u);
  setUsers(users);
}

// Generera unikt ID
function generateId() {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

// ========= Routing och rendering =========

const mainContent = document.getElementById('main-content');
const navEl = document.getElementById('nav');

function updateNav() {
  const user = getCurrentUser();
  let navHTML = `<a data-view="home">Hem</a>
                 <a data-view="games">Spel</a>
                 <a data-view="about">Om oss</a>
                 <a data-view="contact">Kontakt</a>`;
  if (user) {
    navHTML += `<a data-view="upload-game">Ladda upp spel</a>
                <a data-view="shop">Shop</a>
                <a data-view="chat">Chat</a>
                <a data-view="profile" data-userid="${user.id}">Profil</a>
                <a data-view="settings">Inställningar</a>
                <a data-view="logout">Logga ut</a>`;
  } else {
    navHTML += `<a data-view="login">Logga in</a>
                <a data-view="register">Registrera</a>`;
  }
  navEl.innerHTML = navHTML;
  // Lägg till klicklyssnare på alla nav-länkar
  Array.from(navEl.getElementsByTagName('a')).forEach(link => {
    link.addEventListener('click', (e) => {
      const view = e.target.getAttribute('data-view');
      if (view === 'profile') {
        const uid = e.target.getAttribute('data-userid');
        showView('profile', { userId: uid });
      } else if (view === 'logout') {
        logout();
      } else {
        showView(view);
      }
    });
  });
}

function showView(view, data = {}) {
  switch (view) {
    case 'home':
      mainContent.innerHTML = renderHome();
      break;
    case 'about':
      mainContent.innerHTML = renderAbout();
      break;
    case 'contact':
      mainContent.innerHTML = renderContact();
      attachContactEvents();
      break;
    case 'games':
      mainContent.innerHTML = renderGames();
      attachPlayGameEvents();
      break;
    case 'shop':
      mainContent.innerHTML = renderShop();
      attachPlayGameEvents();
      break;
    case 'upload-game':
      if (!getCurrentUser()) {
        mainContent.innerHTML = `<p>Du måste vara inloggad för att ladda upp spel.</p>`;
      } else {
        mainContent.innerHTML = renderUploadGame();
        attachUploadGameEvents();
      }
      break;
    case 'chat':
      if (!getCurrentUser()) {
        mainContent.innerHTML = `<p>Du måste vara inloggad för att chatta.</p>`;
      } else {
        mainContent.innerHTML = renderChat();
        attachChatEvents();
      }
      break;
    case 'profile':
      // Om data.userId finns, visa den användarens profil, annars den inloggade användarens.
      const uid = data.userId || (getCurrentUser() && getCurrentUser().id);
      mainContent.innerHTML = renderProfile(uid);
      attachProfileEvents(uid);
      break;
    case 'settings':
      if (!getCurrentUser()) {
        mainContent.innerHTML = `<p>Du måste vara inloggad för att se inställningar.</p>`;
      } else {
        mainContent.innerHTML = renderSettings();
        attachSettingsEvents();
      }
      break;
    case 'login':
      mainContent.innerHTML = renderLogin();
      attachLoginEvents();
      break;
    case 'register':
      mainContent.innerHTML = renderRegister();
      attachRegisterEvents();
      break;
    case 'play-game':
      mainContent.innerHTML = renderPlayGame(data.gameId);
      break;
    default:
      mainContent.innerHTML = `<p>Sidan hittades inte.</p>`;
  }
  updateNav();
}

// ========= Rendering av vyer =========

function renderHome() {
  return `<h2>Välkommen till DRWgg Studios</h2>
          <p>Här hittar du de senaste spelen och nyheterna.</p>`;
}

function renderAbout() {
  return `<h2>Om oss</h2>
          <p>Information om DRWgg Studios...</p>`;
}

function renderContact() {
  return `<h2>Kontakt</h2>
          <form id="contact-form">
            <label>Namn: <input type="text" name="name" required></label>
            <label>E-post: <input type="email" name="email" required></label>
            <label>Meddelande: <textarea name="message" required></textarea></label>
            <button type="submit">Skicka</button>
          </form>`;
}

function renderGames() {
  const games = getGames();
  let html = `<h2>Spel</h2>`;
  if (games.length === 0) {
    html += `<p>Inga spel uppladdade än.</p>`;
  } else {
    html += `<ul>`;
    games.forEach(game => {
      html += `<li>
                <h3>${game.title}</h3>
                <p>${game.description}</p>
                <button data-view="play-game" data-gameid="${game.id}">Spela</button>
               </li>`;
    });
    html += `</ul>`;
  }
  return html;
}

function renderShop() {
  if (!getCurrentUser()) {
    return `<p>Du måste vara inloggad för att se shopen.</p>`;
  }
  // För enkelhetens skull listas samma spel som i "Spel"-vyn.
  return renderGames();
}

function renderUploadGame() {
  return `<h2>Ladda upp spel</h2>
          <form id="upload-game-form">
            <div id="upload-game-error" class="error"></div>
            <label>Speltitel: <input type="text" name="title" required></label>
            <label>Beskrivning: <textarea name="description" required></textarea></label>
            <div>
              <label>
                <input type="radio" name="uploadType" value="file" checked> Fil
              </label>
              <label>
                <input type="radio" name="uploadType" value="iframe"> iFrame
              </label>
            </div>
            <div id="file-upload-section">
              <label>Spelfil: <input type="file" name="gameFile" accept="*/*"></label>
            </div>
            <div id="iframe-upload-section" style="display:none;">
              <label>iFrame URL / Embed-kod: <input type="text" name="iframeCode" placeholder="https://..."></label>
            </div>
            <button type="submit">Ladda upp</button>
          </form>`;
}

function renderChat() {
  const messages = getMessages();
  let messagesHtml = messages.map(msg => `<p><strong>${msg.user}:</strong> ${msg.text} <small>(${msg.timestamp})</small></p>`).join('');
  return `<h2>Chat</h2>
          <div id="chat-box">${messagesHtml}</div>
          <form id="chat-form">
            <input type="text" name="message" placeholder="Skriv ditt meddelande..." required>
            <button type="submit">Skicka</button>
          </form>`;
}

function renderProfile(userId) {
  const users = getUsers();
  let profileUser = users.find(u => u.id === userId);
  if (!profileUser) return "<p>Användaren hittades inte.</p>";
  let friendsHtml = "";
  if (profileUser.friends && profileUser.friends.length > 0) {
    friendsHtml = "<ul>" + profileUser.friends.map(fid => {
      let friend = users.find(u => u.id === fid);
      return friend ? `<li>${friend.username}</li>` : "";
    }).join('') + "</ul>";
  } else {
    friendsHtml = "<p>Inga vänner ännu.</p>";
  }
  let html = `<h2>${profileUser.username}'s Profil</h2>
              <img src="${profileUser.profileImage}" alt="Profilbild" class="profile-image">
              <h3>Vänner:</h3>
              ${friendsHtml}`;
  const current = getCurrentUser();
  if (current && current.id !== profileUser.id && (!current.friends || !current.friends.includes(profileUser.id))) {
    html += `<button id="add-friend-btn" data-friendid="${profileUser.id}">Bli kompis</button>`;
  }
  return html;
}

function renderSettings() {
  const user = getCurrentUser();
  if (!user) return "<p>Inloggning krävs.</p>";
  return `<h2>Inställningar</h2>
          <form id="settings-form">
            <div id="settings-error" class="error"></div>
            <label>Nytt användarnamn: <input type="text" name="username" value="${user.username}" required></label>
            <label>Nytt lösenord: <input type="password" name="password" placeholder="Lämna tomt om du inte vill ändra"></label>
            <label>Ny profilbild: <input type="file" name="profileImage" accept="image/*"></label>
            <button type="submit">Spara ändringar</button>
          </form>`;
}

function renderLogin() {
  return `<h2>Logga in</h2>
          <form id="login-form">
            <div id="login-error" class="error"></div>
            <label>Användarnamn: <input type="text" name="username" required></label>
            <label>Lösenord: <input type="password" name="password" required></label>
            <button type="submit">Logga in</button>
          </form>`;
}

function renderRegister() {
  return `<h2>Registrera</h2>
          <form id="register-form">
            <div id="register-error" class="error"></div>
            <label>Användarnamn: <input type="text" name="username" required></label>
            <label>Lösenord: <input type="password" name="password" required></label>
            <label>Profilbild: <input type="file" name="profileImage" accept="image/*"></label>
            <button type="submit">Registrera</button>
          </form>`;
}

// Ny vy: Spela ett spel i programmet
function renderPlayGame(gameId) {
  const games = getGames();
  const game = games.find(g => g.id === gameId);
  if (!game) return "<p>Spelet hittades inte.</p>";
  let iframeContent = "";
  if (game.type === 'iframe') {
    // Om användaren skrivit in en hel iframe-kod, använd den direkt. Annars bygg en iframe med URL.
    if (game.iframe.trim().startsWith("<iframe")) {
      iframeContent = game.iframe;
    } else {
      iframeContent = `<iframe src="${game.iframe}" frameborder="0" style="width:100%; height:100%;"></iframe>`;
    }
  } else if (game.type === 'file') {
    // Vi använder den uppladdade filen som källa för en iframe
    iframeContent = `<iframe src="${game.file}" frameborder="0" style="width:100%; height:100%;"></iframe>`;
  }
  return `<h2>${game.title}</h2>
          <p>${game.description}</p>
          <div class="game-container" style="width:100%; height:600px;">
            ${iframeContent}
          </div>
          <button onclick="showView('games')">Tillbaka till spel</button>`;
}

// ========= Eventhantering för vyerna =========

function attachContactEvents() {
  const form = document.getElementById('contact-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Tack för ditt meddelande!');
    form.reset();
    showView('home');
  });
}

function attachLoginEvents() {
  const form = document.getElementById('login-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = form.username.value.trim();
    const password = form.password.value;
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUserId(user.id);
      showView('home');
    } else {
      document.getElementById('login-error').textContent = 'Felaktigt användarnamn eller lösenord.';
    }
  });
}

function attachRegisterEvents() {
  const form = document.getElementById('register-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = form.username.value.trim();
    const password = form.password.value;
    const fileInput = form.profileImage;
    const users = getUsers();
    if (users.find(u => u.username === username)) {
      document.getElementById('register-error').textContent = 'Användarnamnet är redan taget.';
      return;
    }
    // Hantera profilbild om vald
    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const newUser = {
          id: generateId(),
          username: username,
          password: password,
          profileImage: event.target.result,
          friends: []
        };
        users.push(newUser);
        setUsers(users);
        setCurrentUserId(newUser.id);
        showView('home');
      }
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      // Standardbild om ingen fil vald
      const newUser = {
        id: generateId(),
        username: username,
        password: password,
        profileImage: 'https://via.placeholder.com/150',
        friends: []
      };
      users.push(newUser);
      setUsers(users);
      setCurrentUserId(newUser.id);
      showView('home');
    }
  });
}

function attachUploadGameEvents() {
  const form = document.getElementById('upload-game-form');
  // Visa/dölj uppladdningssektioner baserat på valt alternativ
  const uploadTypeRadios = form.querySelectorAll('input[name="uploadType"]');
  uploadTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (form.uploadType.value === 'file') {
        document.getElementById('file-upload-section').style.display = 'block';
        document.getElementById('iframe-upload-section').style.display = 'none';
      } else {
        document.getElementById('file-upload-section').style.display = 'none';
        document.getElementById('iframe-upload-section').style.display = 'block';
      }
    });
  });
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const uploadType = form.uploadType.value;
    
    if (!title || !description) {
      document.getElementById('upload-game-error').textContent = 'Fyll i alla fält.';
      return;
    }
    
    if (uploadType === 'file') {
      const fileInput = form.gameFile;
      if (!fileInput.files[0]) {
        document.getElementById('upload-game-error').textContent = 'Välj en fil.';
        return;
      }
      const reader = new FileReader();
      reader.onload = function(event) {
        const games = getGames();
        const newGame = {
          id: generateId(),
          title: title,
          description: description,
          type: 'file',
          file: event.target.result,
          uploader: getCurrentUser().id
        };
        games.push(newGame);
        setGames(games);
        showView('games');
      }
      reader.readAsDataURL(fileInput.files[0]);
    } else if (uploadType === 'iframe') {
      const iframeCode = form.iframeCode.value.trim();
      if (!iframeCode) {
        document.getElementById('upload-game-error').textContent = 'Ange iFrame URL eller embed-kod.';
        return;
      }
      const games = getGames();
      const newGame = {
        id: generateId(),
        title: title,
        description: description,
        type: 'iframe',
        iframe: iframeCode,
        uploader: getCurrentUser().id
      };
      games.push(newGame);
      setGames(games);
      showView('games');
    }
  });
}

function attachChatEvents() {
  const form = document.getElementById('chat-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const messageText = form.message.value.trim();
    if (!messageText) return;
    const messages = getMessages();
    const newMessage = {
      user: getCurrentUser().username,
      text: messageText,
      timestamp: new Date().toLocaleTimeString()
    };
    messages.push(newMessage);
    setMessages(messages);
    // Uppdatera chatboxen
    showView('chat');
  });
}

function attachSettingsEvents() {
  const form = document.getElementById('settings-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newUsername = form.username.value.trim();
    const newPassword = form.password.value;
    const fileInput = form.profileImage;
    let user = getCurrentUser();
    const users = getUsers();
    if (users.find(u => u.username === newUsername && u.id !== user.id)) {
      document.getElementById('settings-error').textContent = 'Användarnamnet är redan taget.';
      return;
    }
    user.username = newUsername;
    if (newPassword) {
      user.password = newPassword;
    }
    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function(event) {
        user.profileImage = event.target.result;
        updateUser(user);
        showView('profile');
      }
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      updateUser(user);
      showView('profile');
    }
  });
}

function attachProfileEvents(userId) {
  const addFriendBtn = document.getElementById('add-friend-btn');
  if (addFriendBtn) {
    addFriendBtn.addEventListener('click', () => {
      const friendId = addFriendBtn.getAttribute('data-friendid');
      let current = getCurrentUser();
      if (!current.friends) current.friends = [];
      if (!current.friends.includes(friendId)) {
        current.friends.push(friendId);
        updateUser(current);
        alert('Du är nu kompis med användaren!');
        showView('profile', { userId: friendId });
      }
    });
  }
}

// Ny funktion: Fäst eventlyssnare på "Spela"-knappar i spel-listan
function attachPlayGameEvents() {
  const playButtons = mainContent.querySelectorAll('button[data-view="play-game"]');
  playButtons.forEach(button => {
    button.addEventListener('click', () => {
      const gameId = button.getAttribute('data-gameid');
      showView('play-game', { gameId: gameId });
    });
  });
}

// ========= Logout =========

function logout() {
  localStorage.removeItem('currentUser');
  showView('home');
}

// ========= Initiering =========

function initApp() {
  // Säkerställ att nödvändiga arrayer finns i localStorage
  if (!localStorage.getItem('users')) setUsers([]);
  if (!localStorage.getItem('games')) setGames([]);
  if (!localStorage.getItem('messages')) setMessages([]);
  updateNav();
  showView('home');
}

document.addEventListener('DOMContentLoaded', initApp);
// ... (övriga delar av koden är oförändrade)

// Ändrad vy: Spela ett spel i programmet med full screen-knapp
function renderPlayGame(gameId) {
  const games = getGames();
  const game = games.find(g => g.id === gameId);
  if (!game) return "<p>Spelet hittades inte.</p>";
  let iframeContent = "";
  if (game.type === 'iframe') {
    // Om användaren skrivit in en hel iframe-kod, använd den direkt. Annars bygg en iframe med URL.
    if (game.iframe.trim().startsWith("<iframe")) {
      iframeContent = game.iframe;
    } else {
      iframeContent = `<iframe src="${game.iframe}" frameborder="0" style="width:100%; height:100%;"></iframe>`;
    }
  } else if (game.type === 'file') {
    // Vi använder den uppladdade filen som källa för en iframe
    iframeContent = `<iframe src="${game.file}" frameborder="0" style="width:100%; height:100%;"></iframe>`;
  }
  return `<h2>${game.title}</h2>
          <p>${game.description}</p>
          <div id="game-container" class="game-container" style="width:100%; height:600px;">
            ${iframeContent}
          </div>
          <button id="fullscreen-btn">Full Screen</button>
          <button onclick="showView('games')">Tillbaka till spel</button>`;
}

// Lägg till i showView-funktionen under "play-game" för att fästa full screen-event
function showView(view, data = {}) {
  switch (view) {
    case 'home':
      mainContent.innerHTML = renderHome();
      break;
    case 'about':
      mainContent.innerHTML = renderAbout();
      break;
    case 'contact':
      mainContent.innerHTML = renderContact();
      attachContactEvents();
      break;
    case 'games':
      mainContent.innerHTML = renderGames();
      attachPlayGameEvents();
      break;
    case 'shop':
      mainContent.innerHTML = renderShop();
      attachPlayGameEvents();
      break;
    case 'upload-game':
      if (!getCurrentUser()) {
        mainContent.innerHTML = `<p>Du måste vara inloggad för att ladda upp spel.</p>`;
      } else {
        mainContent.innerHTML = renderUploadGame();
        attachUploadGameEvents();
      }
      break;
    case 'chat':
      if (!getCurrentUser()) {
        mainContent.innerHTML = `<p>Du måste vara inloggad för att chatta.</p>`;
      } else {
        mainContent.innerHTML = renderChat();
        attachChatEvents();
      }
      break;
    case 'profile':
      // Om data.userId finns, visa den användarens profil, annars den inloggade användarens.
      const uid = data.userId || (getCurrentUser() && getCurrentUser().id);
      mainContent.innerHTML = renderProfile(uid);
      attachProfileEvents(uid);
      break;
    case 'settings':
      if (!getCurrentUser()) {
        mainContent.innerHTML = `<p>Du måste vara inloggad för att se inställningar.</p>`;
      } else {
        mainContent.innerHTML = renderSettings();
        attachSettingsEvents();
      }
      break;
    case 'login':
      mainContent.innerHTML = renderLogin();
      attachLoginEvents();
      break;
    case 'register':
      mainContent.innerHTML = renderRegister();
      attachRegisterEvents();
      break;
    case 'play-game':
      mainContent.innerHTML = renderPlayGame(data.gameId);
      attachFullScreenEvent(); // NY: Fäster eventlyssnare för full screen-knappen
      break;
    default:
      mainContent.innerHTML = `<p>Sidan hittades inte.</p>`;
  }
  updateNav();
}

// NY funktion: Fäster eventlyssnare på full screen-knappen
function attachFullScreenEvent() {
  const fsBtn = document.getElementById('fullscreen-btn');
  const gameContainer = document.getElementById('game-container');
  if (fsBtn && gameContainer) {
    fsBtn.addEventListener('click', () => {
      if (gameContainer.requestFullscreen) {
        gameContainer.requestFullscreen();
      } else if (gameContainer.webkitRequestFullscreen) { /* Safari */
        gameContainer.webkitRequestFullscreen();
      } else if (gameContainer.msRequestFullscreen) { /* IE11 */
        gameContainer.msRequestFullscreen();
      }
    });
  }
}

// ... (resten av koden är oförändrad)