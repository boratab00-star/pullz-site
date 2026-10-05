import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, doc, setDoc, getDoc, onAuthStateChanged, signOut } from './firebase-config.js';

// 1. Inject CSS for Modal and Navbar Button
const style = document.createElement('style');
style.textContent = `
  .auth-modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(10px);
    z-index: 9999;
    display: flex; justify-content: center; align-items: center;
    opacity: 0; visibility: hidden;
    transition: all 0.4s ease;
  }
  .auth-modal-overlay.active { opacity: 1; visibility: visible; }
  .auth-modal {
    background: rgba(17, 24, 39, 0.95);
    padding: 3rem;
    border-radius: 24px;
    width: 90%; max-width: 420px;
    border: 1px solid rgba(6, 182, 212, 0.3);
    box-shadow: 0 30px 60px rgba(0,0,0,0.9), 0 0 30px rgba(6, 182, 212, 0.1) inset;
    transform: scale(0.9) translateY(20px);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  .auth-modal-overlay.active .auth-modal { transform: scale(1) translateY(0); }
  .auth-modal::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: var(--brand-cyan);
    box-shadow: 0 0 15px var(--brand-cyan);
  }
  .auth-close {
    position: absolute; top: 1rem; right: 1.5rem;
    color: var(--text-muted); cursor: pointer; font-size: 1.8rem;
    transition: color 0.3s;
    user-select: none;
  }
  .auth-close:hover { color: white; }
  .auth-header { text-align: center; margin-bottom: 2rem; }
  .auth-header h2 { font-size: 2rem; margin-bottom: 0.5rem; color: white; font-family: 'Outfit', sans-serif;}
  .auth-header p { color: var(--text-muted); font-family: 'Inter', sans-serif; font-size: 0.95rem; }
  .input-group { margin-bottom: 1.5rem; text-align: left; }
  .input-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-muted); font-family: 'Inter', sans-serif;}
  .input-group input {
    width: 100%; padding: 0.8rem 1rem; background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
    color: white; font-family: 'Inter', sans-serif; outline: none;
    transition: border-color 0.3s; box-sizing: border-box;
  }
  .input-group input:focus { border-color: var(--brand-cyan); }
  .auth-error { color: #ef4444; font-size: 0.9rem; margin-bottom: 1rem; text-align: center; display: none; background: rgba(239, 68, 68, 0.1); padding: 0.5rem; border-radius: 4px; }
  .auth-success { color: var(--brand-green); font-size: 0.9rem; margin-bottom: 1rem; text-align: center; display: none; background: rgba(16, 185, 129, 0.1); padding: 0.5rem; border-radius: 4px; }
  .toggle-form { text-align: center; margin-top: 1.5rem; font-size: 0.9rem; color: var(--text-muted); font-family: 'Inter', sans-serif;}
  .toggle-form span { color: var(--brand-cyan); cursor: pointer; font-weight: bold; transition: color 0.3s;}
  .toggle-form span:hover { color: white; text-decoration: underline; }
  #register-form { display: none; }
  
  /* User profile injected in top-left nav */
  .nav-user-profile {
    display: flex; align-items: center; gap: 1rem; margin-left: 2rem;
  }
  .user-badge {
    display: flex; align-items: center; gap: 0.5rem;
    background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3);
    padding: 0.4rem 1rem; border-radius: 20px; color: white; font-size: 0.9rem;
  }
  .user-badge span { color: var(--brand-cyan); font-weight: bold; }
  .btn-logout {
    background: transparent; border: 1px solid #ef4444; color: #ef4444;
    padding: 0.4rem 1rem; border-radius: 20px; cursor: pointer; font-size: 0.9rem;
    transition: all 0.3s;
  }
  .btn-logout:hover { background: #ef4444; color: white; }
  @media (max-width: 768px) {
    .nav-user-profile { margin-left: 1rem; }
    .btn-logout, .user-badge { font-size: 0.8rem; padding: 0.3rem 0.6rem; }
  }
`;
document.head.appendChild(style);

