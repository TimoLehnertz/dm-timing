function change(){
    runden.value = parseInt(streckenlänge.value / rundenlänge.value);

    restMeter.value = streckenlänge.value - (runden.value * rundenlänge.value);

    gesSek.value = parseInt(VorgabezeitMin.value * 60) + parseInt(VorgabezeitSek.value);

    kmh.value = streckenlänge.value / 1000 / (gesSek.value / 3600);

    ersteRundeSek.value = parseFloat((gesSek.value / streckenlänge.value) * restMeter.value + startzugabe.value).toFixed(3);

    durchschittZeit.value = ((gesSek.value - ersteRundeSek.value) / runden.value).toFixed(3);

    reset();
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
        this.runden;
    }
    getInfoHtml(){
        let i = 0;
        let info = "<table><tr>";
        for (const key in this) {
            if (this.hasOwnProperty(key) && i > 0) {
                //const element = object[key];
                info += "<td>" + key + "</td>";
            }
            i++;
        }
        info += "</tr><tr>";
        i = 0;
        for (const key in this) {
            if (this.hasOwnProperty(key) && i > 0) {
                info += "<td>" + this[key] + "</td>";
            }
            i++;
        }
        info += "</tr></table>"
        return info
    }

    getLastTime(){
        if(this.measurements.length == 0){
            return 0;
        }
        let length = this.measurements.length;
        return this.measurements[length - 1] - this.measurements[Math.max(0, length - 2)];
    }

    getCurrentTime(){
        return this.measurements[this.measurements.length - 1] - this.measurements[0];
    }

    getLapsLeft(){
        return this.runden - this.measurements.length + 1;
    }
}

/*

*/
function calcTip(rennen){
    let sum = 0;
    for(let i = 0; i < rennen.measurements.length; i++){
        sum += rennen.measurements[i] - rennen.measurements[Math.max(0, i - 1)];
    }
    //übrige meter nach drücken der Leertaste
    //let metersLeft = (rennen.streckenlänge - (Math.max(0, rennen.measurements.length - 2) * rennen.rundenlänge) - (rennen.measurements.length > 1 ? rennen.restMeter : 0));

    let timeLeft = (rennen.vorgabezeitMin * 60 * 1000 + rennen.vorgabezeitSek * 1000) - rennen.getCurrentTime();

    let rundenLeft = rennen.getLapsLeft();

    let tip = timeLeft / rundenLeft;

    tip = tip - rennen.getLastTime();

    if(isNaN(tip)){
        tip = 0;
    }

    plusMinus.innerHTML = "<span>" + millisToSeconds(rennen.getLastTime()) + "</span><br>" +
    (tip < 0 ? "-" : "+") + millisToSeconds(tip);
    
    if(tip < -100){
        rundenÜbrig.style.background ="red";
    } else if(tip > 300){
        rundenÜbrig.style.background ="green";
    } else{
        rundenÜbrig.style.background ="gray";
    }
}

function getSol(lap, rennen){
    return (lap < 2 ? rennen.vorgabeErsteRunde : rennen.vorgabeDurchschittRunde) * 1000;
}

function keyDown(e){
    if(e.keyCode == 27){
        reset();
    } else if(e.keyCode == 112){
        measurement();
    }
}

function measurement(){
    //reset
    if(!started){
        start();
    }
    color = body.style.background;
    body.style.background ="green";
    
    setTimeout(()=>{body.style.background="#DDD";}, 200);
    if(!(restMeter.value > 0 && measumentsTaken < 1)){
        lapsLeft--;
    }
    jetztRennen.measurements.push(performance.now());
    measumentsTaken++;
    updateScreen();
    calcTip(jetztRennen);
    if(lapsLeft == -1){
        finsish();
    }
}

function updateScreen(){    
    rundenÜbrig.innerText = lapsLeft;
    showStats(jetztRennen, result);
}

function grayInputOut(gray){
    for(child of document.getElementById("eingabefeld").childNodes){
        for (const childChild of child.childNodes) {
            childChild.disabled = gray;
        }
    }
}

