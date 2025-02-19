#!/bin/bash
# Elasticsearch가 완전히 시작될 때까지 대기
curl -u '${ELASTIC_USER}:${ELASTIC_PASSWORD}' \
curl -u '${ELASTIC_USER}:${ELASTIC_PASSWORD}' --header "content-type: application/JSON" -XPOST '${ELASTICSEARCH_HOSTS}/_snapshot/{snapshot_name}/{backup_key}/_restore?wait_for_completion=true' 
  -XPOST '${ELASTICSEARCH_HOSTS}/_snapshot/my_backup/snapshot_20250207/_restore?wait_for_completion=true' \
  -H 'Content-Type: application/json' \
  -d '{
    "indices": "*",
    "include_global_state": true
  }'

until curl -s -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" "${ELASTICSEARCH_HOSTS}" | grep -q "You Know, for Search"; do
    echo "Waiting for Elasticsearch..."
    sleep 1
done


# kibana_system 사용자 비밀번호 설정
echo "Setting ${ELASTICSEARCH_USERNAME} password..."
curl -X POST "${ELASTICSEARCH_HOSTS}/_security/user/${ELASTICSEARCH_USERNAME}/_password" \
    -u ${ELASTIC_USER}:${ELASTIC_PASSWORD} \
    -H "Content-Type: application/json" \
    -d "{\"password\": \"${ELASTICSEARCH_PASSWORD}\"}"