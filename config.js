// SR FISHING WEB VERSION - Configuration File

const CONFIG = {
    // JRMA Live Backend API Endpoint
    API_BASE_URL: "https://streamfish-1ad.e.jrnm.app",
    
    // Twitch Developer Console Client ID for Login with Twitch OAuth
    // Replace with standard Twitch Application Client ID from dev.twitch.tv/console/apps
    TWITCH_CLIENT_ID: "959yd4kz9y1kn7c12bqadra92pfyrp",
    
    // Dynamic OAuth Redirect URI matching current site location
    REDIRECT_URI: window.location.origin + window.location.pathname,
    
    // Auto Refresh Interval for Live Sync (in milliseconds)
    SYNC_INTERVAL_MS: 5000
};

window.CONFIG = CONFIG;
