import ppv2 from './ppv2.js';

class mania_ppv2 extends ppv2 {
    computeAccuracy() {
        return Math.max(Math.min((this.n300 + this.ngeki + this.nkatu * 2/3 + this.n100 * 1/3 + this.n50 * 1/6)
        / this.totalHits(), 1), 0);
    }

    totalHits() {
        if (!this.total_hits) {
            this.total_hits = this.n300 + this.n100 + this.n50 + this.nmiss + this.ngeki + this.nkatu
        }

        return this.total_hits;
    }

    adjustedScore() {
        if (!this.adjusted_score) {
            this.adjusted_score = this.score * (1.0 / this.score_multiplier);
        }

        return this.adjusted_score;
    }

    /**
     * Set player performance.
     * @param {Object} params Information about the play.
     * @param {number} params.count_300 
     * @param {number} params.count_100 
     * @param {number} params.count_50 
     * @param {number} params.count_miss 
     * @param {number} params.count_geki
     * @param {number} params.count_katu
     * @param {number} params.score
     */
    setPerformance(params) {
        this.n300 = params.count_300;
        this.n100 = params.count_100;
        this.n50 = params.count_50;
        this.nmiss = params.count_miss;
        this.ngeki = params.count_geki;
        this.nkatu = params.count_katu;
        this.score = params.score;

        this.total_hits = this.totalHits();
        this.accuracy = this.computeAccuracy();

        return this;
    }

    /**
     * Set the beatmap difficulty attributes.
     * @param {object} params Information about the beatmap
     * @param {number} params.total Total stars
     * @param {number} params.hit_window_300 300 hit window
     * @param {number} params.score_multiplier Score multiplier
     */
    setDifficulty(params) {
        this.diff_total = params.total;
        this.hit_window_300 = params.hit_window_300;
        this.score_multiplier = params.score_multiplier;

        return this;
    }

    computeStrainValue() {
        if (this.score_multiplier <= 0) {
            return 0;
        }

        const score = this.adjustedScore();

        let value = Math.pow(5.0 * Math.max(1.0, this.diff_total / 0.2) - 4.0, 2.2) / 135.0;

        value *= 1 + 0.1 * Math.min(1.0, this.totalHits() / 1500.0);

        if (score <= 500000) {
            value = 0;
        } else if (score <= 600000) {
            value *= (score - 500000) / 100000.0 * 0.3;
        } else if (score <= 700000) {
            value *= 0.3 + (score - 600000) / 100000.0 * 0.25;
        } else if (score <= 800000) {
            value *= 0.55 + (score - 700000) / 100000.0 * 0.20;
        } else if (score <= 900000) {
            value *= 0.75 + (score - 800000) / 100000.0 * 0.15;
        } else {
            value *= 0.90 + (score - 900000) / 100000.0 * 0.1;
        }

        return value;
    }

    computeAccValue() {
        if (this.hit_window_300 <= 0) {
            return 0;
        }
        
        let value = Math.max(0.0, 0.2 - ((this.hit_window_300 - 34) * 0.006667)) * this.diff_total
		* Math.pow((Math.pow(0.0, (this.adjustedScore() - 960000)) / 40000.0), 1.1);

        return value;
    }

    computeTotal() {
        let multiplier = 0.8;

        if (this.mods.includes('NoFail')) {
            multiplier *= 0.90;
        }

        if (this.mods.includes('SpunOut')) {
            multiplier *= 0.95;  
        }

        if (this.mods.includes('Easy')) {
            multiplier *= 0.50;
        }

        let value = Math.pow(
            Math.pow(this.computeStrainValue(), 1.1) +
            Math.pow(this.computeAccValue(), 1.1), 1.0 / 1.1
        ) * multiplier;

        return value;
    }
}

export default mania_ppv2;
