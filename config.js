// SR FISHING WEB VERSION - Configuration File

const CONFIG = {
    // JRMA Live Backend API Endpoint (auto-detects localhost for local testing)
    API_BASE_URL: (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"))
        ? ""
        : "https://streamfish-1ad.e.jrnm.app",
    
    // Twitch Developer Console Client ID for Login with Twitch OAuth
    TWITCH_CLIENT_ID: "uruqm8g5qqisy395tk312ph08e138f",
    
    // OAuth Redirect URI
    REDIRECT_URI: "https://steveroars.github.io/SRFishing/",
    
    // Auto Refresh Interval for Live Sync (in milliseconds)
    SYNC_INTERVAL_MS: 5000
};

window.CONFIG = CONFIG;
