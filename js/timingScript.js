function change(){
    if(!validateForm()){
        return;
    }
    runden.value = parseInt(streckenlänge.value / rundenlänge.value);

    restMeter.value = streckenlänge.value - (runden.value * rundenlänge.value);

    gesSek.value = parseInt(VorgabezeitMin.value * 60) + parseInt(VorgabezeitSek.value);

    kmh.value = streckenlänge.value / 1000 / (gesSek.value / 3600);

    ersteRundeSek.value = parseFloat(((gesSek.value / streckenlänge.value) * (parseInt(restMeter.value) == 0 ? rundenlänge.value : restMeter.value)) + parseFloat(startzugabe.value)).toFixed(1);

    durchschittZeit.value = ((gesSek.value - ersteRundeSek.value) / (parseInt(runden.value) - 1)).toFixed(3);

    reset();
}

function validateForm(){
    let validated = true;
    let form = eingabefeld;
    for (const key of form.childNodes) {
        for (const iterator of key.childNodes) {
            if(iterator.type == "number"){
                if(Number.isNaN(parseInt(iterator.value))){
                    console.log("wrong type " + typeof iterator.value);
                    validated = false;
                    iterator.style.border = "3px solid red";
                } else{
                    iterator.style.border = "2px solid gray";
                }
            }
        }
    }
    if(validated){
        warnings.innerText = "";
    }else{
        warnings.innerText = "Bitte werte überprüfen";
    }
    return validated;
}

function changeTrigger(){
    setKey = true;
    document.getElementById("pressKey").style.display = "block";
    triggerButton.blur();
}

let triggerKey = 32;
let setKey = false;

let lapsLeft = 3;
let started = false;
let measumentsTaken = 0;

let rennen = [];
let jetztRennen;

let enterFullscreenOnStart = true;


function keyDown(e){
    if(e.keyCode == 27){
        reset();
        setKey = false;
        document.getElementById("pressKey").style.display = "none";
    } else if(setKey){
        triggerKey = e.keyCode;
        setKey = false;
        document.getElementById("pressKey").style.display = "none";
        document.getElementById("triggerKey").innerText = keyboardMap[e.keyCode];
        document.getElementById("readyStart").innerText = "Press " + keyboardMap[e.keyCode] + " to start";
    } else if(e.keyCode == triggerKey && !setKey){
        measurement();
    } else if(e.keyCode == 18){
        deleteLastTrigger();
    }
}

function play() { 
    var audio = new Audio("static/sounds/beep.wav"); 
    audio.play(); 
} 

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

    if(isNaN(tip) || rundenLeft < 1){
        tip = timeLeft;
    }

    console.log("-------------");
    console.log("rundenLeft: " + rundenLeft);
    console.log("timeLeft: " + timeLeft);

    plusMinus.innerHTML = "<span>" + millisToSeconds(rennen.getLastTime()) + "</span><span style='font-size: 20pt;'>      (Laptime)</span><br>" +
    (tip < 0 ? "-" : "+") + millisToSeconds(tip) + "<span style='font-size: 20pt;'>    (Tip)</span>";
    
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

function measurement(atTime){
    if(atTime == undefined && document.getElementById("lichtschranke").checked){ //needed for lischtschrankentriggering
        return;
    }
    if(atTime != undefined && document.getElementById("local").checked){
        return;
    }
    play();
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
    if(atTime == undefined && document.getElementById("local").checked){//(Local keypress)
        jetztRennen.measurements.push(performance.now());
        console.log("local trigger")
    } else if(atTime != undefined){
        jetztRennen.measurements.push(atTime);
        console.log("ls trigger")
    }
    
    measumentsTaken++;
    updateScreen();
    calcTip(jetztRennen);
    if(lapsLeft == -1){
        finsish();
    }
    
}

function deleteLastTrigger(){
    if(jetztRennen != undefined && jetztRennen.measurements.length > 1){
        jetztRennen.measurements.splice(-1,1);
        lapsLeft++;
        updateScreen();
        calcTip(jetztRennen);
    }
    document.getElementById("deleteLastTriggerBtn").blur();
}

