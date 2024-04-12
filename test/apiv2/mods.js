import { apiv2 } from '../../src/index.js';
import chai from 'chai';
import chaiStats from 'chai-stats';
import dotenv from 'dotenv';
dotenv.config();

chai.use(chaiStats);

const { assert } = chai;

if (process.env.API_KEY == null) {
    throw new Error("No osu! api key provided");
}

describe('[apiv2] check if returning the #1 DT score on a map works', () => {
    let client, scores;

    before(done => {
        client = new apiv2({
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
        });

        client.fetch('/beatmaps/999944/solo-scores', { params: { mods: ['DT']}})
        .then(response => {
            scores = response?.scores;
            done();
        });
    });

    it('should return a DT score', () => {
        const top = scores[0];
        assert(top?.mods?.find(x => x.acronym == 'DT') !== undefined);
    });
});
