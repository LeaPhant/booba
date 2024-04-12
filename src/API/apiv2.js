import fetch from 'node-fetch';

const CLIENT_SECRET_FORMAT = new RegExp('^[a-zA-Z0-9]{40}$');
const DEFAULT_HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    'x-api-version': '20240130'
};

class apiv2 {
    #apiBase = 'https://osu.ppy.sh';
    #clientId;
    #clientSecret;
    #token;
    /**
     * New apiv2 client 
     * @param {Object} params
     * @param {any} params.clientId Client ID
     * @param {string} params.clientSecret Client Secret
     * @param {string} [params.apiBase="https://osu.ppy.sh"] Base URL for API requests
     */
    constructor(params) {
        if (params.clientId == null) throw new Error('Client ID required.');
        if (params.clientSecret == null) throw new Error('Client Secret required.');

        if (isNaN(Number(params.clientId))) {
            throw new TypeError('Client ID has to be a number.');
        }

        if (!CLIENT_SECRET_FORMAT.test(params.clientSecret)) {
            throw new TypeError('Client Secret not a valid format.');
        }

        this.#clientId = params.clientId;
        this.#clientSecret = params.clientSecret;
    }

    /**
     * Check whether client has a valid bearer token
     * @returns {bool}
     */
    isAuthorized() {
        if (this.#token == null) return false;
        if (Date.now() > this.#token?.expiry) return false;

        return true;
    }

    /**
     * Get authorization headers
     * @returns {Object}
     */
    async getAuthorizationHeaders() {
        if (!this.isAuthorized()) {
            await this.obtainBearerToken();
        }

        return {
            ...DEFAULT_HEADERS,
            'Authorization': `Bearer ${this.#token.token}`
        };
    }

    /**
     * Obtains and sets bearer token
     */
    async obtainBearerToken() {
        const response = await fetch(new URL('/oauth/token', this.#apiBase), {
            method: 'POST',
            headers: DEFAULT_HEADERS,
            body: new URLSearchParams({
                client_id: this.#clientId,
                client_secret: this.#clientSecret,
                grant_type: 'client_credentials',
                scope: 'public'
            }).toString()
        });

        const body = await response.json();

        this.#token = {
            token: body.access_token,
            expiry: Date.now() + body.expires_in * 1000
        };
    }

    /**
     * Fetch response from an APIv2 endpoint
     * @param {String} path The API path to 
     * @returns {Object}
     */
    async fetch(path, options) {
        const headers = {
            ...await this.getAuthorizationHeaders(),
            'Content-Type': 'application/json',
            ...options?.headers ?? {}
        };

        let params = '';

        if (options?.params) {
            const urlParams = new URLSearchParams(options.params);
            params = `?${urlParams}`;
        }

        const response = await fetch(new URL('/api/v2' + path + params, this.#apiBase), {
            method: 'GET',
            headers
        });

        return await response.json();
    }
}

export default apiv2;
