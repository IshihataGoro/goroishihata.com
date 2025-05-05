// グローバル変数
let activeWindow = null;
let zIndex = 100;

// デバッグ用のDOMチェック関数
function checkElementExists(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`要素ID "${id}" が見つかりません`);
        return false;
    }
    return true;
}

// 初期化時に重要な要素の存在をチェック
function checkRequiredElements() {
    const requiredIds = [
        'icon-my-computer', 'icon-notepad', 'icon-internet-explorer', 'icon-recycle-bin', 'icon-web56',
        'my-computer', 'notepad', 'internet-explorer', 'recycle-bin', 'yahoo',
        'clock', 'start-button', 'start-menu'
    ];
    
    let allFound = true;
    for (const id of requiredIds) {
        if (!checkElementExists(id)) {
            allFound = false;
        }
    }
    
    return allFound;
}

// Update clock
function updateClock() {
    const clockElement = document.getElementById('clock');
    if (!clockElement) {
        console.warn('時計要素が見つかりません');
        return;
    }
    
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    clockElement.textContent = `${hours}:${minutes}`;
}

// Window management
function openWindow(id) {
    const winElement = document.getElementById(id);
    if (!winElement) {
        console.warn(`ウィンドウID "${id}" が見つかりません`);
        return;
    }
    
    winElement.style.display = 'block';
    setActiveWindow(id);
    
    // 各リサイズハンドルにイベントリスナーを追加
    setupWindowResizeHandles(winElement);
}

function closeWindow(id) {
    const winElement = document.getElementById(id);
    if (winElement) {
        winElement.style.display = 'none';
    }
}

function minimizeWindow(id) {
    const winElement = document.getElementById(id);
    if (winElement) {
        winElement.style.display = 'none';
    }
}

function maximizeWindow(id) {
    const winElement = document.getElementById(id);
    if (!winElement) return;
    
    if (winElement.style.width === '100vw') {
        winElement.style.width = '400px';
        winElement.style.height = '300px';
        winElement.style.top = '50px';
        winElement.style.left = '100px';
    } else {
        winElement.style.width = '100vw';
        winElement.style.height = 'calc(100vh - 28px)';
        winElement.style.top = '0';
        winElement.style.left = '0';
    }
}

function setActiveWindow(id) {
    const winElement = document.getElementById(id);
    if (!winElement) return;
    
    if (activeWindow) {
        const prevWin = document.getElementById(activeWindow);
        if (prevWin) {
            prevWin.style.zIndex = 100;
        }
    }
    
    winElement.style.zIndex = ++zIndex;
    activeWindow = id;
}

