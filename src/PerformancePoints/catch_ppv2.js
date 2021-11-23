import ppv2 from './ppv2.js';

class catch_ppv2 extends ppv2 {
    mode = 2;

    constructor() {
        super({ diff_mods: ['HardRock', 'Easy', 'DoubleTime', 'HalfTime'] });
    }

    /**
     * Calculate accuracy
     * @returns {number}
     */
    computeAccuracy() {
        return Math.max(Math.min((this.n50 + this.n100 + this.n300)
        / this.totalHits(), 1), 0);
    }

    /**
     * Calculate total hits
     * @returns {number}
     */
    totalHits() {
        if (!this.total_hits) {
            this.total_hits = this.n300 + this.n100 + this.n50 + this.nmiss + this.nkatu;
        }

        return this.total_hits;
    }

    /**
     * Calculate total object count
     * @returns {number}
     */
    totalComboHits() {
        if (!this.total_combo_hits) {
            this.total_combo_hits = this.n300 + this.n100 + this.nmiss;
        }

        return this.total_combo_hits;
    }

    /**
     * Set player performance.
     * @param {Object} params Information about the play.
     * @param {number} params.count300
     * @param {number} params.count100
     * @param {number} params.count50
     * @param {number} params.countmiss
     * @param {number} params.countkatu
     * @param {number} params.maxcombo
     */
    setPerformance(params) {
        // osu! api v1 response
        if (params?.count300 != null) {
            if (params.beatmap_id != null) {
                this.beatmap_id = params.beatmap_id;
            }

            this.n300 = Number(params.count300);
            this.n100 = Number(params.count100);
            this.n50 = Number(params.count50);
            this.nmiss = Number(params.countmiss);
            this.nkatu = Number(params.countkatu);
            this.combo = Number(params.maxcombo);

            this.setMods(Number(params.enabled_mods));
        }

        // osu! api v2 response
        else if (params?.statistics?.count_300 != null) {
            const { statistics } = params;

            this.beatmap_id = params?.beatmap?.id;
            this.n300 = statistics.count_300;
            this.n100 = statistics.count_100;
            this.n50 = statistics.count_50;
            this.nmiss = statistics.count_miss;
            this.nkatu = statistics.count_katu;
            this.combo = params.max_combo;

            this.setMods(params.mods);
        }

        this.total_hits = this.totalHits();
        this.accuracy = this.computeAccuracy();

        return this;
    }

    /**
     * Set the beatmap difficulty attributes.
     * @param {object} params Information about the beatmap
     * @param {number} params.total Total stars
     * @param {number} params.ar Approach rate
     * @param {number} params.max_combo Max combo
     */
    setDifficulty(params) {
        // beatmap api response
        if (params.difficulty != null) {
            params = params.difficulty[this.mods_enabled_diff];

            params.total = params.aim;
        }

        this.diff = { ...params };

        return this;
    }

    /**
     * Compute total pp
     * @returns {number}
     */
    computeTotal() {
        let value = Math.pow(5.0 * Math.max(1.0, this.diff.total / 0.0049) - 4.0, 2.0) / 100000.0;

        const lengthBonus =
		0.95 + 0.3 * Math.min(1.0, this.totalComboHits() / 2500.0) +
		(this.totalComboHits() > 2500 ? Math.log10(this.totalComboHits() / 2500.0) * 0.475 : 0.0);

        value *= lengthBonus;

        value *= Math.pow(0.97, this.nmiss);

        if (this.diff.max_combo > 0) {
            value *= Math.min(Math.pow(this.combo, 0.8) / Math.pow(this.diff.max_combo, 0.8), 1.0);
        }

        let approachRateFactor = 1.0;

        if (this.diff.ar > 9) {
            approachRateFactor += 0.1 * (this.diff.ar - 9.0);
        }

        if (this.diff.ar > 10) {
            approachRateFactor += 0.1 * (this.diff.ar - 10.0);
        }

        if (this.diff.ar < 8) {
            approachRateFactor += 0.025 * (8.0 - this.diff.ar); 
        }

        value *= approachRateFactor;

        if (this.mods.includes('Hidden')) {
            if (this.diff.ar <= 10) {
                value *= 1.05 + 0.075 * (10.0 - this.diff.ar);
            } else if (this.diff.ar > 10) {
                value *= 1.01 + 0.04 * (11.0 - Math.min(11.0, this.diff.ar));
            }
        }

        if (this.mods.includes('Flashlight')) {
            value *= 1.35 * lengthBonus;
        }

        value *= Math.pow(this.accuracy, 5.5);

        if (this.mods.includes('NoFail')) {
            value *= 0.90;
        }

        if (this.mods.includes('SpunOut')) {
            value *= 0.95;  
        }

        return value;
    }

    /**
     * 
     * @param {bool} fc Whether to simulate a full combo
     */
    async compute(fc = false) {
        if (this.diff?.total == null) {
            await this.fetchDifficulty();
        }

        const n300 = this.n300, nmiss = this.nmiss, combo = this.combo, accuracy = this.accuracy;

        if (fc) {
            this.n300 += this.nmiss;
            this.nmiss = 0;
            this.combo = this.diff.max_combo;
            this.accuracy = this.computeAccuracy();
        }

        const pp = {
            total: this.computeTotal(),
            computed_accuracy: this.accuracy * 100
        };

        if (fc) {
            this.n300 = n300;
            this.nmiss = nmiss;
            this.combo = combo;
            this.accuracy = accuracy;

            this.pp_fc = pp;
        } else {
            this.pp = pp;
        }

        return pp;
    }
}

export default catch_ppv2;
