#!/bin/sh

curl -X POST \
       -H "Content-Type: application/json" \
       -d '{"serviceType": "voice", "unit": 20}' \
       https://2mayzurprh.execute-api.us-east-1.amazonaws.com/prod/charge-request-memcached
