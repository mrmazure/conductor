// i18n shorthand — window.i18n is set up by i18n.js before this script runs
function t(key, ...params) {
  return window.i18n ? window.i18n.t(key, ...params) : key;
}

// DOM Elements
const palette = document.getElementById('palette');
const conductor = document.getElementById('conductor');
const startInp = document.getElementById('startTime');
const showNameInp = document.getElementById('showName');
const btnAddType = document.getElementById('btnAddType');
const btnResetTypes = document.getElementById('btnResetTypes');
const btnClearDescriptions = document.getElementById('btnClearDescriptions');

// Stats Elements
const endTimeDisplay = document.getElementById('endTimeDisplay');
const totalDurationDisplay = document.getElementById('totalDurationDisplay');
const connectionStatus = document.getElementById('connection-status'); // NEW

// Modal Elements
const modal = document.getElementById('typeModal');
const inpName = document.getElementById('newTypeName');
const inpColor = document.getElementById('newTypeColor');
const inpDuration = document.getElementById('newTypeDuration');
const btnCancel = document.getElementById('typeCancel');
const btnConfirm = document.getElementById('typeConfirm');
const btnDeleteType = document.getElementById('typeDelete');

// État global
let items = [];
let currentShareId = null; // ID du partage cloud actif
let currentEncKey = null; // CryptoKey AES-GCM active (jamais envoyée au serveur)

function getDefaultTypes() {
  return {
    sequence: { label: t('default.types.sequence'), i18nKey: 'default.types.sequence', color: '#3b82f6', duration: 60 },
    speak:    { label: t('default.types.speak'),    i18nKey: 'default.types.speak',    color: '#f59e0b', duration: 60 },
    pub:      { label: t('default.types.pub'),      i18nKey: 'default.types.pub',      color: '#10b981', duration: 60 },
    musique:  { label: t('default.types.musique'),  i18nKey: 'default.types.musique',  color: '#8b5cf6', duration: 180 },
    autre:    { label: t('default.types.autre'),    i18nKey: 'default.types.autre',    color: '#ef4444', duration: 60 }
  };
}

let types = getDefaultTypes();

