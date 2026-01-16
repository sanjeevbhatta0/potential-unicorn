#!/bin/bash
# Test script for AI Service API

set -e

BASE_URL="http://localhost:8000"

echo "Testing AI Service API..."
echo

# Test health check
echo "1. Testing health check..."
curl -s "$BASE_URL/health" | jq '.'
echo

# Test readiness
echo "2. Testing readiness..."
curl -s "$BASE_URL/ready" | jq '.'
echo

# Test languages list
echo "3. Testing languages endpoint..."
curl -s "$BASE_URL/api/v1/translate/languages" | jq '.'
echo

# Test summarization
echo "4. Testing summarization..."
curl -s -X POST "$BASE_URL/api/v1/summarize" \
  -H "Content-Type: application/json" \
  -d '{
    "article": {
      "content": "Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals. The term artificial intelligence had previously been used to describe machines that mimic and display human cognitive skills that are associated with the human mind, such as learning and problem-solving. This definition has since been rejected by major AI researchers who now describe AI in terms of rationality and acting rationally, which does not limit how intelligence can be articulated.",
      "title": "Introduction to AI"
    },
    "length": "short",
    "provider": "claude",
    "key_points": true
  }' | jq '.'
echo

# Test translation
echo "5. Testing translation..."
curl -s -X POST "$BASE_URL/api/v1/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, how are you?",
    "target_language": "es",
    "provider": "claude"
  }' | jq '.'
echo

echo "All tests completed!"
