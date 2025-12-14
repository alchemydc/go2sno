# ikon mobile app api calls

ikon uses an api exposed by mtnpowder.com to get resort data.
it's private and undocumented and uses a bearer token that appears to be a base64 encoded string that looks like a
sha256 hash. it does not appear to change between logins.

there does not appear to be a way to get the bearer token without logging in to the app while instrumenting the device
through an intercepting proxy that is terminating SSL

## get all resorts
`curl -H 'accept: */*' -H 'content-type: application/json' \
 -H 'user-agent: IkonMobileIOS/7.76.304 (The in-house Ikon mobile app; iPadOS; Apple; Build 9308)' \
 -H 'accept-language: en-US,en;q=0.9' --compressed \
 'https://www.mtnpowder.com/feed/v3/ikon.json?bearer_token=$IKON_API_KEY'`



## get resort data
`curl -H 'accept: */*' -H 'content-type: application/json' \
-H 'user-agent: IkonMobileIOS/7.76.304 (The in-house Ikon mobile app; iPadOS; Apple; Build 9308)' \
-H 'accept-language: en-US,en;q=0.9' --compressed \
'https://www.mtnpowder.com/feed/v3.json?resortId=5&bearer_token="$IKON_API_KEY"' | jq .`


