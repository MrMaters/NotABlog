/* =========================================
   1. RELOJ EN TIEMPO REAL Y CMD
   ========================================= */
function actualizarReloj() {
    const ahora = new Date();
    let horas = ahora.getHours();
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12 || 12;
    const horasTexto = String(horas).padStart(2, '0');
    
    const trayTime = document.getElementById('tray-time');
    if (trayTime) trayTime.innerText = `${horasTexto}:${minutos} ${ampm}`;
    
    const segundos = ahora.getSeconds();
    const milisegundos = ahora.getMilliseconds();
    const gradosHora = (ahora.getHours() % 12) * 30 + ahora.getMinutes() * 0.5;
    const gradosMinuto = ahora.getMinutes() * 6 + segundos * 0.1;
    const gradosSegundo = segundos * 6 + milisegundos * 0.006;
    
    const hourHand = document.getElementById('hour-hand');
    const minuteHand = document.getElementById('minute-hand');
    const secondHand = document.getElementById('second-hand');
    if (hourHand) hourHand.style.transform = `rotate(${gradosHora}deg)`;
    if (minuteHand) minuteHand.style.transform = `rotate(${gradosMinuto}deg)`;
    if (secondHand) secondHand.style.transform = `rotate(${gradosSegundo}deg)`;
}
setInterval(actualizarReloj, 50);
actualizarReloj();

// ==================== CMD (ASPECTO IDÉNTICO A OTRAS VENTANAS, COMPLETO) ====================
let globalZIndex = 10000;
let cmdWindow = null;

function crearVentanaCMD() {
    if (cmdWindow) {
        cmdWindow.close();
    }

    // Contenedor principal
    const ventana = document.createElement('div');
    ventana.id = 'cmd-ventana';
    ventana.className = 'window-xp';
    ventana.style.cssText = `display:flex; width:550px; height:400px; top:100px; left:100px; position:fixed; z-index:${globalZIndex++}`;
    ventana.addEventListener('mousedown', () => {
    ventana.style.zIndex = globalZIndex++;
});

    // Barra de título
    const titleBar = document.createElement('div');
    titleBar.className = 'window-title-bar';
    titleBar.innerHTML = `
        <div class="title-text">
            <span>💻 Símbolo del sistema</span>
        </div>
        <div class="window-controls">
            <button class="btn-min">_</button>
            <button class="btn-max">□</button>
            <button class="btn-close">X</button>
        </div>
    `;

    // Contenido (usa clase window-content)
    const content = document.createElement('div');
    content.className = 'window-content';
    content.style.cssText = 'display:flex; flex-direction:column; background:#000; padding:5px; overflow:hidden;';

    // Terminal
    const terminal = document.createElement('div');
    terminal.id = 'cmd-terminal';
    terminal.style.cssText = 'flex:1; overflow-y:auto; font-family:"Courier New", monospace; font-size:13px; color:#0f0; white-space:pre-wrap; padding:5px; background:#000; min-height:0;';

    // Línea de entrada
    const inputLine = document.createElement('div');
    inputLine.style.cssText = 'display:flex; align-items:center; border-top:1px solid #0f0; padding-top:5px; flex-shrink:0;';
    inputLine.innerHTML = '<span style="color:#0f0; margin-right:5px;">C:\\Users\\NotMaters&gt;</span>';
    const input = document.createElement('input');
    input.id = 'cmd-input';
    input.type = 'text';
    input.style.cssText = 'flex:1; background:transparent; border:none; color:#0f0; font-family:"Courier New", monospace; font-size:13px; outline:none;';
    input.placeholder = 'Escribe un comando...';
    inputLine.appendChild(input);

    content.appendChild(terminal);
    content.appendChild(inputLine);
    ventana.appendChild(titleBar);
    ventana.appendChild(content);
    document.body.appendChild(ventana);

    // CMD al frente al hacer clic (pero nunca sobre el menú inicio)
    ventana.addEventListener('mousedown', () => {
        ventana.style.zIndex = '10002';
    });

    // Estado
    let isMaximized = false;
    let prevRect = { top: 100, left: 100, width: 550, height: 400 };
    let historial = [];
    let historialIndex = -1;

    // Funciones CMD
    function escribirSalida(texto) {
        terminal.innerHTML += texto + '\n';
        terminal.scrollTop = terminal.scrollHeight;
    }

    async function ejecutarComando(cmd) {
        const args = cmd.split(' ');
        const comando = args[0].toLowerCase();
        if (cmd.trim() !== '') {
            historial.push(cmd);
            historialIndex = historial.length;
        }
        escribirSalida(`C:\\Users\\NotMaters&gt;${cmd}`);

        switch (comando) {
            case 'help':
                escribirSalida('Comandos disponibles:\n' +
                    '  help               - Muestra esta ayuda\n' +
                    '  clear              - Limpia la pantalla\n' +
                    '  echo <texto>       - Muestra un mensaje\n' +
                    '  reload             - Recarga la página\n' +
                    '  logout             - Cierra sesión\n' +
                    '  deleteuser <user>  - Elimina un usuario local\n' +
                    '  lsusers            - Lista usuarios locales\n' +
                    '  post <título> | <contenido> - Crea un post (solo admin)\n' +
                    '  version            - Muestra la versión\n' +
                    '  cls                - Limpia la pantalla (alias de clear)');
                break;
            case 'clear':
            case 'cls':
                terminal.innerHTML = '';
                break;
            case 'echo':
                escribirSalida(args.slice(1).join(' '));
                break;
            case 'reload':
                escribirSalida('Recargando...');
                setTimeout(() => location.reload(), 500);
                break;
            case 'logout':
                if (getUsuarioActual()) {
                    escribirSalida('Cerrando sesión...');
                    logout();
                    verificadoConfig = false;
                    actualizarUI();
                    configVentana?.cerrar();
                    pubVentana?.mostrar();
                } else {
                    escribirSalida('No hay sesión activa.');
                }
                break;
            case 'deleteuser':
                const username = args[1];
                if (!username) {
                    escribirSalida('Uso: deleteuser <nombre>');
                } else {
                    let usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
                    const index = usuarios.findIndex(u => u.username === username);
                    if (index !== -1) {
                        usuarios.splice(index, 1);
                        localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
                        escribirSalida(`Usuario '${username}' eliminado.`);
                    } else {
                        escribirSalida(`Usuario '${username}' no encontrado.`);
                    }
                }
                break;
            case 'lsusers':
                const users = JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
                if (users.length === 0) {
                    escribirSalida('No hay usuarios registrados.');
                } else {
                    escribirSalida('Usuarios: ' + users.map(u => u.username).join(', '));
                }
                break;
            case 'post':
                if (!(await esAdmin())) {
                    escribirSalida('Acceso denegado. Solo el administrador puede crear posts.');
                    break;
                }
                const restArgs = args.slice(1).join(' ');
                const separatorIndex = restArgs.indexOf('|');
                if (separatorIndex === -1) {
                    escribirSalida('Uso: post <título> | <contenido>');
                } else {
                    const titulo = restArgs.substring(0, separatorIndex).trim();
                    const contenido = restArgs.substring(separatorIndex + 1).trim();
                    if (!titulo || !contenido) {
                        escribirSalida('El título y el contenido son obligatorios.');
                    } else {
                        try {
                            await crearPost(titulo, contenido);
                            escribirSalida('Post creado exitosamente.');
                            actualizarUI();
                        } catch (error) {
                            escribirSalida('Error al crear el post: ' + error.message);
                        }
                    }
                }
                break;
            case 'version':
                escribirSalida('NotABlog v1.0 - Terminal de administración');
                break;
            default:
                escribirSalida(`'${comando}' no se reconoce como un comando interno o externo,\nprograma o archivo por lotes ejecutable.`);
        }
    }

    // Eventos de teclado
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const comando = input.value.trim();
            input.value = '';
            if (comando !== '') await ejecutarComando(comando);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historialIndex > 0) {
                historialIndex--;
                input.value = historial[historialIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historialIndex < historial.length - 1) {
                historialIndex++;
                input.value = historial[historialIndex];
            } else {
                historialIndex = historial.length;
                input.value = '';
            }
        }
    });

    // Botones de la barra de título
    ventana.querySelector('.btn-close').addEventListener('click', () => {
        ventana.remove();
        cmdWindow = null;
    });
    ventana.querySelector('.btn-min').addEventListener('click', () => {
        ventana.style.display = 'none';
    });
    ventana.querySelector('.btn-max').addEventListener('click', () => {
        if (!isMaximized) {
            const rect = ventana.getBoundingClientRect();
            prevRect = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
            ventana.style.top = '0';
            ventana.style.left = '0';
            ventana.style.width = '100vw';
            ventana.style.height = 'calc(100vh - 35px)';
            ventana.style.borderRadius = '0';
            ventana.querySelector('.btn-max').textContent = '❐';
            isMaximized = true;
        } else {
            ventana.style.top = prevRect.top + 'px';
            ventana.style.left = prevRect.left + 'px';
            ventana.style.width = prevRect.width + 'px';
            ventana.style.height = prevRect.height + 'px';
            ventana.style.borderRadius = '8px 8px 0 0';
            ventana.querySelector('.btn-max').textContent = '□';
            isMaximized = false;
        }
    });

    // Arrastre
    let dragging = false, dragOffsetX = 0, dragOffsetY = 0;
    titleBar.addEventListener('mousedown', (e) => {
        if (e.target.closest('button') || isMaximized) return;
        dragging = true;
        const rect = ventana.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        titleBar.style.cursor = 'grabbing';
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
    });
    function onDrag(e) {
        if (!dragging) return;
        ventana.style.left = (e.clientX - dragOffsetX) + 'px';
        ventana.style.top = (e.clientY - dragOffsetY) + 'px';
    }
    function stopDrag() {
        dragging = false;
        titleBar.style.cursor = 'grab';
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
    }

    // Inicializar terminal
    terminal.innerHTML = 'MaterOS [Versión 1.0.1000]\n(C) Copyright 2026 NotMaters\nEscribe ´´help´´ para ver los comandos disponibles\n\n';
    input.focus();

    cmdWindow = { close: () => ventana.remove() };
}
// ==================== FIN CMD ====================

/* =========================================
   2. SISTEMA DE CUENTAS (FIREBASE, EMAIL, TELÉFONO, RESTABLECIMIENTO, reCAPTCHA)
   ========================================= */
