import ppv2 from './ppv2.js';

class taiko_ppv2 extends ppv2 {
    mode = 1;

    constructor() {
        super({ diff_mods: ['HardRock', 'Easy', 'DoubleTime', 'HalfTime'] });
    }

    /**
     * Calculate accuracy
     * @returns {number}
     */
    computeAccuracy() {
        return Math.max(Math.min((this.n100 * 1/2 + this.n300)
        / this.totalHits(), 1), 0);
    }

    /**
     * Calculate total hits
     * @returns {number}
     */
    totalHits() {
        if (!this.total_hits) {
            this.total_hits = this.n300 + this.n100 + this.n50 + this.nmiss;
        }

        return this.total_hits;
    }

    /**
     * Calculate total successful hits
     * @returns {number}
     */
    totalSuccessfulHits() {
        if (!this.total_successful_hits) {
            this.total_successful_hits = this.n300 + this.n100 + this.n50;
        }

        return this.total_successful_hits;
    }

    /**
     * Calculate effective miss count
     * @returns {number}
     */
    effectiveMissCount() {
        return Math.max(1.0, 1000.0 / this.totalSuccessfulHits()) * this.nmiss;
    }

    /**
     * Set player performance.
     * @param {Object} params Information about the play.
     * @param {number} params.count300 
     * @param {number} params.count100 
     * @param {number} params.count50 
     * @param {number} params.countmiss 
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
     * @param {number} params.hit_window_300 300 hit window
     */
    setDifficulty(params) {
        // beatmap api response
        if (params.difficulty != null) {
            params = params.difficulty[this.mods_enabled_diff];
        }

        this.diff = { ...params };

        return this;
    }

    /**
     * Compute strain skill pp
     * @returns {number}
     */
    computeStrainValue() {
        let value = Math.pow(5 * Math.max(1.0, this.diff.total / 0.115) - 4.0, 2.25) / 1150.0;

        const lengthBonus = 1 + 0.1 * Math.min(1.0, this.totalHits() / 1500.0);

        value *= lengthBonus;
        value *= Math.pow(0.986, this.effectiveMissCount());

        if (this.mods.includes('Easy')) {
            value *= 0.985;
        }

        if (this.mods.includes('Hidden')) {
            value *= 1.025;
        }

        if (this.mods.includes('HardRock')) {
            value *= 1.050;
        }

        if (this.mods.includes('Flashlight')) {
            value *= 1.050 * lengthBonus;
        }

        value *= Math.pow(this.accuracy, 2.0);

        return value;
    }

    /**
     * Compute acc skill pp
     * @returns {number}
     */
    computeAccValue() {
        if (this.diff.hit_window_300 <= 0) {
            return 0;
        }

        let value
        = Math.pow(60.0 / this.diff.hit_window_300, 1.1) 
        * Math.pow(this.accuracy, 8.0) 
        * Math.pow(this.diff.total, 0.4) 
        * 27.0;

        const lengthBonus = Math.min(1.15, Math.pow(this.totalHits() / 1500.0, 0.3));
        value *= lengthBonus;

        if (this.mods.includes('Hidden') && this.mods.includes('Flashlight')) {
            value *= Math.max(1.050, 1.075 * lengthBonus);
        }

        return value;
    }

    /**
     * Compute total pp from separate skills
     * @param {object} pp Object with pp values for all skills
     * @returns {number}
     */
    computeTotal(pp) {
        let multiplier = 1.13;

        if (this.mods.includes('Hidden')) {
            multiplier *= 1.075;
        }

        if (this.mods.includes('Easy')) {
            multiplier *= 0.975;
        }        

        let value = Math.pow(
			Math.pow(pp.strain, 1.1) +
			Math.pow(pp.acc, 1.1), 1.0 / 1.1
		) * multiplier;

        return value;
    }

    /**
     * Calculate pp and automatically fetch beatmap difficulty
     * @param {bool} fc Whether to simulate a full combo
     */
    async compute(fc = false) {
        const n300 = this.n300, nmiss = this.nmiss, accuracy = this.accuracy;

        if (this.diff?.total == null) {
            await this.fetchDifficulty();
        }

        if (fc) {
            this.n300 += this.nmiss;
            this.nmiss = 0;
            this.accuracy = this.computeAccuracy();
        }

        const pp = {
            strain: this.computeStrainValue(),
            acc: this.computeAccValue(),
            computed_accuracy: this.accuracy * 100
        };

        pp.total = this.computeTotal(pp);

        if (fc) {
            this.n300 = n300;
            this.nmiss = nmiss;
            this.accuracy = accuracy;

            this.pp_fc = pp;
        } else {
            this.pp = pp;
        }

        return pp;
    }
}

export default taiko_ppv2;
