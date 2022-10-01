import fetch from 'node-fetch';
import Mods from '../Shared/Mods.js';

class ppv2 {
    accuracy = 1.00;
    mods = [];
    mods_enabled = 0;
    #DIFF_MODS = [];
    #beatmap_api = "https://osu.lea.moe";

    constructor(params) {
        if (params.beatmap_api != null) {
            try {
                new URL(beatmap_api);

                this.beatmap_api = beatmap_api;
            } catch(e) {
                throw new Error("Not a valid URL");
            }
        }

        if (Array.isArray(params.diff_mods)) {
            this.#DIFF_MODS = params.diff_mods;
        }
    }

    /** 
     * Set beatmap
     * @param {string|number} beatmap_id
     * @returns {ppv2}
     */
    setBeatmap(beatmap_id) {
        this.beatmap_id = beatmap_id;

        return this;
    }

    async fetchBeatmap() {
        if (this.beatmap_id == null) {
            throw new Error("No Beatmap ID given");
        }

        try {
            const response = await fetch(`${this.#beatmap_api}/b/${this.beatmap_id}?mode=${this.mode}`);
            const { beatmap, difficulty } = await response.json();

            return { beatmap, difficulty };
        } catch(e) {
            console.error(e);
            throw new Error("Failed fetching beatmap");
        }
    }

    async fetchDifficulty() {
        this.setDifficulty(await this.fetchBeatmap());
    }

    /**
     * Set mods.
     * @param {any} mods_enabled Mods
     * @returns {ppv2}
     */
    setMods(mods_enabled) {
        const mods = new Mods(mods_enabled);
        this.mods = mods.list;
        this.mods_enabled = mods.value ?? 0;

        // Only include Hidden in the diff_mods together with Flashlight
        if (mods.list.includes('Hidden') && !mods.list.includes('Flashlight')) {
            mods.list = mods.list.filter(m => m !== 'Hidden')
        }

        const diff_mods = new Mods(mods.list.filter(a => this.#DIFF_MODS.includes(a)));

        this.mods_enabled_diff = diff_mods.value ?? 0;

        return this;
    }
}

export default ppv2;