const USUARIOS_KEY = 'blog_usuarios';
const SESION_KEY = 'blog_sesion';
const firebaseConfig = {
  apiKey: "AIzaSyAAerl3iPi5EuxFUdmv--XUvU6sdyp-lWs",
  authDomain: "notmatersblog.firebaseapp.com",
  projectId: "notmatersblog",
  storageBucket: "notmatersblog.firebasestorage.app",
  messagingSenderId: "10713698025",
  appId: "1:10713698025:web:0c908e12e49d25c96cea78"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const ADMIN_EMAIL = 'slltt@proton.me';
const ADMIN_USERNAME = 'NotMaters';

// --- Funciones de cuenta ---
function inicializarUsuarios() {
    let usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
    localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
}

function getUsuarioActual() {
    const sesion = JSON.parse(localStorage.getItem(SESION_KEY));
    return sesion || null;
}

function setUsuarioActual(usuario) {
    if (usuario) localStorage.setItem(SESION_KEY, JSON.stringify(usuario));
    else localStorage.removeItem(SESION_KEY);
}

function login(username, password) {
    return new Promise((resolve, reject) => {
        if (username === ADMIN_USERNAME) {
            firebase.auth().signInWithEmailAndPassword(ADMIN_EMAIL, password)
                .then(async () => {
                    setUsuarioActual({ username: ADMIN_USERNAME, role: 'admin' });
                    await syncUserProfile(ADMIN_USERNAME, { role: 'admin' });
                    resolve(true);
                })
                .catch(error => reject(error.message));
            return;
        }
        const usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
        const usuarioLocal = usuarios.find(u => u.username === username);
        if (!usuarioLocal) { reject('Usuario no encontrado'); return; }
        firebase.auth().signInWithEmailAndPassword(usuarioLocal.email, password)
            .then(async () => {
                setUsuarioActual({ username: username, role: usuarioLocal.role });
                await syncUserProfile(username);
                resolve(true);
            })
            .catch(error => reject(error.message));
    });
}

function registrarUsuario(username, password, email, telefono) {
    return new Promise((resolve, reject) => {
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(async (userCredential) => {
                let usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
                if (usuarios.some(u => u.username === username)) {
                    reject('El usuario ya existe');
                    return;
                }
                const userData = {
                    username, password, email, telefono: telefono || '',
                    role: 'user', uid: userCredential.user.uid,
                    avatar_url: '',
                    avatar_delete_token: ''
                };
                usuarios.push(userData);
                localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
                setUsuarioActual({ username, role: 'user' });
                await db.collection('usuarios').doc(username).set({
                    email, telefono: telefono || '', role: 'user',
                    avatar_url: '', avatar_delete_token: ''
                });
                resolve(true);
            })
            .catch(error => reject(error.message));
    });
}

async function syncUserProfile(username, extraData = {}) {
    try {
        const doc = await db.collection('usuarios').doc(username).get();
        let usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
        let index = usuarios.findIndex(u => u.username === username);
        let userData = index !== -1 ? usuarios[index] : { username, ...extraData };

        if (doc.exists) {
            const data = doc.data();
            userData.avatar_url = data.avatar_url || '';
            userData.avatar_delete_token = data.avatar_delete_token || '';
            userData.email = data.email || userData.email;
            userData.telefono = data.telefono || userData.telefono;
        } else {
            await db.collection('usuarios').doc(username).set({
                email: userData.email || '',
                telefono: userData.telefono || '',
                role: userData.role || 'user',
                avatar_url: userData.avatar_url || '',
                avatar_delete_token: userData.avatar_delete_token || ''
            });
        }

        if (index !== -1) {
            usuarios[index] = userData;
        } else {
            usuarios.push(userData);
        }
        localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
    } catch (error) {
        console.error('Error al sincronizar perfil:', error);
    }
}

function logout() {
    firebase.auth().signOut().catch(() => {});
    setUsuarioActual(null);
}

async function esAdmin() {
    const user = firebase.auth().currentUser;
    if (user && user.email === ADMIN_EMAIL) return true;
    const usuario = getUsuarioActual();
    return usuario && usuario.role === 'admin';
}

// --- Restablecimiento de contraseña ---
let ventanaRestablecer = null;
let confirmationResult = null;
let firebaseUser = null;
let recaptchaVerifier = null;

function crearVentanaRestablecer() {
    let ventanaRest = document.getElementById('window-restablecer');
    if (!ventanaRest) {
        ventanaRest = document.createElement('div');
        ventanaRest.id = 'window-restablecer';
        ventanaRest.className = 'window-xp';
        ventanaRest.style.cssText = 'display:none; width:450px; top:120px; left:350px; height:auto; max-height:80vh;';
        ventanaRest.innerHTML = `
            <div class="window-title-bar">
                <div class="title-text"><img src="assets/images/icono-perfil.png" width="16"> Restablecer Contraseña</div>
                <div class="window-controls"><button class="btn-min">_</button><button class="btn-max">□</button><button class="btn-close">X</button></div>
            </div>
            <div class="window-content" style="display:flex; flex-direction:column; gap:12px; padding:20px; overflow-y:auto;">
                <p style="font-size:13px; color:#555;">Ingresa tu nombre de usuario o correo electrónico para restablecer tu contraseña.</p>
                <input type="text" id="reset-identifier" placeholder="Usuario o correo" style="width:100%; padding:6px; border:1px solid #7f9db9; border-radius:3px;">
                <div id="reset-options" style="display:flex; gap:10px; justify-content:center; margin:5px 0;">
                    <button id="reset-email-btn" style="flex:1; padding:6px; background:#0053e5; color:white; border:none; border-radius:3px; cursor:pointer;">📧 Enviar al correo</button>
                    <button id="reset-sms-btn" style="flex:1; padding:6px; background:#4CAF50; color:white; border:none; border-radius:3px; cursor:pointer;">📱 Enviar al teléfono</button>
                </div>
                <div id="reset-code-section" style="display:none; flex-direction:column; gap:8px; border-top:1px solid #ddd; padding-top:10px;">
                    <label style="font-size:12px; font-weight:bold;">Código de verificación</label>
                    <input type="text" id="reset-code" placeholder="Ingresa el código de 6 dígitos" style="width:100%; padding:6px; border:1px solid #7f9db9; border-radius:3px;">
                    <button id="reset-verify-btn" style="padding:6px; background:#ff9800; color:white; border:none; border-radius:3px; cursor:pointer;">Verificar código</button>
                </div>
                <div id="reset-new-password-section" style="display:none; flex-direction:column; gap:8px; border-top:1px solid #ddd; padding-top:10px;">
                    <label style="font-size:12px; font-weight:bold;">Nueva contraseña</label>
                    <input type="password" id="reset-new-password" placeholder="Nueva contraseña (mínimo 6 caracteres)" style="width:100%; padding:6px; border:1px solid #7f9db9; border-radius:3px;">
                    <button id="reset-confirm-btn" style="padding:6px; background:#4CAF50; color:white; border:none; border-radius:3px; cursor:pointer;">Cambiar contraseña</button>
                </div>
                <div id="reset-message" style="font-size:13px; text-align:center; color:#333;"></div>
                <div id="recaptcha-container"></div>
            </div>
        `;
        document.body.appendChild(ventanaRest);
        
        ventanaRestablecer = crearVentana('#window-restablecer', {
            nombre: 'Restablecer',
            onClose: () => resetearRestablecer()
        });
        
        ventanaRest.querySelector('.btn-close').addEventListener('click', () => {
            ventanaRestablecer?.cerrar();
            resetearRestablecer();
        });
        
        document.getElementById('reset-email-btn').addEventListener('click', enviarCorreoRestablecimiento);
        document.getElementById('reset-sms-btn').addEventListener('click', enviarSMSRestablecimiento);
        document.getElementById('reset-verify-btn').addEventListener('click', verificarCodigoSMS);
        document.getElementById('reset-confirm-btn').addEventListener('click', confirmarCambioContraseña);
    }
    return ventanaRestablecer;
}

function resetearRestablecer() {
    document.getElementById('reset-identifier').value = '';
    document.getElementById('reset-code').value = '';
    document.getElementById('reset-new-password').value = '';
    document.getElementById('reset-code-section').style.display = 'none';
    document.getElementById('reset-new-password-section').style.display = 'none';
    document.getElementById('reset-message').innerHTML = '';
    document.getElementById('reset-message').style.color = '';
    document.getElementById('reset-options').style.display = 'flex';
    confirmationResult = null;
    firebaseUser = null;
    const recaptchaContainer = document.getElementById('recaptcha-container');
    recaptchaContainer.innerHTML = '';
    if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
    }
}

function abrirRestablecer(identificador = '') {
    if (!ventanaRestablecer) ventanaRestablecer = crearVentanaRestablecer();
    if (ventanaRestablecer) {
        resetearRestablecer();
        ventanaRestablecer.mostrar();
        document.getElementById('reset-options').style.display = 'flex';
        if (identificador) document.getElementById('reset-identifier').value = identificador;
    }
}

function enviarCorreoRestablecimiento() {
    const identifier = document.getElementById('reset-identifier').value.trim();
    const msg = document.getElementById('reset-message');
    if (!identifier) { msg.innerHTML = '⚠️ Ingresa tu usuario o correo.'; msg.style.color = 'red'; return; }
    
    if (identifier === ADMIN_USERNAME || identifier === ADMIN_EMAIL) {
        firebase.auth().sendPasswordResetEmail(ADMIN_EMAIL)
            .then(() => {
                msg.innerHTML = `✅ Se ha enviado un enlace de restablecimiento a ${ADMIN_EMAIL}. Revisa tu correo.`;
                msg.style.color = 'green';
                document.getElementById('reset-options').style.display = 'none';
                setTimeout(() => {
                    ventanaRestablecer?.cerrar();
                    resetearRestablecer();
                }, 8000);
            })
            .catch(error => { msg.innerHTML = `❌ Error: ${error.message}`; msg.style.color = 'red'; });
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
    const usuario = usuarios.find(u => u.username === identifier || u.email === identifier);
    if (!usuario) { msg.innerHTML = '❌ No se encontró una cuenta.'; msg.style.color = 'red'; return; }
    if (!usuario.email) { msg.innerHTML = '❌ Esta cuenta no tiene un correo electrónico asociado.'; msg.style.color = 'red'; return; }
    
    firebase.auth().sendPasswordResetEmail(usuario.email)
        .then(() => {
            msg.innerHTML = `✅ Se ha enviado un enlace a ${usuario.email}.`;
            msg.style.color = 'green';
            document.getElementById('reset-options').style.display = 'none';
            setTimeout(() => {
                ventanaRestablecer?.cerrar();
                resetearRestablecer();
            }, 8000);
        })
        .catch(error => { msg.innerHTML = `❌ Error: ${error.message}`; msg.style.color = 'red'; });
}

function enviarSMSRestablecimiento() {
    const identifier = document.getElementById('reset-identifier').value.trim();
    const msg = document.getElementById('reset-message');
    if (!identifier) { msg.innerHTML = '⚠️ Ingresa tu usuario o correo.'; msg.style.color = 'red'; return; }
    
    const usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
    const usuario = usuarios.find(u => u.username === identifier || u.email === identifier);
    if (!usuario) { msg.innerHTML = '❌ No se encontró una cuenta.'; msg.style.color = 'red'; return; }
    if (!usuario.telefono) { msg.innerHTML = '❌ Esta cuenta no tiene un número de teléfono asociado.'; msg.style.color = 'red'; return; }
    
    let phoneNumber = usuario.telefono.trim();
    if (!phoneNumber.startsWith('+')) phoneNumber = '+' + phoneNumber;
    
    const recaptchaContainer = document.getElementById('recaptcha-container');
    recaptchaContainer.innerHTML = '';
    if (recaptchaVerifier) { recaptchaVerifier.clear(); recaptchaVerifier = null; }
    try {
        recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            size: 'invisible', callback: () => {}
        });
    } catch (error) {
        msg.innerHTML = '❌ Error al inicializar reCAPTCHA.'; msg.style.color = 'red'; return;
    }
    firebase.auth().signInWithPhoneNumber(phoneNumber, recaptchaVerifier)
        .then(result => {
            confirmationResult = result;
            msg.innerHTML = `✅ Se ha enviado un código SMS al número ${phoneNumber}.`;
            msg.style.color = 'green';
            document.getElementById('reset-code-section').style.display = 'flex';
            document.getElementById('reset-options').style.display = 'none';
            document.getElementById('reset-new-password-section').style.display = 'none';
        })
        .catch(error => {
            msg.innerHTML = `❌ Error al enviar SMS: ${error.message}`;
            msg.style.color = 'red';
            recaptchaVerifier?.clear();
            recaptchaVerifier = null;
        });
}

function verificarCodigoSMS() {
    const code = document.getElementById('reset-code').value.trim();
    const msg = document.getElementById('reset-message');
    if (!code) { msg.innerHTML = '⚠️ Ingresa el código de verificación.'; msg.style.color = 'red'; return; }
    if (!confirmationResult) { msg.innerHTML = '❌ No se ha enviado ningún código.'; msg.style.color = 'red'; return; }
    confirmationResult.confirm(code)
        .then(result => {
            msg.innerHTML = '✅ Código verificado correctamente. Ahora puedes cambiar tu contraseña.';
            msg.style.color = 'green';
            document.getElementById('reset-code-section').style.display = 'none';
            document.getElementById('reset-new-password-section').style.display = 'flex';
            firebaseUser = result.user;
        })
        .catch(error => {
            msg.innerHTML = `❌ Código incorrecto o expirado. ${error.message}`;
            msg.style.color = 'red';
        });
}

function confirmarCambioContraseña() {
    const newPassword = document.getElementById('reset-new-password').value.trim();
    const msg = document.getElementById('reset-message');
    if (!newPassword || newPassword.length < 6) { msg.innerHTML = '⚠️ La contraseña debe tener al menos 6 caracteres.'; msg.style.color = 'red'; return; }
    if (!firebaseUser) { msg.innerHTML = '❌ No estás autenticado.'; msg.style.color = 'red'; return; }
    firebaseUser.updatePassword(newPassword)
        .then(() => {
            msg.innerHTML = '✅ Contraseña actualizada correctamente.';
            msg.style.color = 'green';
            const identifier = document.getElementById('reset-identifier').value.trim();
            const usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
            const usuario = usuarios.find(u => u.username === identifier || u.email === identifier);
            if (usuario) {
                const index = usuarios.findIndex(u => u.username === usuario.username);
                if (index !== -1) {
                    usuarios[index].password = newPassword;
                    localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
                }
            }
            const actual = getUsuarioActual();
            if (actual && usuario && actual.username === usuario.username) {
                setUsuarioActual({ username: usuario.username, role: usuario.role });
            }
            setTimeout(() => {
                ventanaRestablecer?.cerrar();
                resetearRestablecer();
                actualizarUI();
            }, 2000);
        })
        .catch(error => {
            msg.innerHTML = `❌ Error: ${error.message}`;
            msg.style.color = 'red';
        });
}

/* =========================================
   3. GESTOR DE VENTANAS (UNIFICADO) CON MÉTODO cerrar
   ========================================= */
