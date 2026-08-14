// SR FISHING WEB VERSION - Main Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // State management
    const state = {
        currentUser: null,
        twitchToken: null,
        userProfile: null,
        activeTab: 'net',
        activeLogFilter: 'all',
        activeRankSubTab: 'catches',
        cooldownTimerInterval: null,
        syncTimer: null
    };

    // Custom In-App Modal Dialog Utility (Replaces native alert/confirm popups)
    window.showAppModal = function({ icon = 'ℹ️', title = 'Notice', message = '', confirmText = 'OK', cancelText = null, onConfirm = null }) {
        const existing = document.getElementById('appModalOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'app-modal-overlay';
        overlay.id = 'appModalOverlay';

        overlay.innerHTML = `
            <div class="app-modal-card">
                <div style="font-size: 3rem; filter: drop-shadow(0 4px 10px rgba(0,229,255,0.4));">${icon}</div>
                <h3 style="font-size: 1.35rem; font-weight: 800; color: #fff; margin-bottom: 2px;">${title}</h3>
                <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.5;">${message}</p>
                <div style="display: flex; gap: 12px; width: 100%; justify-content: center; margin-top: 10px;">
                    ${cancelText ? `<button class="btn-action" style="background: rgba(255,255,255,0.1); width: auto; padding: 10px 24px;" id="btnModalCancel">${cancelText}</button>` : ''}
                    <button class="btn-action btn-gold" style="width: auto; padding: 10px 28px; font-weight: 800;" id="btnModalConfirm">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const btnConfirm = overlay.querySelector('#btnModalConfirm');
        if (btnConfirm) {
            btnConfirm.addEventListener('click', () => {
                overlay.remove();
                if (onConfirm) onConfirm();
            });
        }

        const btnCancel = overlay.querySelector('#btnModalCancel');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                overlay.remove();
            });
        }
    };

    // Master Catalog of 148 Species & Trash Items (derived from GAME_SPECS.md & DbInitializer.cs)
    // Note: Trash items belong under Common rarity tier per specs (all sell flat 5g)
    const MASTER_SPECIES_CATALOG = [
        // TRASH (6) - Part of Common Tier
        { name: "Rusty Can", tier: "Common", isTrash: true, basePrice: 5, asset: "assets/fish/trash/rusty_can.png", frame: "assets/frames/common_frame.png" },
        { name: "Seaweed", tier: "Common", isTrash: true, basePrice: 5, asset: "assets/fish/trash/seaweed.png", frame: "assets/frames/common_frame.png" },
        { name: "Glass Bottle", tier: "Common", isTrash: true, basePrice: 5, asset: "assets/fish/trash/glass_bottle.png", frame: "assets/frames/common_frame.png" },
        { name: "Tire", tier: "Common", isTrash: true, basePrice: 5, asset: "assets/fish/trash/tire.png", frame: "assets/frames/common_frame.png" },
        { name: "Old Boot", tier: "Common", isTrash: true, basePrice: 5, asset: "assets/fish/trash/old_boot.png", frame: "assets/frames/common_frame.png" },
        { name: "Plastic Bag", tier: "Common", isTrash: true, basePrice: 5, asset: "assets/fish/trash/plastic_bag.png", frame: "assets/frames/common_frame.png" },

        // COMMON SPECIES (30)
        { name: "Minnow", tier: "Common", isTrash: false, basePrice: 10, asset: "assets/fish/common_fish/minnow.png", frame: "assets/frames/common_frame.png" },
        { name: "Clam", tier: "Common", isTrash: false, basePrice: 12, asset: "assets/fish/common_fish/clam.png", frame: "assets/frames/common_frame.png" },
        { name: "Starfish", tier: "Common", isTrash: false, basePrice: 15, asset: "assets/fish/common_fish/starfish.png", frame: "assets/frames/common_frame.png" },
        { name: "Shrimp", tier: "Common", isTrash: false, basePrice: 18, asset: "assets/fish/common_fish/shrimp.png", frame: "assets/frames/common_frame.png" },
        { name: "Anchovy", tier: "Common", isTrash: false, basePrice: 20, asset: "assets/fish/common_fish/anchovy.png", frame: "assets/frames/common_frame.png" },
        { name: "Snail", tier: "Common", isTrash: false, basePrice: 22, asset: "assets/fish/common_fish/snail.png", frame: "assets/frames/common_frame.png" },
        { name: "Hermit Crab", tier: "Common", isTrash: false, basePrice: 25, asset: "assets/fish/common_fish/hermit_crab.png", frame: "assets/frames/common_frame.png" },
        { name: "Sardine", tier: "Common", isTrash: false, basePrice: 28, asset: "assets/fish/common_fish/sardine.png", frame: "assets/frames/common_frame.png" },
        { name: "Goldfish", tier: "Common", isTrash: false, basePrice: 30, asset: "assets/fish/common_fish/goldfish.png", frame: "assets/frames/common_frame.png" },
        { name: "Bluegill", tier: "Common", isTrash: false, basePrice: 35, asset: "assets/fish/common_fish/bluegill.png", frame: "assets/frames/common_frame.png" },
        { name: "Carp", tier: "Common", isTrash: false, basePrice: 38, asset: "assets/fish/common_fish/carp.png", frame: "assets/frames/common_frame.png" },
        { name: "Flounder", tier: "Common", isTrash: false, basePrice: 40, asset: "assets/fish/common_fish/flounder.png", frame: "assets/frames/common_frame.png" },
        { name: "Rainbow Trout", tier: "Common", isTrash: false, basePrice: 45, asset: "assets/fish/common_fish/rainbow_trout.png", frame: "assets/frames/common_frame.png" },
        { name: "Perch", tier: "Common", isTrash: false, basePrice: 48, asset: "assets/fish/common_fish/perch.png", frame: "assets/frames/common_frame.png" },
        { name: "Mackerel", tier: "Common", isTrash: false, basePrice: 50, asset: "assets/fish/common_fish/mackerel.png", frame: "assets/frames/common_frame.png" },
        { name: "Catfish", tier: "Common", isTrash: false, basePrice: 55, asset: "assets/fish/common_fish/catfish.png", frame: "assets/frames/common_frame.png" },
        { name: "Whitefish", tier: "Common", isTrash: false, basePrice: 58, asset: "assets/fish/common_fish/whitefish.png", frame: "assets/frames/common_frame.png" },
        { name: "Tadpole", tier: "Common", isTrash: false, basePrice: 60, asset: "assets/fish/common_fish/tadpole.png", frame: "assets/frames/common_frame.png" },
        { name: "Frog", tier: "Common", isTrash: false, basePrice: 65, asset: "assets/fish/common_fish/frog.png", frame: "assets/frames/common_frame.png" },
        { name: "Shinner", tier: "Common", isTrash: false, basePrice: 68, asset: "assets/fish/common_fish/shinner.png", frame: "assets/frames/common_frame.png" },
        { name: "Bullfrog", tier: "Common", isTrash: false, basePrice: 70, asset: "assets/fish/common_fish/bullfrog.png", frame: "assets/frames/common_frame.png" },
        { name: "Bullhead Catfish", tier: "Common", isTrash: false, basePrice: 75, asset: "assets/fish/common_fish/bullhead_catfish.png", frame: "assets/frames/common_frame.png" },
        { name: "Brown Trout", tier: "Common", isTrash: false, basePrice: 78, asset: "assets/fish/common_fish/brown_trout.png", frame: "assets/frames/common_frame.png" },
        { name: "Goblin Perch", tier: "Common", isTrash: false, basePrice: 80, asset: "assets/fish/common_fish/goblin_perch.png", frame: "assets/frames/common_frame.png" },
        { name: "Oyster", tier: "Common", isTrash: false, basePrice: 85, asset: "assets/fish/common_fish/oyster.png", frame: "assets/frames/common_frame.png" },
        { name: "Mussel", tier: "Common", isTrash: false, basePrice: 88, asset: "assets/fish/common_fish/mussel.png", frame: "assets/frames/common_frame.png" },
        { name: "Guppy", tier: "Common", isTrash: false, basePrice: 90, asset: "assets/fish/common_fish/guppy.png", frame: "assets/frames/common_frame.png" },
        { name: "Herring", tier: "Common", isTrash: false, basePrice: 92, asset: "assets/fish/common_fish/herring.png", frame: "assets/frames/common_frame.png" },
        { name: "Smelt", tier: "Common", isTrash: false, basePrice: 95, asset: "assets/fish/common_fish/smelt.png", frame: "assets/frames/common_frame.png" },
        { name: "Crawdad", tier: "Common", isTrash: false, basePrice: 100, asset: "assets/fish/common_fish/crawdad.png", frame: "assets/frames/common_frame.png" },

        // UNCOMMON SPECIES (28)
        { name: "Largemouth Bass", tier: "Uncommon", isTrash: false, basePrice: 60, asset: "assets/fish/uncommon_fish/largemouth_bass.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Smallmouth Bass", tier: "Uncommon", isTrash: false, basePrice: 80, asset: "assets/fish/uncommon_fish/smallmouth_bass.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Salmon", tier: "Uncommon", isTrash: false, basePrice: 120, asset: "assets/fish/uncommon_fish/salmon.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Northern Pike", tier: "Uncommon", isTrash: false, basePrice: 160, asset: "assets/fish/uncommon_fish/northern_pike.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Electric Eel", tier: "Uncommon", isTrash: false, basePrice: 200, asset: "assets/fish/uncommon_fish/electric_eel.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Red Snapper", tier: "Uncommon", isTrash: false, basePrice: 240, asset: "assets/fish/uncommon_fish/red_snapper.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Sea Horse", tier: "Uncommon", isTrash: false, basePrice: 280, asset: "assets/fish/uncommon_fish/sea_horse.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "King Crab", tier: "Uncommon", isTrash: false, basePrice: 320, asset: "assets/fish/uncommon_fish/king_crab.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Jellyfish", tier: "Uncommon", isTrash: false, basePrice: 360, asset: "assets/fish/uncommon_fish/jellyfish.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Lobster", tier: "Uncommon", isTrash: false, basePrice: 400, asset: "assets/fish/uncommon_fish/lobster.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Barracuda", tier: "Uncommon", isTrash: false, basePrice: 440, asset: "assets/fish/uncommon_fish/barracuda.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Pufferfish", tier: "Uncommon", isTrash: false, basePrice: 480, asset: "assets/fish/uncommon_fish/pufferfish.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Clownfish", tier: "Uncommon", isTrash: false, basePrice: 520, asset: "assets/fish/uncommon_fish/clownfish.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Yellow Tang", tier: "Uncommon", isTrash: false, basePrice: 560, asset: "assets/fish/uncommon_fish/yellow_tang.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Stingray", tier: "Uncommon", isTrash: false, basePrice: 600, asset: "assets/fish/uncommon_fish/stingray.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Sea Urchin", tier: "Uncommon", isTrash: false, basePrice: 640, asset: "assets/fish/uncommon_fish/sea_urchin.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Chicken Fish", tier: "Uncommon", isTrash: false, basePrice: 680, asset: "assets/fish/uncommon_fish/chicken_fish.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Suckerfish", tier: "Uncommon", isTrash: false, basePrice: 720, asset: "assets/fish/uncommon_fish/suckerfish.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Tiger Grouper", tier: "Uncommon", isTrash: false, basePrice: 760, asset: "assets/fish/uncommon_fish/tiger_grouper.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Trigger Fish", tier: "Uncommon", isTrash: false, basePrice: 800, asset: "assets/fish/uncommon_fish/trigger_fish.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Parrotfish", tier: "Uncommon", isTrash: false, basePrice: 840, asset: "assets/fish/uncommon_fish/parrot_fish.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Angelfish", tier: "Uncommon", isTrash: false, basePrice: 880, asset: "assets/fish/uncommon_fish/angelfish.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Marlin", tier: "Uncommon", isTrash: false, basePrice: 920, asset: "assets/fish/uncommon_fish/marlin.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Goblin Shark", tier: "Uncommon", isTrash: false, basePrice: 960, asset: "assets/fish/uncommon_fish/goblin_shark.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Thornback Ray", tier: "Uncommon", isTrash: false, basePrice: 1000, asset: "assets/fish/uncommon_fish/thornback_ray.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Cuttlefish", tier: "Uncommon", isTrash: false, basePrice: 1040, asset: "assets/fish/uncommon_fish/cuttlefish.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Sawfish", tier: "Uncommon", isTrash: false, basePrice: 1080, asset: "assets/fish/uncommon_fish/sawfish.png", frame: "assets/frames/uncommon_frame.png" },
        { name: "Flying Fish", tier: "Uncommon", isTrash: false, basePrice: 1115, asset: "assets/fish/uncommon_fish/flying_fish.png", frame: "assets/frames/uncommon_frame.png" },

        // RARE SPECIES (32)
        { name: "Shark", tier: "Rare", isTrash: false, basePrice: 600, asset: "assets/fish/rare/shark.png", frame: "assets/frames/rare_frame.png" },
        { name: "Whale", tier: "Rare", isTrash: false, basePrice: 750, asset: "assets/fish/rare/whale.png", frame: "assets/frames/rare_frame.png" },
        { name: "Octopus", tier: "Rare", isTrash: false, basePrice: 900, asset: "assets/fish/rare/octopus.png", frame: "assets/frames/rare_frame.png" },
        { name: "Dolphin", tier: "Rare", isTrash: false, basePrice: 1050, asset: "assets/fish/rare/dolphin.png", frame: "assets/frames/rare_frame.png" },
        { name: "Sea Turtle", tier: "Rare", isTrash: false, basePrice: 1200, asset: "assets/fish/rare/sea_turtle.png", frame: "assets/frames/rare_frame.png" },
        { name: "MMF Chickenfish", tier: "Rare", isTrash: false, basePrice: 1350, asset: "assets/fish/rare/mmf_chickenfish.png", frame: "assets/frames/rare_frame.png" },
        { name: "Lionfish", tier: "Rare", isTrash: false, basePrice: 1500, asset: "assets/fish/rare/lionfish.png", frame: "assets/frames/rare_frame.png" },
        { name: "Piranha", tier: "Rare", isTrash: false, basePrice: 1650, asset: "assets/fish/rare/piranha.png", frame: "assets/frames/rare_frame.png" },
        { name: "Swordfish", tier: "Rare", isTrash: false, basePrice: 1800, asset: "assets/fish/rare/swordfish.png", frame: "assets/frames/rare_frame.png" },
        { name: "Sturgeon", tier: "Rare", isTrash: false, basePrice: 1950, asset: "assets/fish/rare/sturgeon.png", frame: "assets/frames/rare_frame.png" },
        { name: "Dwarf Anglerfish", tier: "Rare", isTrash: false, basePrice: 2100, asset: "assets/fish/rare/dwarf_anglershark.png", frame: "assets/frames/rare_frame.png" },
        { name: "Dwarf Lanternshark", tier: "Rare", isTrash: false, basePrice: 2250, asset: "assets/fish/rare/dwarf_lanternfish.png", frame: "assets/frames/rare_frame.png" },
        { name: "Blobfish", tier: "Rare", isTrash: false, basePrice: 2400, asset: "assets/fish/rare/blobfish.png", frame: "assets/frames/rare_frame.png" },
        { name: "Ocean Sunfish", tier: "Rare", isTrash: false, basePrice: 2550, asset: "assets/fish/rare/ocean_sunfish.png", frame: "assets/frames/rare_frame.png" },
        { name: "Oarfish", tier: "Rare", isTrash: false, basePrice: 2700, asset: "assets/fish/rare/oarfish.png", frame: "assets/frames/rare_frame.png" },
        { name: "Dragonfish", tier: "Rare", isTrash: false, basePrice: 2850, asset: "assets/fish/rare/dragonfish.png", frame: "assets/frames/rare_frame.png" },
        { name: "Mantis Shrimp", tier: "Rare", isTrash: false, basePrice: 3000, asset: "assets/fish/rare/mantis_shrimp.png", frame: "assets/frames/rare_frame.png" },
        { name: "Coelacanth", tier: "Rare", isTrash: false, basePrice: 3150, asset: "assets/fish/rare/coelacanth.png", frame: "assets/frames/rare_frame.png" },
        { name: "Giant Grouper", tier: "Rare", isTrash: false, basePrice: 3300, asset: "assets/fish/rare/giant_grouper.png", frame: "assets/frames/rare_frame.png" },
        { name: "Electric Jellyfish", tier: "Rare", isTrash: false, basePrice: 3450, asset: "assets/fish/rare/electric_jellyfish.png", frame: "assets/frames/rare_frame.png" },
        { name: "Giant Clam", tier: "Rare", isTrash: false, basePrice: 3600, asset: "assets/fish/rare/giant_clam.png", frame: "assets/frames/rare_frame.png" },
        { name: "Giant Squid", tier: "Rare", isTrash: false, basePrice: 3750, asset: "assets/fish/rare/giant_catfish.png", frame: "assets/frames/rare_frame.png" },
        { name: "Giant Salamander", tier: "Rare", isTrash: false, basePrice: 3900, asset: "assets/fish/rare/giant_salamander.png", frame: "assets/frames/rare_frame.png" },
        { name: "Narwhal", tier: "Rare", isTrash: false, basePrice: 4050, asset: "assets/fish/rare/narwhal.png", frame: "assets/frames/rare_frame.png" },
        { name: "Shiny Sawfish", tier: "Rare", isTrash: false, basePrice: 4200, asset: "assets/fish/rare/shiny_sawfish.png", frame: "assets/frames/rare_frame.png" },
        { name: "Bluefin Tuna", tier: "Rare", isTrash: false, basePrice: 4350, asset: "assets/fish/rare/bluefin_tuna.png", frame: "assets/frames/rare_frame.png" },
        { name: "Hammerhead Shark", tier: "Rare", isTrash: false, basePrice: 4500, asset: "assets/fish/rare/hammerhead_shark.png", frame: "assets/frames/rare_frame.png" },
        { name: "Orca", tier: "Rare", isTrash: false, basePrice: 4650, asset: "assets/fish/rare/orca.png", frame: "assets/frames/rare_frame.png" },
        { name: "Giant Catfish", tier: "Rare", isTrash: false, basePrice: 4800, asset: "assets/fish/rare/giant_catfish.png", frame: "assets/frames/rare_frame.png" },
        { name: "Golden Mantis Shrimp", tier: "Rare", isTrash: false, basePrice: 4900, asset: "assets/fish/rare/golden_mantis_shrimp.png", frame: "assets/frames/rare_frame.png" },
        { name: "Viper Fish", tier: "Rare", isTrash: false, basePrice: 4950, asset: "assets/fish/rare/viper_fish.png", frame: "assets/frames/rare_frame.png" },
        { name: "Gulper Eel", tier: "Rare", isTrash: false, basePrice: 4999, asset: "assets/fish/rare/gulper_eel.png", frame: "assets/frames/rare_frame.png" },

        // LEGENDARY SPECIES (26)
        { name: "Kraken Hatchling", tier: "Legendary", isTrash: false, basePrice: 3500, asset: "assets/fish/legendary/kraken_hatchling.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Megalodon", tier: "Legendary", isTrash: false, basePrice: 4200, asset: "assets/fish/legendary/megalodon.png", frame: "assets/frames/legendary_frame.png" },
        { name: "SteveRoars SpaghettiFish", tier: "Legendary", isTrash: false, basePrice: 5000, asset: "assets/fish/legendary/steveroars_spaghetifish.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Hydra Fry", tier: "Legendary", isTrash: false, basePrice: 5800, asset: "assets/fish/legendary/hydra_fry.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Kraken Spawn", tier: "Legendary", isTrash: false, basePrice: 6600, asset: "assets/fish/legendary/kraken_spawn.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Dunkleosteus", tier: "Legendary", isTrash: false, basePrice: 7400, asset: "assets/fish/legendary/dunkleosteus.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Golden Carp", tier: "Legendary", isTrash: false, basePrice: 8200, asset: "assets/fish/legendary/golden_carp.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Deep Sea Angler", tier: "Legendary", isTrash: false, basePrice: 9000, asset: "assets/fish/legendary/deep_sea_angler.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Giant Regal Oarfish", tier: "Legendary", isTrash: false, basePrice: 9800, asset: "assets/fish/legendary/giant_regal_oarfish.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Colossal Squid", tier: "Legendary", isTrash: false, basePrice: 10600, asset: "assets/fish/legendary/colossal_squid.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Phantom Ray", tier: "Legendary", isTrash: false, basePrice: 11400, asset: "assets/fish/legendary/phantom_ray.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Golden Dragonfish", tier: "Legendary", isTrash: false, basePrice: 12200, asset: "assets/fish/legendary/golden_dragonfish.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Blue Whale", tier: "Legendary", isTrash: false, basePrice: 13000, asset: "assets/fish/legendary/blue_whale.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Leviathan Calf", tier: "Legendary", isTrash: false, basePrice: 13800, asset: "assets/fish/legendary/leviathan_calf.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Titan Turtle", tier: "Legendary", isTrash: false, basePrice: 14600, asset: "assets/fish/legendary/titan_turtle.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Golden Abyssal Eel", tier: "Legendary", isTrash: false, basePrice: 15400, asset: "assets/fish/legendary/golden_abyssal_eel.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Shadow Leviathan", tier: "Legendary", isTrash: false, basePrice: 16200, asset: "assets/fish/legendary/shadow_leviathan.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Golden Jellyfish", tier: "Legendary", isTrash: false, basePrice: 17000, asset: "assets/fish/legendary/golden_jellyfish.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Titan Jellyfish", tier: "Legendary", isTrash: false, basePrice: 17800, asset: "assets/fish/legendary/titan_jellyfish.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Golden Whale Shark", tier: "Legendary", isTrash: false, basePrice: 18600, asset: "assets/fish/legendary/golden_whale_shark.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Golden Sea Urchin", tier: "Legendary", isTrash: false, basePrice: 19400, asset: "assets/fish/legendary/golden_sea_urchin.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Golden King Crab", tier: "Legendary", isTrash: false, basePrice: 20200, asset: "assets/fish/legendary/golden_king_crab.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Rainbow Manta Ray", tier: "Legendary", isTrash: false, basePrice: 21000, asset: "assets/fish/legendary/rainbow_manta_ray.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Giant Octopus", tier: "Legendary", isTrash: false, basePrice: 21800, asset: "assets/fish/legendary/giant_octopus.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Sea Serpent", tier: "Legendary", isTrash: false, basePrice: 22600, asset: "assets/fish/legendary/sea_serpent.png", frame: "assets/frames/legendary_frame.png" },
        { name: "Sunken Treasure", tier: "Legendary", isTrash: false, basePrice: 23575, asset: "assets/fish/legendary/sunken_treasure.png", frame: "assets/frames/legendary_frame.png" },

        // MYTHICAL SPECIES (22)
        { name: "Ghost Leviathan", tier: "Mythical", isTrash: false, basePrice: 6000, asset: "assets/fish/mythical/ghost_leviathan.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Cosmic Whale", tier: "Mythical", isTrash: false, basePrice: 8000, asset: "assets/fish/mythical/cosmic_whale.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Celestial Serpent", tier: "Mythical", isTrash: false, basePrice: 10000, asset: "assets/fish/mythical/celestial_serpent.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Abyssal Dragon", tier: "Mythical", isTrash: false, basePrice: 12000, asset: "assets/fish/mythical/abyssal_dragon.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Rainbow Phoenix Fish", tier: "Mythical", isTrash: false, basePrice: 14000, asset: "assets/fish/mythical/rainbow_phoenix_fish.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Ethereal Kraken", tier: "Mythical", isTrash: false, basePrice: 16000, asset: "assets/fish/mythical/ethereal_kraken.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Solar Dolphin", tier: "Mythical", isTrash: false, basePrice: 18000, asset: "assets/fish/mythical/solar_dolphin.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Lunar Shark", tier: "Mythical", isTrash: false, basePrice: 20000, asset: "assets/fish/mythical/lunar_shark.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Galactic Jellyfish", tier: "Mythical", isTrash: false, basePrice: 22000, asset: "assets/fish/mythical/galactic_jellyfish.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Quantum Turtle", tier: "Mythical", isTrash: false, basePrice: 24000, asset: "assets/fish/mythical/quantum_turtle.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Starlight Ray", tier: "Mythical", isTrash: false, basePrice: 26000, asset: "assets/fish/mythical/starlight_ray.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Void Octopus", tier: "Mythical", isTrash: false, basePrice: 28000, asset: "assets/fish/mythical/void_octopus.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Rainbow Sea Serpent", tier: "Mythical", isTrash: false, basePrice: 30000, asset: "assets/fish/mythical/rainbow_sea_serpent.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Ethereal Fish", tier: "Mythical", isTrash: false, basePrice: 32000, asset: "assets/fish/mythical/ethereal_fish.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Glowing Abyssal Leviathan", tier: "Mythical", isTrash: false, basePrice: 34000, asset: "assets/fish/mythical/glowing_abyssal_leviathan.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Phoenix Koi", tier: "Mythical", isTrash: false, basePrice: 36000, asset: "assets/fish/mythical/phoenix_koi.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Cthulhu Spore", tier: "Mythical", isTrash: false, basePrice: 38000, asset: "assets/fish/mythical/cthulhu_spore.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Abyssal Octopus", tier: "Mythical", isTrash: false, basePrice: 40000, asset: "assets/fish/mythical/abyssal_octopus.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Shadow Dragon", tier: "Mythical", isTrash: false, basePrice: 41500, asset: "assets/fish/mythical/shadow_dragon.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Phantom Shark", tier: "Mythical", isTrash: false, basePrice: 43000, asset: "assets/fish/mythical/phantom_shark.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Abyssal Kraken", tier: "Mythical", isTrash: false, basePrice: 44000, asset: "assets/fish/mythical/abyssal_kraken.png", frame: "assets/frames/mythical_frame.png" },
        { name: "Galactic Angler", tier: "Mythical", isTrash: false, basePrice: 45000, asset: "assets/fish/mythical/galactic_angler.png", frame: "assets/frames/mythical_frame.png" },

        // DIVINE SPECIES (5)
        { name: "Trident Kraken", tier: "Divine", isTrash: false, basePrice: 50000, asset: "assets/fish/divine/trident_kraken.png", frame: "assets/frames/divine_frame.png" },
        { name: "Rainbow MMF Chickenfish", tier: "Divine", isTrash: false, basePrice: 55000, asset: "assets/fish/divine/rainbow_mmf_chickenfish.png", frame: "assets/frames/divine_frame.png" },
        { name: "Spectral Icefish", tier: "Divine", isTrash: false, basePrice: 60000, asset: "assets/fish/divine/spectral_icefish.png", frame: "assets/frames/divine_frame.png" },
        { name: "Mermaid", tier: "Divine", isTrash: false, basePrice: 65000, asset: "assets/fish/divine/mermaid.png", frame: "assets/frames/divine_frame.png" },
        { name: "SteveRoars Hatchling", tier: "Divine", isTrash: false, basePrice: 69075, asset: "assets/fish/divine/steveraors_hatchling.png", frame: "assets/frames/divine_frame.png" }
    ];

    // Initialize App
    init();

    function init() {
        checkTwitchOAuthHash();
        setupNavigation();
        setupEventListeners();
        loadSavedUserSession();
        
        if (state.currentUser) {
            fetchUserProfile();
            startAutoSync();
        } else {
            renderLoggedOutState();
        }
    }

    // 1. Twitch OAuth Implicit Grant handling
    function checkTwitchOAuthHash() {
        const hash = window.location.hash.substring(1);
        if (!hash) return;

        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');

        if (accessToken) {
            state.twitchToken = accessToken;
            localStorage.setItem('sr_twitch_token', accessToken);
            history.pushState("", document.title, window.location.pathname + window.location.search);
            fetchTwitchUserInfo(accessToken);
        }
    }

    async function fetchTwitchUserInfo(token) {
        try {
            const res = await fetch('https://api.twitch.tv/helix/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Client-ID': window.CONFIG.TWITCH_CLIENT_ID
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.data && data.data.length > 0) {
                    const twitchUser = data.data[0];
                    state.currentUser = {
                        id: twitchUser.id,
                        username: twitchUser.login,
                        displayName: twitchUser.display_name,
                        profileImage: twitchUser.profile_image_url
                    };
                    localStorage.setItem('sr_user_session', JSON.stringify(state.currentUser));
                    updateUserHeaderUI();
                    fetchUserProfile();
                }
            }
        } catch (err) {
            console.error('Error contacting Twitch API:', err);
        }
    }

    function loadSavedUserSession() {
        const savedSession = localStorage.getItem('sr_user_session');
        const savedToken = localStorage.getItem('sr_twitch_token');
        if (savedSession) {
            state.currentUser = JSON.parse(savedSession);
            state.twitchToken = savedToken;
            updateUserHeaderUI();
        }
    }

    function loginWithTwitch() {
        if (!window.CONFIG.TWITCH_CLIENT_ID || window.CONFIG.TWITCH_CLIENT_ID === "YOUR_TWITCH_CLIENT_ID") {
            alert("Twitch Client ID is not configured yet! Please update config.js with your Twitch Dev Client ID.");
            return;
        }

        const authUrl = `https://id.twitch.tv/oauth2/authorize` +
            `?client_id=${encodeURIComponent(window.CONFIG.TWITCH_CLIENT_ID)}` +
            `&redirect_uri=${encodeURIComponent(window.CONFIG.REDIRECT_URI)}` +
            `&response_type=token` +
            `&scope=user:read:email`;

        window.location.href = authUrl;
    }

    function logoutUser() {
        state.currentUser = null;
        state.twitchToken = null;
        state.userProfile = null;
        localStorage.removeItem('sr_user_session');
        localStorage.removeItem('sr_twitch_token');
        if (state.syncTimer) clearInterval(state.syncTimer);
        renderLoggedOutState();
    }

    function startAutoSync() {
        if (state.syncTimer) clearInterval(state.syncTimer);
        state.syncTimer = setInterval(async () => {
            if (state.currentUser) {
                await fetchUserProfile(true);
            }
        }, (window.CONFIG && window.CONFIG.SYNC_INTERVAL_MS) || 4000);
    }

    // 2. Fetch Profile from JRMA Backend API
    function getProfileStorageKey(userId) {
        return 'srf_user_profile_' + (userId || 'viewer_demo');
    }

    function saveLocalProfile() {
        if (!state.userProfile) return;
        const key = getProfileStorageKey(state.userProfile.id);
        localStorage.setItem(key, JSON.stringify(state.userProfile));
    }

    function loadLocalProfile(userId) {
        const key = getProfileStorageKey(userId);
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.warn("Failed parsing saved profile:", e);
            }
        }
        return null;
    }

    // 2. Fetch Profile from JRMA Backend API (With Persistent Local State Merging)
    async function fetchUserProfile(isSilent = false) {
        if (!state.currentUser) {
            state.currentUser = { id: "viewer_demo", displayName: "ViewerDemo", username: "viewerdemo" };
        }

        const userId = state.currentUser.id;

        try {
            const url = `${window.CONFIG.API_BASE_URL}/api/User/${userId}?username=${encodeURIComponent(state.currentUser.username)}`;
            const res = await fetch(url);

            if (res.ok) {
                const serverData = await res.json();
                state.userProfile = serverData;
                saveLocalProfile();
                renderProfileData(isSilent);
            } else if (!isSilent) {
                renderFallbackProfileData();
            }
        } catch (err) {
            if (!isSilent) renderFallbackProfileData();
        }
    }

    function renderFallbackProfileData() {
        const userId = state.currentUser ? state.currentUser.id : "viewer_demo";
        const saved = loadLocalProfile(userId);

        if (saved) {
            state.userProfile = saved;
        } else {
            state.userProfile = {
                id: userId,
                username: state.currentUser ? state.currentUser.displayName : "ViewerDemo",
                gold: 35000,
                activeRod: "Default Rod",
                tankCapacity: 3,
                hasAutoFeeder: false,
                hasDeepFreezer: true,
                hasFishingVessel: false,
                hasFishingNet: true,
                cooldownTotalSeconds: 900,
                remainingCooldownSeconds: 0,
                netCatches: [
                    { id: 'cat_1', species: { name: "Rainbow Trout", rarity: "Common", iconUrl: "assets/fish/common_fish/rainbow_trout.png" }, weight: 3.4, qualityMultiplier: 1.0 },
                    { id: 'cat_2', species: { name: "Largemouth Bass", rarity: "Uncommon", iconUrl: "assets/fish/uncommon_fish/largemouth_bass.png" }, weight: 8.2, qualityMultiplier: 1.15 },
                    { id: 'cat_3', species: { name: "Minnow", rarity: "Common", iconUrl: "assets/fish/common_fish/minnow.png" }, weight: 0.2, qualityMultiplier: 1.0 },
                    { id: 'cat_4', species: { name: "Bluegill", rarity: "Common", iconUrl: "assets/fish/common_fish/bluegill.png" }, weight: 1.1, qualityMultiplier: 1.0 }
                ],
                inventoryItems: [
                    { itemName: "Standard Bait", quantity: 4 },
                    { itemName: "Super Bait", quantity: 2 },
                    { itemName: "Common & Uncommon Recovery Med", quantity: 3 }
                ],
                tankFish: [
                    { id: 'tank_101', nickname: "Goldie", currentHp: 100, maxHp: 100, species: { name: "Golden Carp", rarity: "Legendary" }, atk: 12, qualityMultiplier: 1.3 }
                ],
                caughtStats: {
                    "rainbow trout": { timesCaught: 5, heaviestWeight: 4.8 },
                    "largemouth bass": { timesCaught: 2, heaviestWeight: 12.4 },
                    "golden carp": { timesCaught: 1, heaviestWeight: 2450.0 },
                    "minnow": { timesCaught: 8, heaviestWeight: 0.4 },
                    "rusty can": { timesCaught: 3, heaviestWeight: 0.8 }
                }
            };
            saveLocalProfile();
        }
        renderProfileData();
    }

    function syncCooldownTime(remainingSeconds) {
        if (typeof remainingSeconds === 'number' && remainingSeconds > 0) {
            const targetEnd = Date.now() + (remainingSeconds * 1000);
            if (!state.cooldownEndTime || Math.abs(state.cooldownEndTime - targetEnd) > 2000) {
                state.cooldownEndTime = targetEnd;
            }
        } else if (remainingSeconds === 0) {
            state.cooldownEndTime = 0;
        }
    }

    function getRemainingCooldownSecs() {
        if (!state.cooldownEndTime || state.cooldownEndTime <= Date.now()) return 0;
        return Math.max(0, Math.ceil((state.cooldownEndTime - Date.now()) / 1000));
    }

    function renderProfileData(isSilent = false) {
        if (!state.userProfile) return;

        // Save local state to localStorage on every render so actions persist
        saveLocalProfile();

        // Header Gold
        const goldEl = document.getElementById('userGoldVal');
        if (goldEl) goldEl.textContent = state.userProfile.gold.toLocaleString();

        // Hero Stats
        const statGold = document.getElementById('statGold');
        if (statGold) statGold.textContent = state.userProfile.gold.toLocaleString();

        const statCatches = document.getElementById('statCatches');
        if (statCatches) statCatches.textContent = state.userProfile.netCatches ? state.userProfile.netCatches.length : 0;

        const statRod = document.getElementById('statRod');
        if (statRod) statRod.textContent = state.userProfile.activeRod || "Default Rod";

        // Anchor timestamp-based cooldown
        syncCooldownTime(state.userProfile.remainingCooldownSeconds || 0);

        // Start 1-second ticker for smooth countdown (runs continuously)
        startCooldownTicker();

        // Render Active Tab
        if (!isSilent) {
            renderCurrentTabContent();
        } else if (state.activeTab === 'net' || state.activeTab === 'tank') {
            renderCurrentTabContent();
        }
    }

    function startCooldownTicker() {
        updateCooldownUI();
        updateDailyClaimUI();

        if (state.cooldownTimerInterval) return;

        state.cooldownTimerInterval = setInterval(() => {
            updateCooldownUI();
            updateDailyClaimUI();
        }, 1000);
    }

    function updateCooldownUI() {
        const timerEl = document.getElementById('cooldownTimerVal');
        if (!timerEl) return;

        const secondsRemaining = getRemainingCooldownSecs();

        if (secondsRemaining <= 0) {
            timerEl.textContent = "READY TO FISH!";
            timerEl.style.color = "var(--accent-emerald)";
        } else {
            const mins = Math.floor(secondsRemaining / 60);
            const secs = Math.floor(secondsRemaining % 60);
            timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            timerEl.style.color = "var(--accent-cyan)";
        }
    }

    // Daily Claim 1,000 Gold Logic (24-Hour Cycle with LocalStorage Persistence)
    function getDailyClaimStatus() {
        if (!state.userProfile) return { canClaim: false, timeRemainingStr: '' };

        const userId = state.userProfile.id || 'viewer_demo';
        const localClaimStr = localStorage.getItem('srf_last_daily_' + userId);
        const lastClaimStr = state.userProfile.lastDailyClaimTime || localClaimStr;
        const lastClaim = lastClaimStr ? new Date(lastClaimStr).getTime() : 0;
        const now = Date.now();
        const elapsed = now - lastClaim;
        const dayMs = 24 * 60 * 60 * 1000;

        if (elapsed >= dayMs || !lastClaim) {
            return { canClaim: true, timeRemainingStr: '' };
        } else {
            const remMs = dayMs - elapsed;
            const hrs = Math.floor(remMs / (1000 * 60 * 60));
            const mins = Math.floor((remMs % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((remMs % (1000 * 60)) / 1000);
            return { canClaim: false, timeRemainingStr: `${hrs}h ${mins}m ${secs}s` };
        }
    }

    function updateDailyClaimUI() {
        const btn = document.getElementById('btnClaimDaily');
        const text = document.getElementById('dailyBtnText');
        if (!btn || !text) return;

        const status = getDailyClaimStatus();
        if (status.canClaim) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.className = 'btn-action btn-gold';
            text.textContent = 'Claim Daily (1,000 Gold)';
        } else {
            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
            btn.className = 'btn-action';
            text.textContent = `Daily: ${status.timeRemainingStr}`;
        }
    }

    window.claimDailyReward = async function() {
        if (!state.userProfile) return;
        const status = getDailyClaimStatus();

        if (!status.canClaim) {
            window.showAppModal({
                icon: '⏳',
                title: 'Daily Reward Already Claimed',
                message: `@${state.userProfile.username || 'Viewer'} already claimed the daily reward! Come back in ${status.timeRemainingStr}.`
            });
            return;
        }

        const nowIso = new Date().toISOString();
        const userId = state.userProfile.id || 'viewer_demo';
        localStorage.setItem('srf_last_daily_' + userId, nowIso);
        state.userProfile.lastDailyClaimTime = nowIso;
        state.userProfile.gold = (state.userProfile.gold || 0) + 1000;

        try {
            const res = await fetch(`${window.CONFIG.API_BASE_URL}/api/user/claim-daily`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: state.userProfile.id })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.newGold !== undefined) state.userProfile.gold = data.newGold;
            }
        } catch (err) {
            console.warn('API daily claim fallback:', err);
        }

        renderProfileData();
        window.showAppModal({
            icon: '🎁',
            title: 'Daily Reward Claimed!',
            message: `@${state.userProfile.username || 'Viewer'} claimed 1,000 Gold! Next claim available in 24 hours.`
        });
    };

    // 3. Navigation & Tab Switcher
    function setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = item.getAttribute('data-tab');
                switchTab(targetTab);
            });
        });
    }

    function switchTab(tabId) {
        state.activeTab = tabId;
        
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
        if (activeNav) activeNav.classList.add('active');

        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        const activePane = document.getElementById(`tab-${tabId}`);
        if (activePane) activePane.classList.add('active');

        renderCurrentTabContent();
    }

    function renderCurrentTabContent() {
        switch (state.activeTab) {
            case 'net':
                renderNetTab();
                break;
            case 'inventory':
                renderInventoryTab();
                break;
            case 'gear':
                renderGearTab();
                break;
            case 'tank':
                renderTankTab();
                break;
            case 'shop':
                renderShopTab();
                break;
            case 'craft':
                renderCraftTab();
                break;
            case 'ranks':
                renderRanksTab();
                break;
            case 'log':
                renderLogTab();
                break;
        }
    }

    // 4. Tab Renderers
    function renderNetTab() {
        const netGrid = document.getElementById('netGrid');
        if (!netGrid) return;

        const catches = state.userProfile ? (state.userProfile.netCatches || []) : [];
        const hasFreezer = state.userProfile && state.userProfile.hasDeepFreezer;

        if (catches.length === 0) {
            netGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding: 50px 20px; color: var(--text-muted); background:var(--bg-glass); border:1px solid var(--border-glass); border-radius:var(--radius-lg);">
                    <div style="font-size: 2.5rem; margin-bottom: 10px;">🎣</div>
                    <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-light);">Your Fishing Net is Currently Empty!</div>
                    <div style="margin-top: 6px; font-size: 0.88rem;">Type <code style="color:var(--accent-gold); background:rgba(255,183,3,0.1); padding:2px 6px; border-radius:4px;">!fish</code> in Twitch chat to cast your line and catch fish!</div>
                </div>
            `;
            return;
        }

        // Calculate individual item prices and total net value
        let totalNetValue = 0;
        const processedCatches = catches.map(item => {
            const specName = item.species ? (item.species.name || item.speciesName || 'Fish') : (item.speciesName || 'Fish');
            const catalogMatch = MASTER_SPECIES_CATALOG.find(c => c.name.toLowerCase() === specName.toLowerCase());
            
            const itemAsset = catalogMatch ? catalogMatch.asset : (item.species && item.species.iconUrl ? item.species.iconUrl : 'assets/fish/common_fish/minnow.png');
            const tierName = catalogMatch ? (catalogMatch.isTrash ? 'Trash' : catalogMatch.tier) : (item.species && item.species.rarity ? item.species.rarity : 'Common');
            const basePrice = catalogMatch ? (catalogMatch.isTrash ? 5 : catalogMatch.basePrice) : 10;
            const qualityMult = item.qualityMultiplier || 1.0;
            const sellPrice = Math.max(1, Math.floor(basePrice * qualityMult));
            
            totalNetValue += sellPrice;

            return {
                ...item,
                specName,
                itemAsset,
                tierName,
                sellPrice
            };
        });

        // Top Action & Summary Bar
        const netHeaderHtml = `
            <div style="grid-column: 1/-1; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:15px; background:var(--bg-glass); border:1px solid var(--border-glass); padding:16px 20px; border-radius:var(--radius-lg); margin-bottom:10px;">
                <div>
                    <div style="font-size:1.1rem; font-weight:700; color:var(--text-light);">🎣 Net Summary</div>
                    <div style="font-size:0.9rem; color:var(--accent-gold); font-weight:600; margin-top:2px;">
                        Catches: <b>${catches.length}</b> &nbsp;|&nbsp; Total Net Value: <b>🪙 ${totalNetValue.toLocaleString()} Gold</b>
                    </div>
                </div>
                <button class="btn-action btn-gold" style="width:auto; padding:10px 24px; font-weight:700;" onclick="window.sellAllNetCatches()">
                    💰 Sell All (${totalNetValue.toLocaleString()} Gold)
                </button>
            </div>
        `;

        const decayNoticeHtml = hasFreezer 
            ? `<div style="grid-column: 1/-1; font-size:0.85rem; color:var(--accent-cyan); background:rgba(0,229,255,0.08); border:1px solid rgba(0,229,255,0.25); padding:10px 16px; border-radius:var(--radius-md); text-align:center; margin-bottom:10px;">🧊 <b>Deep Freezer Active:</b> Catches in your Net stay 100% fresh for 3 days (72h) before standard decay applies!</div>`
            : `<div style="grid-column: 1/-1; font-size:0.85rem; color:var(--accent-gold); background:rgba(255,183,3,0.08); border:1px solid rgba(255,183,3,0.25); padding:10px 16px; border-radius:var(--radius-md); text-align:center; margin-bottom:10px;">⏱️ <b>Decay Timer Notice:</b> Unpreserved catches decay in value after 24 hours (50% @ 24h, 40% @ 48h, 30% @ 72h, 25% floor). Purchase the <i>Deep Freezer</i> to keep catches 100% fresh for 3 days!</div>`;

        const cardsHtml = processedCatches.map(item => {
            const curHp = item.currentHp !== undefined ? item.currentHp : (item.hp !== undefined ? item.hp : null);
            const maxHp = item.maxHp || null;
            const atk = item.atk || item.attack || (item.species && item.species.atk) || null;
            const qualityMult = item.qualityMultiplier || 1.0;
            const qualityLabel = qualityMult >= 1.3 ? '⭐ Perfect' : qualityMult >= 1.15 ? '✨ Good' : 'Standard';
            const qualityColor = qualityMult >= 1.3 ? 'var(--accent-gold)' : qualityMult >= 1.15 ? 'var(--accent-cyan)' : 'var(--text-muted)';
            const isTrash = item.tierName === 'Trash';
            const tankFish = state.userProfile ? (state.userProfile.tankFish || []) : [];
            const tankCap = state.userProfile ? (state.userProfile.tankCapacity || 3) : 3;
            const tankFull = tankFish.length >= tankCap;

            return `
                <div class="item-card">
                    <span class="item-badge rarity-${item.tierName.toLowerCase()}">${item.tierName.toUpperCase()}</span>
                    <img src="${item.itemAsset}" class="item-img" alt="${item.specName}" style="object-fit:contain; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));">
                    <div class="item-name">${item.specName}</div>
                    <div class="item-desc">
                        Weight: <b>${item.weight ? item.weight.toFixed(2) + ' lbs' : '1.00 lbs'}</b><br>
                        Value: <b style="color:var(--accent-gold);">🪙 ${item.sellPrice.toLocaleString()} Gold</b><br>
                        ${curHp !== null && maxHp !== null ? `❤️ HP: <b>${curHp}/${maxHp}</b>&nbsp; ⚔️ ATK: <b>${atk !== null ? atk : '—'}</b><br>` : ''}
                        <span style="color:${qualityColor}; font-size:0.78rem; font-weight:700;">${qualityLabel} (${qualityMult.toFixed(2)}x)</span><br>
                        <span style="color:${hasFreezer ? 'var(--accent-emerald)' : 'var(--accent-gold)'}; font-size:0.78rem;">
                            ${hasFreezer ? '🧊 Preserved (3 Days Fresh)' : '⏱️ Fresh (Decays in 24h)'}
                        </span>
                    </div>
                    <button class="btn-action btn-gold" onclick="window.sellFish('${item.id}', ${item.sellPrice}, '${item.specName.replace(/'/g, "\\'")}')">Sell 🪙 ${item.sellPrice.toLocaleString()} Gold</button>
                    ${!isTrash ? `
                    <button class="btn-action" style="margin-top:4px; background:linear-gradient(135deg,var(--accent-cyan),var(--accent-blue)); color:#000; font-weight:700; ${tankFull ? 'opacity:0.4; cursor:not-allowed;' : ''}" 
                        onclick="window.sendToTank('${item.id}', '${item.specName.replace(/'/g, "\\'")}')"
                        ${tankFull ? 'disabled' : ''}>
                        🐠 ${tankFull ? 'Tank Full' : 'Transfer to Tank'}
                    </button>` : ''}
                </div>
            `;
        }).join('');

        netGrid.innerHTML = netHeaderHtml + decayNoticeHtml + cardsHtml;
    }

    function renderInventoryTab() {
        const invGrid = document.getElementById('invGrid');
        if (!invGrid) return;

        const items = state.userProfile ? (state.userProfile.inventoryItems || []) : [];
        if (items.length === 0) {
            invGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">Your inventory is empty! Purchase consumables from the Shop or craft baits.</div>`;
            return;
        }

        invGrid.innerHTML = items.map(item => {
            const name = item.itemName || item.name || 'Item';
            let icon = 'assets/baits/standard_bait.png';
            if (name.toLowerCase().includes('power')) icon = 'assets/baits/power_bait.png';
            else if (name.toLowerCase().includes('super')) icon = 'assets/baits/super_bait.png';
            else if (name.toLowerCase().includes('trophy')) icon = 'assets/Icons/trophy_bait.png';
            else if (name.toLowerCase().includes('common')) icon = 'assets/Icons/common_uncommon_med.png';
            else if (name.toLowerCase().includes('rare')) icon = 'assets/Icons/rare_legendary_med.png';
            else if (name.toLowerCase().includes('mythical')) icon = 'assets/Icons/mythical_divine_med.png';
            else if (name.toLowerCase().includes('egg')) icon = 'assets/Icons/fish_eggs.png';

            return `
                <div class="item-card">
                    <span class="item-badge rarity-common">INVENTORY</span>
                    <img src="${icon}" class="item-img" alt="${name}" style="object-fit:contain;">
                    <div class="item-name">${name}</div>
                    <div class="item-desc">Quantity: <b>x${item.quantity}</b></div>
                </div>
            `;
        }).join('');
    }

    function renderGearTab() {
        const gearGrid = document.getElementById('gearGrid');
        if (!gearGrid) return;

        const profile = state.userProfile || {};
        const activeRod = profile.activeRod || "Default Rod";

        gearGrid.innerHTML = `
            <div class="item-card">
                <span class="item-badge rarity-legendary">EQUIPPED ROD</span>
                <img src="assets/Icons/default_rod.png" class="item-img" alt="Equipped Rod">
                <div class="item-name">${activeRod}</div>
                <div class="item-desc">Active Rod equipped for !fish casts.</div>
            </div>
            <div class="item-card">
                <span class="item-badge rarity-${profile.hasAutoFeeder ? 'uncommon' : 'common'}">${profile.hasAutoFeeder ? 'UNLOCKED' : 'LOCKED'}</span>
                <img src="assets/Icons/auto_feeder.png" class="item-img" alt="Auto Feeder">
                <div class="item-name">Auto Feeder</div>
                <div class="item-desc">Auto-feeds tank fish every 12 hrs for 3,500 Gold.</div>
            </div>
            <div class="item-card">
                <span class="item-badge rarity-${profile.hasDeepFreezer ? 'uncommon' : 'common'}">${profile.hasDeepFreezer ? 'UNLOCKED' : 'LOCKED'}</span>
                <img src="assets/Icons/deep_freezer.png" class="item-img" alt="Deep Freezer">
                <div class="item-name">Deep Freezer</div>
                <div class="item-desc">Keeps all catches in Net 100% fresh for 3 days (72h) before standard decay.</div>
            </div>
            <div class="item-card">
                <span class="item-badge rarity-${profile.hasFishingNet ? 'uncommon' : 'common'}">${profile.hasFishingNet ? 'UNLOCKED' : 'LOCKED'}</span>
                <img src="assets/Icons/fishing_net.png" class="item-img" alt="Fishing Net">
                <div class="item-name">Fishing Net Perk</div>
                <div class="item-desc">Grants a 20% double-catch bonus per cast.</div>
            </div>
            <div class="item-card">
                <span class="item-badge rarity-${profile.hasFishingVessel ? 'uncommon' : 'common'}">${profile.hasFishingVessel ? 'UNLOCKED' : 'LOCKED'}</span>
                <img src="assets/Icons/fishing_vessel.png" class="item-img" alt="Fishing Vessel">
                <div class="item-name">Fishing Vessel</div>
                <div class="item-desc">Enables offshore catches & double weight rolls.</div>
            </div>
        `;
    }

    function renderTankTab() {
        const tankInfoPanel = document.getElementById('tankInfoPanel');
        const tankVisualizer = document.getElementById('tankVisualizer');
        if (!tankVisualizer) return;

        const tankFish = state.userProfile ? (state.userProfile.tankFish || []) : [];
        const hasAutoFeeder = state.userProfile && state.userProfile.hasAutoFeeder;
        const capacity = state.userProfile ? (state.userProfile.tankCapacity || 3) : 3;

        // Determine if any fish HP is below 50% OR if feed is due
        const feedDueAt = state.userProfile && state.userProfile.lastFedAt
            ? new Date(state.userProfile.lastFedAt).getTime() + (12 * 60 * 60 * 1000)
            : 0;
        const isFeedDue = Date.now() >= feedDueAt;
        const hasLowHpFish = tankFish.some(fish => {
            const cur = fish.currentHp !== undefined ? fish.currentHp : (fish.hp !== undefined ? fish.hp : 100);
            const max = fish.maxHp || 100;
            return (cur / max) < 0.5;
        });
        const canFeed = isFeedDue || hasLowHpFish;

        // Tank Header Info (Rendered OUTSIDE/ABOVE tankVisualizer into tankInfoPanel)
        const tankHeaderHtml = `
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; background: rgba(4, 15, 30, 0.85); backdrop-filter: blur(10px); border: 1px solid rgba(0, 229, 255, 0.25); padding: 14px 22px; border-radius: var(--radius-md);">
                <div>
                    <div style="font-weight: 700; font-size: 1.05rem; color: #fff; display: flex; align-items: center; gap: 8px;">
                        <span>🐠 Aquarium Status:</span>
                        <span style="color: var(--accent-cyan); font-weight: 800;">${tankFish.length} / ${capacity} Slots</span>
                        ${hasAutoFeeder ? '<span style="font-size:0.75rem; background:rgba(0,229,255,0.15); color:var(--accent-cyan); border:1px solid rgba(0,229,255,0.3); padding:2px 8px; border-radius:12px;">🤖 Auto-Feeder</span>' : ''}
                        ${hasLowHpFish ? '<span style="font-size:0.75rem; background:rgba(244,63,94,0.15); color:var(--accent-rose); border:1px solid rgba(244,63,94,0.3); padding:2px 8px; border-radius:12px;">⚠️ Fish HP Low!</span>' : ''}
                    </div>
                    <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 3px;">
                        Feed cycle: 12h &nbsp;|&nbsp; Regen: +10% HP/30m while fed &nbsp;|&nbsp; Alive fish sell at 100%, fainted at 50%
                    </div>
                </div>
                <div style="display: flex; gap: 12px; align-items: center; flex-wrap:wrap;">
                    <button class="btn-action ${canFeed ? 'btn-gold' : ''}" 
                        style="width: auto; padding: 10px 20px; font-weight:700; ${!canFeed ? 'opacity:0.4; cursor:not-allowed; background:var(--bg-secondary); border:1px solid var(--border-color);' : ''}" 
                        onclick="window.feedTank()" ${!canFeed ? 'disabled' : ''}>
                        🥣 Feed Tank (1,000 Gold)
                    </button>
                    <div style="background:rgba(244,63,94,0.12); border:1px solid rgba(244,63,94,0.3); border-radius:var(--radius-md); padding:8px 16px; font-size:0.8rem; font-weight:600; color:#fff; line-height:1.5;">
                        ⚔️ <b style="color:var(--accent-rose);">Chat Battles:</b><br>
                        <code style="color:var(--accent-gold); font-size:0.78rem;">!fishbattle [gold]</code> — vs random<br>
                        <code style="color:var(--accent-gold); font-size:0.78rem;">!fishbattle @user [gold]</code> — challenge (60s to accept)
                    </div>
                </div>
            </div>
        `;

        if (tankInfoPanel) tankInfoPanel.innerHTML = tankHeaderHtml;

        let fishHtml = '';
        if (tankFish.length === 0) {
            fishHtml = `
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: var(--text-muted); pointer-events: none;">
                    <div style="font-size: 3rem; margin-bottom: 8px;">🐠</div>
                    <div style="font-size: 1.1rem; font-weight: 700; color: #fff;">Your Aquarium Tank is Empty</div>
                    <div style="font-size: 0.85rem; margin-top: 4px;">Transfer caught fish from your Fishing Net to store them in your tank!</div>
                </div>
            `;
        } else {
            fishHtml = tankFish.map((fish, index) => {
                const specName = fish.species ? (fish.species.name || fish.speciesName || 'Fish') : (fish.speciesName || 'Fish');
                const catalogMatch = MASTER_SPECIES_CATALOG.find(c => c.name.toLowerCase() === specName.toLowerCase());
                const fishAsset = catalogMatch ? catalogMatch.asset : (fish.species && fish.species.iconUrl ? fish.species.iconUrl : 'assets/fish/legendary/golden_carp.png');
                const curHp = fish.currentHp !== undefined ? fish.currentHp : (fish.hp !== undefined ? fish.hp : 100);
                const maxHp = fish.maxHp || 100;
                const hpPct = Math.min(100, Math.max(0, Math.floor((curHp / maxHp) * 100)));
                const atk = fish.atk || fish.attack || (fish.species && fish.species.atk) || 0;
                const qualityMult = fish.qualityMultiplier || 1.0;
                const qualityLabel = qualityMult >= 1.3 ? '⭐ Perfect' : qualityMult >= 1.15 ? '✨ Good' : 'Standard';
                const qualityColor = qualityMult >= 1.3 ? 'var(--accent-gold)' : qualityMult >= 1.15 ? 'var(--accent-cyan)' : 'var(--text-muted)';
                const isFainted = curHp <= 0;
                const basePrice = catalogMatch ? catalogMatch.basePrice : 10;
                const aliveSell = Math.max(1, Math.floor(basePrice * qualityMult));
                const sellVal = isFainted ? Math.floor(aliveSell * 0.5) : aliveSell;

                // Spread out swimming positions
                const topPos = 20 + (index * 24) % 55;
                const leftPos = 10 + (index * 30) % 70;

                return `
                    <div class="swimming-fish-wrapper" style="top: ${topPos}%; left: ${leftPos}%;" title="${specName} (HP: ${curHp}/${maxHp} | ATK: ${atk})">
                        <img src="${fishAsset}" class="swimming-fish-img" alt="${specName}" style="${isFainted ? 'filter: grayscale(1) drop-shadow(0 6px 12px rgba(0,0,0,0.6)); opacity:0.6;' : 'filter: drop-shadow(0 6px 12px rgba(0,0,0,0.6));'}">
                        <div class="swimming-fish-label">${fish.nickname || specName}${isFainted ? ' 💀' : ''}</div>
                        <div class="swimming-fish-hpbar">
                            <div class="swimming-fish-hpfill" style="width: ${hpPct}%; background: ${hpPct < 30 ? 'linear-gradient(90deg,#f43f5e,#fb7185)' : hpPct < 60 ? 'linear-gradient(90deg,#fb8500,#ffb703)' : 'linear-gradient(90deg,#10b981,#34d399)'}"></div>
                        </div>
                        <div style="font-size:0.7rem; color:var(--text-muted); text-align:center; line-height:1.4; margin-top:2px;">
                            ❤️ ${curHp}/${maxHp} &nbsp;⚔️ ${atk} ATK<br>
                            <span style="color:${qualityColor}; font-weight:700;">${qualityLabel} (${qualityMult.toFixed(2)}x)</span>
                        </div>
                        <button class="btn-action btn-gold" onclick="window.sellTankFish('${fish.id}', ${sellVal}, '${specName.replace(/'/g, "\\'")}')"
                            style="margin-top:5px; padding:4px 12px; font-size:0.75rem; font-weight:800; border-radius:6px; cursor:pointer;">
                            Sell 🪙 ${sellVal.toLocaleString()}${isFainted ? ' (50%)' : ''}
                        </button>
                    </div>
                `;
            }).join('');
        }

        let bubblesHtml = '';
        for (let i = 0; i < 12; i++) {
            const size = Math.random() * 12 + 6;
            const left = Math.random() * 95;
            const delay = Math.random() * 4;
            bubblesHtml += `<div class="bubble" style="width:${size}px; height:${size}px; left:${left}%; animation-delay:${delay}s;"></div>`;
        }

        tankVisualizer.innerHTML = bubblesHtml + fishHtml;
    }

    // 5. Upgrades Shop (Matching GAME_SPECS.md Exactly)
    function renderShopTab() {
        const shopGrid = document.getElementById('shopGrid');
        if (!shopGrid) return;

        const shopItems = [
            // Rods (GAME_SPECS.md Section 3)
            { name: "Default Rod", price: 0, desc: "Base Starting Rod (15 Minutes Cooldown)", icon: "assets/Icons/default_rod.png", category: "Rod" },
            { name: "Standard Rod", price: 30000, desc: "-20% Cooldown (12 Minutes Cooldown)", icon: "assets/Icons/default_rod.png", category: "Rod" },
            { name: "Golden Rod", price: 150000, desc: "-40% Cooldown (9 Minutes Cooldown)", icon: "assets/Icons/golden_rod.png", category: "Rod" },
            { name: "Divine Rod", price: 300000, desc: "-60% Cooldown (6 Minutes Cooldown)", icon: "assets/Icons/divine_rod.png", category: "Rod" },

            // Baits (Purchasable or Craftable) — per GAME_SPECS.md
            { name: "Standard Bait", price: 2000, desc: "2x odds for anything above Common (Or Craft: 4 Common Fish)", icon: "assets/baits/standard_bait.png", category: "Bait" },
            { name: "Power Bait", price: 7000, desc: "2x odds for anything above Uncommon (Or Craft: 6 Uncommon Fish)", icon: "assets/baits/power_bait.png", category: "Bait" },
            { name: "Super Bait", price: 10000, desc: "Guarantees anything above Uncommon (Or Craft: 5 Rare Fish)", icon: "assets/baits/super_bait.png", category: "Bait" },

            // Consumables & Recovery Meds
            { name: "Common & Uncommon Med", price: 2500, desc: "Revives fainted Common/Uncommon fish to 50% HP", icon: "assets/Icons/common_uncommon_med.png", category: "Med" },
            { name: "Rare & Legendary Med", price: 10000, desc: "Revives fainted Rare/Legendary fish to 50% HP", icon: "assets/Icons/rare_legendary_med.png", category: "Med" },
            { name: "Mythical & Divine Med", price: 25000, desc: "Revives fainted Mythical/Divine fish to 50% HP", icon: "assets/Icons/mythical_divine_med.png", category: "Med" },
            { name: "Trophy Bait", price: 25000, desc: "Best weight of 3 rolls on next cast", icon: "assets/Icons/trophy_bait.png", category: "Consumable" },
            { name: "Fish Eggs", price: 15000, desc: "Increases Tank fish stats by +10% next battle", icon: "assets/Icons/fish_eggs.png", category: "Consumable" },

            // Permanent Account Upgrades
            { name: "Auto-Feeder", price: 25000, desc: "Auto-feeds tank fish every 12 hrs for 3,500 Gold", icon: "assets/Icons/auto_feeder.png", category: "Upgrade" },
            { name: "Tank Upgrade", price: 225000, desc: "Expands max tank capacity from 3 to 5 fish", icon: "assets/Icons/tank_expansion.png", category: "Upgrade" },
            { name: "Fishing Net", price: 75000, desc: "20% chance to catch a second fish per cast", icon: "assets/Icons/fishing_net.png", category: "Upgrade" },
            { name: "Deep Freezer", price: 100000, desc: "Keeps all catches 100% fresh for 3 days (72h) before decay", icon: "assets/Icons/deep_freezer.png", category: "Upgrade" },
            { name: "Fishing Vessel", price: 350000, desc: "Enables offshore fishing & double weight rolls", icon: "assets/Icons/fishing_vessel.png", category: "Upgrade" }
        ];

        shopGrid.innerHTML = shopItems.map(item => `
            <div class="item-card">
                <span class="item-badge rarity-common">${item.category}</span>
                <img src="${item.icon}" class="item-img" alt="${item.name}">
                <div class="item-name">${item.name}</div>
                <div class="item-desc">${item.desc}</div>
                <button class="btn-action btn-gold" onclick="window.buyShopItem('${item.name.replace(/'/g, "\\'")}', ${item.price})">
                    ${item.price === 0 ? 'Free Starting Rod' : 'Buy for 🪙 ' + item.price.toLocaleString() + ' Gold'}
                </button>
            </div>
        `).join('');
    }

    // 6. Crafting Station (With Accurate Ingredient Progress Bars & Active/Disabled "Craft" Button)
    function renderCraftTab() {
        const craftGrid = document.getElementById('craftGrid');
        if (!craftGrid) return;

        // Calculate accurate fish ingredient count in player's Net from master catalog
        const netCatches = (state.userProfile && state.userProfile.netCatches) ? state.userProfile.netCatches : [];
        
        let commonCount = 0;
        let uncommonCount = 0;
        let rareCount = 0;

        netCatches.forEach(c => {
            const specName = c.species ? (c.species.name || c.speciesName || '') : (c.speciesName || '');
            const catalogMatch = MASTER_SPECIES_CATALOG.find(m => m.name.toLowerCase() === specName.toLowerCase());
            const tier = catalogMatch ? catalogMatch.tier.toLowerCase() : (c.species && c.species.rarity ? c.species.rarity.toLowerCase() : 'common');
            const isTrash = catalogMatch ? catalogMatch.isTrash : (c.species && c.species.isTrash);

            if (tier === 'common' || isTrash) commonCount++;
            else if (tier === 'uncommon') uncommonCount++;
            else if (tier === 'rare') rareCount++;
        });

        // Crafting recipes: Standard=4 Common | Power=6 Uncommon | Super=5 Rare
        const recipes = [
            {
                id: "standard",
                name: "Standard Bait",
                reqTier: "Common",
                requiredCount: 4,
                currentCount: commonCount,
                desc: "2x odds for anything above Common",
                icon: "assets/baits/standard_bait.png"
            },
            {
                id: "power",
                name: "Power Bait",
                reqTier: "Uncommon",
                requiredCount: 6,
                currentCount: uncommonCount,
                desc: "2x odds for anything above Uncommon",
                icon: "assets/baits/power_bait.png"
            },
            {
                id: "super",
                name: "Super Bait",
                reqTier: "Rare",
                requiredCount: 5,
                currentCount: rareCount,
                desc: "Guarantees anything above Uncommon",
                icon: "assets/baits/super_bait.png"
            }
        ];

        craftGrid.innerHTML = recipes.map(r => {
            const isReady = r.currentCount >= r.requiredCount;
            const pct = Math.min(100, Math.floor((r.currentCount / r.requiredCount) * 100));

            return `
                <div class="item-card" style="align-items: stretch; text-align: left;">
                    <div style="display:flex; align-items:center; gap: 14px;">
                        <img src="${r.icon}" class="item-img" alt="${r.name}">
                        <div style="flex:1;">
                            <div class="item-name">${r.name}</div>
                            <div class="item-desc" style="margin-top:2px;">${r.desc}</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 12px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">
                            <span>Ingredients: ${r.currentCount} / ${r.requiredCount} ${r.reqTier} Fish</span>
                            <span style="color: ${isReady ? 'var(--accent-emerald)' : 'var(--accent-cyan)'};">${pct}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill ${isReady ? 'complete' : ''}" style="width: ${pct}%;"></div>
                        </div>
                    </div>

                    <button class="btn-action ${isReady ? 'btn-gold' : ''}" 
                        onclick="window.craftBait('${r.id}')"
                        style="margin-top: 14px; ${!isReady ? 'opacity: 0.45; cursor: not-allowed; background: var(--bg-secondary); border: 1px solid var(--border-color);' : ''}" 
                        ${!isReady ? 'disabled' : ''}>
                        Craft
                    </button>
                </div>
            `;
        }).join('');
    }

    // 7. Leaderboards (With Sub-Tabs: Catches, Trophy, Richest, Battles Won)
    async function renderRanksTab() {
        const ranksGrid = document.getElementById('ranksGrid');
        if (!ranksGrid) return;

        const activeSub = state.activeRankSubTab || 'catches';

        const subTabsNavHtml = `
            <div style="display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap;">
                <button class="filter-btn ${activeSub === 'catches' ? 'active' : ''}" onclick="window.setRankSubTab('catches')">🎣 Total Catches</button>
                <button class="filter-btn ${activeSub === 'trophies' ? 'active' : ''}" onclick="window.setRankSubTab('trophies')">🏆 Trophy Records</button>
                <button class="filter-btn ${activeSub === 'gold' ? 'active' : ''}" onclick="window.setRankSubTab('gold')">🪙 Most Richest</button>
                <button class="filter-btn ${activeSub === 'battles' ? 'active' : ''}" onclick="window.setRankSubTab('battles')">⚔️ Battles Won</button>
            </div>
        `;

        if (!ranksGrid.dataset.loaded) {
            ranksGrid.innerHTML = subTabsNavHtml + `
                <div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">
                    🔄 Loading Leaderboard...
                </div>
            `;
        }

        try {
            const [catchesRes, trophiesRes, goldRes, battlesRes] = await Promise.all([
                fetch(`${window.CONFIG.API_BASE_URL}/api/Leaderboard/catches`).catch(() => null),
                fetch(`${window.CONFIG.API_BASE_URL}/api/Leaderboard/trophies`).catch(() => null),
                fetch(`${window.CONFIG.API_BASE_URL}/api/Leaderboard/gold`).catch(() => null),
                fetch(`${window.CONFIG.API_BASE_URL}/api/Leaderboard/battles`).catch(() => null)
            ]);

            const catchesData = (catchesRes && catchesRes.ok) ? await catchesRes.json() : [
                { username: "SteveRoars", totalCatches: 412 },
                { username: "AnglerPro", totalCatches: 289 },
                { username: "FishMaster99", totalCatches: 175 }
            ];

            const trophiesData = (trophiesRes && trophiesRes.ok) ? await trophiesRes.json() : [
                { holderUsername: "SteveRoars", speciesName: "SteveRoars Hatchling", heaviestWeight: 6907.5 },
                { holderUsername: "LegendaryAngler", speciesName: "Golden Carp", heaviestWeight: 2450.0 },
                { holderUsername: "DeepSeaKing", speciesName: "Trident Kraken", heaviestWeight: 1840.2 }
            ];

            const goldData = (goldRes && goldRes.ok) ? await goldRes.json() : [
                { username: "SteveRoars", gold: 520000 },
                { username: "RichAngler", gold: 340000 },
                { username: "GoldCollector", gold: 185000 }
            ];

            const battlesData = (battlesRes && battlesRes.ok) ? await battlesRes.json() : [
                { username: "SteveRoars", battlesWon: 48 },
                { username: "BattleChamp", battlesWon: 32 },
                { username: "FishFighter", battlesWon: 19 }
            ];

            let cardContentHtml = '';

            if (activeSub === 'catches') {
                cardContentHtml = `
                    <div class="item-card" style="align-items: stretch; text-align: left;">
                        <h3 style="margin-bottom: 12px; display:flex; align-items:center; gap:8px;">
                            <span>🎣</span> Total Catches Leaderboard
                        </h3>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">Most fish caught overall in channel</div>
                        ${catchesData.map((row, idx) => `
                            <div style="display:flex; justify-content:space-between; padding: 10px 0; border-bottom: 1px solid var(--border-glass);">
                                <span><b>${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#' + (idx + 1)} ${row.username || row.holderUsername || 'Angler'}</b></span>
                                <span style="color: var(--accent-cyan); font-weight:700;">${(row.totalCatches || 0).toLocaleString()} Catches</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (activeSub === 'trophies') {
                cardContentHtml = `
                    <div class="item-card" style="align-items: stretch; text-align: left;">
                        <h3 style="margin-bottom: 12px; display:flex; align-items:center; gap:8px;">
                            <span>🏆</span> Trophy Records Leaderboard
                        </h3>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">Heaviest record fish caught overall in channel</div>
                        ${trophiesData.map((row, idx) => `
                            <div style="display:flex; justify-content:space-between; padding: 10px 0; border-bottom: 1px solid var(--border-glass);">
                                <div>
                                    <b>${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#' + (idx + 1)} ${row.holderUsername || row.username || 'Angler'}</b><br>
                                    <span style="font-size:0.78rem; color:var(--text-muted);">${row.speciesName || 'Fish Record'}</span>
                                </div>
                                <span style="color: var(--accent-gold); font-weight:700;">${(row.heaviestWeight || 0).toFixed(1)} lbs</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (activeSub === 'gold') {
                cardContentHtml = `
                    <div class="item-card" style="align-items: stretch; text-align: left;">
                        <h3 style="margin-bottom: 12px; display:flex; align-items:center; gap:8px;">
                            <span>🪙</span> Most Richest Leaderboard
                        </h3>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">Most Gold overall in channel</div>
                        ${goldData.map((row, idx) => `
                            <div style="display:flex; justify-content:space-between; padding: 10px 0; border-bottom: 1px solid var(--border-glass);">
                                <span><b>${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#' + (idx + 1)} ${row.username || 'Angler'}</b></span>
                                <span style="color: var(--accent-gold); font-weight:700;">🪙 ${(row.gold || 0).toLocaleString()} Gold</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (activeSub === 'battles') {
                cardContentHtml = `
                    <div class="item-card" style="align-items: stretch; text-align: left;">
                        <h3 style="margin-bottom: 12px; display:flex; align-items:center; gap:8px;">
                            <span>⚔️</span> Battles Won Leaderboard
                        </h3>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">Most victories overall in fish battles</div>
                        ${battlesData.map((row, idx) => `
                            <div style="display:flex; justify-content:space-between; padding: 10px 0; border-bottom: 1px solid var(--border-glass);">
                                <span><b>${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#' + (idx + 1)} ${row.username || 'Angler'}</b></span>
                                <span style="color: var(--accent-emerald); font-weight:700;">${(row.battlesWon || 0).toLocaleString()} Wins</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            ranksGrid.innerHTML = subTabsNavHtml + cardContentHtml;
            ranksGrid.dataset.loaded = 'true';
        } catch (err) {
            console.error("Error loading leaderboards:", err);
        }
    }

    window.setRankSubTab = function(subTab) {
        state.activeRankSubTab = subTab;
        renderRanksTab();
    };

    // 8. Fish Encyclopedia (Discovered Species Count, Full Color Images on Discovery)
    function renderLogTab() {
        const logGrid = document.getElementById('logGrid');
        if (!logGrid) return;

        const caughtStats = (state.userProfile && state.userProfile.caughtStats) ? state.userProfile.caughtStats : {};

        // Build comprehensive set of discovered species names
        const discoveredMap = new Map();

        if (state.userProfile) {
            if (state.userProfile.caughtStats) {
                Object.entries(state.userProfile.caughtStats).forEach(([k, v]) => {
                    discoveredMap.set(k.toLowerCase(), v);
                });
            }

            const checkAdd = (name, weight = null) => {
                if (!name) return;
                const key = name.toLowerCase();
                if (!discoveredMap.has(key)) {
                    discoveredMap.set(key, { timesCaught: 1, heaviestWeight: weight || 1.0 });
                }
            };

            if (state.userProfile.netCatches) {
                state.userProfile.netCatches.forEach(c => {
                    const n = c.species ? (c.species.name || c.speciesName) : c.speciesName;
                    checkAdd(n, c.weight);
                });
            }

            if (state.userProfile.tankFish) {
                state.userProfile.tankFish.forEach(f => {
                    const n = f.species ? (f.species.name || f.speciesName) : f.speciesName;
                    checkAdd(n, f.weight);
                });
            }

            if (state.userProfile.caughtSpecies && Array.isArray(state.userProfile.caughtSpecies)) {
                state.userProfile.caughtSpecies.forEach(s => checkAdd(String(s)));
            }
        }

        const totalItems = MASTER_SPECIES_CATALOG.length; // 148
        const discoveredCount = MASTER_SPECIES_CATALOG.filter(item => discoveredMap.has(item.name.toLowerCase())).length;
        const discoveredPct = ((discoveredCount / totalItems) * 100).toFixed(1);

        const commonCount = MASTER_SPECIES_CATALOG.filter(i => i.tier === 'Common').length;
        const uncommonCount = MASTER_SPECIES_CATALOG.filter(i => i.tier === 'Uncommon').length;
        const rareCount = MASTER_SPECIES_CATALOG.filter(i => i.tier === 'Rare').length;
        const legendaryCount = MASTER_SPECIES_CATALOG.filter(i => i.tier === 'Legendary').length;
        const mythicalCount = MASTER_SPECIES_CATALOG.filter(i => i.tier === 'Mythical').length;
        const divineCount = MASTER_SPECIES_CATALOG.filter(i => i.tier === 'Divine').length;

        // Top Summary Header + Filter Bar HTML
        const summaryHeaderHtml = `
            <div style="grid-column: 1/-1; background: var(--bg-glass); border: 1px solid var(--border-glass); padding: 16px 20px; border-radius: var(--radius-lg); margin-bottom: 12px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px;">
                <div>
                    <div style="font-size: 1.15rem; font-weight: 700; color: #fff;">📖 Species & Trash Encyclopedia</div>
                    <div style="font-size: 0.92rem; color: var(--accent-gold); font-weight: 700; margin-top: 3px;">
                        Discovered: <span style="color: var(--accent-cyan); font-weight: 800;">${discoveredCount} / ${totalItems} Species</span> (${discoveredPct}%)
                    </div>
                </div>
            </div>
            <div class="filter-bar" style="grid-column: 1/-1;">
                <button class="filter-btn ${state.activeLogFilter === 'all' ? 'active' : ''}" onclick="window.setLogFilter('all')">All (${totalItems})</button>
                <button class="filter-btn ${state.activeLogFilter === 'Common' ? 'active' : ''}" onclick="window.setLogFilter('Common')">Common (${commonCount})</button>
                <button class="filter-btn ${state.activeLogFilter === 'Uncommon' ? 'active' : ''}" onclick="window.setLogFilter('Uncommon')">Uncommon (${uncommonCount})</button>
                <button class="filter-btn ${state.activeLogFilter === 'Rare' ? 'active' : ''}" onclick="window.setLogFilter('Rare')">Rare (${rareCount})</button>
                <button class="filter-btn ${state.activeLogFilter === 'Legendary' ? 'active' : ''}" onclick="window.setLogFilter('Legendary')">Legendary (${legendaryCount})</button>
                <button class="filter-btn ${state.activeLogFilter === 'Mythical' ? 'active' : ''}" onclick="window.setLogFilter('Mythical')">Mythical (${mythicalCount})</button>
                <button class="filter-btn ${state.activeLogFilter === 'Divine' ? 'active' : ''}" onclick="window.setLogFilter('Divine')">Divine (${divineCount})</button>
            </div>
        `;

        const filteredList = MASTER_SPECIES_CATALOG.filter(item => {
            if (state.activeLogFilter === 'all') return true;
            return item.tier === state.activeLogFilter;
        });

        const cardsHtml = filteredList.map(item => {
            const stat = discoveredMap.get(item.name.toLowerCase());
            const isDiscovered = !!stat;
            const rarityClass = (item.tier || 'common').toLowerCase();

            let statTextHtml = '';
            if (isDiscovered) {
                const timesCaught = stat.timesCaught || 1;
                const heaviestW = stat.heaviestWeight ? (typeof stat.heaviestWeight === 'number' ? stat.heaviestWeight.toFixed(1) + ' lbs' : stat.heaviestWeight) : '1.0 lbs';
                statTextHtml = `Caught: <strong>x${timesCaught}</strong> | Heaviest: <strong>${heaviestW}</strong>`;
            } else {
                statTextHtml = `<span style="color: var(--text-muted);">Undiscovered</span>`;
            }

            return `
                <div class="log-card">
                    <span class="item-badge rarity-${rarityClass}">${item.tier}</span>
                    <div class="log-img-box">
                        <img src="${item.asset}" class="log-fish-img ${isDiscovered ? '' : 'undiscovered'}" alt="${item.name}">
                    </div>
                    <div class="item-name">${isDiscovered ? item.name : '??? Undiscovered'}</div>
                    <div class="log-stats">
                        ${statTextHtml}
                    </div>
                </div>
            `;
        }).join('');

        logGrid.innerHTML = summaryHeaderHtml + cardsHtml;
    }

    window.setLogFilter = function(filter) {
        state.activeLogFilter = filter;
        renderLogTab();
    };

    // Event Listeners & UI Helpers
    function setupEventListeners() {
        const loginBtn = document.getElementById('btnTwitchLogin');
        if (loginBtn) loginBtn.addEventListener('click', loginWithTwitch);

        const logoutBtn = document.getElementById('btnLogout');
        if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
    }

    function updateUserHeaderUI() {
        const loggedOutContainer = document.getElementById('loggedOutContainer');
        const loggedInContainer = document.getElementById('loggedInContainer');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');

        if (state.currentUser) {
            if (loggedOutContainer) loggedOutContainer.style.display = 'none';
            if (loggedInContainer) loggedInContainer.style.display = 'flex';
            if (userAvatar) userAvatar.src = state.currentUser.profileImage || 'assets/Icons/sr.png';
            if (userName) userName.textContent = state.currentUser.displayName || state.currentUser.username;
        } else {
            if (loggedOutContainer) loggedOutContainer.style.display = 'block';
            if (loggedInContainer) loggedInContainer.style.display = 'none';
        }
    }

    function renderLoggedOutState() {
        updateUserHeaderUI();
    }

    function startAutoSync() {
        if (state.syncTimer) clearInterval(state.syncTimer);
        state.syncTimer = setInterval(fetchUserProfile, window.CONFIG.SYNC_INTERVAL_MS);
    }

    // Global action bindings (with custom modal popups and immediate local state persistence)
    window.sellFish = async function(fishId, sellPrice, specName) {
        if (!state.userProfile) return;

        try {
            const res = await fetch(`${window.CONFIG.API_BASE_URL}/api/net/sell-one`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: state.userProfile.id, catchId: fishId })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.newGold !== undefined) state.userProfile.gold = data.newGold;
            } else {
                state.userProfile.gold = (state.userProfile.gold || 0) + (sellPrice || 0);
            }
        } catch (err) {
            state.userProfile.gold = (state.userProfile.gold || 0) + (sellPrice || 0);
        }

        // Remove item from local state and re-render
        if (state.userProfile.netCatches) {
            state.userProfile.netCatches = state.userProfile.netCatches.filter(i => String(i.id) !== String(fishId));
        }
        renderProfileData();
        window.showAppModal({
            icon: '💰',
            title: 'Fish Sold!',
            message: `Successfully sold ${specName} for 🪙 ${sellPrice.toLocaleString()} Gold!`
        });
    };

    window.sellAllNetCatches = async function() {
        if (!state.userProfile || !state.userProfile.netCatches || state.userProfile.netCatches.length === 0) return;

        let totalValue = 0;
        state.userProfile.netCatches.forEach(item => {
            const specName = item.species ? (item.species.name || item.speciesName || '') : '';
            const catalogMatch = MASTER_SPECIES_CATALOG.find(c => c.name.toLowerCase() === specName.toLowerCase());
            const basePrice = catalogMatch ? (catalogMatch.isTrash ? 5 : catalogMatch.basePrice) : 10;
            const qualityMult = item.qualityMultiplier || 1.0;
            totalValue += Math.max(1, Math.floor(basePrice * qualityMult));
        });

        try {
            const res = await fetch(`${window.CONFIG.API_BASE_URL}/api/net/sell-all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: state.userProfile.id })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.newGold !== undefined) state.userProfile.gold = data.newGold;
            } else {
                state.userProfile.gold = (state.userProfile.gold || 0) + totalValue;
            }
        } catch (err) {
            state.userProfile.gold = (state.userProfile.gold || 0) + totalValue;
        }

        const count = state.userProfile.netCatches.length;
        state.userProfile.netCatches = [];
        renderProfileData();
        window.showAppModal({
            icon: '💰',
            title: 'Net Emptied!',
            message: `Sold all ${count} catches from your Fishing Net for 🪙 ${totalValue.toLocaleString()} Gold!`
        });
    };

    window.buyShopItem = async function(itemName, price) {
        if (!state.userProfile) return;

        if (price > 0 && (state.userProfile.gold || 0) < price) {
            window.showAppModal({
                icon: '⚠️',
                title: 'Insufficient Gold',
                message: `You need 🪙 ${price.toLocaleString()} Gold to purchase ${itemName}.`
            });
            return;
        }

        if (price > 0) {
            state.userProfile.gold = (state.userProfile.gold || 0) - price;
        }

        const nameLower = itemName.toLowerCase();

        if (nameLower.includes('rod')) {
            state.userProfile.activeRod = itemName;
        } else if (nameLower.includes('tank upgrade')) {
            state.userProfile.tankCapacity = 5;
        } else if (nameLower.includes('auto-feeder')) {
            state.userProfile.hasAutoFeeder = true;
        } else if (nameLower.includes('deep freezer')) {
            state.userProfile.hasDeepFreezer = true;
        } else if (nameLower.includes('fishing vessel')) {
            state.userProfile.hasFishingVessel = true;
        } else if (nameLower.includes('fishing net')) {
            state.userProfile.hasFishingNet = true;
        } else {
            if (!state.userProfile.inventoryItems) state.userProfile.inventoryItems = [];
            const existing = state.userProfile.inventoryItems.find(i => (i.itemName || i.name || '').toLowerCase() === nameLower);
            if (existing) existing.quantity++;
            else state.userProfile.inventoryItems.push({ itemName: itemName, quantity: 1 });
        }

        try {
            await fetch(`${window.CONFIG.API_BASE_URL}/api/shop/buy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: state.userProfile.id, itemName: itemName })
            });
        } catch (err) {
            console.warn('API buy fallback:', err);
        }

        renderProfileData();
        window.showAppModal({
            icon: '🛍️',
            title: 'Purchase Successful!',
            message: `Successfully purchased ${itemName} for 🪙 ${price.toLocaleString()} Gold!`
        });
    };

    window.craftBait = async function(baitId) {
        if (!state.userProfile) return;

        const baitName = baitId === 'super' ? 'Super Bait' : baitId === 'power' ? 'Power Bait' : 'Standard Bait';
        const targetTier = baitId === 'super' ? 'rare' : baitId === 'power' ? 'uncommon' : 'common';
        const reqCount = baitId === 'super' ? 5 : baitId === 'power' ? 6 : 4;

        // Perform local craft update first
        if (state.userProfile.netCatches) {
            let removed = 0;
            state.userProfile.netCatches = state.userProfile.netCatches.filter(item => {
                const specName = item.species ? (item.species.name || item.speciesName || '') : '';
                const catalogMatch = MASTER_SPECIES_CATALOG.find(c => c.name.toLowerCase() === specName.toLowerCase());
                const tier = catalogMatch ? catalogMatch.tier.toLowerCase() : (item.species && item.species.rarity ? item.species.rarity.toLowerCase() : 'common');
                const isTrash = catalogMatch ? catalogMatch.isTrash : (item.species && item.species.isTrash);
                const matchesTier = (targetTier === 'common' && (tier === 'common' || isTrash)) || (tier === targetTier);

                if (matchesTier && removed < reqCount) {
                    removed++;
                    return false;
                }
                return true;
            });
        }

        if (!state.userProfile.inventoryItems) state.userProfile.inventoryItems = [];
        const existingInv = state.userProfile.inventoryItems.find(i => i.itemName === baitName);
        if (existingInv) existingInv.quantity++;
        else state.userProfile.inventoryItems.push({ itemName: baitName, quantity: 1 });

        try {
            await fetch(`${window.CONFIG.API_BASE_URL}/api/craft/craft-bait`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: state.userProfile.id, baitType: baitId })
            });
        } catch (err) {
            console.warn("API craft fallback:", err);
        }

        renderProfileData();
        window.showAppModal({
            icon: '⚒️',
            title: 'Bait Crafted!',
            message: `Successfully crafted x1 ${baitName}! Saved in your Inventory. Auto-equipped on next cast!`
        });
    };

    window.feedTank = async function() {
        if (!state.userProfile) return;
        const feedCost = 1000;
        if (state.userProfile.gold < feedCost) {
            window.showAppModal({
                icon: '⚠️',
                title: 'Insufficient Gold',
                message: `Feeding the tank requires 🪙 ${feedCost.toLocaleString()} Gold.`
            });
            return;
        }

        try {
            const res = await fetch(`${window.CONFIG.API_BASE_URL}/api/tank/feed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: state.userProfile.id })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.newGold !== undefined) state.userProfile.gold = data.newGold;
            } else {
                state.userProfile.gold -= feedCost;
            }
        } catch (err) {
            state.userProfile.gold -= feedCost;
        }

        state.userProfile.lastFedAt = new Date().toISOString();
        renderProfileData();
        window.showAppModal({
            icon: '🥣',
            title: 'Aquarium Fed!',
            message: 'Tank fish fed! 12-hour starvation timer reset. Passive HP regeneration active!'
        });
    };

    window.sendToTank = async function(catchId, specName) {
        if (!state.userProfile) return;
        const tankFish = state.userProfile.tankFish || [];
        const capacity = state.userProfile.tankCapacity || 3;
        if (tankFish.length >= capacity) {
            window.showAppModal({
                icon: '🚫',
                title: 'Tank Full',
                message: `Your Aquarium Tank is full (${tankFish.length}/${capacity} slots used). Sell a fish first.`
            });
            return;
        }

        const netCatches = state.userProfile.netCatches || [];
        const fish = netCatches.find(c => String(c.id) === String(catchId));
        if (fish) {
            state.userProfile.netCatches = netCatches.filter(c => String(c.id) !== String(catchId));
            if (!state.userProfile.tankFish) state.userProfile.tankFish = [];
            state.userProfile.tankFish.push(fish);
        }

        try {
            await fetch(`${window.CONFIG.API_BASE_URL}/api/tank/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: state.userProfile.id, catchId: catchId })
            });
        } catch (err) {
            console.warn('Transfer to tank API fallback:', err);
        }

        renderProfileData();
        window.showAppModal({
            icon: '🐠',
            title: 'Transferred to Tank',
            message: `${specName} was transferred into your Aquarium Tank!`
        });
    };

    window.sellTankFish = async function(fishId, sellPrice, specName) {
        if (!state.userProfile) return;

        window.showAppModal({
            icon: '💰',
            title: 'Sell Tank Fish?',
            message: `Are you sure you want to sell ${specName} from your tank for 🪙 ${sellPrice.toLocaleString()} Gold?`,
            confirmText: 'Sell Fish',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    const res = await fetch(`${window.CONFIG.API_BASE_URL}/api/tank/sell`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: state.userProfile.id, fishId: fishId })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.newGold !== undefined) state.userProfile.gold = data.newGold;
                    } else {
                        state.userProfile.gold = (state.userProfile.gold || 0) + sellPrice;
                    }
                } catch (err) {
                    state.userProfile.gold = (state.userProfile.gold || 0) + sellPrice;
                }

                state.userProfile.tankFish = (state.userProfile.tankFish || []).filter(f => String(f.id) !== String(fishId));
                renderProfileData();
                window.showAppModal({
                    icon: '🪙',
                    title: 'Fish Sold',
                    message: `Sold ${specName} for 🪙 ${sellPrice.toLocaleString()} Gold!`
                });
            }
        });
    };

    window.launchFishBattle = function() {
        const tankFish = (state.userProfile && state.userProfile.tankFish) ? state.userProfile.tankFish : [];
        if (tankFish.length === 0) {
            alert("Your aquarium tank has no fish! Transfer a fish from your Fishing Net into your Tank to enter battles.");
            return;
        }

        const myFish = tankFish[0];
        const mySpecName = myFish.species ? (myFish.species.name || myFish.speciesName || 'Golden Carp') : (myFish.speciesName || 'Golden Carp');
        const catalogMatch = MASTER_SPECIES_CATALOG.find(c => c.name.toLowerCase() === mySpecName.toLowerCase());
        const myAsset = catalogMatch ? catalogMatch.asset : 'assets/fish/legendary/golden_carp.png';
        const myHpMax = myFish.maxHp || 120;
        let myCurHp = myHpMax;
        const myAtk = myFish.atk || 35;

        // Enemy Boss
        const bosses = [
            { name: "Abyssal Leviathan", hp: 160, atk: 28, asset: "assets/fish/mythical/abyssal_dragon.png" },
            { name: "Phantom Kraken", hp: 190, atk: 32, asset: "assets/fish/mythical/ethereal_kraken.png" },
            { name: "Golden Dragonfish", hp: 140, atk: 38, asset: "assets/fish/legendary/golden_dragonfish.png" }
        ];
        const boss = bosses[Math.floor(Math.random() * bosses.length)];
        let bossCurHp = boss.hp;

        // Modal Overlay
        const overlay = document.createElement('div');
        overlay.className = 'battle-overlay';
        overlay.id = 'battleModalOverlay';

        overlay.innerHTML = `
            <div class="battle-arena-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h2 style="font-size:1.4rem; font-weight:800; color:var(--accent-cyan);">⚔️ RPG Fish Battle Arena</h2>
                    <span style="font-size:0.85rem; color:var(--text-muted);">Stream Fishing RPG Combat Theater</span>
                </div>

                <div class="battle-theater">
                    <!-- My Champion -->
                    <div class="combatant-card">
                        <span class="item-badge rarity-legendary">YOUR CHAMPION</span>
                        <img id="playerFishImg" src="${myAsset}" class="combatant-img" alt="${mySpecName}">
                        <div style="font-weight:700; font-size:1.1rem; color:#fff;">${myFish.nickname || mySpecName}</div>
                        <div style="width:100%; max-width:200px;">
                            <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; margin-bottom:4px;">
                                <span style="color:var(--text-secondary);">HP:</span>
                                <span id="playerHpTxt" style="color:var(--accent-emerald);">${myCurHp} / ${myHpMax}</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div id="playerHpFill" class="progress-bar-fill complete" style="width:100%;"></div>
                            </div>
                        </div>
                    </div>

                    <div class="battle-vs-badge">VS</div>

                    <!-- Enemy Boss -->
                    <div class="combatant-card">
                        <span class="item-badge rarity-divine">OCEAN BOSS</span>
                        <img id="bossFishImg" src="${boss.asset}" class="combatant-img" alt="${boss.name}">
                        <div style="font-weight:700; font-size:1.1rem; color:#fff;">${boss.name}</div>
                        <div style="width:100%; max-width:200px;">
                            <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; margin-bottom:4px;">
                                <span style="color:var(--text-secondary);">HP:</span>
                                <span id="bossHpTxt" style="color:var(--accent-rose);">${bossCurHp} / ${boss.hp}</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div id="bossHpFill" class="progress-bar-fill" style="width:100%; background:linear-gradient(90deg,#f43f5e,#fb7185);"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="battle-log-box" id="battleLogBox">
                    <div style="color:var(--accent-cyan); font-weight:700;">⚔️ Battle started! ${mySpecName} engages ${boss.name}...</div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:12px;" id="battleFooter">
                    <button class="btn-action btn-gold" id="btnAutoBattle" style="width:auto; padding:10px 28px; font-weight:800;">
                        🔥 Fight Battle!
                    </button>
                    <button class="btn-action" style="width:auto; padding:10px 20px; background:rgba(255,255,255,0.1);" onclick="document.getElementById('battleModalOverlay').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const btnFight = document.getElementById('btnAutoBattle');
        btnFight.addEventListener('click', async () => {
            btnFight.disabled = true;
            btnFight.style.opacity = '0.5';

            const logBox = document.getElementById('battleLogBox');
            const playerImg = document.getElementById('playerFishImg');
            const bossImg = document.getElementById('bossFishImg');

            let turn = 1;

            const fightLoop = setInterval(() => {
                if (myCurHp <= 0 || bossCurHp <= 0) {
                    clearInterval(fightLoop);
                    
                    const win = myCurHp > 0;
                    if (win) {
                        logBox.innerHTML += `<div style="color:var(--accent-gold); font-weight:800; font-size:0.95rem;">🏆 VICTORY! Your ${mySpecName} defeated ${boss.name}! Rewarded 🪙 2,500 Gold & +1 Battle Win!</div>`;
                        state.userProfile.gold = (state.userProfile.gold || 0) + 2500;
                        renderProfileData();
                    } else {
                        logBox.innerHTML += `<div style="color:var(--accent-rose); font-weight:800; font-size:0.95rem;">💀 FAINTED! ${mySpecName} was fainted in combat! Use Recovery Meds to revive.</div>`;
                    }
                    logBox.scrollTop = logBox.scrollHeight;
                    return;
                }

                if (turn % 2 === 1) {
                    // Player attacks
                    playerImg.classList.add('attack-lunge-right');
                    setTimeout(() => playerImg.classList.remove('attack-lunge-right'), 400);

                    const isCrit = Math.random() < 0.25;
                    const dmg = Math.floor((myAtk + Math.random() * 12) * (isCrit ? 1.5 : 1.0));
                    bossCurHp = Math.max(0, bossCurHp - dmg);

                    const bossPct = Math.floor((bossCurHp / boss.hp) * 100);
                    document.getElementById('bossHpTxt').textContent = `${bossCurHp} / ${boss.hp}`;
                    document.getElementById('bossHpFill').style.width = `${bossPct}%`;

                    logBox.innerHTML += `<div>⚔️ Turn ${turn}: <b>${mySpecName}</b> attacks ${boss.name} for <span style="color:var(--accent-gold); font-weight:700;">${dmg} HP</span> ${isCrit ? '🔥 CRITICAL HIT!' : ''}</div>`;
                } else {
                    // Boss attacks
                    bossImg.classList.add('attack-lunge-left');
                    setTimeout(() => bossImg.classList.remove('attack-lunge-left'), 400);

                    const dmg = Math.floor(boss.atk + Math.random() * 10);
                    myCurHp = Math.max(0, myCurHp - dmg);

                    const playerPct = Math.floor((myCurHp / myHpMax) * 100);
                    document.getElementById('playerHpTxt').textContent = `${myCurHp} / ${myHpMax}`;
                    document.getElementById('playerHpFill').style.width = `${playerPct}%`;

                    logBox.innerHTML += `<div>💥 Turn ${turn}: <b>${boss.name}</b> strikes back for <span style="color:var(--accent-rose); font-weight:700;">${dmg} HP</span>!</div>`;
                }

                logBox.scrollTop = logBox.scrollHeight;
                turn++;
            }, 600);
        });
    };
});
