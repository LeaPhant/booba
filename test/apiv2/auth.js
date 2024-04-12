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

describe('[apiv2] check if authenticating works', () => {
    let client, headers;

    before(done => {
        client = new apiv2({
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
        });

        client.getAuthorizationHeaders().then(response => {
            headers = response;

            done();
        }).catch(console.error);
    });

    it('should return valid authorization headers', () => {
        assert.match(headers?.Authorization, /Bearer ./);
    });
});
