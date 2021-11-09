import ppv2 from './ppv2.js';

class taiko_ppv2 extends ppv2 {
    computeAccuracy() {
        return Math.max(Math.min((this.n100 * 1/2 + this.n300)
        / this.totalHits(), 1), 0);
    }

    totalHits() {
        if (!this.total_hits) {
            this.total_hits = this.n300 + this.n100 + this.n50 + this.nmiss;
        }

        return this.total_hits;
    }

    /**
     * Set player performance.
     * @param {Object} params Information about the play.
     * @param {number} params.count_300 
     * @param {number} params.count_100 
     * @param {number} params.count_50 
     * @param {number} params.count_miss 
     */
    setPerformance(params) {
        this.n300 = params.count_300;
        this.n100 = params.count_100;
        this.n50 = params.count_50;
        this.nmiss = params.count_miss;

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
        this.diff_total = params.total;
        this.hit_window_300 = params.hit_window_300;

        return this;
    }

    computeStrainValue() {
        const lengthBonus = 1 + 0.1 * Math.min(1.0, this.totalHits() / 1500.0);

        let value = Math.pow(5.0 * Math.max(1.0, this.diff_total / 0.0075) - 4.0, 2.0) / 100000.0;

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

    computeAccValue() {
        if (this.hit_window_300 <= 0) {
            return 0;
        }

        let value = Math.pow(150.0 / this.hit_window_300, 1.1) * Math.pow(this.accuracy, 15) * 22.0;
        value *= Math.min(1.15, Math.pow(this.totalHits() / 1500.0, 0.3));

        return value;
    }

    computeTotal() {
        let multiplier = 1.1;

        if (this.mods.includes('NoFail')) {
            multiplier *= 0.90;
        }

        if (this.mods.includes('Hidden')) {
            multiplier *= 1.10;
        }

        let value = Math.pow(
			Math.pow(this.computeStrainValue(), 1.1) +
			Math.pow(this.computeAccValue(), 1.1), 1.0 / 1.1
		) * multiplier;

        return value;
    }
}

export default taiko_ppv2;