// --- Network Manager ---
const Network = {
  peer: null,
  conn: [], // List of connections
  myId: null,
  isHost: false,
  user: {
    nickname: (() => {
      const animals = [
        "Aigle", "Albatros", "Alligator", "Alpaga", "Antilope", "Autruche",
        "Babouin", "Baleine", "Bison", "Blaireau", "Buffle", "Caméléon",
        "Canard", "Capybara", "Caribou", "Castor", "Cerf", "Chameau", "Chat",
        "Cheval", "Chien", "Chimpanzé", "Chouette", "Cigogne", "Cobra",
        "Coccinelle", "Cochon", "Colibri", "Condor", "Corbeau", "Coyote",
        "Crabe", "Crocodile", "Cygne", "Dauphin", "Dinde", "Dragon",
        "Écureuil", "Éléphant", "Élan", "Escargot", "Faucon", "Flamant",
        "Fourmi", "Furet", "Gazelle", "Girafe", "Gorille", "Grenouille",
        "Guépard", "Hamster", "Hérisson", "Hibou", "Hippopotame", "Hirondelle",
        "Hyène", "Iguane", "Jaguar", "Kangourou", "Koala", "Lama", "Lapin",
        "Léopard", "Lezard", "Libellule", "Lièvre", "Lion", "Loup", "Loutre",
        "Lynx", "Mammouth", "Manchot", "Mandrill", "Marmotte", "Méduse",
        "Mésange", "Morse", "Mouton", "Narval", "Oie", "Okapi", "Otarie",
        "Ours", "Panda", "Panthère", "Paon", "Papillon", "Paresseux",
        "Pélican", "Perroquet", "Phoque", "Pie", "Pigeon", "Pingouin",
        "Piranha", "Poisson", "Poney", "Poulpe", "Puma", "Python", "Rat",
        "Raton laveur", "Renard", "Requin", "Rhinocéros", "Salamandre",
        "Sanglier", "Sauterelle", "Scorpion", "Serpent", "Singe", "Souris",
        "Suricate", "Tapir", "Tatou", "Taupe", "Tigre", "Tortue", "Toucan",
        "Vache", "Vautour", "Wombat", "Zèbre"
      ];
      return animals[Math.floor(Math.random() * animals.length)];
    })(),
    color: '#' + Math.floor(Math.random() * 16777215).toString(16)
  },
  // Locked blocks state: { blockId: { nickname: 'User-1', color: '#...' } }
  locks: {},

  init() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');

    if (roomParam) {
      // Joining a specific room via shared link
      this.updateStatus('connecting');
      this.initPeer(null, roomParam);
    } else {
      // Default URL: collaboration is opt-in, do nothing until user clicks Share
      this.updateStatus('offline');
    }
  },

  startHosting() {
    if (this.peer && !this.peer.destroyed) {
      // Already hosting, just return current ID
      return Promise.resolve(this.myId);
    }
    return new Promise((resolve) => {
      this.isHost = true;
      this.updateStatus('connecting');
      this.peer = new Peer(null, { debug: 1 });

      this.peer.on('open', (id) => {
        this.myId = id;
        this.updateStatus('connected');
        console.log('Hosting with Peer ID:', id);

        this.peer.on('connection', (conn) => {
          console.log('Incoming connection from:', conn.peer);
          this.handleConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.error('Peer Error:', err.type);
          this.updateStatus('offline');
        });

        resolve(id);
      });

      this.peer.on('error', (err) => {
        console.error('Peer Error during host init:', err.type);
        this.updateStatus('offline');
        resolve(null);
      });
    });
  },

  disconnect() {
    if (this.peer && !this.peer.destroyed) {
      this.peer.destroy();
    }
    this.peer = null;
    this.conn = [];
    this.isHost = false;
    this.locks = {};
    this.myId = null;
    this.updateStatus('offline');
  },

  initPeer(id, targetPeerId) {
    this.peer = new Peer(id, { debug: 1 });

    this.peer.on('open', (id) => {
      this.myId = id;
      console.log('My Peer ID:', id);
      this.connectToPeer(targetPeerId);
    });

    this.peer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
      this.handleConnection(conn);
    });

    this.peer.on('error', (err) => {
      console.error('Peer Error:', err.type);
      this.updateStatus('offline');
    });
  },

  connectToPeer(peerId) {
    const conn = this.peer.connect(peerId, {
      metadata: this.user
    });
    this.handleConnection(conn);
  },

  handleConnection(conn) {
    conn.on('open', () => {
      console.log('Connection opened with:', conn.peer);
      this.conn.push(conn);
      this.updateStatus('connected');

      // If we are Host, send current state to new peer
      if (this.isHost) {
        console.log('Sending SYNC_FULL to new peer', conn.peer);
        conn.send({
          type: 'SYNC_FULL',
          state: {
            items,
            showName: showNameInp.value,
            startTime: startInp.value,
            types: types // Send custom types
          }
        });
        conn.send({ type: 'SYNC_LOCKS', locks: this.locks });
      }

      // Propagate existing peers (mesh? or star? We use Star topology essentially where Host relays)
      // For simplicity: Broadcasts go to everyone.
    });

    conn.on('data', (data) => {
      this.handleData(data, conn);
    });

    conn.on('close', () => {
      console.log('Connection closed with:', conn.peer);
      this.conn = this.conn.filter(c => c !== conn);
      this.clearLocksForPeer(conn.peer);
      // If host has no more peers, stay online (still hosting, ready for new joins).
      // If client lost its only connection, go offline.
      if (!this.isHost && this.conn.length === 0) {
        this.updateStatus('offline');
      } else {
        // Host stays 'connected' (still listening), client updates count
        this.updateStatus('connected');
      }
      render();
    });

    conn.on('error', (err) => {
      console.warn('Connection error with', conn.peer, err);
      this.conn = this.conn.filter(c => c !== conn);
      this.clearLocksForPeer(conn.peer);
      if (!this.isHost && this.conn.length === 0) {
        this.updateStatus('offline');
      }
    });
  },

  handleData(data, senderConn) {
    // console.log('Received:', data);

    switch (data.type) {
      case 'SYNC_FULL':
        // Full State Override ( Initial Join )
        if (data.state.items) items = data.state.items;
        if (data.state.showName) showNameInp.value = data.state.showName;
        if (data.state.startTime) startInp.value = data.state.startTime;
        if (data.state.types) {
          types = data.state.types;
          updatePalette();
        }
        render();
        break;

      case 'UPDATE_TYPES':
        if (data.types) {
          types = data.types;
          updatePalette();
          render(); // Re-render to update block colors/labels
        }
        break;

      case 'SYNC_LOCKS':
        this.locks = data.locks || {};
        render(); // Re-render to show locks
        break;

      case 'UPDATE_ITEM':
        // Individual item update
        const item = items.find(i => i.id === data.item.id);
        if (item) {
          Object.assign(item, data.item);
          // Don't full render if we can avoid it? For now full render is safest.
          // BUT: If I am editing this item, I might get overwritten?
          // The lock system should prevent me from editing if someone else is.
          render();
        }
        break;

      case 'ADD_ITEM':
        items.splice(data.index, 0, data.item);
        render();
        break;

      case 'MOVE_ITEM':
        moveItem(data.fromIndex, data.toIndex, true);
        break;

      case 'DELETE_ITEM':
        const idx = items.findIndex(i => i.id === data.id);
        if (idx !== -1) {
          items.splice(idx, 1);
          render();
        }
        break;

      case 'UPDATE_GLOBAL':
        if (data.showName !== undefined) showNameInp.value = data.showName;
        if (data.startTime !== undefined) startInp.value = data.startTime;
        render(); // Update stats
        break;

      case 'LOCK_BLOCK':
        this.locks[data.blockId] = data.user;
        render();
        break;

      case 'UNLOCK_BLOCK':
        delete this.locks[data.blockId];
        render();
        break;

      case 'CLEAR_ALL':
        items = [];
        render();
        updateTitle();
        break;
    }

    // Pass it on? (Relay)
    // If I am Host, I must relay to all other clients (except sender).
    // If I am Client, I only send to Host (Star topology).
    // Actually, in PeerJS mesh is harder. Let's assume Star for now where Host is central.
    // However, the prompt implies "Lobby" is just a discoverable entry point.
    // If we want simple p2p, everyone broadcasts to everyone they are connected to.
    this.broadcast(data, senderConn);
  },

  broadcast(data, excludeConn = null) {
    this.conn.forEach(c => {
      if (c !== excludeConn && c.open) {
        c.send(data);
      }
    });
  },

  send(data) {
    this.broadcast(data);
  },

  updateStatus(status) {
    this.currentStatus = status;
    const dot = connectionStatus.querySelector('.status-dot');
    const label = connectionStatus.querySelector('.peer-label');
    const count = connectionStatus.querySelector('.peer-count');

    // Show/Hide the whole status bar
    if (status === 'offline') {
      connectionStatus.classList.add('hidden');
      return;
    }
    connectionStatus.classList.remove('hidden');
    dot.className = 'status-dot ' + status;

    // Show/Hide counter only for Host
    if (this.isHost) {
      label.classList.remove('hidden');
      count.classList.remove('hidden');
      count.textContent = this.conn.length + 1; // +1 for me
      connectionStatus.title = t('peer.hostTitle', this.conn.length);
    } else {
      label.classList.add('hidden');
      count.classList.add('hidden');
      connectionStatus.title = status === 'connecting'
        ? t('peer.connecting')
        : t('peer.connected', this.myId);
    }
  },

  clearLocksForPeer(peerId) {
    // If we tracked which peer held which lock...
    // For now, locks just time out or explicit unlock.
  }
};

