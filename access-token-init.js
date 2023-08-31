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
	client_id,
	client_secret,
	dc
}) {
	const TOKEN_EXPIRY_TIME = 60 * 60 * 1000;
	const ACCESS_TOKEN_KEY = `${key}_ACCESS_TOKEN`;
	const AUTH_META_KEY = `${key}_AUTH_META`;

	const access_token = pm.collectionVariables.get(ACCESS_TOKEN_KEY);
	if (access_token == undefined) {
		request();
	} else {
		const authMetaDetails = JSON.parse(pm.collectionVariables.get(AUTH_META_KEY));

		const lastUpdatedTime = authMetaDetails['last_update_time'];
		const didAccessTokenExpire = lastUpdatedTime == undefined || Date.now() - lastUpdatedTime >= TOKEN_EXPIRY_TIME;

		const lastUsedRefreshToken = authMetaDetails['last_refresh_token'];
		const areRefreshTokensDiff = lastUsedRefreshToken == undefined || refresh_token != lastUsedRefreshToken;

		if (didAccessTokenExpire || areRefreshTokensDiff) {
			request();
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
				url: `https://${DEFAULT_CLIENT_CONFIG[dc].domain}/oauth/v2/token?` + getQpAsString(query),
				method: 'POST'
			},
			function (err, res) {
				if (res) {
					const data = res.json();
					pm.collectionVariables.set(ACCESS_TOKEN_KEY, data.access_token);
					pm.collectionVariables.set(
						AUTH_META_KEY,
						JSON.stringify({
							last_update_time: Date.now(),
							last_refresh_token: refresh_token
						})
					);
				} else if (err) {
					console.error(err);
				}
			}
		);
	}
	function getQpAsString(qp) {
		let ans = '';
		for (const [key, value] of Object.entries(qp)) {
			ans += `&${key}=${value}`;
		}
		if (ans[0] == '&') {
			ans = ans.substring(1);
		}
		return ans;
	}
}
