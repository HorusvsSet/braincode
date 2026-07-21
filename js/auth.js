/**
 * Authentication Module
 * Handles login, register, logout, and auth state changes.
 */
const Auth = {
  _stateListeners: [],

  /**
   * Initialize auth and set up state listener
   */
  init() {
    if (!firebaseAuth) return;

    firebaseAuth.onAuthStateChanged((user) => {
      this._currentUser = user;
      this._stateListeners.forEach(fn => fn(user));
      this._updateUI(user);
    });
  },

  /**
   * Listen for auth state changes
   */
  onStateChange(fn) {
    this._stateListeners.push(fn);
    if (this._currentUser !== undefined) {
      fn(this._currentUser);
    }
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return this._currentUser;
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return !!this._currentUser;
  },

  /**
   * Login with email and password
   */
  async loginWithEmail(email, password) {
    try {
      const result = await firebaseAuth.signInWithEmailAndPassword(email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: this._translateError(error.code) };
    }
  },

  /**
   * Register with email and password
   */
  async registerWithEmail(email, password, displayName) {
    try {
      const result = await firebaseAuth.createUserWithEmailAndPassword(email, password);
      await result.user.updateProfile({ displayName });
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: this._translateError(error.code) };
    }
  },

  /**
   * Login with Google
   */
  async loginWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await firebaseAuth.signInWithPopup(provider);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: this._translateError(error.code) };
    }
  },

  /**
   * Logout
   */
  async logout() {
    try {
      await firebaseAuth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email) {
    try {
      await firebaseAuth.sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: this._translateError(error.code) };
    }
  },

  /**
   * Update UI based on auth state
   */
  _updateUI(user) {
    const navAuth = document.getElementById('nav-auth');
    if (!navAuth) return;

    if (user) {
      navAuth.innerHTML = `
        <div class="user-menu">
          <img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || user.email || 'U') + '&background=6366f1&color=fff'}" 
               alt="Avatar" class="avatar-small">
          <span class="user-name">${user.displayName || user.email}</span>
          <button class="btn btn-sm btn-outline" onclick="Auth.logout().then(() => App.navigate('home'))">
            Logout
          </button>
        </div>
      `;
    } else {
      navAuth.innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="App.navigate('login')">Sign In</button>
      `;
    }
  },

  /**
   * Translate Firebase error codes to user-friendly messages
   */
  _translateError(code) {
    const messages = {
      'auth/email-already-in-use': 'This email is already registered.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/operation-not-allowed': 'This login method is not enabled.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed.',
      'auth/cancelled-popup-request': 'Another sign-in request is in progress.',
      'auth/popup-blocked': 'Popup was blocked by your browser.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Check your connection.',
    };
    return messages[code] || 'An unexpected error occurred. Please try again.';
  }
};
