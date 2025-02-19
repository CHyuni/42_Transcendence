mkdir -p ${PWD}/postgre/postgres_vol
mkdir -p ${PWD}/postgre/postgres_log
mkdir -p ${PWD}/react/react_vol/my-react-app/build  
mkdir -p ${PWD}/elastic/elastic_vol 
mkdir -p ${PWD}/nginx/nginx_log 
mkdir -p ${PWD}/redis/redis_log 

# cp -r ${PWD}/setup/postgres_vol ${PWD}/postgre/postgres_vol
chmod +x ${PWD}/setup/redis.sh
chmod +x ${PWD}/setup/init_kibana.sh
chmod +x ${PWD}/setup/docker-entrypoint.sh
chmod -R 777 ${PWD}/prometheus/prometheus_vol
chmod -R 777 ${PWD}/grafana/grafana_vol
chmod -R 777 ${PWD}/elastic/elastic_vol
chmod -R 777 ${PWD}/elastic/snapshots



cp ${PWD}/setup/redis.sh ${PWD}/redis/redis.sh
cp ${PWD}/setup/init_kibana.sh ${PWD}/elastic/init_kibana.sh
cp ${PWD}/setup/docker-entrypoint.sh ${PWD}/nginx/docker-entrypoint.sh



SERVER_IP=$(hostname -I | awk '{print $1}')

if grep -q "^SERVER_IP=" .env; then
    sed -i "s|^SERVER_IP=.*|SERVER_IP=$SERVER_IP|" .env
fi
