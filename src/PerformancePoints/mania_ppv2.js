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

    /**
     * Calculate accuracy
     * @returns {number}
     */
    computeAccuracy() {
        return Math.max(Math.min((this.n300 + this.ngeki + this.nkatu * 2/3 + this.n100 * 1/3 + this.n50 * 1/6)
        / this.totalHits(), 1), 0);
    }

    computeCustomAccuracy() {
        if (this.totalHits() == 0) return 0;

        return (this.ngeki * 320 + this.n300 * 300 + this.nkatu * 200 + this.n100 * 100 + this.n50 * 50) 
        / (this.totalHits() * 320);
    }

    /**
     * Calculate total hits
     * @returns {number}
     */
    totalHits() {
        if (!this.total_hits) {
            this.total_hits = this.n300 + this.n100 + this.n50 + this.nmiss + this.ngeki + this.nkatu
        }

        return this.total_hits;
    }

    /**
     * Calculate score without mod multipliers
     * @returns {number}
     */
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

    /**
     * Compute strain skill pp
     * @returns {number}
     */
    computeStrainValue() {
        const value = Math.pow(Math.max(this.diff.total -0.15, 0.05), 2.2)
                    * Math.max(0.0, 5.0 * this.computeCustomAccuracy() - 4.0)
                    * (1.0 + 0.1 * Math.min(1.0, this.totalHits() / 1500.0));

        return value;
    }

    /**
     * Compute total pp from separate skills
     * @param {object} pp Object with pp values for all skills
     * @returns {number}
     */
    computeTotal(pp) {
        let multiplier = 8.0;

        if (this.mods.includes('NoFail')) {
            multiplier *= 0.75;
        }

        if (this.mods.includes('SpunOut')) {
            multiplier *= 0.95;  
        }

        if (this.mods.includes('Easy')) {
            multiplier *= 0.50;
        }

        return pp.strain * multiplier;
    }

    /**
     * Calculate pp and automatically fetch beatmap difficulty
     */
    async compute() {
        if (this.diff?.total == null) {
            await this.fetchDifficulty();
        }

        const pp = {
            strain: this.computeStrainValue(),
            computed_accuracy: this.accuracy * 100
        };

        pp.total = this.computeTotal(pp);

        return pp;
    }
}

export default mania_ppv2;
