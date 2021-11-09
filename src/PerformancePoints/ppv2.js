import fetch from 'node-fetch';
import Mods from '../Shared/Mods.js';

class ppv2 {
    accuracy = 1.00;
    mods = [];
    mods_enabled = 0;
    beatmap_api = "https://osu.lea.moe";

    constructor(beatmap_api) {
        if (beatmap_api != null) {
            try {
                new URL(beatmap_api);

                this.beatmap_api = beatmap_api;
            } catch(e) {
                throw new Error("Not a valid URL");
            }
        }
    }

    async fetchBeatmap() {
        if (this.beatmap_id == null) {
            throw new Error("No Beatmap ID given");
        }

        try {
            const response = await fetch(`${this.beatmap_api}/b/${this.beatmap_id}?mode=${this.mode}`);
            const { beatmap, difficulty } = await response.json();

            return { beatmap, difficulty };
        } catch(e) {
            console.error(e);
            throw new Error("Failed fetching beatmap");
        }
    }

    /**
     * Set mods.
     * @param {number} mods_enabled Mods enum value
     */
    setMods(mods_enabled) {
        const mods = new Mods(mods_enabled);
        this.mods = mods.list;
        this.mods_enabled = mods.value ?? 0;

        return this;
    }
}

export default ppv2;