function crearVentana(selector, opciones = {}) {
    const ventana = document.querySelector(selector);
    if (!ventana) return null;
    
    const barra = ventana.querySelector('.window-title-bar');
    const btnMin = ventana.querySelector('.btn-min');
    const btnMax = ventana.querySelector('.btn-max');
    const btnCerrar = ventana.querySelector('.btn-close');
    const taskbarList = document.getElementById('open-windows-list');
    const contenido = ventana.querySelector('.window-content');
    
    let arrastrando = false, redimensionando = false, direccion = '';
    let offsetX = 0, offsetY = 0, startX = 0, startY = 0, startWidth = 0, startHeight = 0, startTop = 0, startLeft = 0;
    let maximizada = false;
    let tamanioAnterior = { width: '', height: '', top: '', left: '' };
    const nombreVentana = opciones.nombre || ventana.id || 'Ventana';
    const onClose = opciones.onClose || null;
    
    if (contenido) { contenido.style.flex = '1'; contenido.style.overflow = 'hidden'; }
    
    function getLimites() {
        const taskbarHeight = document.getElementById('taskbar')?.offsetHeight || 35;
        return { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight - taskbarHeight };
    }
    
    function ajustarPosicion() {
        const limites = getLimites();
        let top = parseFloat(ventana.style.top) || 0, left = parseFloat(ventana.style.left) || 0;
        top = Math.min(Math.max(top, limites.top), limites.bottom - ventana.offsetHeight);
        left = Math.min(Math.max(left, limites.left), limites.right - ventana.offsetWidth);
        ventana.style.top = top + 'px'; ventana.style.left = left + 'px';
    }
    
    function iniciarRedimension(e, dir) {
        if (maximizada) return;
        redimensionando = true; direccion = dir;
        const rect = ventana.getBoundingClientRect();
        startX = e.clientX; startY = e.clientY; startWidth = rect.width; startHeight = rect.height; startTop = rect.top; startLeft = rect.left;
        document.addEventListener('mousemove', onResize);
        document.addEventListener('mouseup', detenerRedimension);
        e.preventDefault();
    }
    
    function onResize(e) {
        if (!redimensionando) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        let newWidth = startWidth, newHeight = startHeight, newTop = startTop, newLeft = startLeft;
        const limites = getLimites();
        if (direccion.includes('e')) { newWidth = Math.max(200, startWidth + dx); if (startLeft + newWidth > limites.right) newWidth = limites.right - startLeft; }
        if (direccion.includes('w')) { newWidth = Math.max(200, startWidth - dx); newLeft = startLeft + dx; if (newLeft < limites.left) { newLeft = limites.left; newWidth = startWidth + (startLeft - limites.left); } }
        if (direccion.includes('s')) { newHeight = Math.max(100, startHeight + dy); if (startTop + newHeight > limites.bottom) newHeight = limites.bottom - startTop; }
        if (direccion.includes('n')) { newHeight = Math.max(100, startHeight - dy); newTop = startTop + dy; if (newTop < limites.top) { newTop = limites.top; newHeight = startHeight + (startTop - limites.top); } }
        ventana.style.width = newWidth + 'px'; ventana.style.height = newHeight + 'px';
        if (direccion.includes('w')) ventana.style.left = newLeft + 'px';
        if (direccion.includes('n')) ventana.style.top = newTop + 'px';
    }
    
    function detenerRedimension() { redimensionando = false; document.removeEventListener('mousemove', onResize); document.removeEventListener('mouseup', detenerRedimension); }
    
    function agregarHandle(ventana, direccion) {
        const handle = document.createElement('div');
        handle.style.position = 'absolute'; handle.style.zIndex = '10'; handle.style.background = 'transparent';
        handle.style.cursor = getCursor(direccion);
        const size = 8;
        switch (direccion) {
            case 'n': handle.style.cssText = `position:absolute; top:0; left:${size}px; right:${size}px; height:${size}px; cursor:n-resize;`; break;
            case 's': handle.style.cssText = `position:absolute; bottom:0; left:${size}px; right:${size}px; height:${size}px; cursor:s-resize;`; break;
            case 'e': handle.style.cssText = `position:absolute; right:0; top:${size}px; bottom:${size}px; width:${size}px; cursor:e-resize;`; break;
            case 'w': handle.style.cssText = `position:absolute; left:0; top:${size}px; bottom:${size}px; width:${size}px; cursor:w-resize;`; break;
            case 'ne': handle.style.cssText = `position:absolute; top:0; right:0; width:${size}px; height:${size}px; cursor:ne-resize;`; break;
            case 'nw': handle.style.cssText = `position:absolute; top:0; left:0; width:${size}px; height:${size}px; cursor:nw-resize;`; break;
            case 'se': handle.style.cssText = `position:absolute; bottom:0; right:0; width:${size}px; height:${size}px; cursor:se-resize;`; break;
            case 'sw': handle.style.cssText = `position:absolute; bottom:0; left:0; width:${size}px; height:${size}px; cursor:sw-resize;`; break;
        }
        handle.addEventListener('mousedown', (e) => iniciarRedimension(e, direccion));
        ventana.appendChild(handle);
    }
    
    function getCursor(dir) {
        const map = { n:'n-resize', s:'s-resize', e:'e-resize', w:'w-resize', ne:'ne-resize', nw:'nw-resize', se:'se-resize', sw:'sw-resize' };
        return map[dir] || 'default';
    }

    ventana.addEventListener('mousedown', () => {
    ventana.style.zIndex = globalZIndex++;
});
    
    ['n','s','e','w','ne','nw','se','sw'].forEach(dir => agregarHandle(ventana, dir));
    
    barra.addEventListener('mousedown', (e) => {
        if (e.target.closest('.window-controls') || maximizada) return;
        arrastrando = true;
        const rect = ventana.getBoundingClientRect();
        offsetX = e.clientX - rect.left; offsetY = e.clientY - rect.top;
        barra.style.cursor = 'grabbing';
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', detenerArrastre);
        e.preventDefault();
    });
    
    function onDrag(e) {
        if (!arrastrando) return;
        let left = e.clientX - offsetX, top = e.clientY - offsetY;
        const limites = getLimites();
        left = Math.max(limites.left, Math.min(limites.right - ventana.offsetWidth, left));
        top = Math.max(limites.top, Math.min(limites.bottom - ventana.offsetHeight, top));
        ventana.style.left = left + 'px'; ventana.style.top = top + 'px';
    }
    
    function detenerArrastre() { arrastrando = false; barra.style.cursor = 'default'; document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', detenerArrastre); }
    
    if (btnMin) btnMin.addEventListener('click', () => ventana.style.display = 'none');
    if (btnMax) btnMax.addEventListener('click', () => {
        if (!maximizada) {
            const rect = ventana.getBoundingClientRect();
            tamanioAnterior = { width: rect.width + 'px', height: rect.height + 'px', top: rect.top + 'px', left: rect.left + 'px' };
            const taskbarHeight = document.getElementById('taskbar')?.offsetHeight || 35;
            ventana.style.width = '100%'; ventana.style.height = `calc(100vh - ${taskbarHeight}px)`; ventana.style.top = '0'; ventana.style.left = '0';
            ventana.classList.add('maximizada'); maximizada = true; btnMax.textContent = '❐';
        } else {
            ventana.style.width = tamanioAnterior.width; ventana.style.height = tamanioAnterior.height; ventana.style.top = tamanioAnterior.top; ventana.style.left = tamanioAnterior.left;
            ventana.classList.remove('maximizada'); maximizada = false; btnMax.textContent = '□';
        }
    });
    
    function cerrar() {
        if (onClose) onClose();
        const btnTask = taskbarList?.querySelector(`[data-ventana="${ventana.id}"]`);
        if (btnTask) btnTask.remove();
        ventana.style.display = 'none';
    }
    if (btnCerrar) btnCerrar.addEventListener('click', cerrar);
    
    function agregarABarra() {
        if (!taskbarList || taskbarList.querySelector(`[data-ventana="${ventana.id}"]`)) return;
        const btn = document.createElement('button');
        btn.className = 'taskbar-item active'; btn.dataset.ventana = ventana.id; btn.textContent = nombreVentana;
        btn.addEventListener('click', () => ventana.style.display = (ventana.style.display === 'none') ? 'flex' : 'none');
        taskbarList.appendChild(btn);
    }
    
    function mostrar() {
        ventana.style.zIndex = '10001'; // Por encima del CMD
        ventana.style.zIndex = globalZIndex++;
        ventana.style.display = 'flex';
        agregarABarra();
        setTimeout(ajustarPosicion, 10);
    }
    function ocultar() { ventana.style.display = 'none'; }
    
    if (ventana.style.display === 'flex') agregarABarra();
    window.addEventListener('resize', () => {
        if (maximizada) {
            const taskbarHeight = document.getElementById('taskbar')?.offsetHeight || 35;
            ventana.style.width = '100%'; ventana.style.height = `calc(100vh - ${taskbarHeight}px)`;
        } else if (ventana.style.display === 'flex') ajustarPosicion();
    });
    
    return { mostrar, ocultar, cerrar, toggle: () => ventana.style.display === 'none' ? mostrar() : ocultar(), ventana, maximizada: () => maximizada, restaurar: () => maximizada && btnMax?.click(), ajustar: ajustarPosicion };
}

/* =========================================
   4. VARIABLES GLOBALES
   ========================================= */
let pubVentana = null, perfilVentana = null, configVentana = null, cuentaVentana = null, eliminarCuentaVentana = null;
let verificadoConfig = false, modoVistaPost = false, postVisto = null, filtroFecha = null;
let mesCalendario = new Date().getMonth(), anioCalendario = new Date().getFullYear();

/* =========================================
   5. MENÚ DE INICIO Y UI
   ========================================= */
function actualizarMenuInicio() {
    const usuario = getUsuarioActual();
    const userDiv = document.querySelector('.start-user-area');
    if (!userDiv) return;
    const cerrarSesionBtn = document.getElementById('start-cerrar-sesion');
    if (cerrarSesionBtn) cerrarSesionBtn.style.display = usuario ? 'block' : 'none';

    let avatarSrc = 'assets/images/icono-perfil.png';
    if (usuario) {
        const usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
        const datos = usuarios.find(u => u.username === usuario.username);
        if (datos && datos.avatar_url) {
            avatarSrc = datos.avatar_url;
        } else if (datos?.avatarBase64) {
            avatarSrc = datos.avatarBase64;
        }
    }

    userDiv.innerHTML = usuario ? `
        <img src="${avatarSrc}" style="width:32px; height:32px; border-radius:50%; border:1px solid #0053e5; object-fit:cover;">
        <div><strong>${usuario.username}</strong><div style="font-size:11px; color:#666;">${usuario.role === 'admin' ? 'Administrador' : 'Usuario'}</div></div>
    ` : `
        <img src="assets/images/icono-perfil.png" style="width:32px; height:32px; border-radius:50%; border:1px solid #aaa;">
        <div><strong>Invitado</strong><div style="font-size:11px; color:#666;">Haz clic para iniciar sesión</div></div>
    `;

    userDiv.onclick = (e) => {
        e.stopPropagation();
        if (usuario) {
            configVentana?.mostrar() || (configVentana = crearVentana('#window-configuracion', { nombre: 'Configuración' }), configVentana.mostrar = function() { crearVentana('#window-configuracion').mostrar(); renderizarConfiguracion(); }, configVentana.mostrar());
        } else {
            cuentaVentana?.mostrar() || (iniciarSistemaCuentas(), cuentaVentana.mostrar());
        }
        document.getElementById('start-menu').style.display = 'none';
    };
}

function actualizarBotonCrearPost() {
    const btn = document.getElementById('btn-nueva-pub');
    if (!btn) return;
    const user = firebase.auth().currentUser;
    const sesion = getUsuarioActual();
    if ((user && user.email === ADMIN_EMAIL) || (sesion && sesion.role === 'admin')) {
        btn.style.display = 'inline-block';
    } else {
        btn.style.display = 'none';
    }
}

function actualizarUI() {
    actualizarMenuInicio(); actualizarBotonCrearPost(); actualizarEstadisticas();
    if (filtroFecha) filtrarPorFecha(filtroFecha);
    else obtenerPosts().then(renderizarPosts);
    actualizarCalendario();
}

/* =========================================
   6. VENTANA DE CUENTA (CON REINICIO Y 3s DE ÉXITO)
   ========================================= */
function crearVentanaCuenta() {
    let ventanaCuenta = document.getElementById('window-cuenta');
    if (!ventanaCuenta) {
        ventanaCuenta = document.createElement('div');
        ventanaCuenta.id = 'window-cuenta';
        ventanaCuenta.className = 'window-xp';
        ventanaCuenta.style.cssText = 'display:none; width:440px; top:100px; left:300px;';
        ventanaCuenta.innerHTML = `
            <div class="window-title-bar"><div class="title-text"><img src="assets/images/icono-perfil.png" width="16"> Cuenta</div><div class="window-controls"><button class="btn-min">_</button><button class="btn-max">□</button><button class="btn-close">X</button></div></div>
            <div class="window-content" style="height:auto; max-height:80vh; display:flex; flex-direction:column; gap:12px; padding:20px; overflow-y:auto;">
                <div style="display:flex; gap:10px; border-bottom:1px solid #ddd; padding-bottom:10px;">
                    <button id="tab-login" class="tab-btn active" style="flex:1; padding:5px; background:#0053e5; color:white; border:none; border-radius:3px; cursor:pointer;">Iniciar Sesión</button>
                    <button id="tab-registro" class="tab-btn" style="flex:1; padding:5px; background:#ece9d8; color:#333; border:1px solid #7f9db9; border-radius:3px; cursor:pointer;">Registrarse</button>
                </div>
                <div id="panel-login" class="panel">
                    <div style="margin-bottom:10px;"><label>Usuario</label><input type="text" id="login-username" style="width:100%; padding:5px; border:1px solid #7f9db9; border-radius:3px;"></div>
                    <div style="margin-bottom:10px;"><label>Contraseña</label><input type="password" id="login-password" style="width:100%; padding:5px; border:1px solid #7f9db9; border-radius:3px;"></div>
                    <div id="login-captcha-container" style="margin-bottom:10px; display:flex; justify-content:center;"></div>
                    <button id="btn-login" style="width:100%; padding:6px; background:#0053e5; color:white; border:none; border-radius:3px; cursor:pointer;">Iniciar Sesión</button>
                    <div style="margin-top:6px; text-align:center;"><button id="btn-restablecer" style="background:none; border:none; color:#0053e5; text-decoration:underline; cursor:pointer; font-size:12px;">¿Olvidaste tu contraseña?</button></div>
                    <div id="login-message" style="margin-top:8px; font-size:12px; color:red;"></div>
                </div>
                <div id="panel-registro" class="panel" style="display:none;">
                    <div style="margin-bottom:10px;"><label>Usuario</label><input type="text" id="registro-username" style="width:100%; padding:5px; border:1px solid #7f9db9; border-radius:3px;"></div>
                    <div style="margin-bottom:10px;"><label>Correo electrónico</label><input type="email" id="registro-email" placeholder="ejemplo@correo.com" style="width:100%; padding:5px; border:1px solid #7f9db9; border-radius:3px;"></div>
                    <div style="margin-bottom:10px;"><label>Número de teléfono</label><input type="tel" id="registro-telefono" placeholder="+52 123 456 7890" style="width:100%; padding:5px; border:1px solid #7f9db9; border-radius:3px;"></div>
                    <div style="margin-bottom:10px;"><label>Contraseña</label><input type="password" id="registro-password" style="width:100%; padding:5px; border:1px solid #7f9db9; border-radius:3px;"></div>
                    <div id="registro-captcha-container" style="margin-bottom:10px; display:flex; justify-content:center;"></div>
                    <button id="btn-registro" style="width:100%; padding:6px; background:#4CAF50; color:white; border:none; border-radius:3px; cursor:pointer;">Crear Cuenta</button>
                    <div id="registro-message" style="margin-top:8px; font-size:12px; color:red;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(ventanaCuenta);
        
        let loginWidgetId = null, registroWidgetId = null;
        const SITE_KEY = '6LfOBGAtAAAAAGhjHEgPowLgWU_NgNpJZC2TmJTP';

        function renderizarCaptcha(contenedorId) {
            if (typeof grecaptcha === 'undefined') { setTimeout(() => renderizarCaptcha(contenedorId), 500); return null; }
            const container = document.getElementById(contenedorId);
            if (!container) return null;
            if (container.dataset.widgetId) {
                try { grecaptcha.reset(container.dataset.widgetId); } catch(e) {}
                return container.dataset.widgetId;
            }
            try {
                const widgetId = grecaptcha.render(container.id, { sitekey: SITE_KEY, size: 'normal' });
                container.dataset.widgetId = widgetId;
                return widgetId;
            } catch(e) { console.error('Error reCAPTCHA:', e); return null; }
        }

        document.getElementById('tab-login').addEventListener('click', () => {
            document.getElementById('panel-login').style.display = 'block';
            document.getElementById('panel-registro').style.display = 'none';
            document.getElementById('tab-login').style.background = '#0053e5'; document.getElementById('tab-login').style.color = 'white';
            document.getElementById('tab-registro').style.background = '#ece9d8'; document.getElementById('tab-registro').style.color = '#333';
            loginWidgetId = renderizarCaptcha('login-captcha-container');
        });
        document.getElementById('tab-registro').addEventListener('click', () => {
            document.getElementById('panel-login').style.display = 'none';
            document.getElementById('panel-registro').style.display = 'block';
            document.getElementById('tab-registro').style.background = '#0053e5'; document.getElementById('tab-registro').style.color = 'white';
            document.getElementById('tab-login').style.background = '#ece9d8'; document.getElementById('tab-login').style.color = '#333';
            registroWidgetId = renderizarCaptcha('registro-captcha-container');
        });

        document.getElementById('btn-login').addEventListener('click', async () => {
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();
            const msg = document.getElementById('login-message');
            if (!username || !password) { msg.textContent = 'Completa todos los campos'; msg.style.color = 'red'; return; }
            if (!loginWidgetId) loginWidgetId = document.getElementById('login-captcha-container')?.dataset.widgetId;
            let captchaResponse = '';
            if (loginWidgetId) try { captchaResponse = grecaptcha.getResponse(loginWidgetId); } catch(e) {}
            if (!captchaResponse) { msg.textContent = '⚠️ Por favor, completa el reCAPTCHA.'; msg.style.color = 'red'; return; }
            try {
                await login(username, password);
                msg.textContent = '✅ Sesión iniciada'; msg.style.color = 'green';
                actualizarUI();
                setTimeout(() => {
                    if (cuentaVentana) {
                        cuentaVentana.cerrar();
                        resetVentanaCuenta();
                    }
                }, 3000);
            } catch (error) {
                msg.textContent = `❌ ${error}`; msg.style.color = 'red';
                loginWidgetId = renderizarCaptcha('login-captcha-container');
            }
        });
        
        document.getElementById('btn-restablecer').addEventListener('click', () => {
            abrirRestablecer(document.getElementById('login-username').value.trim());
        });
        
        document.getElementById('btn-registro').addEventListener('click', async () => {
            const username = document.getElementById('registro-username').value.trim();
            const email = document.getElementById('registro-email').value.trim();
            const telefono = document.getElementById('registro-telefono').value.trim();
            const password = document.getElementById('registro-password').value.trim();
            const msg = document.getElementById('registro-message');
            if (!username || !email || !password) { msg.textContent = 'Completa todos los campos'; msg.style.color = 'red'; return; }
            if (!email.includes('@')) { msg.textContent = 'Ingresa un correo electrónico válido.'; msg.style.color = 'red'; return; }
            if (!registroWidgetId) registroWidgetId = document.getElementById('registro-captcha-container')?.dataset.widgetId;
            let captchaResponse = '';
            if (registroWidgetId) try { captchaResponse = grecaptcha.getResponse(registroWidgetId); } catch(e) {}
            if (!captchaResponse) { msg.textContent = '⚠️ Por favor, completa el reCAPTCHA.'; msg.style.color = 'red'; return; }
            try {
                await registrarUsuario(username, password, email, telefono);
                msg.textContent = '✅ Cuenta creada e iniciada sesión'; msg.style.color = 'green';
                actualizarUI();
                setTimeout(() => {
                    if (cuentaVentana) {
                        cuentaVentana.cerrar();
                        resetVentanaCuenta();
                    }
                }, 3000);
            } catch (error) {
                msg.textContent = `❌ ${error}`; msg.style.color = 'red';
                registroWidgetId = renderizarCaptcha('registro-captcha-container');
            }
        });

        setTimeout(() => {
            if (document.getElementById('panel-login').style.display !== 'none') loginWidgetId = renderizarCaptcha('login-captcha-container');
            else registroWidgetId = renderizarCaptcha('registro-captcha-container');
        }, 200);
    }
    return crearVentana('#window-cuenta', {
        nombre: 'Cuenta',
        onClose: () => resetVentanaCuenta()
    });
}

function resetVentanaCuenta() {
    const panelLogin = document.getElementById('panel-login');
    const panelRegistro = document.getElementById('panel-registro');
    if (panelLogin && panelRegistro) {
        panelLogin.style.display = 'block';
        panelRegistro.style.display = 'none';
        document.getElementById('tab-login').style.background = '#0053e5';
        document.getElementById('tab-login').style.color = 'white';
        document.getElementById('tab-registro').style.background = '#ece9d8';
        document.getElementById('tab-registro').style.color = '#333';
    }
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('registro-username').value = '';
    document.getElementById('registro-email').value = '';
    document.getElementById('registro-telefono').value = '';
    document.getElementById('registro-password').value = '';
    document.getElementById('login-message').textContent = '';
    document.getElementById('registro-message').textContent = '';
    if (typeof grecaptcha !== 'undefined') {
        const loginContainer = document.getElementById('login-captcha-container');
        const registroContainer = document.getElementById('registro-captcha-container');
        if (loginContainer && loginContainer.dataset.widgetId) grecaptcha.reset(loginContainer.dataset.widgetId);
        if (registroContainer && registroContainer.dataset.widgetId) grecaptcha.reset(registroContainer.dataset.widgetId);
    }
}

function iniciarSistemaCuentas() {
    inicializarUsuarios();
    cuentaVentana = crearVentanaCuenta();
    ventanaRestablecer = crearVentanaRestablecer();
    actualizarUI();
}

/* =========================================
   7. SISTEMA DE PUBLICACIONES (FIRESTORE) + COMENTARIOS ANIDADOS + IMAGE TOKENS
   ========================================= */
async function obtenerPosts() {
    try {
        const snapshot = await db.collection('posts').orderBy('fecha', 'desc').get();
        const posts = [];
        snapshot.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));
        return posts;
    } catch (error) { console.error("Error al obtener posts:", error); return []; }
}

async function crearPost(titulo, contenido, portadaTitulo, portadaSubtitulo, imageTokens = []) {
    const usuario = getUsuarioActual();
    const nuevoPost = {
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        autor: usuario ? usuario.username : 'Anónimo',
        fecha: new Date().toISOString(),
        portada_titulo: portadaTitulo?.trim() || '',
        portada_subtitulo: portadaSubtitulo?.trim() || '',
        image_tokens: imageTokens
    };
    const docRef = await db.collection('posts').add(nuevoPost);
    return { id: docRef.id, ...nuevoPost };
}

async function eliminarPost(id) {
    try {
        const doc = await db.collection('posts').doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            if (data.image_tokens && Array.isArray(data.image_tokens)) {
                for (const token of data.image_tokens) {
                    await eliminarImagenCloudinary(token);
                }
            }
        }
        await db.collection('posts').doc(id).delete();
    } catch (error) {
        console.error('Error al eliminar post:', error);
        throw error;
    }
}

async function buscarPosts(query) {
    const posts = await obtenerPosts();
    if (!query.trim()) return posts;
    const q = query.toLowerCase().trim();
    return posts.filter(p => p.titulo.toLowerCase().includes(q) || p.contenido.toLowerCase().includes(q));
}

// --- MENSAJES (COMENTARIOS ANIDADOS) ---
async function obtenerMensajes(postId) {
    try {
        const snapshot = await db.collection('posts').doc(postId)
            .collection('comentarios')
            .orderBy('timestamp', 'asc')
            .get();
        const mensajes = [];
        snapshot.forEach(doc => mensajes.push({ id: doc.id, ...doc.data() }));
        return mensajes;
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        return [];
    }
}

async function agregarMensaje(postId, parentId, texto) {
    const usuario = getUsuarioActual();
    if (!usuario) throw new Error('Debes iniciar sesión para comentar.');
    const user = firebase.auth().currentUser;
    const mensaje = {
        parentId: parentId || null,
        autor: usuario.username,
        userId: user ? user.uid : 'unknown',
        texto: texto.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await db.collection('posts').doc(postId).collection('comentarios').add(mensaje);
    return { id: docRef.id, ...mensaje, timestamp: new Date().toISOString() };
}

async function eliminarMensaje(postId, mensajeId) {
    await db.collection('posts').doc(postId).collection('comentarios').doc(mensajeId).delete();
}

/* =========================================
   8. RENDERIZAR POSTS Y ESTADÍSTICAS (CON HILOS DE COMENTARIOS + AVATARES)
   ========================================= */
function actualizarEstadisticas() {
    obtenerPosts().then(posts => {
        const total = document.getElementById('total-posts');
        const ultimo = document.getElementById('last-post-date');
        if (total) total.textContent = posts.length;
        if (ultimo) ultimo.textContent = posts.length ? formatearFecha(posts[0].fecha) : 'Ninguno';
    });
}

function formatearFecha(fechaISO) {
    const d = new Date(fechaISO);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeHTML(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

function renderizarPosts(postsData = null) {
    const area = document.getElementById('posts-area');
    if (!area || modoVistaPost || area.dataset.modo === 'formulario') return;
    if (!postsData) { obtenerPosts().then(renderizarPosts); return; }
    if (postsData.length === 0) { area.innerHTML = '<div class="empty-message">📭 No hay publicaciones. ¡Crea una!</div>'; return; }
    
    area.innerHTML = postsData.map(post => `
        <div class="post-item" data-id="${post.id}">
            <h3 style="font-size:18px; margin-bottom:2px;">${escapeHTML(post.portada_titulo || post.titulo)}</h3>
            ${post.portada_subtitulo ? `<p style="font-size:14px; color:#666; margin:0 0 8px 0;">${escapeHTML(post.portada_subtitulo)}</p>` : ''}
            <div class="post-meta">✍️ ${escapeHTML(post.autor)} | 📅 ${formatearFecha(post.fecha)}</div>
            <div class="post-actions">
                <button class="btn-ver-post">📖 Leer más</button>
                ${esAdmin() ? '<button class="btn-eliminar">🗑️ Eliminar</button>' : ''}
            </div>
        </div>
    `).join('');
    
    area.querySelectorAll('.btn-ver-post').forEach(btn => btn.addEventListener('click', (e) => mostrarPostCompleto(e.target.closest('.post-item').dataset.id)));
    area.querySelectorAll('.btn-eliminar').forEach(btn => btn.addEventListener('click', async (e) => {
        if (confirm('¿Eliminar esta publicación permanentemente?')) {
            await eliminarPost(e.target.closest('.post-item').dataset.id);
            actualizarUI();
        }
    }));
}

function mostrarPostCompleto(id) {
    obtenerPosts().then(posts => {
        const post = posts.find(p => p.id === id);
        if (!post) { alert('El post no existe.'); return; }
        postVisto = post; modoVistaPost = true; renderizarPostDetallado(post);
    });
}

async function renderizarPostDetallado(post) {
    const area = document.getElementById('posts-area');
    delete area.dataset.modo;
    area.style.display = 'flex'; area.style.flexDirection = 'column'; area.style.height = '100%';
    
    area.innerHTML = `
        <div style="display:flex; flex-direction:column; height:100%; padding:5px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h2 style="color:#003399; margin:0;">${escapeHTML(post.titulo)}</h2>
                <button id="volver-lista-btn" style="padding:4px 15px; background:#ece9d8; border:1px solid #7f9db9; border-radius:3px; cursor:pointer;">← Volver</button>
            </div>
            <div style="font-size:13px; color:#888; margin-bottom:10px;">✍️ ${escapeHTML(post.autor)} | 📅 ${formatearFecha(post.fecha)}</div>
            <div class="contenido-post" style="flex:1; overflow-y:auto; border:1px solid #ddd; border-radius:4px; padding:15px; background:#f9f9f9;">
                <div class="ql-editor" style="padding:0; font-size:15px; line-height:1.7;">${post.contenido}</div>
                
                <!-- Sección de comentarios -->
                <div style="margin-top: 25px; border-top: 2px solid #0053e5; padding-top: 15px;">
                    <h3 style="color: #003399; margin-bottom: 10px;">💬 Comentarios</h3>
                    <div id="comentarios-lista" style="margin-bottom: 15px;"></div>
                    <div id="comentarios-form" style="margin-top: 10px;"></div>
                </div>
            </div>
        </div>`;

    document.getElementById('volver-lista-btn').addEventListener('click', volverALista);

    const listaComentarios = document.getElementById('comentarios-lista');
    const formComentarios = document.getElementById('comentarios-form');
    const usuarioActual = getUsuarioActual();

    // Cache de avatares
    const avatarCache = {};

    async function obtenerAvatar(autor) {
        if (avatarCache[autor]) return avatarCache[autor];
        const usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
        const localUser = usuarios.find(u => u.username === autor);
        if (localUser && localUser.avatar_url) {
            avatarCache[autor] = localUser.avatar_url;
            return localUser.avatar_url;
        }
        try {
            const doc = await db.collection('usuarios').doc(autor).get();
            if (doc.exists && doc.data().avatar_url) {
                avatarCache[autor] = doc.data().avatar_url;
                return doc.data().avatar_url;
            }
        } catch(e) {}
        avatarCache[autor] = 'assets/images/icono-perfil.png';
        return avatarCache[autor];
    }

    // Construir el árbol de comentarios
    function construirArbol(mensajes, parentId = null, nivel = 0) {
        const hijos = mensajes.filter(m => m.parentId === parentId);
        if (hijos.length === 0) return '';
        
        let html = '';
        for (const m of hijos) {
            let fecha = 'hace un momento';
            if (m.timestamp) {
                let dateObj;
                if (m.timestamp.toDate && typeof m.timestamp.toDate === 'function') dateObj = m.timestamp.toDate();
                else if (m.timestamp instanceof Date) dateObj = m.timestamp;
                else if (typeof m.timestamp === 'string') dateObj = new Date(m.timestamp);
                else if (m.timestamp.seconds) dateObj = new Date(m.timestamp.seconds * 1000);
                else dateObj = new Date();
                fecha = formatearFecha(dateObj.toISOString());
            }

            const esAutor = usuarioActual && usuarioActual.username === m.autor;
            const esAdminUser = usuarioActual && usuarioActual.role === 'admin';
            const puedeBorrar = esAutor || esAdminUser;
            const tieneHijos = mensajes.some(h => h.parentId === m.id);
            const avatarUrl = avatarCache[m.autor] || 'assets/images/icono-perfil.png';
            
            const respuestasId = `respuestas-${m.id}`;
            const formRespId = `form-responder-${m.id}`;

            html += `
                <div style="margin-left:${nivel * 20}px; border-left: 2px solid ${nivel > 0 ? '#ccc' : 'transparent'}; padding-left: 10px; margin-bottom: 8px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <img src="${avatarUrl}" style="width:20px; height:20px; border-radius:50%; object-fit:cover; border:1px solid #ccc;">
                        <strong style="font-size:13px;">${escapeHTML(m.autor)}</strong>
                        <span style="color:#888; font-size:11px;">${fecha}</span>
                        ${puedeBorrar ? `<button class="btn-borrar-mensaje" data-id="${m.id}" style="margin-left:auto; background:none; border:none; color:#e4433c; cursor:pointer; font-size:11px;">🗑️</button>` : ''}
                    </div>
                    <p style="margin:4px 0 0 26px; color:#333; font-size:13px;">${escapeHTML(m.texto)}</p>
                    ${usuarioActual ? `<button class="btn-responder" data-id="${m.id}" style="margin-left:26px; margin-top:5px; padding:2px 8px; font-size:11px; background:#ece9d8; border:1px solid #7f9db9; border-radius:3px; cursor:pointer;">Responder</button>` : ''}
                    ${tieneHijos ? `<button class="btn-toggle-respuestas" data-target="${respuestasId}" style="margin-left:5px; font-size:11px; background:none; border:none; color:#0053e5; cursor:pointer;">Ver respuestas</button>` : ''}
                    <div id="${respuestasId}" style="display:none; margin-top:5px;">
                        ${construirArbol(mensajes, m.id, nivel + 1)}
                    </div>
                    <div id="${formRespId}" style="display:none; margin-top:5px; margin-left:26px;"></div>
                </div>
            `;
        }
        return html;
    }

    async function cargarComentarios() {
        const mensajes = await obtenerMensajes(post.id);
        if (mensajes.length === 0) {
            listaComentarios.innerHTML = '<p style="color:#888; font-size:13px;">No hay comentarios aún. ¡Sé el primero!</p>';
            return;
        }

        // Obtener avatares de todos los autores únicos
        const autoresUnicos = [...new Set(mensajes.map(m => m.autor))];
        await Promise.all(autoresUnicos.map(autor => obtenerAvatar(autor)));

        listaComentarios.innerHTML = construirArbol(mensajes, null, 0);
        agregarEventosComentarios(post.id, mensajes);
    }

    function agregarEventosComentarios(postId, mensajes) {
        listaComentarios.querySelectorAll('.btn-toggle-respuestas').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const targetDiv = document.getElementById(targetId);
                if (targetDiv) {
                    const isHidden = targetDiv.style.display === 'none';
                    targetDiv.style.display = isHidden ? 'block' : 'none';
                    btn.textContent = isHidden ? 'Ocultar respuestas' : 'Ver respuestas';
                }
            });
        });

        listaComentarios.querySelectorAll('.btn-responder').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const parentId = e.target.dataset.id;
                const formDiv = document.getElementById(`form-responder-${parentId}`);
                if (formDiv.style.display === 'none') {
                    formDiv.style.display = 'block';
                    formDiv.innerHTML = `
                        <textarea id="respuesta-texto-${parentId}" placeholder="Escribe tu respuesta..." style="width:100%; padding:4px; border:1px solid #7f9db9; border-radius:3px; font-size:12px; resize:vertical; min-height:40px;"></textarea>
                        <button class="btn-enviar-respuesta" data-parent="${parentId}" style="margin-top:4px; padding:2px 10px; background:#0053e5; color:white; border:none; border-radius:3px; cursor:pointer; font-size:12px;">Enviar</button>
                        <span id="respuesta-mensaje-${parentId}" style="font-size:11px; margin-left:5px;"></span>
                    `;
                    formDiv.querySelector('.btn-enviar-respuesta').addEventListener('click', async () => {
                        const texto = document.getElementById(`respuesta-texto-${parentId}`).value.trim();
                        const msg = document.getElementById(`respuesta-mensaje-${parentId}`);
                        if (!texto) {
                            msg.textContent = 'Escribe algo.';
                            msg.style.color = 'red';
                            setTimeout(() => { msg.textContent = ''; }, 1500);
                            return;
                        }
                        try {
                            await agregarMensaje(postId, parentId, texto);
                            msg.textContent = '✅ Comentario publicado.';
                            msg.style.color = 'green';
                            setTimeout(() => { msg.textContent = ''; }, 1500);
                            cargarComentarios();
                        } catch (error) {
                            msg.textContent = `❌ Error: ${error.message}`;
                            msg.style.color = 'red';
                            setTimeout(() => { msg.textContent = ''; }, 1500);
                        }
                    });
                } else {
                    formDiv.style.display = 'none';
                    formDiv.innerHTML = '';
                }
            });
        });

        listaComentarios.querySelectorAll('.btn-borrar-mensaje').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const mensajeId = e.target.dataset.id;
                mostrarConfirmacionXP('Eliminar mensaje', '¿Seguro que deseas eliminar este mensaje?', 
                    async () => {
                        await eliminarMensaje(postId, mensajeId);
                        cargarComentarios();
                    },
                    () => {}
                );
            });
        });
    }

    await cargarComentarios();

    if (usuarioActual) {
        formComentarios.innerHTML = `
            <textarea id="nuevo-comentario-texto" placeholder="Escribe tu comentario..." style="width:100%; padding:8px; border:1px solid #7f9db9; border-radius:3px; resize:vertical; min-height:60px; font-family:Tahoma; font-size:13px;"></textarea>
            <button id="btn-enviar-comentario" style="margin-top:8px; padding:6px 15px; background:#0053e5; color:white; border:none; border-radius:3px; cursor:pointer;">Enviar</button>
            <div id="comentario-mensaje" style="font-size:12px; margin-top:5px;"></div>
        `;

        document.getElementById('btn-enviar-comentario').addEventListener('click', async () => {
            const texto = document.getElementById('nuevo-comentario-texto').value.trim();
            const msg = document.getElementById('comentario-mensaje');
            if (!texto) {
                msg.textContent = '❌ Escribe algo para comentar.';
                msg.style.color = 'red';
                setTimeout(() => { msg.textContent = ''; }, 1500);
                return;
            }
            try {
                await agregarMensaje(post.id, null, texto);
                document.getElementById('nuevo-comentario-texto').value = '';
                msg.textContent = '✅ Comentario publicado.';
                msg.style.color = 'green';
                setTimeout(() => { msg.textContent = ''; }, 1500);
                await cargarComentarios();
            } catch (error) {
                msg.textContent = `❌ Error: ${error.message}`;
                msg.style.color = 'red';
                setTimeout(() => { msg.textContent = ''; }, 1500);
            }
        });
    } else {
        formComentarios.innerHTML = `
            <p style="font-size:13px; color:#888;">🔒 <a href="#" id="ir-a-login" style="color:#0053e5; text-decoration:underline;">Inicia sesión</a> para comentar.</p>
        `;
        document.getElementById('ir-a-login').addEventListener('click', (e) => {
            e.preventDefault();
            if (cuentaVentana) {
                cuentaVentana.mostrar();
            } else {
                iniciarSistemaCuentas();
                cuentaVentana.mostrar();
            }
        });
    }
}

function volverALista() { modoVistaPost = false; postVisto = null; actualizarUI(); }

/* =========================================
   9. SUBIR IMAGEN A CLOUDINARY (con delete_token)
   ========================================= */
const CLOUD_NAME = 'jigugfvw', UPLOAD_PRESET = 'NotABlog';
async function subirImagenACloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
    });
    const data = await response.json();
    if (data.secure_url) {
        return { url: data.secure_url, delete_token: data.delete_token || '' };
    }
    throw new Error('Cloudinary no devolvió URL');
}

async function eliminarImagenCloudinary(deleteToken) {
    if (!deleteToken) return;
    try {
        const formData = new FormData();
        formData.append('token', deleteToken);
        await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/delete_by_token`, {
            method: 'POST',
            body: formData
        });
    } catch (error) {
        console.error('Error al eliminar imagen anterior:', error);
    }
}

