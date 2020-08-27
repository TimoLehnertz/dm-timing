"use strict";
            
            //setInterval(updateCsv, 500);

            let csv = [];

            let newTriggerCallback = function(){console.log("triggered");}

            var request = new XMLHttpRequest();

            function getCsv(callback){
                request.open("GET","/get-csv");
                //request.open("GET","static/data/triggers.csv");
                request.addEventListener('load', function(event) {
                if (request.status >= 200 && request.status < 300) {
                    callback(request.responseText);
                } else {
                    console.warn(request.statusText, request.responseText);
                }});
                request.send();
            }


            function onNewtriggger(callback){
                newTriggerCallback = callback;
            }

            

            function receive(response){
                let triggerSize = csv.length;
                let split = response.split(',');
                for (let i = 0; i < split.length; i++) {
                    csv[i] = split[i];
                }
                if(triggerSize != csv.length){
                    newTriggerCallback(csv);
                }
                getCsv(receive);
            }

            getCsv(receive);