function updateScreen(){
    if(jetztRennen.runden == undefined){
        rundenÜbrig.innerText = "0";
    } else{
        rundenÜbrig.innerText = Math.min(jetztRennen.runden, parseInt(lapsLeft) + 1);
    }
    showStats(jetztRennen, result);
}

function grayInputOut(gray){
    for(child of document.getElementById("eingabefeld").childNodes){
        for (const childChild of child.childNodes) {
            childChild.disabled = gray;
        }
    }
    document.getElementById("local").disabled = gray;
    document.getElementById("lichtschranke").disabled = gray;
}

function enterFullscreenChanged(){
    enterFullscreenOnStart = document.getElementById("enterFullscreen").checked;
}

function start(){
    document.getElementById("middle").scrollIntoView();
    document.getElementById("readyStart").style.display = "none";
    grayInputOut(true);
    lapsLeft = runden.value;
    measumentsTaken = 0;
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
    updateScreen();
    if(enterFullscreenOnStart){
        enterFullscreen(document.documentElement);
    }
    //setInterval(()=>{measurement()}, 1000);
}

function finsish(){
    rennen.push(jetztRennen);
    reset();
    alert("Rennen gespeichert");
    document.getElementById("readyStart").style.display = "block";
}

function reset(){
    grayInputOut(false);
    started = false;
    measumentsTaken = 0;
    lapsLeft = runden.value;
    jetztRennen = new Rennen();
    document.getElementById("readyStart").style.display = "block";
}