// Make elements draggable using addEventListener
function makeDraggable(element) {
    if (!element) return;
    
    let offsetX, offsetY, isDragging = false;
    let startX, startY, moved = false;
    
    function handleMouseDown(e) {
        // Don't start drag if clicking on a child that handles its own events
        if (e.target.tagName === 'INPUT' || 
            e.target.tagName === 'BUTTON' || 
            e.target.classList.contains('window-button') ||
            e.target.classList.contains('resize-handle')) {
            return;
        }
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        moved = false;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        
        element.style.zIndex = ++zIndex;
        
        // ドラッグ中のイベントハンドラーを追加
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Prevent text selection during drag
        e.preventDefault();
    }
    
    function handleMouseMove(e) {
        if (!isDragging) return;
        
        // Check if mouse has moved significantly
        if (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3) {
            moved = true;
        }
        
        if (moved) {
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
        }
    }
    
    function handleMouseUp() {
        if (!isDragging) return;
        
        isDragging = false;
        // イベントリスナーを削除
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
    
    // 既存のリスナーを防ぐために事前に削除
    element.removeEventListener('mousedown', handleMouseDown);
    // 新しいリスナーを追加
    element.addEventListener('mousedown', handleMouseDown);
}

// Resizing window functionality
function setupResizeHandles() {
    // すべてのウィンドウに対して初期化を行う
    const winElements = document.querySelectorAll('.window');
    for (let i = 0; i < winElements.length; i++) {
        const winElement = winElements[i];
        if (winElement && winElement.style.display !== 'none') {
            setupWindowResizeHandles(winElement);
        }
    }
}

function setupWindowResizeHandles(winElement) {
    if (!winElement) return;
    
    const handles = winElement.querySelectorAll('.resize-handle');
    
    for (let i = 0; i < handles.length; i++) {
        const handle = handles[i];
        
        // 既に設定済みの場合は追加しない
        if (handle.hasListener) continue;
        
        let startX, startY, startWidth, startHeight;
        let startLeft, startTop;
        let isResizing = false;
        
        function handleMouseDown(e) {
            e.stopPropagation();
            
            isResizing = true;
            setActiveWindow(winElement.id);
            
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(winElement.style.width || winElement.offsetWidth, 10);
            startHeight = parseInt(winElement.style.height || winElement.offsetHeight, 10);
            startLeft = parseInt(winElement.style.left || winElement.offsetLeft, 10);
            startTop = parseInt(winElement.style.top || winElement.offsetTop, 10);
            
            // ドラッグ中のイベントリスナーを追加
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
            
            console.log('リサイズ開始:', handle.className);
            e.preventDefault();
        }
        
        function resize(e) {
            if (!isResizing) return;
            
            // 過剰な動きを防ぐために移動距離を制限
            const maxMove = 100; // 一度に処理する最大ピクセル数
            let dx = e.clientX - startX;
            let dy = e.clientY - startY;
            
            // 急激な動きを制限
            dx = Math.max(-maxMove, Math.min(maxMove, dx));
            dy = Math.max(-maxMove, Math.min(maxMove, dy));
            
            if (handle.classList.contains('resize-handle-se')) {
                winElement.style.width = `${Math.max(300, startWidth + dx)}px`;
                winElement.style.height = `${Math.max(200, startHeight + dy)}px`;
            } else if (handle.classList.contains('resize-handle-sw')) {
                const newWidth = Math.max(300, startWidth - dx);
                winElement.style.width = `${newWidth}px`;
                winElement.style.left = `${startLeft + (startWidth - newWidth)}px`;
                winElement.style.height = `${Math.max(200, startHeight + dy)}px`;
            } else if (handle.classList.contains('resize-handle-ne')) {
                winElement.style.width = `${Math.max(300, startWidth + dx)}px`;
                const newHeight = Math.max(200, startHeight - dy);
                winElement.style.height = `${newHeight}px`;
                winElement.style.top = `${startTop + (startHeight - newHeight)}px`;
            } else if (handle.classList.contains('resize-handle-nw')) {
                const newWidth = Math.max(300, startWidth - dx);
                winElement.style.width = `${newWidth}px`;
                winElement.style.left = `${startLeft + (startWidth - newWidth)}px`;
                const newHeight = Math.max(200, startHeight - dy);
                winElement.style.height = `${newHeight}px`;
                winElement.style.top = `${startTop + (startHeight - newHeight)}px`;
            }
        }
        
        function stopResize() {
            if (!isResizing) return;
            
            isResizing = false;
            // イベントリスナーを削除
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
        
        // 既存のリスナーを防ぐために事前に削除
        handle.removeEventListener('mousedown', handleMouseDown);
        // 新しいリスナーを追加
        handle.addEventListener('mousedown', handleMouseDown);
        handle.hasListener = true; // リスナー設定済みフラグ
    }
}

// Admin note functionality
function editAdminNote() {
    const adminLogin = document.getElementById('admin-login');
    if (adminLogin) {
        adminLogin.style.display = 'block';
    }
}

function cancelAdminLogin() {
    const adminLogin = document.getElementById('admin-login');
    if (adminLogin) {
        adminLogin.style.display = 'none';
    }
}

function checkAdminLogin() {
    const usernameInput = document.getElementById('admin-username');
    const passwordInput = document.getElementById('admin-password');
    const adminLogin = document.getElementById('admin-login');
    
    if (!usernameInput || !passwordInput || !adminLogin) {
        console.warn('管理者ログイン要素が見つかりません');
        return;
    }
    
    const username = usernameInput.value;
    const password = passwordInput.value;
    
    if (username === 'goro' && password === '56420') {
        adminLogin.style.display = 'none';
        editNoteContent();
    } else {
        alert('ユーザー名またはパスワードが間違っています。');
    }
}

function editNoteContent() {
    const noteContent = document.getElementById('admin-note-content');
    if (!noteContent) {
        console.warn('管理者メモ内容要素が見つかりません');
        return;
    }
    
    const currentContent = noteContent.innerText;
    const newContent = prompt('メモの内容を編集してください：', currentContent);
    
    if (newContent !== null) {
        noteContent.innerText = newContent;
    }
}

// Start menu functionality
function setupStartMenu() {
    const startMenu = document.getElementById('start-menu');
    const startButton = document.getElementById('start-button');
    
    if (!startMenu || !startButton) {
        console.warn('スタートメニュー要素が見つかりません');
        return;
    }
    
    let startMenuOpen = false;
    let activeSubmenu = null;
    
    function toggleStartMenu() {
        if (startMenuOpen) {
            closeStartMenu();
        } else {
            openStartMenu();
        }
    }
    
    function openStartMenu() {
        startMenu.style.display = 'block';
        startMenuOpen = true;
        startButton.style.borderTop = '1px solid #808080';
        startButton.style.borderLeft = '1px solid #808080';
        startButton.style.borderRight = '1px solid #ffffff';
        startButton.style.borderBottom = '1px solid #ffffff';
    }
    
    function closeStartMenu() {
        startMenu.style.display = 'none';
        startMenuOpen = false;
        if (activeSubmenu) {
            const submenu = document.getElementById(activeSubmenu);
            if (submenu) {
                submenu.style.display = 'none';
            }
            activeSubmenu = null;
        }
        startButton.style.borderTop = '1px solid #ffffff';
        startButton.style.borderLeft = '1px solid #ffffff';
        startButton.style.borderRight = '1px solid #808080';
        startButton.style.borderBottom = '1px solid #808080';
    }
    
    // Handle clicks outside start menu
    function handleDocumentClick(e) {
        if (startMenuOpen && !startMenu.contains(e.target) && e.target !== startButton) {
            closeStartMenu();
        }
    }
    
    // Setup submenu functionality
    function showSubmenu(id) {
        if (activeSubmenu) {
            const submenu = document.getElementById(activeSubmenu);
            if (submenu) {
                submenu.style.display = 'none';
            }
        }
        
        const newSubmenu = document.getElementById(id);
        if (newSubmenu) {
            newSubmenu.style.display = 'block';
            activeSubmenu = id;
        }
    }

    // Add event listeners for submenus
    const programsTrigger = document.getElementById('programs-menu-trigger');
    const documentsTrigger = document.getElementById('documents-menu-trigger');
    
    if (programsTrigger) {
        programsTrigger.addEventListener('mouseover', () => showSubmenu('programs-menu'));
    }
    
    if (documentsTrigger) {
        documentsTrigger.addEventListener('mouseover', () => showSubmenu('documents-menu'));
    }
    
    // クリックイベントの設定
    startButton.addEventListener('click', toggleStartMenu);
    document.addEventListener('click', handleDocumentClick);
}

// BBS機能のセットアップ
function setupBBS() {
    const submitButton = document.getElementById('bbs-submit');
    const messagesDiv = document.getElementById('bbs-messages');
    
    if (!submitButton || !messagesDiv) {
        console.warn('BBS要素が見つかりません');
        return;
    }
    
    // ローカルストレージからメッセージを読み込む
    const loadMessages = () => {
        const messages = JSON.parse(localStorage.getItem('bbs-messages') || '[]');
        messagesDiv.innerHTML = '';
        
        messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'bbs-message';
            messageDiv.innerHTML = `
                <div class="bbs-message-header">
                    <strong>${msg.name}</strong> - ${msg.date}
                </div>
                <div class="bbs-message-body">${msg.text}</div>
            `;
            messagesDiv.appendChild(messageDiv);
        });
        
        // 最新メッセージが見えるようにスクロール
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    };
    
    // 初期ロード
    loadMessages();
    
    // 投稿ボタンのイベント
    function handleSubmit() {
        const nameInput = document.getElementById('bbs-name');
        const messageInput = document.getElementById('bbs-message');
        
        if (!nameInput || !messageInput) return;
        
        const name = nameInput.value.trim() || '名無し';
        const text = messageInput.value.trim();
        
        if (text) {
            // メッセージを保存
            const messages = JSON.parse(localStorage.getItem('bbs-messages') || '[]');
            messages.push({
                name: name,
                text: text,
                date: new Date().toLocaleString()
            });
            
            // 最大20件までに制限
            if (messages.length > 20) {
                messages.shift();
            }
            
            localStorage.setItem('bbs-messages', JSON.stringify(messages));
            
            // 入力欄をクリア
            messageInput.value = '';
            
            // メッセージを再読み込み
            loadMessages();
        }
    }
    
    // 既存のリスナーを防ぐために事前に削除
    submitButton.removeEventListener('click', handleSubmit);
    // 新しいリスナーを追加
    submitButton.addEventListener('click', handleSubmit);
}

