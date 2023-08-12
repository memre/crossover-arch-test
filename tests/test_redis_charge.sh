#!/bin/sh
curl -X POST \
       -H "Content-Type: application/json" \
       -d '{"serviceType": "voice", "unit": 20}' \
       https://i3m9l7e1yl.execute-api.us-east-1.amazonaws.com/prod/charge-request-redis
