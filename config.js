// SR FISHING WEB VERSION - Configuration File

const CONFIG = {
    // JRMA Live Backend API Endpoint
    API_BASE_URL: "https://streamfish-1ad.e.jrnm.app",
    
    // Twitch Developer Console Client ID for Login with Twitch OAuth
    TWITCH_CLIENT_ID: "uruqm8g5qqisy395tk312ph08e138f",
    
    // Dynamic OAuth Redirect URI matching current site location
    REDIRECT_URI: window.location.origin + window.location.pathname,
    
    // Auto Refresh Interval for Live Sync (in milliseconds)
    SYNC_INTERVAL_MS: 5000
};

window.CONFIG = CONFIG;
