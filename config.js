// SR FISHING WEB VERSION - Configuration File

const CONFIG = {
    // JRMA Live Backend API Endpoint
    API_BASE_URL: "https://streamfish-1ad.e.jrnm.app",
    
    // Twitch Developer Console Client ID for Login with Twitch OAuth
    TWITCH_CLIENT_ID: "959yd4kz9y1kn7c12bqadra92pfyrp",
    
    // Twitch OAuth Redirect URI
    REDIRECT_URI: "https://steveroars.github.io/SRFishing/",
    
    // Auto Refresh Interval for Live Sync (in milliseconds)
    SYNC_INTERVAL_MS: 5000
};

window.CONFIG = CONFIG;
