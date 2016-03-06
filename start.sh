#!/bin/bash
# declare an array called array and define 3 vales
ports=( "5001" "5002" "5003" "5004" "5005" "5006" "5007" "5008" )
for i in "${ports[@]}"
do
    forever start -w --watchDirectory /home/stream/new/api/  /home/stream/new/api/server.js $i
done

forever start node_modules/forever-webui/app.js
