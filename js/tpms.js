var outsideTemp = 0.00;
var tpmsFlTemp = 0.00;
var tpmsFlPres = 0.00;
var tpmsFrTemp = 0.00;
var tpmsFrPres = 0.00;
var tpmsRlTemp = 0.00;
var tpmsRlPres = 0.00;
var tpmsRrTemp = 0.00;
var tpmsRrPres = 0.00;
var tpmsLayout = null;

// TBD: get from json
var pressureSettings = {
	normal: 2.00,
	warnDiff: 0.3,
	multiplier: 6, // can be modified to have the color change earlier or later to yellow/orange/red
	range: 0.5
};
var warnMin = pressureSettings.normal - pressureSettings.warnDiff;
var warnMax = pressureSettings.normal + pressureSettings.warnDiff;

// TBD: Config-file necessary?
tempIsF = false;
pressIsPsi = false;

$(document).ready(function() {
    // websocket
    // --------------------------------------------------------------------------
    function retrievedata(action) {
        var tpmsWebsocket = new WebSocket("ws://127.0.0.1:9969/");
        tpmsWebsocket.onmessage = function(event) {
            var res = event.data.split("#");
            switch (res[0]) {
                case "envData":
                    updateOutsideTemp(res[4]);
                    updateTireTemp("Fl", res[12]);
                    updateTirePres("Fl", res[13]);
                    updateTireTemp("Fr", res[14]);
                    updateTirePres("Fr", res[15]);
                    updateTireTemp("Rl", res[16]);
                    updateTirePres("Rl", res[17]);
                    updateTireTemp("Rr", res[18]);
                    updateTirePres("Rr", res[19]);
                    break;
                default:
                    break;
            }
        };
        tpmsWebsocket.onopen = function() {
            tpmsWebsocket.send(action);
        };
        tpmsWebsocket.onerror = function(e) {
            console.log("err: " + e.toString());
        };
    }
    // --------------------------------------------------------------------------
    // websocket end
    // --------------------------------------------------------------------------
    //
    // BEGINN TPMS UPDATES
    //
	// --------------------------------------------------------------------------
	function updateTireTemp(pos, value) {
		value = parseFloat(value); // parseInt?
		$('#'+pos+'Temperature').html(value); // value is float
	}
	function updateTirePres(pos, value) {
		value = parseFloat(value).toFixed(2);

		// write value
		$('#'+pos+'Pressure').html(value.toString().replace(".",","));

		var diff = calcOffset(value); // || 0;

		var color =  perc2color(diff); // || "00ff00";
		var height = pixelPosition(value); // || 28.5;
		$('#'+pos+'Bar').css({'background': color, 'height': height+'px'});

		var tireClass = value <= warnMin || value >= warnMax ? "tire warning" : "tire normal";
		$('#'+pos+'Tire').attr("class", tireClass);

		var scaleClass = value > pressureSettings.normal ? "scale scalenorm black" : "scale scalenorm";
		$('.scalenorm').attr("class", scaleClass);

	}
    // --------------------------------------------------------------------------
    //
    // END TPMS UPDATES
    //
    // --------------------------------------------------------------------------
    // --------------------------------------------------------------------------
    // Update Outside Temperature
    // --------------------------------------------------------------------------
    function updateOutsideTemp(outTemp) {
        outTemp = $.trim(outTemp);
        if ($.isNumeric(outTemp) && outTemp !== "0") {
            outsideTemp = outTemp -= 40;
            if (tempIsF) {
                outTemp = outTemp * 1.8 + 32;
                outsideTemp = parseFloat(outTemp.toFixed(1));
            }
            /*outsideTemp += "&deg;";*/
        } else {
            outsideTemp = "-";
		}
        $('#outSideTemperatureValue').html(outsideTemp);
    }

    // Start data retrieval
    setTimeout(function() {
    retrievedata('envData');
    }, 10000);
});

// TBD: Swap Tire Positions? See Speedometer
// SaveSpeedBarLayout();
// No need to save layout, only save order of IDs




function pixelPosition(value) {
	var maxHeight = 57; // tire / bar height in px
	return maxHeight - maxHeight * ( 0.5 - (( value - pressureSettings.normal ) / ( pressureSettings.range * 2 )));
}
function calcOffset(value) {
    return diff = pressureSettings.normal === value ? 0 : pressureSettings.normal > value ? pressureSettings.normal - value : value - pressureSettings.normal, diff *= pressureSettings.multiplier, diff > 100 && (diff = 100), diff / pressureSettings.normal * 100;
}
function perc2color(diff) {
    var n, e;
    return diff < 50 ? (e = 255, n = Math.round(5.1 * diff)) : (n = 255, e = Math.round(510 - 5.1 * diff)), "#" + ("000000" + (65536 * n + 256 * e + 0).toString(16)).slice(-6);
}



utility.loadScript('apps/_tpms/js/tpmsUpdate.js')