// --- Initialization ---

async function init() {
  loadTypes();
  updatePalette();

  const urlParams = new URLSearchParams(window.location.search);
  const shareParam = urlParams.get('s');    // ID du partage cloud
  const roomParam = urlParams.get('room'); // ID de salle PeerJS

  if (shareParam) {
    // Récupérer la clé de chiffrement depuis le #hash (jamais envoyée au serveur)
    const hashCle = window.location.hash.replace('#', '');

    if (hashCle) {
      try {
        currentEncKey = await importerCle(hashCle);
        currentShareId = shareParam;
        const res = await fetch(`save_share.php?getID=${encodeURIComponent(shareParam)}`);
        if (res.ok) {
          const envelope = await res.json();
          if (envelope.encryptedPayload) {
            // Déchiffrer localement avec la clé extraite du hash
            const data = await dechiffrer(envelope.encryptedPayload, currentEncKey);
            if (data.types) { types = data.types; saveTypes(); updatePalette(); }
            if (Array.isArray(data.items)) items = data.items;
            if (data.showName) showNameInp.value = data.showName;
            if (data.startTime) startInp.value = data.startTime;
          }
        } else {
          console.warn('Partage introuvable ou expiré.');
          currentShareId = null; currentEncKey = null;
          loadState();
        }
      } catch (err) {
        console.error('Erreur lors du chargement du partage chiffré :', err);
        currentShareId = null; currentEncKey = null;
        loadState();
      }
    } else {
      // Lien sans clé : impossible de déchiffrer
      console.warn('Clé de chiffrement absente du hash — chargement impossible.');
      loadState();
    }
  } else {
    loadState();
  }

  render();
  setupEventListeners();

  // PeerJS démarre uniquement si le lien contient ?room=
  if (roomParam) {
    Network.init();
  } else {
    Network.updateStatus('offline');
  }
}

