import ppv2 from './ppv2.js';

class catch_ppv2 extends ppv2 {
    computeAccuracy() {
        return Math.max(Math.min((this.n50 + this.n100 + this.n300)
        / this.totalHits(), 1), 0);
    }

    totalHits() {
        if (!this.total_hits) {
            this.total_hits = this.n300 + this.n100 + this.n50 + this.nmiss + this.nkatu;
        }

        return this.total_hits;
    }

    totalComboHits() {
        if (!this.total_combo_hits) {
            this.total_combo_hits = this.n300 + this.n100 + this.nmiss;
        }

        return this.total_combo_hits;
    }

    /**
     * Set player performance.
     * @param {Object} params Information about the play.
     * @param {number} params.count_300
     * @param {number} params.count_100
     * @param {number} params.count_50
     * @param {number} params.count_miss
     * @param {number} params.count_katu
     * @param {number} params.max_combo
     */
    setPerformance(params) {
        this.n300 = params.count_300;
        this.n100 = params.count_100;
        this.n50 = params.count_50;
        this.nmiss = params.count_miss;
        this.nkatu = params.count_katu;
        this.combo = params.max_combo;

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
        this.diff_total = params.total;
        this.ar = params.ar;
        this.max_combo = params.max_combo;

        return this;
    }

    computeTotal() {
        let value = Math.pow(5.0 * Math.max(1.0, this.diff_total / 0.0049) - 4.0, 2.0) / 100000.0;

        const lengthBonus =
		0.95 + 0.3 * Math.min(1.0, this.totalComboHits() / 2500.0) +
		(this.totalComboHits() > 2500 ? Math.log10(this.totalComboHits() / 2500.0) * 0.475 : 0.0);

        value *= lengthBonus;

        value *= Math.pow(0.97, this.nmiss);

        if (this.max_combo > 0) {
            value *= Math.min(Math.pow(this.combo, 0.8) / pow(this.max_combo, 0.8), 1.0);
        }

        let approachRateFactor = 1.0;

        if (this.ar > 9) {
            approachRateFactor += 0.1 * (this.ar - 9.0);
        }

        if (this.ar > 10) {
            approachRateFactor += 0.1 * (this.ar - 10.0);
        }

        if (this.ar < 8) {
            approachRateFactor += 0.025 * (8.0 - this.ar); 
        }

        value *= approachRateFactor;

        if (this.mods.includes('Hidden')) {
            if (this.ar <= 10) {
                value *= 1.05 + 0.075 * (10.0 - this.ar);
            } else if (this.ar > 10) {
                value *= 1.01 + 0.04 * (11.0 - Math.min(11.0, this.ar));
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
}

export default catch_ppv2;
