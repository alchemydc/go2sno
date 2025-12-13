# epic mix API calls (extracted from mobile app)

## get all resorts
`curl -H 'accept: application/json, text/plain, */*' \
 -H 'accept-language: en-US,en;q=0.9' \ -H 'user-agent: MyEpic/160000 ios' --compressed \
 https://digital-gw.azmtn.com/uiservice/api/v1/resorts | jq .`


## get daily stats for park city
`curl -H 'accept: application/json, text/plain, */*' \
-H 'accept-language: en-US,en;q=0.9' -H 'user-agent: MyEpic/160000 ios'  --compressed \
https://digital-gw.azmtn.com/uiservice/api/v1/resorts/14/daily-stats | jq .`


## get basic data for park city
`curl ' -H 'accept: application/json, text/plain, */*' \
 -H 'accept-language: en-US,en;q=0.9' -H 'user-agent: MyEpic/160000 ios' --compressed \
 https://digital-gw.azmtn.com/uiservice/api/v1/resorts/14 | jq .`

## more details for park city
`curl  -H 'accept: application/json, text/plain, */*' -H 'accept-language: en-US,en;q=0.9' \
-H 'user-agent: MyEpic/160000 ios' --compressed \
https://digital-gw.azmtn.com/uiservice/api/v1/resorts/14/home`

## get maps for park city
`curl -H 'cookie: ' -H 'accept: application/json, text/plain, */*' -H 'accept-language: en-US,en;q=0.9' -H 'user-agent: MyEpic/160000 ios' --compressed https://digital-gw.azmtn.com/uiservice/api/v1/resorts/14/maps`

## get wait times for park city
`curl -H 'accept: application/json, text/plain, */*' -H 'accept-language: en-US,en;q=0.9' -H 'user-agent: MyEpic/160000 ios' --compressed https://digital-gw.azmtn.com/uiservice/api/v1/resorts/14/wait-times`

## get weather for park city
`curl -H 'accept: application/json, text/plain, */*' -H 'accept-language: en-US,en;q=0.9' -H 'user-agent: MyEpic/160000 ios' --compressed https://digital-gw.azmtn.com/uiservice/api/v1/resorts/14/weather`

## get webcams for park city
`curl -H 'accept: application/json, text/plain, */*' -H 'accept-language: en-US,en;q=0.9' -H 'user-agent: MyEpic/160000 ios' --compressed https://digital-gw.azmtn.com/uiservice/api/v1/resorts/14/webcam-screen`
