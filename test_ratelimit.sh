#!/bin/bash

# Simple script to test the Upstash IP rate limit on the local Next.js server

API_URL="http://localhost:3000/api/matching/join-random"

echo "=== Testing DDoS Protection on $API_URL ==="
echo "Sending 15 rapid requests. The limit is 10 requests per 10 seconds."
echo "Expected behavior: First 10 should succeed (HTTP 200), the rest should fail (HTTP 429 Too Many Requests)."
echo ""

for i in {1..15}
do
   # Send an empty JSON body and just extract the HTTP status code
   STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"clientId": "test-client-id"}' "$API_URL")
   
   if [ "$STATUS" -eq 200 ]; then
       echo "Request $i: ✅ SUCCESS (HTTP 200)"
   elif [ "$STATUS" -eq 429 ]; then
       echo "Request $i: 🚨 BLOCKED by Rate Limiter (HTTP 429)"
   else
       echo "Request $i: ⚠️ Unexpected response (HTTP $STATUS)"
   fi
done

echo ""
echo "Test completed."
