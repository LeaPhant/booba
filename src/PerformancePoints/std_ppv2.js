import ppv2 from './ppv2.js';

class std_ppv2 extends ppv2 {
    mode = 0;

    computeAccuracy() {
        return Math.max(Math.min((this.n300 + this.n100 * 1/3 + this.n50 * 1/6)
        / this.totalHits(), 1), 0);
    }

    totalHits() {
        return this.n300 + this.n100 + this.n50 + this.nmiss;
    }

    effectiveMissCount() {
        let combo_based_miss_count = 0.0;

        if (this.map.nsliders > 0) {
            let full_combo_threshold = this.map.max_combo - 0.1 * this.map.nsliders;

            if (this.combo < full_combo_threshold) {
                combo_based_miss_count = full_combo_threshold / Math.max(1, this.combo);
            }
        }

        combo_based_miss_count = Math.min(combo_based_miss_count, this.totalHits());

        return Math.max(this.nmiss, Math.floor(combo_based_miss_count));
    }

    setBeatmap(beatmap_id) {
        this.beatmap_id = beatmap_id;

        return this;
    }

    /**
     * Set player performance.
     * @param {Object} params Information about the play, can be osu! api response
     * @param {string} params.beatmap_id 
     * @param {number} params.count300 
     * @param {number} params.count100 
     * @param {number} params.count50 
     * @param {number} params.countmiss 
     * @param {number} params.maxcombo
     */
    setPerformance(params) {
        // osu! api v1 response
        if (params?.count300 != null) {
            this.beatmap_id = params.beatmap_id;
            this.n300 = Number(params.count300);
            this.n100 = Number(params.count100);
            this.n50 = Number(params.count50);
            this.nmiss = Number(params.countmiss);
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
     * @param {number} params.max_combo Maximum achievable combo
     * @param {number} params.aim Aim stars
     * @param {number} params.speed Speed stars
     * @param {number} params.total Total stars
     * @param {number} params.ar Approach Rate
     * @param {number} params.od Overall Difficulty
     * @param {number} params.count_circles Amount of hit circles
     * @param {number} params.count_sliders Amount of hit circles
     * @param {number} params.count_spinners Amount of hit circles
     */
    setDifficulty(params) {
        // beatmap api response
        if (params.beatmap != null && params.difficulty != null) {
            const { beatmap, difficulty } = params;

            const diff = difficulty[this.mods_enabled];

            this.diff = {
                aim: diff.aim ?? 0,
                speed: diff.speed ?? 0,
                fl: diff.flashlight_rating ?? 0,
                total: diff.total ?? 0
            };

            this.map = {
                max_combo: diff.max_combo,
                ar: diff.ar,
                od: diff.od,
                ncircles: beatmap.num_circles ?? 0,
                nsliders: beatmap.num_sliders ?? 0,
                nspinners: beatmap.num_spinners ?? 0
            }
        } else {
            this.diff = {
                aim: params.aim,
                speed: params.speed,
                fl: params.fl ?? 0,
                total: params.total
            };

            this.map = {
                max_combo: params.max_combo,
                ar: params.ar,
                od: params.od,
                ncircles: params.count_circles ?? 0,
                nsliders: params.count_sliders ?? 0,
                nspinners: params.count_spinners ?? 0,
            }
        }

        this.n300 = this.map.ncircles + this.map.nsliders + this.map.nspinners - this.n100 - this.n50 - this.nmiss;
        this.total_hits = this.totalHits();

        return this;
    }

    async fetchDifficulty() {
        this.setDifficulty(await this.fetchBeatmap());
    }

    computeAimValue() {
        const nmiss_e = this.effectiveMissCount();

        let raw_aim = this.diff.aim;

        if (this.mods.includes('TouchDevice')) {
            raw_aim = Math.pow(rawAim, 0.8);
        }

        let value = Math.pow(5.0 * Math.max(1.0, raw_aim / 0.0675) - 4.0, 3.0) / 100000.0;

        let length_bonus = 0.95 + 0.4 * Math.min(1.0, this.total_hits / 2000.0) +
        (this.total_hits > 2000 ? Math.log10(this.total_hits / 2000.0) * 0.5 : 0.0);

        value *= length_bonus;

        if (nmiss_e > 0) {
            value *= 0.97 * Math.pow(1.0 - Math.pow(nmiss_e / this.total_hits, 0.775), nmiss_e);
        }

        if (this.map.max_combo > 0) {
            value *= Math.min(Math.pow(this.combo, 0.8) / Math.pow(this.map.max_combo, 0.8), 1.0);
        }

        let ar_factor = 0.0;

        if (this.map.ar > 10.33) {
            ar_factor += 0.3 * (ar - 10.33);
        } else if (this.map.ar < 8.0) {
            ar_factor += 0.1 * (8.0 - ar);
        }

        value *= 1.0 + ar_factor * length_bonus;

        if (this.mods.includes('Hidden')) {
            value *= 1.0 + 0.04 * (12.0 - this.map.ar);
        }

        value *= this.accuracy;

        value *= 0.98 + Math.pow(this.map.od, 2) / 2500.0;

        return value;
    }

    computeSpeedValue() {
        const nmiss_e = this.effectiveMissCount();

        let value = Math.pow(5.0 * Math.max(1.0, this.diff.speed / 0.0675) - 4.0, 3.0) / 100000.0;

        let length_bonus = 0.95 + 0.4 * Math.min(1.0, this.total_hits / 2000.0) +
            (this.total_hits > 2000 ? Math.log10(this.total_hits / 2000.0) * 0.5 : 0.0);
            
        value *= length_bonus;

        if (nmiss_e > 0) {
            value *= 0.97 * Math.pow(1.0 - Math.pow(nmiss_e / this.total_hits, 0.775), Math.pow(nmiss_e, 0.875));
        }

        if (this.map.max_combo > 0) {
            value *= Math.min(Math.pow(this.combo, 0.8) / Math.pow(this.map.max_combo, 0.8), 1.0);
        }

        let ar_factor = 0;

        if (this.map.ar > 10.33) {
            ar_factor += 0.3 * (this.map.ar - 10.33);
        }

        value *= 1.0 + ar_factor * length_bonus;

        if (this.mods.includes('Hidden')) {
            value *= 1.0 + 0.04 * (12.0 - this.map.ar);
        }

        value *= (0.95 + Math.pow(this.map.od, 2) / 750) * Math.pow(this.accuracy, (14.5 - Math.max(this.map.od, 8.0)) / 2);

        value *= Math.pow(0.98, this.n50 < this.total_hits / 500.0 ? 0.0 : this.n50 - this.total_hits / 500.0);

        return value;
    }

    computeAccValue() {
        let better_acc_percentage;
        let n_objects_with_acc;

        if (this.mods.includes('ScoreV2')) {
            n_objects_with_acc = this.total_hits;
            better_acc_percentage = this.accuracy;
        } else {
            n_objects_with_acc = this.map.ncircles;

            if (n_objects_with_acc > 0) {
                better_acc_percentage =  ((this.n300 - (this.total_hits - n_objects_with_acc)) * 6 + this.n100 * 2 + this.n50) / (n_objects_with_acc * 6);
            } else {
                better_acc_percentage = 0;
            }

            if (better_acc_percentage < 0) {
                better_acc_percentage = 0;
            }
        }

        let value = Math.pow(1.52163, this.map.od) * Math.pow(better_acc_percentage, 24) * 2.83;

        value *= Math.min(1.15, Math.pow(n_objects_with_acc / 1000.0, 0.3));

        if (this.mods.includes('Hidden')) {
            value *= 1.08;
        }

        if (this.mods.includes('Flashlight')) {
            value *= 1.02;
        }

        return value;
    }

    computeFlashlightValue() {
        let value = 0;

        if (!this.mods.includes('Flashlight')) {
            return value;
        }

        let raw_fl = this.diff.fl;

        if (this.mods.includes('TouchDevice')) {
            raw_fl = Math.pow(raw_fl, 0.8);
        }

        value = Math.pow(raw_fl, 2.0) * 25.0;

        if (this.mods.includes('Hidden')) {
            value *= 1.3;
        }

        if (this.nmiss > 0) {
            value *= 0.97 * Math.pow(1 - Math.pow(this.nmiss / this.total_hits, 0.775), Math.pow(this.nmiss, 0.875));
        }

        if (this.map.max_combo > 0) {
            value *= Math.min(Math.pow(this.combo, 0.8) / Math.pow(this.map.max_combo, 0.8), 1);
        }

        value *= 0.7 + 0.1 * Math.min(1.0, this.total_hits / 200.0) +
            (this.total_hits > 200 ? 0.2 * Math.min(1.0, (this.total_hits - 200) / 200.0) : 0.0);

        value *= 0.5 + this.accuracy / 2.0;

        value *= 0.98 + Math.pow(this.map.od, 2.0) / 2500.0;

        return value;
    }

    computeTotal(pp) {
        let multiplier = 1.12;

        if (this.mods.includes('NoFail')) {
            multiplier *= Math.max(0.9, 1.0 - 0.02 * this.nmiss);
        }

        if (this.mods.includes('SpunOut')) {
            multiplier *= 1.0 - Math.pow(this.map.nspinners / this.total_hits, 0.85);
        }

        return Math.pow(
            Math.pow(pp.aim, 1.1) +
            Math.pow(pp.speed, 1.1) +
            Math.pow(pp.fl, 1.1) +
            Math.pow(pp.acc, 1.1), 1.0 / 1.1
        ) * multiplier;
    }

    /**
     * 
     * @param {bool} fc Whether to simulate a full combo
     * @returns 
     */
    async compute(fc = false) {
        if (this.diff?.total == null) {
            await this.fetchDifficulty();
        }

        const n300 = this.n300, nmiss = this.nmiss, combo = this.combo;

        if (fc) {
            this.n300 += this.nmiss;
            this.nmiss = 0;
            this.combo = this.map.max_combo;
        }

        const pp = {
            aim: this.computeAimValue(),
            speed: this.computeSpeedValue(),
            fl: this.computeFlashlightValue(),
            acc: this.computeAccValue()
        };

        pp.total = this.computeTotal(pp);

        if (fc) {
            this.n300 = n300;
            this.nmiss = nmiss;
            this.combo = combo;

            this.pp_fc = pp;
        } else {
            this.pp = pp;
        }

        return pp;
    }
}

export default std_ppv2;
