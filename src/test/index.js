import { std_ppv2 } from "../index.js";
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

if (process.env.API_KEY == null) {
    throw new Error("No osu! api key provided");
}

(async () => {
    try{
        const response = await fetch(`https://osu.ppy.sh/api/get_user_best?k=${process.env.API_KEY}&u=895581`);
        const json = await response.json();

        if (json.error != null) {
            throw new Error(json.error);
        }

        const score = json[0];

        const pp = new std_ppv2().setPerformance(score);

        console.log(await pp.compute());
        console.log(await pp.compute(true));
    } catch(e) {
        console.error(e);
    }
})();