// 2. Inject Modal HTML globally
const modalHtml = `
  <div class="auth-modal-overlay" id="auth-modal-overlay">
    <div class="auth-modal">
      <div class="auth-close" id="auth-close">&times;</div>
      
      <div class="auth-header">
        <h2>PULLZ Access</h2>
        <p>System Authentication Required</p>
      </div>

      <form id="login-form">
        <div class="auth-error" id="login-error"></div>
        <div class="input-group">
          <label>Email Address</label>
          <input type="email" id="login-email" required>
        </div>
        <div class="input-group">
          <label>Password</label>
          <input type="password" id="login-password" required>
        </div>
        <button type="submit" class="button button-primary" style="width: 100%;">Authenticate</button>
        <div class="toggle-form">
          No clearance? <span id="go-to-register">Request Access</span>
        </div>
      </form>

      <form id="register-form">
        <div class="auth-error" id="register-error"></div>
        <div class="auth-success" id="register-success"></div>
        <div class="input-group">
          <label>Desired Username</label>
          <input type="text" id="reg-username" required autocomplete="off">
        </div>
        <div class="input-group">
          <label>Email Address</label>
          <input type="email" id="reg-email" required>
        </div>
        <div class="input-group">
          <label>Password</label>
          <input type="password" id="reg-password" required minlength="8">
        </div>
        <div class="input-group" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem;">
          <label id="captcha-question" style="margin-bottom: 0; white-space: nowrap; font-size: 1.1rem; color: var(--brand-cyan);">Loading...</label>
          <input type="number" id="reg-captcha" required placeholder="Answer" style="flex: 1; padding: 0.5rem; text-align: center;">
        </div>
        <button type="submit" class="button button-primary" style="width: 100%;">Create Profile</button>
        <div class="toggle-form">
          Already have access? <span id="go-to-login">Authenticate</span>
        </div>
      </form>
    </div>
  </div>
`;
document.body.insertAdjacentHTML('beforeend', modalHtml);

// 3. Setup Logic & Elements
const overlay = document.getElementById('auth-modal-overlay');
const closeBtn = document.getElementById('auth-close');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Anti-Bot Math Captcha
let expectedCaptchaAnswer = 0;
function generateCaptcha() {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  expectedCaptchaAnswer = num1 + num2;
  const qEl = document.getElementById('captcha-question');
  if (qEl) qEl.textContent = `${num1} + ${num2} = ?`;
}
generateCaptcha();

export function showAuthModal() { overlay.classList.add('active'); }
export function hideAuthModal() { overlay.classList.remove('active'); }

closeBtn.addEventListener('click', hideAuthModal);
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) hideAuthModal();
});

document.getElementById('go-to-register').addEventListener('click', () => {
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
});
document.getElementById('go-to-login').addEventListener('click', () => {
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
});

// Login Flow
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-password').value;
  const errBox = document.getElementById('login-error');
  
  try {
    errBox.style.display = 'none';
    const userCred = await signInWithEmailAndPassword(auth, email, pass);
    if (!userCred.user.emailVerified) {
      errBox.textContent = "Please verify your email address first! Check your inbox.";
      errBox.style.display = 'block';
    } else {
      hideAuthModal();
    }
  } catch(err) {
    console.error("Login Error:", err);
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
      errBox.textContent = "Incorrect email or password! If you just registered, make sure no error occurred.";
    } else {
      errBox.textContent = "Error: " + err.message;
    }
    errBox.style.display = 'block';
  }
});

// Register Flow
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim().toLowerCase();
  const email = document.getElementById('reg-email').value;
  const pass = document.getElementById('reg-password').value;
  const errBox = document.getElementById('register-error');
  const succBox = document.getElementById('register-success');
  
  errBox.style.display = 'none';
  succBox.style.display = 'none';

  if (username.length < 5) {
    errBox.textContent = "Username must be at least 5 characters long!";
    errBox.style.display = 'block';
    return;
  }
  if (pass.length < 8) {
    errBox.textContent = "Password must be at least 8 characters long!";
    errBox.style.display = 'block';
    return;
  }
  
  const userCaptcha = parseInt(document.getElementById('reg-captcha').value);
  if (userCaptcha !== expectedCaptchaAnswer) {
    errBox.textContent = "Anti-Bot: Incorrect math answer!";
    errBox.style.display = 'block';
    generateCaptcha(); // Reset captcha on failure
    return;
  }

  try {
    const userRef = doc(db, 'usernames', username);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      errBox.textContent = "Username is already taken!";
      errBox.style.display = 'block';
      return;
    }
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(userRef, { email: email, uid: userCred.user.uid, createdAt: new Date().toISOString() });
    
    // Assign Owner role automatically to pullzcheats
    let assignedRole = "Member";
    if (username === "pullzcheats") assignedRole = "Owner";
    
    // Also save a user doc for profile management
    await setDoc(doc(db, 'users', userCred.user.uid), {
      username: username,
      email: email,
      role: assignedRole,
      isMuted: false,
      isBanned: false,
      hasChangedUsername: false,
      createdAt: new Date().toISOString()
    });

    await sendEmailVerification(userCred.user);

    succBox.textContent = "Account successfully created! Please check your email (including SPAM folder) for the activation link.";
    succBox.style.display = 'block';
    registerForm.reset();
  } catch(err) {
    console.error("Register Error:", err);
    if(err.code === 'auth/email-already-in-use') {
      errBox.textContent = "This email is already in use!";
    } else {
      errBox.textContent = "Error during registration: " + err.message;
    }
    errBox.style.display = 'block';
  }
});