/* =========================================
   10. BUSCADOR DE GIFS (GIPHY)
   ========================================= */
const GIPHY_API_KEY = '0C6PkjRxfmOfjfBDXyL9CgGvWQBjIg4H';
function mostrarBuscadorGIF(quill) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:99999; display:flex; align-items:center; justify-content:center;';
    modal.innerHTML = `
        <div style="background:white; border-radius:8px; padding:20px; width:500px; max-width:90%; max-height:80%; display:flex; flex-direction:column; box-shadow:0 5px 30px rgba(0,0,0,0.3);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h3 style="margin:0; color:#003399;">Buscar GIFs</h3>
                <button id="gif-modal-close" style="background:none; border:none; font-size:22px; cursor:pointer;">&times;</button>
            </div>
            <div style="display:flex; gap:8px; margin-bottom:10px;">
                <input type="text" id="gif-search-input" placeholder="Buscar GIFs..." style="flex:1; padding:6px; border:1px solid #7f9db9; border-radius:3px;">
                <button id="gif-search-btn" style="padding:6px 16px; background:#0053e5; color:white; border:none; border-radius:3px; cursor:pointer;">Buscar</button>
            </div>
            <div id="gif-results" style="flex:1; overflow-y:auto; display:flex; flex-wrap:wrap; gap:8px; align-content:flex-start; min-height:200px; max-height:400px; padding:4px; border:1px solid #ddd; border-radius:4px;"></div>
        </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#gif-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    const searchInput = modal.querySelector('#gif-search-input'), searchBtn = modal.querySelector('#gif-search-btn'), resultsDiv = modal.querySelector('#gif-results');
    async function buscarGIFs(query) {
        if (!query.trim()) { resultsDiv.innerHTML = '<p style="width:100%; text-align:center; color:#888;">Escribe algo para buscar GIFs</p>'; return; }
        resultsDiv.innerHTML = '<p style="width:100%; text-align:center;">Buscando...</p>';
        try {
            const resp = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`);
            const data = await resp.json();
            if (data.data?.length) {
                resultsDiv.innerHTML = '';
                data.data.forEach(gif => {
                    const img = document.createElement('img');
                    img.src = gif.images.fixed_height_small.url;
                    img.style.cssText = 'width:100px; height:auto; cursor:pointer; border-radius:4px; border:2px solid transparent;';
                    img.addEventListener('mouseenter', () => img.style.borderColor = '#0053e5');
                    img.addEventListener('mouseleave', () => img.style.borderColor = 'transparent');
                    img.addEventListener('click', () => { quill.insertEmbed(quill.getSelection(true).index, 'image', gif.images.original.url); modal.remove(); });
                    resultsDiv.appendChild(img);
                });
            } else resultsDiv.innerHTML = '<p style="width:100%; text-align:center;">No se encontraron GIFs</p>';
        } catch (error) { resultsDiv.innerHTML = '<p style="color:red;">Error al buscar GIFs</p>'; }
    }
    searchBtn.addEventListener('click', () => buscarGIFs(searchInput.value));
    searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') buscarGIFs(searchInput.value); });
}