function showStats(rennen, table){
    if(rennen == undefined){
        return;
    }
    let innerHTML = "<tr><td>Durchfahrt</td><td>Zeitpunkt</td><td>Zeit</td><td>sol</td><td>plus minus</td></tr>";
    
    for(let i = 1; i - 1 < rennen.runden; i++){
        if(i < rennen.measurements.length){
            let plus = (rennen.measurements[i] - rennen.measurements[Math.max(0, i - 1)]) - getSol(i, rennen);
            innerHTML += "<tr" + ((i % 2 == 0) ? " class='zebra'" : "") + "><td>" + i + "</td>"+
            "<td>" + millisToMinutesAndSeconds(rennen.measurements[i] - rennen.measurements[0]) + "</td>"+//Zeitpunkt
            "<td>" + millisToMinutesAndSeconds(rennen.measurements[i] - rennen.measurements[Math.max(0, i - 1)]) + "</td>"+//zeit
            "<td>" + millisToMinutesAndSeconds(getSol(i, rennen)) + "</td>"+//sol
            (plus < 0 ? "<td style='background-color: green;'>-" : "<td style='background-color: red;'>") + millisToMinutesAndSeconds(plus) + "</td>"+
            "</tr>";
        } else{
            innerHTML += "<tr><td>" + i + "</td><td></td><td></td><td>" + millisToMinutesAndSeconds(getSol(i, rennen)) + "</td><td></td></tr>";
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

enterFullscreenChanged();

function enterFullscreen(element) {
    if(element.requestFullscreen) {
      element.requestFullscreen();
    } else if(element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if(element.msRequestFullscreen) {
      element.msRequestFullscreen();
    } else if(element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    }
  }

function scroll(){
    if(window.scrollY > 100){
        title.classList.add("fadeOut");
    } else{
        title.classList.remove("fadeOut");
    }
}
reset();
change();
scroll();

window.addEventListener('keydown', function(e) {
    if(e.keyCode == 32 && e.target == document.body) {
      e.preventDefault();
    }
  });

function downloadTable(){
    exportTableToExcel("savedRaceTable", rennen[savedRace.value].sportlerName);
}

function exportTableToExcel(tableID, filename = ''){
    var downloadLink;
    var dataType = 'application/vnd.ms-excel';
    var tableSelect = document.getElementById(tableID);
    var tableHTML = tableSelect.outerHTML.replace(/ /g, '%20');

    // Specify file name
    filename = filename?filename+'.xls':'excel_data.xls';

    // Create download link element
    downloadLink = document.createElement("a");

    document.body.appendChild(downloadLink);

    if(navigator.msSaveOrOpenBlob){
        var blob = new Blob(['\ufeff', tableHTML], {
            type: dataType
        });
        navigator.msSaveOrOpenBlob( blob, filename);
    }else{
        // Create a link to the file
        downloadLink.href = 'data:' + dataType + ', ' + tableHTML;

        // Setting the file name
        downloadLink.download = filename;
        
        //triggering the function
        downloadLink.click();
    }
}

onNewtriggger(function(csv){measurement(csv[csv.length - 2]);});

  var keyboardMap = [
    "", // [0]
    "", // [1]
    "", // [2]
    "CANCEL", // [3]
    "", // [4]
    "", // [5]
    "HELP", // [6]
    "", // [7]
    "BACK_SPACE", // [8]
    "TAB", // [9]
    "", // [10]
    "", // [11]
    "CLEAR", // [12]
    "ENTER", // [13]
    "ENTER_SPECIAL", // [14]
    "", // [15]
    "SHIFT", // [16]
    "CONTROL", // [17]
    "ALT", // [18]
    "PAUSE", // [19]
    "CAPS_LOCK", // [20]
    "KANA", // [21]
    "EISU", // [22]
    "JUNJA", // [23]
    "FINAL", // [24]
    "HANJA", // [25]
    "", // [26]
    "ESCAPE", // [27]
    "CONVERT", // [28]
    "NONCONVERT", // [29]
    "ACCEPT", // [30]
    "MODECHANGE", // [31]
    "SPACE", // [32]
    "PAGE_UP", // [33]
    "PAGE_DOWN", // [34]
    "END", // [35]
    "HOME", // [36]
    "LEFT", // [37]
    "UP", // [38]
    "RIGHT", // [39]
    "DOWN", // [40]
    "SELECT", // [41]
    "PRINT", // [42]
    "EXECUTE", // [43]
    "PRINTSCREEN", // [44]
    "INSERT", // [45]
    "DELETE", // [46]
    "", // [47]
    "0", // [48]
    "1", // [49]
    "2", // [50]
    "3", // [51]
    "4", // [52]
    "5", // [53]
    "6", // [54]
    "7", // [55]
    "8", // [56]
    "9", // [57]
    "COLON", // [58]
    "SEMICOLON", // [59]
    "LESS_THAN", // [60]
    "EQUALS", // [61]
    "GREATER_THAN", // [62]
    "QUESTION_MARK", // [63]
    "AT", // [64]
    "A", // [65]
    "B", // [66]
    "C", // [67]
    "D", // [68]
    "E", // [69]
    "F", // [70]
    "G", // [71]
    "H", // [72]
    "I", // [73]
    "J", // [74]
    "K", // [75]
    "L", // [76]
    "M", // [77]
    "N", // [78]
    "O", // [79]
    "P", // [80]
    "Q", // [81]
    "R", // [82]
    "S", // [83]
    "T", // [84]
    "U", // [85]
    "V", // [86]
    "W", // [87]
    "X", // [88]
    "Y", // [89]
    "Z", // [90]
    "OS_KEY", // [91] Windows Key (Windows) or Command Key (Mac)
    "", // [92]
    "CONTEXT_MENU", // [93]
    "", // [94]
    "SLEEP", // [95]
    "NUMPAD0", // [96]
    "NUMPAD1", // [97]
    "NUMPAD2", // [98]
    "NUMPAD3", // [99]
    "NUMPAD4", // [100]
    "NUMPAD5", // [101]
    "NUMPAD6", // [102]
    "NUMPAD7", // [103]
    "NUMPAD8", // [104]
    "NUMPAD9", // [105]
    "MULTIPLY", // [106]
    "ADD", // [107]
    "SEPARATOR", // [108]
    "SUBTRACT", // [109]
    "DECIMAL", // [110]
    "DIVIDE", // [111]
    "F1", // [112]
    "F2", // [113]
    "F3", // [114]
    "F4", // [115]
    "F5", // [116]
    "F6", // [117]
    "F7", // [118]
    "F8", // [119]
    "F9", // [120]
    "F10", // [121]
    "F11", // [122]
    "F12", // [123]
    "F13", // [124]
    "F14", // [125]
    "F15", // [126]
    "F16", // [127]
    "F17", // [128]
    "F18", // [129]
    "F19", // [130]
    "F20", // [131]
    "F21", // [132]
    "F22", // [133]
    "F23", // [134]
    "F24", // [135]
    "", // [136]
    "", // [137]
    "", // [138]
    "", // [139]
    "", // [140]
    "", // [141]
    "", // [142]
    "", // [143]
    "NUM_LOCK", // [144]
    "SCROLL_LOCK", // [145]
    "WIN_OEM_FJ_JISHO", // [146]
    "WIN_OEM_FJ_MASSHOU", // [147]
    "WIN_OEM_FJ_TOUROKU", // [148]
    "WIN_OEM_FJ_LOYA", // [149]
    "WIN_OEM_FJ_ROYA", // [150]
    "", // [151]
    "", // [152]
    "", // [153]
    "", // [154]
    "", // [155]
    "", // [156]
    "", // [157]
    "", // [158]
    "", // [159]
    "CIRCUMFLEX", // [160]
    "EXCLAMATION", // [161]
    "DOUBLE_QUOTE", // [162]
    "HASH", // [163]
    "DOLLAR", // [164]
    "PERCENT", // [165]
    "AMPERSAND", // [166]
    "UNDERSCORE", // [167]
    "OPEN_PAREN", // [168]
    "CLOSE_PAREN", // [169]
    "ASTERISK", // [170]
    "PLUS", // [171]
    "PIPE", // [172]
    "HYPHEN_MINUS", // [173]
    "OPEN_CURLY_BRACKET", // [174]
    "CLOSE_CURLY_BRACKET", // [175]
    "TILDE", // [176]
    "", // [177]
    "", // [178]
    "", // [179]
    "", // [180]
    "VOLUME_MUTE", // [181]
    "VOLUME_DOWN", // [182]
    "VOLUME_UP", // [183]
    "", // [184]
    "", // [185]
    "SEMICOLON", // [186]
    "EQUALS", // [187]
    "COMMA", // [188]
    "MINUS", // [189]
    "PERIOD", // [190]
    "SLASH", // [191]
    "BACK_QUOTE", // [192]
    "", // [193]
    "", // [194]
    "", // [195]
    "", // [196]
    "", // [197]
    "", // [198]
    "", // [199]
    "", // [200]
    "", // [201]
    "", // [202]
    "", // [203]
    "", // [204]
    "", // [205]
    "", // [206]
    "", // [207]
    "", // [208]
    "", // [209]
    "", // [210]
    "", // [211]
    "", // [212]
    "", // [213]
    "", // [214]
    "", // [215]
    "", // [216]
    "", // [217]
    "", // [218]
    "OPEN_BRACKET", // [219]
    "BACK_SLASH", // [220]
    "CLOSE_BRACKET", // [221]
    "QUOTE", // [222]
    "", // [223]
    "META", // [224]
    "ALTGR", // [225]
    "", // [226]
    "WIN_ICO_HELP", // [227]
    "WIN_ICO_00", // [228]
    "", // [229]
    "WIN_ICO_CLEAR", // [230]
    "", // [231]
    "", // [232]
    "WIN_OEM_RESET", // [233]
    "WIN_OEM_JUMP", // [234]
    "WIN_OEM_PA1", // [235]
    "WIN_OEM_PA2", // [236]
    "WIN_OEM_PA3", // [237]
    "WIN_OEM_WSCTRL", // [238]
    "WIN_OEM_CUSEL", // [239]
    "WIN_OEM_ATTN", // [240]
    "WIN_OEM_FINISH", // [241]
    "WIN_OEM_COPY", // [242]
    "WIN_OEM_AUTO", // [243]
    "WIN_OEM_ENLW", // [244]
    "WIN_OEM_BACKTAB", // [245]
    "ATTN", // [246]
    "CRSEL", // [247]
    "EXSEL", // [248]
    "EREOF", // [249]
    "PLAY", // [250]
    "ZOOM", // [251]
    "", // [252]
    "PA1", // [253]
    "WIN_OEM_CLEAR", // [254]
    "" // [255]
  ];

  document.getElementById("triggerKey").innerText = keyboardMap[triggerKey];

  document.getElementById("readyStart").innerText = "Press " + keyboardMap[triggerKey] + " to start";