function setupEventListeners() {
  // Global Inputs
  startInp.addEventListener('change', () => {
    render();
    Network.send({ type: 'UPDATE_GLOBAL', startTime: startInp.value });
  });

  showNameInp.addEventListener('input', () => {
    saveState();
    updateTitle();
    Network.send({ type: 'UPDATE_GLOBAL', showName: showNameInp.value });
  });

  // Conductor Drag & Drop
  conductor.addEventListener('dragover', handleDragOver);
  conductor.addEventListener('drop', handleDrop);
  conductor.addEventListener('dragleave', handleDragLeave);
  // Safety net: always remove the placeholder when any drag ends,
  // whether by a successful drop, an Escape key, or releasing outside.
  document.addEventListener('dragend', () => {
    placeholder.remove();
    dragSrcIndex = null;
  });

  // Modal
  btnAddType.addEventListener('click', () => openModal());
  if (btnResetTypes) {
    btnResetTypes.addEventListener('click', resetTypes);
  }
  palette.addEventListener('contextmenu', handlePaletteContextMenu);
  btnCancel.addEventListener('click', closeModal);
  btnConfirm.addEventListener('click', confirmTypeEdit);
  btnDeleteType.addEventListener('click', deleteType);

  // Global Actions
  document.getElementById('btnClear').addEventListener('click', clearAll);
  if (btnClearDescriptions) {
    btnClearDescriptions.addEventListener('click', clearDescriptionsOnly);
  }

  document.getElementById('btnPrint').addEventListener('click', () => {
    updateTitle();
    window.print();
  });

  // Share Modal — open
  const btnOpenShareModal = document.getElementById('btnOpenShareModal');
  if (btnOpenShareModal) {
    btnOpenShareModal.addEventListener('click', () => {
      document.getElementById('shareModal').classList.remove('hidden');
    });
  }

  // Share Modal — close (X button)
  document.getElementById('btnCloseShareModal')?.addEventListener('click', () => {
    document.getElementById('shareModal').classList.add('hidden');
  });

  // Share Modal — close on backdrop click
  document.getElementById('shareModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('shareModal')) {
      document.getElementById('shareModal').classList.add('hidden');
    }
  });

  // Cloud : Générer le lien de partage chiffré
  document.getElementById('btnGenerateCloudLink')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnGenerateCloudLink');
    btn.disabled = true;
    btn.textContent = t('share.cloud.encrypting');
    try {
      // Générer une nouvelle clé AES-GCM 256 bits
      currentEncKey = await genererCle();
      const cleB64 = await exporterCle(currentEncKey);

      // Chiffrer le payload et l'envoyer (le serveur ne voit que le blob opaque)
      const payloadChiffre = await chiffrer(buildSharePayload(), currentEncKey);
      const res = await fetch('save_share.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showName: showNameInp.value,
          encryptedPayload: payloadChiffre
        })
      });
      const resultat = await res.json();

      if (resultat.succes && resultat.shareId) {
        currentShareId = resultat.shareId;
        // La clé est placée dans le #hash — jamais envoyée au serveur
        const url = buildShareUrl('s', currentShareId) + '#' + cleB64;
        document.getElementById('cloudLinkInput').value = url;
        document.getElementById('cloudLinkWrapper').classList.remove('hidden');
        document.getElementById('cloudNotice').classList.remove('hidden');
        // Masquer le bouton (autosave prend le relais)
        btn.classList.add('hidden');
      } else {
        alert(t('alert.saveError') + (resultat.erreur || '?'));
        btn.textContent = t('share.cloud.btn');
        btn.disabled = false;
      }
    } catch (err) {
      console.error(err);
      alert(t('alert.networkError'));
      btn.textContent = t('share.cloud.btn');
      btn.disabled = false;
    }
  });

  // Cloud: Copy link
  document.getElementById('btnCopyCloudLink')?.addEventListener('click', () => {
    const val = document.getElementById('cloudLinkInput').value;
    if (val) copyToClipboard(val, document.getElementById('btnCopyCloudLink'));
  });

  // Live: Activate PeerJS hosting
  document.getElementById('btnStartLive')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnStartLive');
    btn.disabled = true;
    btn.textContent = t('share.live.starting');
    try {
      const hostId = await Network.startHosting();
      if (!hostId) {
        alert(t('alert.liveError'));
        btn.textContent = t('share.live.btn');
        btn.disabled = false;
        return;
      }
      const url = buildShareUrl('room', hostId);
      const input = document.getElementById('liveLinkInput');
      input.value = url;
      document.getElementById('liveLinkWrapper').classList.remove('hidden');
      btn.textContent = t('share.live.active');
    } catch (err) {
      console.error(err);
      btn.textContent = t('share.live.btn');
      btn.disabled = false;
    }
  });

  // Live: Copy link
  document.getElementById('btnCopyLiveLink')?.addEventListener('click', () => {
    const val = document.getElementById('liveLinkInput').value;
    if (val) copyToClipboard(val, document.getElementById('btnCopyLiveLink'));
  });

  // Cleanup peer on page close / navigation
  window.addEventListener('beforeunload', () => {
    Network.disconnect();
  });

  // JSON I/O
  document.getElementById('btnSaveJson').addEventListener('click', saveJson);
  document.getElementById('btnLoadJson').addEventListener('click', () => document.getElementById('fileInputJson').click());
  document.getElementById('fileInputJson').addEventListener('change', loadJson);

  // ODS Export
  const btnExport = document.getElementById('btnExportODS');
  if (btnExport) {
    btnExport.addEventListener('click', exportToODS);
  }

  // Print Events
  window.addEventListener('beforeprint', preparePrint);
  window.addEventListener('afterprint', cleanupPrint);
}

// --- Logic ---

function render() {
  conductor.innerHTML = '';
  const isEmpty = items.length === 0;
  conductor.classList.toggle('empty', isEmpty);

  // Translated empty-state message (replaces the old CSS ::before trick)
  if (isEmpty) {
    const msg = document.createElement('p');
    msg.className = 'conductor-empty-msg';
    msg.textContent = t('conductor.empty');
    conductor.appendChild(msg);
  }

  let currentTime = parseTime(startInp.value || '00:00');
  let totalSeconds = 0;

  items.forEach((it, i) => {
    const el = createBlockElement(it, i, currentTime);
    conductor.appendChild(el);

    // Advance time
    currentTime += it.dur;
    totalSeconds += it.dur;
  });

  // Update Stats
  updateStats(currentTime, totalSeconds);
  saveState();
  updateTitle();
  syncToServer();
}


