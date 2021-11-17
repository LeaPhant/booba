import ppv2 from './ppv2.js';

class mania_ppv2 extends ppv2 {
    mode = 3;

    constructor() {
        const diff_mods = ['HardRock', 'Easy', 'DoubleTime', 'HalfTime'];

        for (let i = 1; i < 9; i++) {
            diff_mods.push(`Key${i}`);
        }

        super({ diff_mods });
    }

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
        return this.score * (1.0 / this.diff.score_multiplier);
    }

    /**
     * Set player performance.
     * @param {Object} params Information about the play.
     * @param {number} params.count300
     * @param {number} params.count100
     * @param {number} params.count50
     * @param {number} params.countmiss
     * @param {number} params.countgeki
     * @param {number} params.countkatu
     * @param {number} params.score
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
            this.ngeki = Number(params.countgeki);
            this.nkatu = Number(params.countkatu);
            
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
            this.nmiss = statistics.count_miss;
            this.ngeki = statistics.count_geki;
            this.nkatu = statistics.count_katu;

            this.setMods(params.mods);
        }

        this.score = Number(params.score);

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
        if (params.difficulty != null) {
            params = params.difficulty[this.mods_enabled_diff];
        }

        this.diff = { ...params };

        return this;
    }

    computeStrainValue() {
        if (this.diff.score_multiplier <= 0) {
            return 0;
        }

        const score = this.adjustedScore();

        let value = Math.pow(5.0 * Math.max(1.0, this.diff.total / 0.2) - 4.0, 2.2) / 135.0;

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

    computeAccValue(strain) {
        if (this.diff.hit_window_300 <= 0) {
            return 0;
        }

        let value = Math.max(0.0, 0.2 - (this.diff.hit_window_300 - 34) * 0.006667)
        * strain
        * Math.pow(Math.max(0.0, this.adjustedScore() - 960000) / 40000, 1.1);

        return value;
    }

    computeTotal(pp) {
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
            Math.pow(pp.strain, 1.1) +
            Math.pow(pp.acc, 1.1), 1.0 / 1.1
        ) * multiplier;

        return value;
    }

    async compute() {
        if (this.diff?.total == null) {
            await this.fetchDifficulty();
        }

        const strain = this.computeStrainValue();

        const pp = {
            strain,
            acc: this.computeAccValue(strain),
            computed_accuracy: this.accuracy * 100
        };

        pp.total = this.computeTotal(pp);

        return pp;
    }
}

export default mania_ppv2;
