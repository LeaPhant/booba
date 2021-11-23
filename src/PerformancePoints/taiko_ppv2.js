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
        const lengthBonus = 1 + 0.1 * Math.min(1.0, this.totalHits() / 1500.0);

        let value = Math.pow(5.0 * Math.max(1.0, this.diff.total / 0.0075) - 4.0, 2.0) / 100000.0;

        value *= lengthBonus;
        value *= Math.pow(0.985, this.nmiss);

        if (this.mods.includes('Hidden')) {
            value *= 1.025;
        }

        if (this.mods.includes('Flashlight')) {
            value *= 1.05 * lengthBonus;
        }

        value *= this.accuracy;

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

        let value = Math.pow(150.0 / this.diff.hit_window_300, 1.1) * Math.pow(this.accuracy, 15) * 22.0;
        value *= Math.min(1.15, Math.pow(this.totalHits() / 1500.0, 0.3));

        return value;
    }

    /**
     * Compute total pp from separate skills
     * @param {object} pp Object with pp values for all skills
     * @returns {number}
     */
    computeTotal(pp) {
        let multiplier = 1.1;

        if (this.mods.includes('NoFail')) {
            multiplier *= 0.90;
        }

        if (this.mods.includes('Hidden')) {
            multiplier *= 1.10;
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
        const n300 = this.n300, nmiss = this.nmiss

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
