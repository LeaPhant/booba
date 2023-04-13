<img alt="Bubble tea" src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f9cb.svg" height="120px" align="right"></img>
# booba
pure javascript osu! api wrapper and helper library for all modes (heavily W.I.P.)

### Roadmap
- [ ] API wrapper
  - [ ] osu! api v1
  - [ ] osu! api v2
- [x] pp calculation
  - [x] standard
  - [x] taiko
  - [x] catch
  - [x] mania (currently mismatches possible due to ongoing changes)
- [ ] beatmap parsing
- [ ] difficulty calculation
- [ ] beatmap rendering
- [ ] replay analyzation

### Installation
```
npm i booba
```
### Usage Examples

#### Calculating pp for a recent score from osu! api v1.
```JavaScript
import fetch from 'node-fetch';
import { std_ppv2 } from 'booba';

const API_KEY = 'put api key here'; // osu! api v1 key
const USER = '1023489';

(async () => {
  const response = await fetch(`https://osu.ppy.sh/api/get_user_recent?k=${API_KEY}&u=${USER}&limit=1`);
  const json = await response.json();
  const [score] = json;

  const pp = new std_ppv2().setPerformance(score);

  console.log(await pp.compute())
  /* => {
    aim: 108.36677305976224,
    speed: 121.39049498160061,
    fl: 514.2615576494688,
    acc: 48.88425340242263,
    total: 812.3689077733752
  } */
})();
```