// 全てのイベントリスナーのセットアップを行う関数
function setupEventListeners() {
    // デスクトップアイコンのダブルクリックイベント
    function setupIconListeners(iconId, windowId) {
        const icon = document.getElementById(iconId);
        if (icon) {
            icon.addEventListener('dblclick', () => openWindow(windowId));
        } else {
            console.warn(`アイコン "${iconId}" が見つかりません`);
        }
    }
    
    setupIconListeners('icon-my-computer', 'my-computer');
    setupIconListeners('icon-notepad', 'notepad');
    setupIconListeners('icon-internet-explorer', 'internet-explorer');
    setupIconListeners('icon-recycle-bin', 'recycle-bin');
    setupIconListeners('icon-web56', 'web56');
    
    // ウィンドウコントロールボタンのイベント
    function setupWindowControls(windowId) {
        const minimizeBtn = document.getElementById(`minimize-${windowId}`);
        const maximizeBtn = document.getElementById(`maximize-${windowId}`);
        const closeBtn = document.getElementById(`close-${windowId}`);
        
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => minimizeWindow(windowId));
        }
        
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => maximizeWindow(windowId));
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeWindow(windowId));
        }
    }
    
    setupWindowControls('my-computer');
    setupWindowControls('notepad');
    setupWindowControls('internet-explorer');
    setupWindowControls('yahoo');
    setupWindowControls('recycle-bin');
    
    // スタートメニューのイベント
    const openNotepadMenu = document.getElementById('open-notepad-menu');
    const openMyComputerMenu = document.getElementById('open-my-computer-menu');
    const openIEMenu = document.getElementById('open-internet-explorer-menu');
    
    if (openNotepadMenu) {
        openNotepadMenu.addEventListener('click', () => openWindow('notepad'));
    }
    
    if (openMyComputerMenu) {
        openMyComputerMenu.addEventListener('click', () => openWindow('my-computer'));
    }
    
    if (openIEMenu) {
        openIEMenu.addEventListener('click', () => openWindow('internet-explorer'));
    }
    
    // シャットダウンボタンのイベント
    const shutdownButton = document.getElementById('shutdown-button');
    if (shutdownButton) {
        shutdownButton.addEventListener('click', () => {
            if (confirm('本当にWindowsを終了しますか？')) {
                document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #000080; color: white; font-family: \'MS Sans Serif\', sans-serif; font-size: 24px;">コンピュータの電源を切っても安全です。</div>';
            }
        });
    }
    
    // 管理者メモのイベント
    const editNoteButton = document.getElementById('edit-note-button');
    const cancelLoginButton = document.getElementById('cancel-login-button');
    const checkLoginButton = document.getElementById('check-login-button');
    
    if (editNoteButton) {
        editNoteButton.addEventListener('click', editAdminNote);
    }
    
    if (cancelLoginButton) {
        cancelLoginButton.addEventListener('click', cancelAdminLogin);
    }
    
    if (checkLoginButton) {
        checkLoginButton.addEventListener('click', checkAdminLogin);
    }
}

