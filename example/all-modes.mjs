import { std_ppv2, taiko_ppv2, catch_ppv2, mania_ppv2 } from '../src/index.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

console.log('-- std --');

try {
  const response = await fetch(`https://osu.ppy.sh/api/get_user_best?k=${process.env.API_KEY}&u=124493&limit=1&m=0`);
  const json = await response.json();
  const [score] = json;

  const pp = new std_ppv2().setPerformance(score);

  console.log(await pp.compute());
} catch(e) {
    console.error(e);
}

console.log('-- taiko --');

try {
  const response = await fetch(`https://osu.ppy.sh/api/get_user_best?k=${process.env.API_KEY}&u=165027&limit=1&m=1`);
  const json = await response.json();
  const [score] = json;

  const pp = new taiko_ppv2().setPerformance(score);

  console.log(await pp.compute());
} catch(e) {
    console.error(e);
}

console.log('-- catch --');

try {
  const response = await fetch(`https://osu.ppy.sh/api/get_user_best?k=${process.env.API_KEY}&u=4158549&limit=1&m=2`);
  const json = await response.json();
  const [score] = json;

  const pp = new catch_ppv2().setPerformance(score);

  console.log(await pp.compute());
} catch(e) {
    console.error(e);
}

console.log('-- mania --');

try {
  const response = await fetch(`https://osu.ppy.sh/api/get_user_best?k=${process.env.API_KEY}&u=259972&limit=1&m=3`);
  const json = await response.json();
  const [score] = json;

  const pp = new mania_ppv2().setPerformance(score);

  console.log(await pp.compute());
} catch(e) {
    console.error(e);
}