function createBlockElement(it, index, startTimeSeconds) {
  const el = document.createElement('div');
  el.className = 'block-item';
  const color = types[it.type]?.color || '#ccc';
  el.style.borderLeftColor = color;
  el.style.setProperty('--item-color', color);
  el.dataset.id = it.id;
  el.dataset.durationPrint = formatDuration(it.dur);

  // Check Lock
  const lock = Network.locks[it.id];
  if (lock) {
    el.classList.add('locked');

    // Add Lock Visuals
    const badge = document.createElement('div');
    badge.className = 'lock-badge';
    badge.textContent = lock.nickname;
    badge.style.backgroundColor = lock.color;
    el.appendChild(badge);

    const icon = document.createElement('div');
    icon.className = 'padlock-icon';
    icon.innerHTML = '🔒';
    el.appendChild(icon);
  }

  const timeStr = formatTime(startTimeSeconds);
  const typeLabel = types[it.type]?.label || it.type;

  el.innerHTML += `
        <div class="drag-handle" draggable="true" title="${t('block.move.title')}">☰</div>
        <div class="time-display">${timeStr}</div>
        <div class="duration-container">
            <span class="label-duration">${t('block.duration')}</span>
            <input type="text" class="duration-input" value="${formatDuration(it.dur)}" ${lock ? 'disabled' : ''}>
        </div>
        <div class="content">
            <div class="title" contenteditable="${!lock}" spellcheck="false">${it.title}</div>
            <textarea class="description-input" rows="1" placeholder="${t('block.descPlaceholder')}" ${lock ? 'disabled' : ''}>${it.desc || ''}</textarea>
        </div>
        <div class="item-actions">
            <button class="btn-mini duplicate" title="${t('block.duplicate.title')}" ${lock ? 'disabled' : ''}>❐</button>
            <button class="btn-mini delete" title="${t('block.delete.title')}" ${lock ? 'disabled' : ''}>✖</button>
        </div>
    `;

  // Events
  const handle = el.querySelector('.drag-handle');
  if (!lock) {
    handle.addEventListener('dragstart', e => {
      dragSrcIndex = index;
      e.dataTransfer.effectAllowed = 'move';
      el.classList.add('dragging');
      placeholder.style.height = el.offsetHeight + 'px';
    });
    handle.addEventListener('dragend', () => el.classList.remove('dragging'));
  } else {
    handle.style.cursor = 'not-allowed';
  }

  // Text Editable Title
  const titleEl = el.querySelector('.title');
  if (!lock) {
    titleEl.addEventListener('focus', () => {
      Network.send({ type: 'LOCK_BLOCK', blockId: it.id, user: Network.user });
    });

    titleEl.addEventListener('blur', e => {
      const newTitle = e.target.textContent.trim() || typeLabel;
      if (it.title !== newTitle) {
        it.title = newTitle;
        Network.send({ type: 'UPDATE_ITEM', item: it }); // Sync changes
        saveState();
      }
      Network.send({ type: 'UNLOCK_BLOCK', blockId: it.id });
    });
  }

  // Duration
  const durInput = el.querySelector('.duration-input');

  if (!lock) {
    durInput.addEventListener('focus', e => {
      e.target.select();
      Network.send({ type: 'LOCK_BLOCK', blockId: it.id, user: Network.user });
    });

    durInput.addEventListener('blur', () => {
      Network.send({ type: 'UNLOCK_BLOCK', blockId: it.id });
    });

    durInput.addEventListener('change', e => {
      it.dur = parseDuration(e.target.value);
      render();
      Network.send({ type: 'UPDATE_ITEM', item: it });
    });
  }

  // Description
  const descInput = el.querySelector('.description-input');

  // Resize logic
  descInput.style.height = '2.4em';
  descInput.style.overflow = 'hidden';

  const expand = () => {
    descInput.style.height = 'auto';
    descInput.style.height = (descInput.scrollHeight + 5) + 'px';
    descInput.style.overflow = 'hidden';
  };

  const shrink = () => {
    descInput.style.height = '2.4em';
    descInput.scrollTop = 0;
  };

  if (!lock) {
    descInput.addEventListener('focus', () => {
      expand();
      Network.send({ type: 'LOCK_BLOCK', blockId: it.id, user: Network.user });
    });
    descInput.addEventListener('input', expand);
    descInput.addEventListener('blur', () => {
      shrink();
      Network.send({ type: 'UNLOCK_BLOCK', blockId: it.id });
    });

    descInput.addEventListener('change', () => {
      it.desc = descInput.value;
      saveState();
      Network.send({ type: 'UPDATE_ITEM', item: it });
    });
  }

  el.querySelector('.duplicate').addEventListener('click', () => duplicateItem(index));
  el.querySelector('.delete').addEventListener('click', () => deleteItem(index));

  return el;
}

function updateStats(endTimeSeconds, totalSeconds) {
  endTimeSeconds = endTimeSeconds % 86400;
  if (endTimeDisplay) endTimeDisplay.textContent = formatFullTime(endTimeSeconds);
  if (totalDurationDisplay) totalDurationDisplay.textContent = formatFullTime(totalSeconds);
}

function updateTitle() {
  const name = showNameInp.value.trim();
  if (name) {
    document.title = `${name} - RadioTools.be`;
  } else {
    document.title = t('title.default');
  }
}

// --- Item Management ---

