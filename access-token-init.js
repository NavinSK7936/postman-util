const querystring = require('querystring');

const DEFAULT_CLIENT_CONFIG = {
	US: {
		domain: 'accounts.zoho.com'
	},
	EU: {
		domain: 'accounts.zoho.eu'
	},
	CN: {
		domain: 'accounts.zoho.com.cn'
	},
	IN: {
		domain: 'accounts.zoho.in'
	},
	AU: {
		domain: 'accounts.zoho.com.au'
	},
	JP: {
		domain: 'accounts.zoho.jp'
	},
	LOCALZOHO: {
		domain: 'accounts.localzoho.com'
	},
	CSEZ: {
		domain: 'accounts.csez.zohocorpin.com'
	}
};

// dc: ['US', 'EU', 'CN', 'IN', 'AU', 'LOCALZOHO', 'CSEZ']
function setAccessToken({
	key,
	refresh_token,
	dc,
	client_id = DEFAULT_CLIENT_CONFIG[dc].client_id,
	client_secret = DEFAULT_CLIENT_CONFIG[dc].client_secret,
    callback = undefined
}) {
	const ACCESS_TOKEN_KEY = `${key}_ACCESS_TOKEN`;
	const AUTH_META_KEY = `${key}_AUTH_META`;

    const access_token = pm.collectionVariables.get(ACCESS_TOKEN_KEY);
	if (access_token == undefined) {
		request();
	} else {
        const TOKEN_EXPIRY_TIME = 60 * 60 * 1000;
		const authMetaDetails = JSON.parse(pm.collectionVariables.get(AUTH_META_KEY));

		const lastUpdatedTime = authMetaDetails['last_update_time'];
		const didAccessTokenExpire = lastUpdatedTime == undefined || Date.now() - lastUpdatedTime >= TOKEN_EXPIRY_TIME;

		const lastUsedRefreshToken = authMetaDetails['last_refresh_token'];
		const areRefreshTokensDiff = lastUsedRefreshToken == undefined || refresh_token != lastUsedRefreshToken;

		if (didAccessTokenExpire || areRefreshTokensDiff) {
			request();
		} else {
            callback?.(access_token);
        }
	}

	function request() {
        const query = {
            client_id: client_id,
            client_secret: client_secret,
            refresh_token: refresh_token,
            grant_type: 'refresh_token'
        };
		pm.sendRequest(
			{
				url: `https://${DEFAULT_CLIENT_CONFIG[dc].domain}/oauth/v2/token?${querystring.stringify(query)}`,
				method: 'POST'
			},
			function (err, res) {
                if (res) {
                    const data = res.json(),
                        access_token = data.access_token,
                        meta = JSON.stringify({
                            last_update_time: Date.now(),
                            last_refresh_token: refresh_token
                        });

                    pm.collectionVariables.set(ACCESS_TOKEN_KEY, access_token);
                    pm.collectionVariables.set(AUTH_META_KEY, meta);

                    callback?.(access_token);
                } else if (err) {
                    console.error(err);
                }
			}
		);
	}
}