/* =========================================
   11. FORMULARIO DE CREACIÓN DE POSTS (QUILL, VIDEO RESIZE)
   ========================================= */
let quillInstance = null;

function mostrarFormularioPost() {
    const area = document.getElementById('posts-area');
    if (!area) return;
    area.dataset.modo = 'formulario';
    area.style.display = 'flex'; area.style.flexDirection = 'column'; area.style.height = '100%';
    const imageTokens = [];

    area.innerHTML = `
        <div style="display:flex; flex-direction:column; height:100%; padding:0 5px;">
            <h3 style="color:#003399; margin:0 0 10px 0;">✏️ Nuevo Post</h3>
            <div style="margin-bottom:10px;"><label>Título del post</label><input type="text" id="post-titulo-input" style="width:100%; padding:6px; border:1px solid #7f9db9; border-radius:3px;"></div>
            <div style="margin-bottom:10px;"><label>Título de portada (opcional)</label><input type="text" id="post-portada-titulo" style="width:100%; padding:6px; border:1px solid #7f9db9; border-radius:3px;"></div>
            <div style="margin-bottom:10px;"><label>Subtítulo de portada (opcional)</label><input type="text" id="post-portada-subtitulo" style="width:100%; padding:6px; border:1px solid #7f9db9; border-radius:3px;"></div>
            <div style="flex:1; min-height:0; display:flex; flex-direction:column; margin-bottom:10px;"><label>Contenido</label><div id="editor-container" style="flex:1; min-height:100px;"></div></div>
            <div id="botonera" style="display:flex; gap:10px; justify-content:flex-end; padding-top:10px; border-top:1px solid #ddd;">
                <button id="post-cancelar-btn" style="padding:6px 20px; background:#ece9d8; border:1px solid #7f9db9; border-radius:3px; cursor:pointer;">Cancelar</button>
                <button id="post-guardar-btn" style="padding:6px 20px; background:#0053e5; color:white; border:none; border-radius:3px; cursor:pointer;">Publicar</button>
            </div>
            <div id="post-form-mensaje" style="margin-top:8px; font-size:13px;"></div>
        </div>`;

    if (quillInstance) quillInstance = null;
    quillInstance = new Quill('#editor-container', {
        theme: 'snow', placeholder: 'Escribe tu publicación...',
        modules: {
            toolbar: {
                container: [[{ 'header': [1,2,3,false] }], ['bold','italic','underline','strike'], ['blockquote','code-block'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], [{ 'color': [] }, { 'background': [] }], ['link','image','video'], [{ 'align': [] }], ['gif'], ['clean']],
                handlers: {
                    image: function() {
                        const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.click();
                        input.onchange = async () => {
                            const file = input.files[0]; if (!file) return;
                            const range = this.quill.getSelection(true);
                            this.quill.insertText(range.index, '⏳ Subiendo imagen...');
                            try {
                                const result = await subirImagenACloudinary(file);
                                if (result.delete_token) imageTokens.push(result.delete_token);
                                this.quill.deleteText(range.index, '⏳ Subiendo imagen...'.length);
                                this.quill.insertEmbed(range.index, 'image', result.url);
                            } catch (error) {
                                this.quill.deleteText(range.index, '⏳ Subiendo imagen...'.length);
                                this.quill.insertText(range.index, '❌ Error al subir imagen');
                            }
                        };
                    },
                    gif: function() { mostrarBuscadorGIF(this.quill); },
                    link: function() {
                        const range = this.quill.getSelection(true);
                        if (range && range.length > 0) {
                            const url = prompt('Introduce la URL:', 'https://');
                            if (url) {
                                let finalUrl = url;
                                if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) finalUrl = 'https://' + url;
                                this.quill.format('link', finalUrl);
                            }
                        } else alert('Selecciona un texto primero para añadir un enlace.');
                    }
                }
            },
            imageResize: { displaySize: true, modules: [ 'Resize', 'DisplaySize' ] }
        }
    });
    setTimeout(() => initVideoResize(quillInstance), 100);

    document.getElementById('post-cancelar-btn').addEventListener('click', ocultarFormularioPost);
    document.getElementById('post-guardar-btn').addEventListener('click', async () => {
        const titulo = document.getElementById('post-titulo-input').value.trim();
        const portadaTitulo = document.getElementById('post-portada-titulo').value.trim();
        const portadaSubtitulo = document.getElementById('post-portada-subtitulo').value.trim();
        const contenidoHTML = quillInstance ? quillInstance.root.innerHTML : '';
        const mensaje = document.getElementById('post-form-mensaje');
        if (!titulo) { mensaje.innerHTML = '❌ El título es obligatorio.'; mensaje.style.color = 'red'; return; }
        if (!contenidoHTML || contenidoHTML === '<p><br></p>') { mensaje.innerHTML = '❌ El contenido no puede estar vacío.'; mensaje.style.color = 'red'; return; }
        try {
            await crearPost(titulo, contenidoHTML, portadaTitulo, portadaSubtitulo, imageTokens);
            mensaje.innerHTML = '✅ Publicación creada exitosamente.'; mensaje.style.color = 'green';
            setTimeout(() => { ocultarFormularioPost(); actualizarUI(); }, 500);
        } catch (error) { mensaje.innerHTML = `❌ Error al publicar: ${error.message}`; mensaje.style.color = 'red'; }
    });
}