function start(){
    grayInputOut(true);
    lapsLeft = runden.value;
    measumentsTaken = 0;
    updateScreen();
    started = true;
    jetztRennen = new Rennen();
    jetztRennen.sportler = sportlerName.value;
    jetztRennen.date = Date.now();
    jetztRennen.streckenlänge = streckenlänge.value;
    jetztRennen.rundenlänge = rundenlänge.value;
    jetztRennen.vorgabezeitMin = VorgabezeitMin.value;
    jetztRennen.vorgabezeitSek = VorgabezeitSek.value;
    jetztRennen.startZugabe = startzugabe.value;
    jetztRennen.vorgabeDurchschittRunde = durchschittZeit.value;
    jetztRennen.vorgabeErsteRunde = ersteRundeSek.value;
    jetztRennen.restMeter = restMeter.value;
    jetztRennen.runden = runden.value;
}

function finsish(){ 
    rennen.push(jetztRennen);
    reset();
    alert("Rennen gespeichert");
}

function reset(){
    grayInputOut(false);
    started = false;
    measumentsTaken = 0;
    lapsLeft = runden.value;
    updateScreen();
    jetztRennen = new Rennen();
    
}

function showStats(rennen, table){
    if(rennen == undefined){
        return;
    }
    let innerHTML = "<tr><td>Durchfahrt</td><td>Zeitpunkt</td><td>Zeit</td><td>sol</td><td>plus minus</td></tr>";
    
    for(let i = 1; i - 1 < rennen.runden; i++){
        if(i < rennen.measurements.length){
            let plus = (rennen.measurements[i] - rennen.measurements[Math.max(0, i - 1)]) - getSol(i, rennen);
            innerHTML += "<tr><td>" + i + "</td>"+
            "<td>" + millisToMinutesAndSeconds(rennen.measurements[i] - rennen.measurements[0]) + "</td>"+//Zeitpunkt
            "<td>" + millisToMinutesAndSeconds(rennen.measurements[i] - rennen.measurements[Math.max(0, i - 1)]) + "</td>"+//zeit
            "<td>" + millisToMinutesAndSeconds(getSol(i, rennen)) + "</td>"+//sol
            (plus < 0 ? "<td style='background-color: green;'>-" : "<td style='background-color: red;'>") + millisToMinutesAndSeconds(plus) + "</td>"+
            "</tr>";
        } else{
            innerHTML += "<tr><td>" + i + "</td><td></td><td></td><td></td><td></td></tr>";
        }
    }
    table.innerHTML = innerHTML;
}

function millisToMinutesAndSeconds(millis) {
    millis = Math.abs(millis);
    let minutes = Math.floor(millis / 60000);
    let seconds = parseInt(millis / 1000) % 60;
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds + ((millis % 1000) < 100 ? ((millis % 1000) < 10 ? ".00" : ".0") : ".") + parseInt(millis % 1000);
}

function millisToSeconds(millis) {
    millis = Math.abs(millis);
    let minutes = Math.floor(millis / 60000);
    let seconds = parseInt(millis / 1000) % 60;
    return (seconds < 10 ? '0' : '') + seconds + ((millis % 1000) < 100 ? ((millis % 1000) < 10 ? ".00" : ".0") : ".") + parseInt(millis % 1000);
}

function loadRace(raceId){
    if(rennen.length == 0){
        savedRace.value = 0;
        return;
    }
    raceId = Math.max(0, Math.min(rennen.length - 1, raceId));
    savedRace.value = raceId;
    savedRaceInfo.innerHTML = rennen[raceId].getInfoHtml();
    showStats(rennen[raceId], savedRaceTable);
}

body.onkeydown = keyDown; 
savedRace.onmousedown = function (){
    event.stopPropagation();
}
body.onscroll = scroll;

function scroll(){
    if(window.scrollY > 100){
        title.classList.add("fadeOut");
    } else{
        title.classList.remove("fadeOut");
    }
}
change();
scroll();
//alert(millisToMinutesAndSeconds());