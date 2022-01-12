
var gyroPresent = false; window.addEventListener("devicemotion", function(event){ if(event.rotationRate.alpha || event.rotationRate.beta || event.rotationRate.gamma) gyroPresent = true; }); 
console.log(gyroPresent);

if(gyroPresent){
    document.getElementById("giro").innerHTML = gyroPresent;
}else{
    document.getElementById("giro").innerHTML = gyroPresent;
}

const pvalue1 = () => new Promise(resolve => getValue1(resolve));
const pera = () => console.log("Pera");

function pvalue() {
    return new Promise(function (resolve) {
        getValue1(value => resolve(value));
    });
}

function trigo() {
    let e = window.instanceOfDeviceOrientationEvent;
    var absolute = e.absolute;
    var alpha = instanceOfDeviceOrientationEvent.alpha;
    var beta = instanceOfDeviceOrientationEvent.beta;
    var gamma = instanceOfDeviceOrientationEvent.gamma;
    console.log("absoute: ".absolute);
    console.log("alpha: ".alpha);
    console.log("beta: ".beta);
    console.log("gama: ".gama);
    document.getElementById("absolute").innerHTML = absolute;
    document.getElementById("alpha").innerHTML = alpha;
    document.getElementById("beta").innerHTML = beta;
    document.getElementById("gama").innerHTML = gama;
}


function handleOrientation(event) {
    var absolute = event.absolute;
    var alpha = event.alpha;
    var beta = event.beta;
    var gamma = event.gamma;

    // Do stuff with the new orientation data
}

console.log("Funca")





if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", function(event) {
        // alpha: rotation around z-axis
        var rotateDegrees = event.alpha;
        // gamma: left to right
        var leftToRight = event.gamma;
        // beta: front back motion
        var frontToBack = event.beta;

        handleOrientationEvent(frontToBack, leftToRight, rotateDegrees);
    }, true);
}

var handleOrientationEvent = function(frontToBack, leftToRight, rotateDegrees) {
    // do something amazing
    document.getElementById("absolute").innerHTML = "juan";
};