function ocultarFormularioPost() {
    const area = document.getElementById('posts-area');
    if (area) { delete area.dataset.modo; area.style.display = ''; area.style.flexDirection = ''; }
    if (quillInstance) { quillInstance = null; }
    actualizarUI();
}

// =============================================
//  FUNCIONES PARA VIDEO RESIZE
// =============================================
function initVideoResize(quill) {
    const editor = quill.root;

    editor.querySelectorAll('.video-wrapper').forEach(w => {
        const iframe = w.querySelector('iframe');
        if (iframe) {
            w.parentNode.insertBefore(iframe, w);
            w.remove();
        }
    });

    editor.addEventListener('click', function(e) {
        const target = e.target;
        if (target.tagName === 'IFRAME') {
            e.preventDefault();
            e.stopPropagation();
            activateVideoWrapper(target);
        } else {
            desactivateVideoWrapper();
        }
    });

    quill.on('text-change', function(delta, oldDelta, source) {
        if (source === 'api') {
            const editor = quill.root;
            editor.querySelectorAll('iframe:not(.video-wrapper iframe)').forEach(iframe => {});
        }
    });

    document.addEventListener('click', function(e) {
        if (!editor.contains(e.target)) {
            desactivateVideoWrapper();
        }
    });
}

function activateVideoWrapper(iframe) {
    let wrapper = iframe.closest('.video-wrapper');
    if (wrapper) {
        wrapper.classList.remove('inactive');
        return wrapper;
    }

    wrapper = document.createElement('div');
    wrapper.className = 'video-wrapper';
    wrapper.style.position = 'absolute';
    wrapper.style.display = 'inline-block';
    wrapper.style.border = '2px dashed #0053e5';
    wrapper.style.padding = '4px';
    wrapper.style.margin = '0';
    wrapper.style.cursor = 'move';

    const parentRect = iframe.parentElement.getBoundingClientRect();
    const iframeRect = iframe.getBoundingClientRect();
    
    iframe.parentNode.insertBefore(wrapper, iframe);
    wrapper.appendChild(iframe);

    const left = iframeRect.left - parentRect.left;
    const top = iframeRect.top - parentRect.top;
    wrapper.style.left = left + 'px';
    wrapper.style.top = top + 'px';

    wrapper.style.width = iframeRect.width + 'px';
    wrapper.style.height = iframeRect.height + 'px';
    iframe.style.width = '100%';
    iframe.style.height = '100%';

    const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
    handles.forEach(dir => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${dir}`;
        handle.dataset.dir = dir;
        wrapper.appendChild(handle);
    });

    enableVideoDrag(wrapper);
    enableVideoResize(wrapper);

    document.querySelectorAll('.video-wrapper').forEach(w => {
        if (w !== wrapper) w.classList.add('inactive');
    });

    return wrapper;
}

function desactivateVideoWrapper() {
    document.querySelectorAll('.video-wrapper').forEach(w => {
        w.classList.add('inactive');
    });
}

function enableVideoDrag(wrapper) {
    let isDragging = false;
    let startX, startY, origX, origY;

    wrapper.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('resize-handle')) return;
        isDragging = true;
        const rect = wrapper.getBoundingClientRect();
        const parentRect = wrapper.parentElement.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        origX = rect.left - parentRect.left;
        origY = rect.top - parentRect.top;
        wrapper.style.cursor = 'grabbing';
        wrapper.style.position = 'absolute';
        wrapper.style.left = origX + 'px';
        wrapper.style.top = origY + 'px';
        wrapper.style.margin = '0';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newX = origX + dx;
        const newY = origY + dy;
        const parentRect = wrapper.parentElement.getBoundingClientRect();
        const maxX = parentRect.width - wrapper.offsetWidth;
        const maxY = parentRect.height - wrapper.offsetHeight;
        wrapper.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
        wrapper.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
        e.preventDefault();
    });

    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            wrapper.style.cursor = 'move';
        }
    });
}

function enableVideoResize(wrapper) {
    let isResizing = false;
    let dir = '';
    let startX, startY, startW, startH;

    wrapper.querySelectorAll('.resize-handle').forEach(handle => {
        handle.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            isResizing = true;
            dir = this.dataset.dir;
            const rect = wrapper.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            startW = rect.width;
            startH = rect.height;
            e.preventDefault();
        });
    });

    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newW = startW, newH = startH;
        let newLeft = 0, newTop = 0;

        if (dir.includes('e')) {
            newW = Math.max(100, startW + dx);
        }
        if (dir.includes('w')) {
            newW = Math.max(100, startW - dx);
            newLeft = dx;
        }
        if (dir.includes('s')) {
            newH = Math.max(80, startH + dy);
        }
        if (dir.includes('n')) {
            newH = Math.max(80, startH - dy);
            newTop = dy;
        }

        wrapper.style.width = newW + 'px';
        wrapper.style.height = newH + 'px';
        const iframe = wrapper.querySelector('iframe');
        if (iframe) {
            iframe.style.width = '100%';
            iframe.style.height = '100%';
        }
        e.preventDefault();
    });

    document.addEventListener('mouseup', function() {
        if (isResizing) {
            isResizing = false;
        }
    });
}

/* =========================================
   12. CONFIGURACIÓN DE PERFIL (CON SUBIDA A CLOUDINARY Y SINCRONIZACIÓN)
   ========================================= */
function renderizarConfiguracion() {
    const contenedor = document.getElementById('config-content');
    if (!contenedor) return;
    const usuario = getUsuarioActual();
    if (!usuario) {
        contenedor.innerHTML = `<div style="text-align:center; padding:30px 0;"><p style="font-size:16px; color:#555;">🔒 Debes iniciar sesión</p><button id="config-ir-login" style="padding:8px 20px; background:#0053e5; color:white; border:none; border-radius:3px; cursor:pointer;">Ir a Iniciar Sesión</button></div>`;
        document.getElementById('config-ir-login')?.addEventListener('click', () => cuentaVentana?.mostrar());
        return;
    }

    if (!verificadoConfig) {
        contenedor.innerHTML = `
            <div style="padding:20px;"><h3 style="color:#003399; margin-bottom:15px;">Verificar identidad</h3>
            <input type="password" id="config-password" placeholder="Contraseña" style="width:100%; padding:6px; border:1px solid #7f9db9; border-radius:3px; margin-bottom:10px;">
            <div id="config-password-error" style="color:red; font-size:12px; margin-bottom:8px;"></div>
            <button id="config-verificar-btn" style="padding:6px 20px; background:#0053e5; color:white; border:none; border-radius:3px; cursor:pointer;">Verificar</button></div>`;
        document.getElementById('config-verificar-btn')?.addEventListener('click', async () => {
            const pass = document.getElementById('config-password').value;
            const error = document.getElementById('config-password-error');
            const user = firebase.auth().currentUser;
            if (!user || !user.email) { error.textContent = '❌ No se pudo obtener tu cuenta.'; return; }
            try {
                await user.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(user.email, pass));
                verificadoConfig = true; renderizarConfiguracion();
            } catch (err) { error.textContent = (err.code === 'auth/wrong-password') ? '❌ Contraseña incorrecta.' : '❌ Error: ' + err.message; }
        });
        return;
    }

    const usuarioActual = getUsuarioActual();
    let usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
    let datosUsuario = usuarios.find(u => u.username === usuarioActual.username) || { 
        username: usuarioActual.username, role: usuarioActual.role, 
        avatar_url: '', avatar_delete_token: '', 
        email: '', telefono: '', password: '' 
    };
    const avatarActual = datosUsuario.avatar_url || datosUsuario.avatarBase64 || 'assets/images/icono-perfil.png';

    contenedor.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:12px; padding:5px;">
            <div style="display:flex; align-items:center; gap:20px;">
                <div style="text-align:center;">
                    <img id="config-avatar-preview" src="${avatarActual}" style="width:80px; height:80px; border-radius:50%; border:3px solid #0053e5; object-fit:cover;">
                    <div style="margin-top:5px;"><label for="config-avatar-input" style="font-size:11px; color:#0053e5; cursor:pointer;">Cambiar foto</label><input type="file" id="config-avatar-input" accept="image/*" style="display:none;"></div>
                </div>
                <div style="flex:1;"><label>Nombre de usuario</label><input type="text" id="config-username" value="${datosUsuario.username || ''}" style="width:100%; padding:6px; border:1px solid #7f9db9; border-radius:3px;"></div>
            </div>
            <div style="border-top:1px solid #ddd; padding-top:10px;"><label>Correo electrónico</label><input type="email" id="config-email" value="${datosUsuario.email || ''}" style="width:100%; padding:6px; border:1px solid #7f9db9; border-radius:3px;"></div>
            <div style="border-top:1px solid #ddd; padding-top:10px;"><label>Número de teléfono</label><input type="tel" id="config-telefono" value="${datosUsuario.telefono || ''}" style="width:100%; padding:6px; border:1px solid #7f9db9; border-radius:3px;"></div>
            <div style="border-top:1px solid #ddd; padding-top:10px;"><label>Nueva Contraseña</label><input type="password" id="config-new-password" placeholder="Dejar en blanco para no cambiar" style="width:100%; padding:6px; border:1px solid #7f9db9; border-radius:3px;"></div>
            <div style="display:flex; gap:10px; justify-content:flex-end; border-top:1px solid #ddd; padding-top:10px;">
                <button id="config-guardar-btn" style="padding:6px 20px; background:#0053e5; color:white; border:none; border-radius:3px; cursor:pointer;">Guardar cambios</button>
                <button id="config-cancelar-btn" style="padding:6px 20px; background:#ece9d8; border:1px solid #7f9db9; border-radius:3px; cursor:pointer;">Cancelar</button>
                <button id="config-eliminar-btn" style="padding:6px 20px; background:#e4433c; color:white; border:none; border-radius:3px; cursor:pointer;">Eliminar cuenta</button>
            </div>
            <div id="config-mensaje" style="font-size:13px; text-align:center;"></div>
        </div>`;

    const inputFile = document.getElementById('config-avatar-input');
    const preview = document.getElementById('config-avatar-preview');
    let nuevaImagenFile = null;

    inputFile?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || file.size > 10*1024*1024) { 
            document.getElementById('config-avatar-error').textContent = '❌ El archivo supera los 10 MB.'; 
            return; 
        }
        nuevaImagenFile = file;
        const reader = new FileReader();
        reader.onload = (ev) => preview.src = ev.target.result;
        reader.readAsDataURL(file);
    });

    document.getElementById('config-guardar-btn')?.addEventListener('click', async () => {
        const nuevoNombre = document.getElementById('config-username').value.trim();
        const nuevoEmail = document.getElementById('config-email').value.trim();
        const nuevoTelefono = document.getElementById('config-telefono').value.trim();
        const nuevaPass = document.getElementById('config-new-password').value.trim();
        const mensaje = document.getElementById('config-mensaje');

        if (!nuevoNombre) { mensaje.textContent = 'El nombre no puede estar vacío.'; mensaje.style.color = 'red'; return; }

        let usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
        if (nuevoNombre !== usuarioActual.username && usuarios.some(u => u.username === nuevoNombre)) {
            mensaje.textContent = '❌ Ese nombre de usuario ya existe.'; mensaje.style.color = 'red'; return;
        }

        if (nuevaPass && nuevaPass.length < 4) {
            mensaje.textContent = 'La contraseña debe tener al menos 4 caracteres.'; mensaje.style.color = 'red'; return;
        }

        if (nuevaPass) {
            try { await firebase.auth().currentUser.updatePassword(nuevaPass); } 
            catch (e) { mensaje.innerHTML = `❌ Error: ${e.message}`; return; }
        }

        let avatarUrl = datosUsuario.avatar_url;
        let deleteToken = datosUsuario.avatar_delete_token;

        if (nuevaImagenFile) {
            try {
                if (datosUsuario.avatar_delete_token) {
                    await eliminarImagenCloudinary(datosUsuario.avatar_delete_token);
                }
                const result = await subirImagenACloudinary(nuevaImagenFile);
                avatarUrl = result.url;
                deleteToken = result.delete_token;
            } catch (error) {
                mensaje.innerHTML = `❌ Error al subir la foto: ${error.message}`;
                mensaje.style.color = 'red';
                return;
            }
        }

        const index = usuarios.findIndex(u => u.username === usuarioActual.username);
        const datosActualizados = {
            username: nuevoNombre,
            role: usuarioActual.role,
            email: nuevoEmail,
            telefono: nuevoTelefono,
            avatar_url: avatarUrl,
            avatar_delete_token: deleteToken,
            password: nuevaPass || (index !== -1 ? usuarios[index].password : '')
        };

        if (index !== -1) {
            usuarios[index] = { ...usuarios[index], ...datosActualizados };
        } else {
            usuarios.push(datosActualizados);
        }
        localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));

        try {
            await db.collection('usuarios').doc(nuevoNombre).set({
                email: nuevoEmail,
                telefono: nuevoTelefono,
                role: usuarioActual.role,
                avatar_url: avatarUrl,
                avatar_delete_token: deleteToken
            }, { merge: true });
        } catch (error) {
            console.error('Error al actualizar perfil en Firestore:', error);
        }

        if (nuevoNombre !== usuarioActual.username) {
            setUsuarioActual({ username: nuevoNombre, role: usuarioActual.role });
            if (usuarioActual.username !== nuevoNombre) {
                try { await db.collection('usuarios').doc(usuarioActual.username).delete(); } catch(e) {}
            }
        }

        actualizarUI();
        mensaje.innerHTML = '✅ Cambios guardados.';
        mensaje.style.color = 'green';
        document.getElementById('config-new-password').value = '';
    });

    document.getElementById('config-cancelar-btn')?.addEventListener('click', () => configVentana?.cerrar());
    document.getElementById('config-eliminar-btn')?.addEventListener('click', () => abrirVentanaEliminarCuenta());
}