// 4. Global Auth State & UI Synchronization
let currentUser = null;

function injectNavUserArea() {
  const brand = document.querySelector('.brand');
  const navLinks = document.querySelector('.nav-links');

  if (navLinks && !document.getElementById('nav-community')) {
    navLinks.insertAdjacentHTML('beforeend', '<a href="community.html" id="nav-community">Community</a>');
  }

  if (brand && !document.getElementById('nav-user-area')) {
    const userArea = document.createElement('div');
    userArea.id = 'nav-user-area';
    userArea.className = 'nav-user-profile';
    userArea.style.marginLeft = '1rem';
    userArea.innerHTML = ``; // Start empty to prevent FOUC flicker
    brand.parentNode.insertBefore(userArea, brand.nextSibling);
  }
}

// Since module scripts are deferred, the DOM might already be loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectNavUserArea);
} else {
  injectNavUserArea();
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  const userArea = document.getElementById('nav-user-area');
  
  if (user) {
    if (user.emailVerified) {
      hideAuthModal();
      if (userArea) {
        // Fetch user doc for username and avatar
        let displayName = user.email.split('@')[0];
        let avatarSrc = `https://ui-avatars.com/api/?name=${displayName}&background=06b6d4&color=fff&size=150`;
        
        let role = "Member";
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (data.username) {
              displayName = data.username;
              avatarSrc = `https://ui-avatars.com/api/?name=${displayName}&background=06b6d4&color=fff&size=150`;
            }
            if (data.avatarBase64) avatarSrc = data.avatarBase64;
            if (data.role) role = data.role;
          }
        } catch (e) {
          console.error("Error fetching user doc for nav:", e);
        }

        const navLinks = document.querySelector('.nav-links');
        if ((role === 'Owner' || role === 'Admin') && navLinks && !document.getElementById('nav-admin')) {
           navLinks.insertAdjacentHTML('beforeend', '<a href="admin.html" id="nav-admin" style="color: #ef4444; font-weight: bold;">⚙️ Control Panel</a>');
        }

        userArea.innerHTML = `
          <a href="profile.html" class="user-badge" style="text-decoration: none; cursor: pointer; transition: 0.3s; background: rgba(6, 182, 212, 0.15); border: 1px solid var(--brand-cyan); padding: 0.3rem 1rem 0.3rem 0.3rem;">
            <img src="${avatarSrc}" alt="Avatar" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px; object-fit: cover; border: 1px solid var(--brand-cyan);">
            ${displayName}
          </a>
          <button class="btn-logout" id="nav-logout-btn">Log Out</button>
        `;
        document.getElementById('nav-logout-btn').addEventListener('click', () => signOut(auth));
      }
    } else {
      if (userArea) {
        userArea.innerHTML = `<button class="button button-ghost button-small" id="nav-login-btn" style="border-color: #f59e0b; color: #f59e0b;">Verify Email</button>`;
        document.getElementById('nav-login-btn').addEventListener('click', showAuthModal);
      }
    }
  } else {
    if (userArea) {
      userArea.innerHTML = `<button class="button button-ghost button-small" id="nav-login-btn" style="border-color: var(--brand-cyan); color: var(--brand-cyan);">Log In / Sign Up</button>`;
      document.getElementById('nav-login-btn').addEventListener('click', showAuthModal);
    }
    
    // Auto show modal on index.html once per session
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
      if (!sessionStorage.getItem('modalShown')) {
        setTimeout(showAuthModal, 800);
        sessionStorage.setItem('modalShown', 'true');
      }
    }
  }
});

export function handleSecureClick(e) {
  e.preventDefault();
  const targetUrl = e.currentTarget.href;
  
  if (!currentUser) {
    showAuthModal();
  } else if (!currentUser.emailVerified) {
    alert('Please verify your email address to download! Check your inbox.');
    showAuthModal();
  } else {
    window.open(targetUrl, '_blank');
  }
}