function addItem(typeKey, index) {
  if (!types[typeKey]) return;
  const defaultDur = types[typeKey].duration || 60;
  const newItem = {
    id: Date.now(),
    type: typeKey,
    title: types[typeKey].label,
    desc: '',
    dur: defaultDur
  };
  items.splice(index, 0, newItem);

  render();
  Network.send({ type: 'ADD_ITEM', item: newItem, index: index });
}

function moveItem(fromIndex, toIndex, isNetwork = false) {
  if (fromIndex === toIndex) return;
  const [moved] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, moved);

  render();
  if (!isNetwork) {
    Network.send({ type: 'MOVE_ITEM', fromIndex, toIndex });
  }
}

function duplicateItem(index) {
  const original = items[index];
  const copy = JSON.parse(JSON.stringify(original));
  copy.id = Date.now();
  items.splice(index + 1, 0, copy);

  render();
  Network.send({ type: 'ADD_ITEM', item: copy, index: index + 1 });
}

function deleteItem(index) {
  const it = items[index];
  if (confirm(t('confirm.deleteBlock'))) {
    items.splice(index, 1);
    render();
    Network.send({ type: 'DELETE_ITEM', id: it.id });
  }
}

function clearAll() {
  if (items.length > 0 && confirm(t('confirm.clearAll'))) {
    // We would need to send a CLEAR_ALL message
    // For now simplistic impl
    items = [];
    render();
    updateTitle();
    Network.send({ type: 'CLEAR_ALL' });
  }
}

function clearDescriptionsOnly() {
  if (items.length > 0 && confirm(t('confirm.clearDesc'))) {
    items.forEach(it => {
      it.desc = '';
    });
    render();
    // Would need to sync all items, huge payload. 
    // Optimization: Network.send({ type: 'CLEAR_DESCRIPTIONS' });
    items.forEach(it => Network.send({ type: 'UPDATE_ITEM', item: it }));
  }
}

// --- Drag & Drop ---
let dragSrcIndex = null;
const placeholder = document.createElement('div');
placeholder.className = 'placeholder';

function handleDragOver(e) {
  e.preventDefault();
  const afterElement = getDragAfterElement(conductor, e.clientY);
  if (afterElement) {
    conductor.insertBefore(placeholder, afterElement);
  } else {
    conductor.appendChild(placeholder);
  }
}

function handleDrop(e) {
  e.preventDefault();
  const type = e.dataTransfer.getData('text/plain');
  const children = [...conductor.children];
  let dropIndex = children.indexOf(placeholder);

  if (dragSrcIndex !== null) {
    let newIndex = dropIndex;
    if (dropIndex > dragSrcIndex) newIndex--;
    moveItem(dragSrcIndex, newIndex);
    dragSrcIndex = null;
  } else if (type && types[type]) {
    addItem(type, dropIndex);
  }
  placeholder.remove();
}

function handleDragLeave(e) {
  // Remove placeholder as soon as the cursor leaves the conductor area entirely.
  // Using relatedTarget: if the destination element is outside the conductor, clean up.
  if (!conductor.contains(e.relatedTarget)) {
    placeholder.remove();
  }
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.block-item:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- Palette & Types ---

function loadTypes() {
  try {
    const stored = localStorage.getItem('rb_types');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.musique && parsed.musique.duration === 60) {
        parsed.musique.duration = 180;
      }
      Object.keys(parsed).forEach(k => {
        if (!parsed[k].duration) parsed[k].duration = 60;
        // Migration: restore i18nKey for default types whose label still matches
        // any known locale translation (i.e. user hasn't renamed them).
        const defaultI18nKey = 'default.types.' + k;
        if (!parsed[k].i18nKey && window.LOCALES) {
          const isDefaultLabel = ['fr', 'en', 'es'].some(lang =>
            window.LOCALES[lang] && window.LOCALES[lang][defaultI18nKey] === parsed[k].label
          );
          if (isDefaultLabel) parsed[k].i18nKey = defaultI18nKey;
        }
      });
      Object.assign(types, parsed);
    }
  } catch (e) { console.error(e); }
}

function saveTypes() {
  localStorage.setItem('rb_types', JSON.stringify(types));
}

function updatePalette() {
  const content = palette.querySelector('.palette-content');
  if (!content) return;
  content.innerHTML = '';

  Object.keys(types).forEach(key => {
    const div = document.createElement('div');
    div.className = `block ${key}`;
    div.draggable = true;
    div.textContent = types[key].i18nKey ? t(types[key].i18nKey) : types[key].label;
    div.dataset.type = key;
    div.style.borderLeftColor = types[key].color;
    div.addEventListener('dragstart', handlePaletteDragStart);
    content.appendChild(div);
  });
}

function handlePaletteDragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.dataset.type);
  e.dataTransfer.effectAllowed = 'copy';
}

function handlePaletteContextMenu(e) {
  e.preventDefault();
  const target = e.target.closest('.block');
  if (target) {
    openModal(target.dataset.type);
  }
}

// --- Modal ---