// 🔥 VENTANA DE ELIMINACIÓN DE CUENTA (SE DESTRUYE AL CERRAR O COMPLETAR)
function crearVentanaEliminarCuenta() {
    let ventanaEliminar = document.getElementById('window-eliminar-cuenta');
    if (!ventanaEliminar) {
        ventanaEliminar = document.createElement('div');
        ventanaEliminar.id = 'window-eliminar-cuenta';
        ventanaEliminar.className = 'window-xp';
        ventanaEliminar.style.cssText = 'display:none; width:400px; top:150px; left:400px;';
        ventanaEliminar.innerHTML = `
            <div class="window-title-bar">
                <div class="title-text"><img src="assets/images/icono-perfil.png" width="16"> Eliminar cuenta</div>
                <div class="window-controls">
                    <button class="btn-min">_</button>
                    <button class="btn-max">□</button>
                    <button class="btn-close">X</button>
                </div>
            </div>
            <div class="window-content" style="padding:20px; display:flex; flex-direction:column; gap:12px;">
                <p style="font-size:13px;">⚠️ Esta acción es permanente y no se puede deshacer. Se eliminarán tus publicaciones y datos.</p>
                <label style="font-size:12px; font-weight:bold;">Ingresa tu contraseña para confirmar:</label>
                <input type="password" id="eliminar-password-input" placeholder="Contraseña actual" style="width:100%; padding:6px; border:1px solid #7f9db9; border-radius:3px;">
                <div id="eliminar-mensaje" style="font-size:12px; color:red;"></div>
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button id="cancelar-eliminar-btn" style="padding:6px 15px; background:#ece9d8; border:1px solid #7f9db9; border-radius:3px; cursor:pointer;">Cancelar</button>
                    <button id="confirmar-eliminar-btn" style="padding:6px 15px; background:#e4433c; color:white; border:none; border-radius:3px; cursor:pointer;">Eliminar cuenta</button>
                </div>
            </div>
        `;
        document.body.appendChild(ventanaEliminar);
        eliminarCuentaVentana = crearVentana('#window-eliminar-cuenta', {
            nombre: 'Eliminar cuenta',
            onClose: () => {
                eliminarCuentaVentana = null;
                setTimeout(() => {
                    const el = document.getElementById('window-eliminar-cuenta');
                    if (el) el.remove();
                }, 100);
            }
        });
        document.getElementById('confirmar-eliminar-btn').addEventListener('click', async () => {
            const pass = document.getElementById('eliminar-password-input').value.trim();
            const msg = document.getElementById('eliminar-mensaje');
            if (!pass) { msg.textContent = 'Ingresa tu contraseña.'; return; }

            const usuarioActual = getUsuarioActual();
            const user = firebase.auth().currentUser;
            if (!user || !user.email) { msg.textContent = '❌ No se pudo obtener tu cuenta.'; return; }

            try {
                await user.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(user.email, pass));
            } catch (error) {
                msg.textContent = '❌ Contraseña incorrecta.';
                return;
            }

            try {
                await user.delete();
                let usuarios = JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
                const index = usuarios.findIndex(u => u.username === usuarioActual.username);
                if (index !== -1) usuarios.splice(index, 1);
                localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
                logout();
                verificadoConfig = false;
                destruirVentanaEliminar();
                configVentana?.cerrar();
                actualizarUI();
                mostrarAvisoXP('Cuenta eliminada', '✅ Tu cuenta ha sido eliminada correctamente.', () => {
                    location.reload();
                });
            } catch (error) {
                msg.textContent = '❌ Error al eliminar cuenta: ' + error.message;
            }
        });

        document.getElementById('cancelar-eliminar-btn').addEventListener('click', () => destruirVentanaEliminar());
    }
    return eliminarCuentaVentana;
}

function destruirVentanaEliminar() {
    if (eliminarCuentaVentana) {
        eliminarCuentaVentana.cerrar();
    }
}

function abrirVentanaEliminarCuenta() {
    if (!eliminarCuentaVentana) eliminarCuentaVentana = crearVentanaEliminarCuenta();
    document.getElementById('eliminar-password-input').value = '';
    document.getElementById('eliminar-mensaje').textContent = '';
    eliminarCuentaVentana.mostrar();
}

function mostrarConfirmacionXP(titulo, mensaje, callbackSi, callbackNo) {
    const id = 'window-confirmacion';
    let ventana = document.getElementById(id);
    if (ventana) ventana.remove();

    ventana = document.createElement('div');
    ventana.id = id;
    ventana.className = 'window-xp';
    ventana.style.cssText = 'display:none; width:320px; top:150px; left:400px;';
    ventana.innerHTML = `
        <div class="window-title-bar">
            <div class="title-text"><span>${titulo}</span></div>
            <div class="window-controls">
                <button class="btn-close">X</button>
            </div>
        </div>
        <div class="window-content" style="padding:20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:15px;">
            <p style="font-size:13px; margin:0;">${mensaje}</p>
            <div style="display:flex; gap:10px; justify-content:center;">
                <button id="confirmacion-si-btn" style="padding:6px 20px; background:#0053e5; color:white; border:none; border-radius:3px; cursor:pointer;">Sí</button>
                <button id="confirmacion-no-btn" style="padding:6px 20px; background:#ece9d8; border:1px solid #7f9db9; border-radius:3px; cursor:pointer;">No</button>
            </div>
        </div>
    `;
    document.body.appendChild(ventana);

    const ventanaObj = crearVentana('#' + id, { nombre: titulo });
    ventanaObj.mostrar();

    const cerrar = (respuesta) => {
        ventanaObj.cerrar();
        setTimeout(() => ventana.remove(), 100);
        if (respuesta && callbackSi) callbackSi();
        else if (!respuesta && callbackNo) callbackNo();
    };

    ventana.querySelector('.btn-close').addEventListener('click', () => cerrar(false));
    ventana.querySelector('#confirmacion-si-btn').addEventListener('click', () => cerrar(true));
    ventana.querySelector('#confirmacion-no-btn').addEventListener('click', () => cerrar(false));
}

// 🔥 AVISO XP
function mostrarAvisoXP(titulo, mensaje, callback) {
    const id = 'window-aviso';
    let ventana = document.getElementById(id);
    if (ventana) ventana.remove();

    ventana = document.createElement('div');
    ventana.id = id;
    ventana.className = 'window-xp';
    ventana.style.cssText = 'display:none; width:300px; top:150px; left:400px;';
    ventana.innerHTML = `
        <div class="window-title-bar">
            <div class="title-text"><span>${titulo}</span></div>
            <div class="window-controls">
                <button class="btn-close">X</button>
            </div>
        </div>
        <div class="window-content" style="padding:20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:15px;">
            <p style="font-size:13px; margin:0;">${mensaje}</p>
            <button id="aviso-aceptar-btn" style="padding:6px 25px; background:#0053e5; color:white; border:none; border-radius:3px; cursor:pointer;">Aceptar</button>
        </div>
    `;
    document.body.appendChild(ventana);

    const ventanaObj = crearVentana('#' + id, { nombre: titulo });
    ventanaObj.mostrar();

    const cerrar = () => {
        ventanaObj.cerrar();
        setTimeout(() => ventana.remove(), 100);
        if (callback) callback();
    };

    ventana.querySelector('.btn-close').addEventListener('click', cerrar);
    ventana.querySelector('#aviso-aceptar-btn').addEventListener('click', cerrar);
}

/* =========================================
   13. CALENDARIO DINÁMICO CON INDICADORES DE POSTS
   ========================================= */
