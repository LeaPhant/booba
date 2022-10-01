import { std_ppv2 } from "../../src/index.js";
import fetch from 'node-fetch';
import chai from 'chai';
import chaiStats from 'chai-stats';
import dotenv from 'dotenv';
dotenv.config();

chai.use(chaiStats);

const { assert } = chai;

if (process.env.API_KEY == null) {
    throw new Error("No osu! api v1 key provided (Use API_KEY env variable)");
}

async function fetchTopPlays() {
    const response = await fetch(`https://osu.ppy.sh/api/get_user_best?k=${process.env.API_KEY}&u=895581&limit=100`);
    const json = await response.json();

    if (json.error != null) {
        throw new Error(json.error);
    }

    return json;
}

async function fetchBeatmaps(beatmapIds) {
    const response = await fetch(`https://osu.lea.moe/b/${beatmapIds.join(',')}`);
    const json = await response.json();

    return json;
}

describe('[std] compare top 100 of -GN to calculated values', () => {
    const scores = [], beatmaps = [];

    before(done => {
        fetchTopPlays().then(_scores => {
            scores.push(..._scores);

            const beatmapIds = scores.map(a => a.beatmap_id);

            fetchBeatmaps(beatmapIds).then(_beatmaps => {
                beatmaps.push(..._beatmaps);

                done();
            }).catch(console.error);
        }).catch(console.error);
    });

    it('should be 100 scores', () => {
        assert.equal(scores.length, 100);
    });

    for (let i = 0; i < 100; i++) {
        it(`matches on #${i + 1} top play`, async () => {
            const score = scores[i];
            const beatmap = beatmaps[i];

            const play = new std_ppv2().setPerformance(score).setDifficulty(beatmap);
            const pp = await play.compute();

            assert.almostEqual(pp.total, score.pp, 0.01, `/b/${score.beatmap_id} ${beatmap.beatmap.title} (${pp.aim} aim, ${pp.speed} speed, ${pp.fl} flashlight)`);
        });
    }
});
