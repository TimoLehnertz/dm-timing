function change(){
    runden.value = parseInt(streckenlänge.value / rundenlänge.value);

    restMeter.value = streckenlänge.value - (runden.value * rundenlänge.value);

    gesSek.value = parseInt(VorgabezeitMin.value * 60) + parseInt(VorgabezeitSek.value);

    kmh.value = streckenlänge.value / 1000 / (gesSek.value / 3600);

    ersteRundeSek.value = parseFloat((gesSek.value / streckenlänge.value) * restMeter.value + startzugabe.value).toFixed(3);

    durchschittZeit.value = ((gesSek.value - ersteRundeSek.value) / runden.value).toFixed(3);
}

let lapsLeft = 3;
let started = false;
let measumentsTaken = 0;

let rennen = [];
let jetztRennen;

class Rennen{
    constructor(){
        this.measurements = [];
        this.sportler = "name";
        this.date;
        this.streckenlänge;
        this.rundenlänge;
        this.vorgabezeitMin;
        this.vorgabezeitSek;
        this.startZugabe;
        this.vorgabeDurchschittRunde;
        this.vorgabeErsteRunde;
        this.restMeter;
    }
}

function calcTip(rennen){
    let sum = 0;
    for(let i = 0; i < rennen.measurements.length; i++){
        sum += rennen.measurements[i] - rennen.measurements[Math.max(0, i - 1)];
    }
    let metersLeft = (rennen.streckenlänge - ((rennen.measurements.length - 1) * rennen.rundenlänge + rennen.restMeter));
    console.log(metersLeft);
}

function getSol(lap, rennen){
    return (lap == 0 ? rennen.vorgabeErsteRunde : rennen.vorgabeDurchschittRunde) * 1000;
}

function measurement(e){
    if(e.keyCode == 27){
        reset();
    }
    if(e.keyCode == 32){
        //reset
        if(!started){
            start();
        }
        color = body.style.background;
        body.style.background ="green";
        
        setTimeout(()=>{body.style.background="white";}, 200);
        if(!(restMeter.value > 0 && measumentsTaken < 1)){
            lapsLeft--;
        }
        jetztRennen.measurements.push(performance.now());
        measumentsTaken++;
        if(lapsLeft == -1){
            finsish();
        }
        updateScreen();
        calcTip(jetztRennen);
    }
}

function updateScreen(){
    rundenÜbrig.innerText = lapsLeft;
    showStats(jetztRennen);
}

function start(){
    lapsLeft = runden.value;
    measumentsTaken = 0;
    updateScreen();
    started = true;
    /*for(child of document.getElementById("eingabefeld").childNodes){
        child.childNodes[0].disabled = "disabled";
        console.log(child);
    }*/
    jetztRennen = new Rennen();
    jetztRennen.sportler = sportlerName.value;
    jetztRennen.date = Date.now();
    jetztRennen.streckenlänge = streckenlänge.value;
    jetztRennen.rundenlänge = rundenlänge.value;
    jetztRennen.VorgabezeitMin = VorgabezeitMin.value;
    jetztRennen.VorgabezeitSek = VorgabezeitSek.value
    jetztRennen.startZugabe = startzugabe.value;
    jetztRennen.vorgabeDurchschittRunde = durchschittZeit.value;
    jetztRennen.vorgabeErsteRunde = ersteRundeSek.value;
    jetztRennen.restMeter = restMeter.value;
}

function finsish(){
    rennen.push(jetztRennen);
    console.log(jetztRennen);
    alert("Rennen gespeichert");
    reset();
}

function reset(){
    started = false;
    measumentsTaken = 0;
    lapsLeft = runden.value;
    updateScreen();
}

function showStats(rennen){
    if(rennen == undefined){
        return;
    }
    result.innerHTML = "<tr><td>Runde</td><td>Zeitpunkt</td><td>Zeit</td><td>sol</td><td>plus minus</td></tr>";
    for(let i = 0; i < rennen.measurements.length; i++){
        
        let plus = (rennen.measurements[i] - rennen.measurements[Math.max(0, i - 1)]) - getSol(i, rennen);        
        result.innerHTML += "<tr><td>" + i + "</td>"+
        "<td>" + millisToMinutesAndSeconds(rennen.measurements[i]) + "</td>"+
        "<td>" + millisToMinutesAndSeconds(rennen.measurements[i] - rennen.measurements[Math.max(0, i - 1)]) + "</td>"+
        "<td>" + millisToMinutesAndSeconds(getSol(i, rennen)) + "</td>"+
        (plus < 0 ? "<td style='background-color: green;'>-" : "<td style='background-color: red;'>") + millisToMinutesAndSeconds(plus) + "</td></tr>";
    }
}

function millisToMinutesAndSeconds(millis) {
    millis = Math.abs(millis);
    let minutes = Math.floor(millis / 60000);
    let seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds + ((millis % 1000) < 99 ? ((millis % 1000) < 9 ? ".00" : ".0") : ".") + parseInt(millis % 1000);
}

body.onkeydown = measurement;
reset.onkeydown = measurement;

change();
console.log(millisToMinutesAndSeconds(61011));