// Make all draggable elements draggable
function setupDraggables() {
    const draggables = document.querySelectorAll('.draggable');
    for (let i = 0; i < draggables.length; i++) {
        makeDraggable(draggables[i]);
    }
    
    // Make windows draggable via their headers
    const winElements = document.querySelectorAll('.window');
    for (let i = 0; i < winElements.length; i++) {
        makeDraggable(winElements[i]);
    }
}

// 初期化関数
function initializeDesktop() {
    console.log('Initializing desktop...');
    try {
        // 重要な要素の存在をチェック
        const allElementsExist = checkRequiredElements();
        if (!allElementsExist) {
            console.warn('一部の必要な要素が見つかりませんでした。機能が制限される可能性があります。');
        }
        
        setupEventListeners();
        setupDraggables();
        setupResizeHandles();
        setupStartMenu();
        setupBBS();
        
        // 時計を開始
        setInterval(updateClock, 1000);
        updateClock();
        
        console.log('Initialization complete');
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// 初期化処理
window.addEventListener('load', function() {
    console.log('Window loaded');
    // すでにinitializeDesktop()が実行済みの場合は実行しない
    if (typeof window.desktopInitialized === 'undefined') {
        window.desktopInitialized = true;
        initializeDesktop();
    }
});

// バックアップとしてDOMContentLoadedも監視
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired');
    // すでにinitializeDesktop()が実行済みの場合は実行しない
    if (typeof window.desktopInitialized === 'undefined') {
        window.desktopInitialized = true;
        initializeDesktop();
    }
});