function openModal(editKey = null) {
  modal.classList.remove('hidden');
  modal.dataset.key = editKey || '';

  if (editKey && types[editKey]) {
    inpName.value = types[editKey].i18nKey ? t(types[editKey].i18nKey) : types[editKey].label;
    inpColor.value = types[editKey].color;
    inpDuration.value = formatDuration(types[editKey].duration || 60);
    btnDeleteType.classList.remove('hidden');
  } else {
    inpName.value = '';
    inpColor.value = '#ffffff';
    inpDuration.value = '01:00';
    btnDeleteType.classList.add('hidden');
  }
  inpName.focus();
}

function closeModal() {
  modal.classList.add('hidden');
}

function confirmTypeEdit() {
  const name = inpName.value.trim();
  if (!name) return;
  const color = inpColor.value;
  const durStr = inpDuration.value;
  const duration = parseDuration(durStr) || 60;
  const key = modal.dataset.key;

  if (key && types[key]) {
    types[key].label = name;
    types[key].color = color;
    types[key].duration = duration;
    // If the user changed the name away from the default, drop the i18n key
    // so the custom name is displayed instead of the auto-translated one.
    if (types[key].i18nKey && name !== t(types[key].i18nKey)) {
      delete types[key].i18nKey;
    }
  } else {
    const newKey = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
    types[newKey] = { label: name, color, duration };
  }

  saveTypes();
  updatePalette();
  render();
  closeModal();
  Network.send({ type: 'UPDATE_TYPES', types: types });
}

function deleteType() {
  const key = modal.dataset.key;
  if (key && types[key] && confirm(t('confirm.deleteType', types[key].label))) {
    delete types[key];
    saveTypes();
    updatePalette();
    render();
    closeModal();
    Network.send({ type: 'UPDATE_TYPES', types: types });
  }
}

function resetTypes() {
  if (confirm(t('confirm.resetTypes'))) {
    types = getDefaultTypes();
    saveTypes();
    updatePalette();
    render();
    Network.send({ type: 'UPDATE_TYPES', types: types });
  }
}

// --- JSON I/O ---

function saveState() {
  const state = {
    showName: showNameInp.value,
    startTime: startInp.value,
    items
  };
  localStorage.setItem('rb_state', JSON.stringify(state));
}

function loadState() {
  try {
    const stored = localStorage.getItem('rb_state');
    if (stored) {
      const state = JSON.parse(stored);
      if (state.showName) showNameInp.value = state.showName;
      if (state.startTime) startInp.value = state.startTime;
      if (Array.isArray(state.items)) items = state.items;
    }
  } catch { }
}