async function generarCalendario(mes, anio) {
    const contenedor = document.getElementById('calendario-contenedor');
    const mesAnoElement = document.getElementById('calendario-mes-ano');
    if (!contenedor) return;

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    const posts = await obtenerPosts();
    
    const postsPorFecha = {};
    posts.forEach(post => {
        if (post.fecha) {
            const fechaObj = new Date(post.fecha);
            const fechaStr = `${fechaObj.getFullYear()}-${String(fechaObj.getMonth() + 1).padStart(2, '0')}-${String(fechaObj.getDate()).padStart(2, '0')}`;
            if (!postsPorFecha[fechaStr]) postsPorFecha[fechaStr] = [];
            postsPorFecha[fechaStr].push(post);
        }
    });

    const primerDia = new Date(anio, mes, 1).getDay();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const hoy = new Date();
    const hoyDia = hoy.getDate();
    const hoyMes = hoy.getMonth();
    const hoyAnio = hoy.getFullYear();

    let offset = primerDia === 0 ? 6 : primerDia - 1;

    let html = '<table style="width:100%; text-align:center; font-size: 12px; border-collapse: collapse;">';
    html += '<tr>';
    for (let d of diasSemana) {
        html += `<th style="padding: 2px 0;">${d}</th>`;
    }
    html += '</tr>';

    let dia = 1;
    let filas = 0;
    while (dia <= diasEnMes) {
        html += '<tr>';
        for (let col = 0; col < 7; col++) {
            if (filas === 0 && col < offset) {
                html += '<td></td>';
            } else if (dia > diasEnMes) {
                html += '<td></td>';
            } else {
                const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                const tienePosts = postsPorFecha[fechaStr] && postsPorFecha[fechaStr].length > 0;
                const esHoy = (dia === hoyDia && mes === hoyMes && anio === hoyAnio);
                const esFiltro = filtroFecha === fechaStr;
                
                let estilo = '';
                if (esHoy) estilo += ' background: #0053e5; color: white; font-weight: bold; border-radius: 50%;';
                if (esFiltro) estilo += ' border: 2px solid #ff6600; border-radius: 50%;';
                
                html += `<td data-fecha="${fechaStr}" style="position: relative; padding: 2px 0; cursor: ${tienePosts ? 'pointer' : 'default'}; ${estilo}">`;
                html += dia;
                if (tienePosts) {
                    html += `<span style="display: block; font-size: 6px; color: #0053e5; margin-top: -2px;">●</span>`;
                }
                html += '</td>';
                dia++;
            }
        }
        html += '</tr>';
        filas++;
    }
    html += '</table>';

    mesAnoElement.textContent = `${meses[mes]} ${anio}`;
    contenedor.innerHTML = html;

    contenedor.querySelectorAll('td[data-fecha]').forEach(td => {
        const fecha = td.dataset.fecha;
        if (postsPorFecha[fecha] && postsPorFecha[fecha].length > 0) {
            td.addEventListener('click', () => {
                filtrarPorFecha(fecha);
            });
        }
    });
}

function irMes(delta) {
    mesCalendario += delta;
    if (mesCalendario < 0) { mesCalendario = 11; anioCalendario--; }
    else if (mesCalendario > 11) { mesCalendario = 0; anioCalendario++; }
    generarCalendario(mesCalendario, anioCalendario);
}

function actualizarCalendario() { generarCalendario(mesCalendario, anioCalendario); }

function iniciarCalendario() {
    document.getElementById('cal-btn-prev')?.addEventListener('click', () => irMes(-1));
    document.getElementById('cal-btn-next')?.addEventListener('click', () => irMes(1));
    generarCalendario(mesCalendario, anioCalendario);
}

function filtrarPorFecha(fecha) {
    filtroFecha = fecha;
    obtenerPosts().then(posts => {
        const filtrados = posts.filter(p => {
            if (!p.fecha) return false;
            const fechaObj = new Date(p.fecha);
            const fechaStr = `${fechaObj.getFullYear()}-${String(fechaObj.getMonth() + 1).padStart(2, '0')}-${String(fechaObj.getDate()).padStart(2, '0')}`;
            return fechaStr === fecha;
        });
        mostrarMensajeFiltro(fecha, filtrados.length);
        renderizarPosts(filtrados);
        actualizarCalendario();
    });
}

function limpiarFiltro() { filtroFecha = null; ocultarMensajeFiltro(); actualizarUI(); actualizarCalendario(); }

function mostrarMensajeFiltro(fecha, count) {
    let mensaje = document.getElementById('filtro-mensaje');
    if (!mensaje) {
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            mensaje = document.createElement('span');
            mensaje.id = 'filtro-mensaje';
            mensaje.style.marginLeft = '10px';
            mensaje.style.fontSize = '12px';
            mensaje.style.color = '#003399';
            toolbar.appendChild(mensaje);
        }
    }
    if (mensaje) {
        const fechaFormateada = new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        mensaje.innerHTML = `📅 Mostrando posts del ${fechaFormateada} (${count}) <button id="limpiar-filtro-btn" style="background: none; border: none; color: #0053e5; text-decoration: underline; cursor: pointer;">[X]</button>`;
        document.getElementById('limpiar-filtro-btn')?.addEventListener('click', limpiarFiltro);
    }
}

function ocultarMensajeFiltro() { const mensaje = document.getElementById('filtro-mensaje'); if (mensaje) mensaje.remove(); }

/* =========================================
   14. FÍSICAS DE AURELIO
   ========================================= */
const aurelioImg = document.getElementById('aurelio-img');
const aurelioContenedor = document.querySelector('#widget-aurelio .widget-content');
let ultimoMouseX = 0, ultimoTiempo = Date.now();

if (aurelioImg && aurelioContenedor) {
    aurelioImg.addEventListener('mousemove', (e) => {
        const rect = aurelioImg.getBoundingClientRect();
        const centroX = rect.left + rect.width / 2;
        const centroY = rect.top + rect.height / 2;
        const distanciaX = e.clientX - centroX;
        const distanciaY = e.clientY - centroY;
        const estirarX = 1 + (distanciaX / (rect.width / 2)) * 0.15;
        const estirarY = 1 + (distanciaY / (rect.height / 2)) * 0.15;
        aurelioImg.style.transform = `scale(${Math.abs(estirarX)}, ${Math.abs(estirarY)}) translate(${distanciaX * 0.05}px, ${distanciaY * 0.05}px)`;
        
        const tiempoActual = Date.now();
        const diferenciaTiempo = tiempoActual - ultimoTiempo;
        if (diferenciaTiempo > 30) {
            const distanciaRecorrida = Math.abs(e.clientX - ultimoMouseX);
            const velocidad = distanciaRecorrida / diferenciaTiempo;
            if (velocidad > 1.2) {
                const rectContenedor = aurelioContenedor.getBoundingClientRect();
                const x = e.clientX - rectContenedor.left;
                const y = e.clientY - rectContenedor.top;
                crearCorazon(x, y);
            }
            ultimoTiempo = tiempoActual;
            ultimoMouseX = e.clientX;
        }
    });
    aurelioImg.addEventListener('mouseleave', () => {
        aurelioImg.style.transform = 'scale(1, 1) translate(0px, 0px)';
    });
}

function crearCorazon(x, y) {
    const corazon = document.createElement('div');
    corazon.classList.add('corazon-flotante');
    corazon.innerText = '❤️';
    corazon.style.left = `${x - 10}px`;
    corazon.style.top = `${y - 10}px`;
    aurelioContenedor.appendChild(corazon);
    setTimeout(() => corazon.remove(), 1000);
}

/* =========================================
   15. EVENTOS Y INICIALIZACIÓN PRINCIPAL
   ========================================= */
document.addEventListener('DOMContentLoaded', function() {
    pubVentana = crearVentana('#window-publicaciones', {
        nombre: 'Publicaciones',
        onClose: () => {
            modoVistaPost = false;
            postVisto = null;
            const area = document.getElementById('posts-area');
            if (area) {
                delete area.dataset.modo;
                area.style.display = '';
                area.style.flexDirection = '';
            }
            actualizarUI();
        }
    });
    perfilVentana = crearVentana('#window-perfil', { nombre: 'Mi Perfil' });
    configVentana = crearVentana('#window-configuracion', {
        nombre: 'Configuración',
        onClose: () => { verificadoConfig = false; }
    });
    if (configVentana) {
        const mostrarOriginal = configVentana.mostrar;
        configVentana.mostrar = function() {
            mostrarOriginal.call(this);
            renderizarConfiguracion();
        };
    }

    iniciarSistemaCuentas();

    firebase.auth().onAuthStateChanged(() => {
        actualizarUI();
    });

    if (pubVentana) {
        pubVentana.mostrar();
        setTimeout(() => {
            const ventana = document.getElementById('window-publicaciones');
            if (ventana) {
                const ancho = ventana.offsetWidth || 700;
                const alto = ventana.offsetHeight || 550;
                const taskbarHeight = document.getElementById('taskbar')?.offsetHeight || 35;
                const left = (window.innerWidth - ancho) / 2;
                const top = (window.innerHeight - taskbarHeight - alto) / 2;
                ventana.style.left = Math.max(0, left) + 'px';
                ventana.style.top = Math.max(0, top) + 'px';
            }
        }, 50);
        setTimeout(() => actualizarUI(), 100);
    }

    iniciarCalendario();

    document.getElementById('icon-publicaciones')?.addEventListener('dblclick', () => pubVentana?.mostrar());
    document.getElementById('icon-perfil')?.addEventListener('dblclick', () => perfilVentana?.mostrar());
    document.getElementById('icon-configuracion')?.addEventListener('dblclick', () => configVentana?.mostrar());
    document.getElementById('start-reportar-bug')?.addEventListener('click', () => {
        document.getElementById('start-menu').style.display = 'none';
        crearVentanaReporteBug();
    });

    document.getElementById('btn-nueva-pub')?.addEventListener('click', mostrarFormularioPost);

    document.getElementById('btn-buscar')?.addEventListener('click', async () => {
        const query = document.getElementById('search-input')?.value || '';
        renderizarPosts(await buscarPosts(query));
    });

    document.getElementById('search-input')?.addEventListener('keyup', (e) => { if (e.key === 'Enter') document.getElementById('btn-buscar')?.click(); });

    document.getElementById('btn-recargar')?.addEventListener('click', () => {
        document.getElementById('search-input').value = '';
        actualizarUI();
    });

    document.getElementById('start-button')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = document.getElementById('start-menu');
    if (menu) {
        // Forzar un valor muy alto cada vez que se abre
        menu.style.setProperty('z-index', '99999', 'important');
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
});
    document.addEventListener('click', () => { const menu = document.getElementById('start-menu'); if (menu) menu.style.display = 'none'; });

    document.getElementById('start-menu')?.addEventListener('click', (e) => e.stopPropagation());

    document.querySelectorAll('.start-menu-item[data-ventana]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const ventanaId = this.dataset.ventana;
            if (ventanaId === 'window-publicaciones') pubVentana?.mostrar();
            else if (ventanaId === 'window-perfil') perfilVentana?.mostrar();
            else if (ventanaId === 'window-configuracion') configVentana?.mostrar();
            else if (ventanaId === 'window-cuenta') cuentaVentana?.mostrar();
            document.getElementById('start-menu').style.display = 'none';
        });
    });

    document.getElementById('start-cmd')?.addEventListener('click', () => {
        document.getElementById('start-menu').style.display = 'none';
        crearVentanaCMD();
    });

    document.getElementById('start-cerrar-sesion')?.addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('start-menu').style.display = 'none';
        mostrarConfirmacionXP('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?', 
            () => {
                logout();
                verificadoConfig = false;
                actualizarUI();
                configVentana?.cerrar();
                pubVentana?.mostrar();
            },
            () => {}
        );
    });

    actualizarUI();
});

function crearVentanaReporteBug() {
    // Si ya existe la ventana, la cerramos primero
    let existente = document.getElementById('window-reporte-bug');
    if (existente) existente.remove();

    const ventana = document.createElement('div');
    ventana.id = 'window-reporte-bug';
    ventana.className = 'window-xp';
    ventana.style.cssText = 'display:none; width:400px; top:120px; left:400px;';
    ventana.innerHTML = `
        <div class="window-title-bar">
            <div class="title-text">🐛 Reportar Bug</div>
            <div class="window-controls">
                <button class="btn-min">_</button>
                <button class="btn-max">□</button>
                <button class="btn-close">X</button>
            </div>
        </div>
        <div class="window-content" style="padding:15px; display:flex; flex-direction:column; gap:10px;">
            <label style="font-size:12px; font-weight:bold;">Describe el bug encontrado:</label>
            <textarea id="bug-descripcion" style="width:100%; height:150px; resize:vertical; padding:5px; border:1px solid #7f9db9; border-radius:3px; font-family:Tahoma; font-size:12px;"></textarea>
            <button id="enviar-bug-btn" style="padding:6px 15px; background:#0053e5; color:white; border:none; border-radius:3px; cursor:pointer;">Enviar reporte</button>
            <div id="bug-mensaje" style="font-size:12px; margin-top:5px;"></div>
        </div>
    `;
    document.body.appendChild(ventana);

    const ventanaObj = crearVentana('#window-reporte-bug', { nombre: 'Reportar bug' });

    document.getElementById('enviar-bug-btn').addEventListener('click', async () => {
        const descripcion = document.getElementById('bug-descripcion').value.trim();
        const msg = document.getElementById('bug-mensaje');
        if (!descripcion) {
            msg.textContent = 'Por favor describe el bug.';
            msg.style.color = 'red';
            return;
        }

        // Enviar usando EmailJS
        try {
            await emailjs.send('service_yf5s5qx', 'template_dqcff3r', {
                to_email: 'slltt@proton.me',      // 👈 tu correo donde recibirás los reportes
                message: descripcion,
                from_name: getUsuarioActual()?.username || 'Anónimo',
                fecha: new Date().toLocaleString(),
            });
            msg.textContent = '✅ Reporte enviado. ¡Gracias!';
            msg.style.color = 'green';
            document.getElementById('bug-descripcion').value = '';
            setTimeout(() => ventanaObj.cerrar(), 2000);
        } catch (error) {
            console.error('Error al enviar reporte:', error);
            msg.textContent = '❌ Error al enviar. Intenta de nuevo.';
            msg.style.color = 'red';
        }
    });

    ventanaObj.mostrar();
}