const MODS_ENUM = {
    NoFail: 1 << 0,
    Easy: 1 << 1,
    TouchDevice: 1 << 2,
    Hidden: 1 << 3,
    HardRock: 1 << 4,
    SuddenDeath: 1 << 5,
    DoubleTime: 1 << 6,
    Relax: 1 << 7,
    HalfTime: 1 << 8,
    Nightcore: 1 << 9,
    Flashlight: 1 << 10,
    Autoplay: 1 << 11,
    SpunOut: 1 << 12,
    Autopilot: 1 << 13,
    Perfect: 1 << 14,
    Key4: 1 << 15,
    Key5: 1 << 16,
    Key6: 1 << 17,
    Key7: 1 << 18,
    Key8: 1 << 19,
    FadeIn: 1 << 20,
    Random: 1 << 21,
    Cinema: 1 << 22,
    Target: 1 << 23,
    Key9: 1 << 24,
    KeyCoop: 1 << 25,
    Key1: 1 << 26,
    Key3: 1 << 27,
    Key2: 1 << 28,
    ScoreV2: 1 << 29,
    Mirror: 1 << 30
}

const MODS_SHORT_NAMES = {
    NoFail: 'NF',
    Easy: 'EZ',
    TouchDevice: 'TD',
    Hidden: 'HD',
    HardRock: 'HR',
    SuddenDeath: 'SD',
    DoubleTime: 'DT',
    Relax: 'RX',
    HalfTime: 'HT',
    Nightcore: 'NC',
    Flashlight: 'FL',
    Autoplay: 'AT',
    SpunOut: 'SO',
    Perfect: 'PF',
    Key4: '4K',
    Key5: '5K',
    Key6: '6K',
    Key7: '7K',
    Key8: '8K',
    FadeIn: 'FI',
    Random: 'RD',
    Cinema: 'CN',
    Target: 'TP',
    Key9: '9K',
    KeyCoop: 'KC',
    Key1: '1K',
    Key3: '3K',
    Key2: '2K',
    ScoreV2: 'V2',
    Mirror: 'MR'
};

const MODS_INHERITS = {
    Nightcore: 'DoubleTime',
    Perfect: 'SuddenDeath'
}

class Mods {
    constructor(mods_enabled) {
        if (typeof mods_enabled == 'number') {
            if (isNaN(mods_enabled)) {
                throw new Error("Invalid mods provided (NaN)");
            }

            this.value = mods_enabled;
        } else if (typeof mods_enabled == 'string') {
            this.value = this.fromString(mods_enabled);
        } else if (Array.isArray(mods_enabled)) {
            this.value = this.fromList(mods_enabled);
        } else {
            throw new Error("Invalid mods provided");
        }

        this.list = this.toList(this.value);
    }

    fromString(mods_string) {
        let mods_enabled = 0;

        let parts;

        mods_string = mods_string.toUpperCase();

        if (mods_string.startsWith('+')) {
            mods_string = mods_string.substring(1);
        }

        if (mods_string.includes(',')) {
            parts = mods_string.split(',');
        } else {
            parts = mods_string.match(/.{1,2}/g);
        }

        for (const [key, value] of Object.entries(MODS_SHORT_NAMES)) {
            if (parts.includes(value)) {
                mods_enabled |= MODS_ENUM[key];
            }
        }

        return mods_enabled;
    }

    fromList(mods_list) {
        let mods_enabled = 0;

        for (const mod of mods_list) {
            if (mod.length == 2) {
                for (const [key, value] of Object.entries(MODS_SHORT_NAMES)) {
                    if (value == mod.toUpperCase()) {
                        mods_enabled |= MODS_ENUM[key];
                    }
                }
            } else {
                if (MODS_ENUM[mod] != null) {
                    mods_enabled |= MODS_ENUM[mod];
                }
            }
        }

        return mods_enabled;
    }

    toList(mods_enabled) {
        const mods = [];

        for (const [mod, value] of Object.entries(MODS_ENUM)) {
            if (value > mods_enabled)
                break;

            if ((mods_enabled & value) == value) {
                mods.push(mod);
            }
        }

        return mods;
    }

    /**
     * 
     * @param {bool} with_plus Whether to output + at beginning of mods string
     */
    toString(with_plus = true) {
        if (this.list.length == 0) {
            return '';
        }

        let output_mods = [];

        for (const mod of this.list) {
            if (Object.keys(MODS_INHERITS).includes(mod)) {
                continue;
            }

            output_mods.push(MODS_SHORT_NAMES[mod]);            
        }

        return (with_plus ? '+' : '') + output_mods.join(',');
    }
}

export default Mods;