function saveJson() {
  const data = {
    meta: { version: "1.2", generated: new Date().toISOString() },
    showName: showNameInp.value,
    startTime: startInp.value,
    types: types,
    items: items
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const name = showNameInp.value.trim() || t('ods.defaultName');
  a.download = `${name} - RadioTools.be.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function loadJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const data = JSON.parse(evt.target.result);
      if (confirm(t('confirm.loadFile'))) {
        if (data.types) {
          types = data.types;
          saveTypes();
          updatePalette();
        }
        if (data.items) items = data.items;
        if (data.showName) showNameInp.value = data.showName;
        if (data.startTime) startInp.value = data.startTime;
        render();
        // Sync full state after load
        Network.send({ type: 'SYNC_FULL', state: data });
      }
    } catch (err) { alert(t('alert.fileError')); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// =============================================================
// --- Chiffrement de bout en bout (E2EE) — AES-GCM 256 bits ---
// =============================================================

/**
 * Génère une clé AES-GCM 256 bits extractible.
 */
async function genererCle() {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,  // extractible pour l'exporter dans l'URL
    ['encrypt', 'decrypt']
  );
}

/**
 * Exporte une CryptoKey vers une chaîne base64url (safe pour les URL).
 */
async function exporterCle(cle) {
  const raw = await crypto.subtle.exportKey('raw', cle);
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Importe une clé depuis sa représentation base64url.
 */
async function importerCle(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') +
    '='.repeat((4 - b64url.length % 4) % 4);
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

/**
 * Chiffre un objet JS avec AES-GCM.
 * Retourne une chaîne base64 contenant [IV (12 octets) + données chiffrées].
 */
async function chiffrer(objet, cle) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(objet));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cle, data);
  // Concaténer IV + ciphertext → base64
  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

/**
 * Déchiffre une chaîne base64 (IV + ciphertext) avec AES-GCM.
 * Retourne l'objet JS original.
 */
async function dechiffrer(b64, cle) {
  const combined = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cle, ciphertext);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

// --- Helpers de partage ---

/**
 * Synchronise silencieusement l'état du conducteur vers le serveur.
 * Ne fait rien si aucun partage cloud n'est actif.
 * Appelée à la fin de chaque render() — non bloquante.
 */
function syncToServer() {
  if (!currentShareId || !currentEncKey) return;
  // Chiffrement + envoi asynchrone sans bloquer l'UI
  (async () => {
    try {
      const payloadChiffre = await chiffrer(buildSharePayload(), currentEncKey);
      const res = await fetch('save_share.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareId: currentShareId,
          showName: showNameInp.value,
          encryptedPayload: payloadChiffre
        })
      });
      if (!res.ok) console.warn('syncToServer : erreur serveur', res.status);
    } catch (err) {
      console.warn('syncToServer : erreur réseau ou chiffrement', err);
    }
  })();
}

/**
 * Construit le payload complet de l'état du conducteur.
 */
function buildSharePayload() {
  return {
    meta: { version: '1.2', generated: new Date().toISOString() },
    showName: showNameInp.value,
    startTime: startInp.value,
    types: types,
    items: items
  };
}

/**
 * Construit une URL de partage avec le paramètre donné.
 * Supprime ?s et ?room pour éviter les conflits.
 * Note : la clé de chiffrement est ajoutée APRÈS via + '#' + cle.
 */
function buildShareUrl(paramKey, valeur) {
  const url = new URL(window.location.href);
  url.searchParams.delete('s');
  url.searchParams.delete('room');
  url.hash = ''; // Nettoyer le hash existant
  url.searchParams.set(paramKey, valeur);
  return url.toString();
}

/**
 * Copie un texte dans le presse-papier avec retour visuel sur le bouton.
 */
function copyToClipboard(texte, btn) {
  navigator.clipboard.writeText(texte).then(() => {
    const original = btn.textContent;
    btn.textContent = t('share.copied');
    setTimeout(() => { btn.textContent = original; }, 2000);
  }).catch(() => {
    // Fallback pour les contextes non-HTTPS
    const ta = document.createElement('textarea');
    ta.value = texte;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    const original = btn.textContent;
    btn.textContent = t('share.copied');
    setTimeout(() => { btn.textContent = original; }, 2000);
  });
}

// --- Helpers ---


function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return (h || 0) * 3600 + (m || 0) * 60;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseDuration(str) {
  if (!str) return 0;
  const parts = str.split(':').map(Number);
  if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
  if (parts.length === 1) return (parts[0] || 0) * 60;
  return 0;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatFullTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// --- Print Management ---

function preparePrint() {
  const header = document.createElement('div');
  header.className = 'print-header-only';

  document.body.classList.add('printing-mode');

  const end = endTimeDisplay ? endTimeDisplay.textContent : '--:--';
  const dur = totalDurationDisplay ? totalDurationDisplay.textContent : '00:00';

  header.innerHTML = `
        <h2>${showNameInp.value || t('print.default')}</h2>
        <p>
            <strong>${t('print.start')}</strong> ${startInp.value} &nbsp;|&nbsp;
            <strong>${t('print.end')}</strong> ${end} &nbsp;|&nbsp;
            <strong>${t('print.duration')}</strong> ${dur}
        </p>
    `;
  document.body.prepend(header);

  document.querySelectorAll('.block-item').forEach(el => {
    const textarea = el.querySelector('.description-input');
    if (textarea) {
      const div = document.createElement('div');
      div.className = 'description-print-view';
      div.textContent = textarea.value;
      textarea.style.display = 'none';
      textarea.parentNode.insertBefore(div, textarea);

      if (!textarea.value.trim()) {
        div.style.display = 'none';
      }
    }

    const timeDisplay = el.querySelector('.time-display');
    const durInput = el.querySelector('.duration-input');
    if (timeDisplay && durInput) {
      const durVal = durInput.value;
      const printDur = document.createElement('div');
      printDur.className = 'print-duration';
      printDur.textContent = `(${durVal})`;
      timeDisplay.appendChild(printDur);
    }
  });
}

function cleanupPrint() {
  document.querySelector('.print-header-only')?.remove();
  document.body.classList.remove('printing-mode');

  document.querySelectorAll('.description-print-view').forEach(e => e.remove());
  document.querySelectorAll('.description-input').forEach(e => e.style.display = '');
  document.querySelectorAll('.print-duration').forEach(e => e.remove());
}

// --- ODS Export ---

function exportToODS() {
  if (!items || items.length === 0) {
    alert(t('alert.noData'));
    return;
  }

  const data = [
    [t('ods.time'), t('ods.duration'), t('ods.type'), t('ods.title'), t('ods.description')]
  ];

  let currentTime = parseTime(startInp.value || '00:00');

  items.forEach(it => {
    const timeStr = formatTime(currentTime);
    const durationStr = formatDuration(it.dur);
    const typeLabel = types[it.type]?.label || it.type;

    data.push([
      timeStr,
      durationStr,
      typeLabel,
      it.title,
      it.desc || ''
    ]);

    currentTime += it.dur;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  const wscols = [
    { wch: 10 },
    { wch: 10 },
    { wch: 15 },
    { wch: 30 },
    { wch: 50 }
  ];
  ws['!cols'] = wscols;

  XLSX.utils.book_append_sheet(wb, ws, t('ods.sheetName'));

  const showName = showNameInp.value.trim() || t('ods.defaultName');
  const filename = `${showName} - RadioTools.be.ods`;

  XLSX.writeFile(wb, filename);
}

// Called by i18n.js after every language change to re-apply dynamic UI strings
window.onLangChange = function () {
  updatePalette();   // Re-renders block type labels in the sidebar
  render();          // Re-builds blocks (duration label, placeholders, button titles)
  updateTitle();     // Updates browser tab title
  // Re-apply connection status tooltip in new language
  if (Network.currentStatus) Network.updateStatus(Network.currentStatus);
};

// Start
init();
