var tpms = true;
var outsideTemp = 0;
var sensorData = [
    { pos: "fl", id: "", pres: 0.00, temp: 0 },
    { pos: "fr", id: "", pres: 0.00, temp: 0 },
    { pos: "rl", id: "", pres: 0.00, temp: 0 },
    { pos: "rr", id: "", pres: 0.00, temp: 0 }
];
//
var debugContainer = false;
var debugLine = 1;
var debugIds  = 0;
//
var setupLayer = false; // false = no setup / 1 = setup / 2 = tire ID selection / 3 = configuration
var setupItems = ["SetupIDBox1", "SetupIDBox2", "SetupIDBox3", "SetupIDBox4",
                  "SetupIDClear", "SetupIDReset", "SetupIDSwitch", "SetupIDSave",
                  "CloseSetup"];
var setupItemSelected;
var availableIds = [];
var availableIdsSelector;
var tempSaved = {fl: "", fr: "", rl: "", rr: ""};
var saveTireIDs = false;
//
var labelForId = "ID";
var labelPres  = "bar";
var labelTemp  = "°C";
//
var message  = false;
var warnings = [
    "Es liegen nicht alle vier Sensor-IDs vor.",
    "Es wurden noch nicht alle vier Sensor-IDs zugeordnet.",
    "Die Einstellungen wurden gespeichert.<br>Es kann einen Moment dauern, bis die Änderungen wirksam werden."
];

// TBD: get from json
var pressureSettings = {
	normal: 2.00,
    treshold: 25,
	warnDiff: 0.3,
	multiplier: 1, // can be modified to have the color change earlier or later to yellow/orange/red
	range: 0.5
};
var warnMin = pressureSettings.normal - pressureSettings.warnDiff;
var warnMax = pressureSettings.normal + pressureSettings.warnDiff;

// TBD: Config-file necessary?
tempIsF = false;
pressIsPsi = false;

$(document).ready(function() {
    debugUpdate("Initialize TPMS");
    // SSE connection to usbget2 daemon
    // --------------------------------------------------------------------------
    function startSSE() {
        var source = new EventSource("http://127.0.0.1:9970/stream");

        source.onmessage = function(event) {
            var data;
            try {
                data = JSON.parse(event.data);
            } catch(e) {
                return;
            }

            if (data.tpms) {
                for (var i = 0; i < 4; i++) {
                    var s = data.tpms[i.toString()];
                    if (s) {
                        sensorData[i].id   = s.id;
                        sensorData[i].temp = s.t;
                        sensorData[i].pres = s.p;
                    }
                }
                runUpdate();
            }

            if (data.oil) {
                updateOilTemp(data.oil.t);
                updateOilPres(data.oil.p);
            }

            if (saveTireIDs) {
                saveTireIDs = false;
                saveConfig();
            }
        };

        source.onerror = function() {
            if (debugContainer) {
                debugUpdate("SSE connection error");
            }
        };
    }

    function saveConfig() {
        var body = JSON.stringify({
            tpms: {
                fl: tempSaved.fl,
                fr: tempSaved.fr,
                rl: tempSaved.rl,
                rr: tempSaved.rr
            }
        });
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://127.0.0.1:9970/config", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                AddDebug("Config gespeichert: " + xhr.status);
                debugIds = 0;
            }
        };
        xhr.send(body);
    }
    // --------------------------------------------------------------------------
    // SSE end
    // --------------------------------------------------------------------------
    //
    // BEGINN TPMS UPDATES
    //
	// --------------------------------------------------------------------------
    function runUpdate() {
        sensorData.forEach(function(set){
            updateTireTemp(set.pos, set.temp);
            updateTirePres(set.pos, set.pres);

        });
        if (debugIds === 0 && sensorData[0].id != "-" && sensorData[1].id != "-" && sensorData[2].id != "-" && sensorData[3].id != "-") {
            debugUpdate("<span class=\"z\">" + debugLine + "</span> IDs FL: " + sensorData[0].id + " FR: " + sensorData[1].id + " RL: " + sensorData[2].id + " RR: " + sensorData[3].id)
            debugIds ++;
        }
    }
	function updateTireTemp(pos, value) {
        if (tempIsF) {
            value = value * 1.8 + 32;
            value = parseFloat(value.toFixed(1));
        }
        else {
            value = parseFloat(value); // parseInt?
        }
		$('#'+pos+'Temperature').html(value); // value is float
	}
	function updateTirePres(pos, value) {
		value = parseFloat(value).toFixed(2);

		// write value
		$('#'+pos+'Pressure').html(value.toString().replace(".",","));

		var color =  perc2color(value); // || "00ff00";
		var height = pixelPosition(value); // || 28.5;
		$('#'+pos+'Bar').css({'background': color, 'height': height+'px'});

		var tireClass = value <= warnMin || value >= warnMax ? "tire warning" : "tire normal";
		$('#'+pos+'Tire').attr("class", tireClass);

		var scaleClass = value > pressureSettings.normal ? "scale scalenorm black" : "scale scalenorm";
		$('#'+pos+'ScaleNorm').attr("class", scaleClass);

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
            outTemp = outTemp -= 40;
            if (tempIsF) {
                outTemp = outTemp * 1.8 + 32;
                outTemp = parseFloat(outTemp.toFixed(1));
            }
            /*outTemp += "&deg;";*/
        } else {
            outTemp = "-";
		}
        $('#outSideTemperatureValue').html(outTemp);
    }
    // --------------------------------------------------------------------------
    // Update Coolant Temperature
    // --------------------------------------------------------------------------
    function updateCoolantTemp(coolantTemp) {
        coolantTemp = $.trim(coolantTemp);
        if ($.isNumeric(coolantTemp) && coolantTemp !== "0") {
            coolantTemp = coolantTemp -= 40;
            if (tempIsF) {
                coolantTemp = coolantTemp * 1.8 + 32;
                coolantTemp = parseFloat(coolantTemp.toFixed(1));
            }
            /*coolantTemp += "&deg;";*/
        } else {
            coolantTemp = "-";
		}
        $('#coolantTemperatureValue').html(coolantTemp);
    }
    // --------------------------------------------------------------------------
    // Update Oil Temperature
    // --------------------------------------------------------------------------
    function updateOilTemp(oilTemp) {
        oilTemp = $.trim(oilTemp);
        if ($.isNumeric(oilTemp) && oilTemp !== "0") {
            if (tempIsF) {
                oilTemp = oilTemp * 1.8 + 32;
                oilTemp = parseFloat(oilTemp.toFixed(1));
            }
            /*oilTemp += "&deg;";*/
        } else {
            oilTemp = "-";
		}
        $('#oilTemperatureValue').html(oilTemp);
    }
    // --------------------------------------------------------------------------
    // Update Oil Pressure
    // --------------------------------------------------------------------------
    function updateOilPres(value) {
		value = parseFloat(value).toFixed(2);
		$('#oilPressureValue').html(value.toString().replace(".",","));
    }

    // WebSocket for vehicle data (envData via speedometer.sh / websocketd :9969)
    // --------------------------------------------------------------------------
    function startEnvData() {
        var ws = new WebSocket("ws://127.0.0.1:9969/");
        ws.onopen = function() {
            ws.send("envData");
        };
        ws.onmessage = function(event) {
            var res = event.data.split("#");
            if (res[0] === "envData") {
                updateOutsideTemp(res[4]);
                updateCoolantTemp(res[6]);
            }
        };
        ws.onerror = function() {};
        ws.onclose = function() {
            setTimeout(startEnvData, 5000); // reconnect on close
        };
    }
    // --------------------------------------------------------------------------

    // Start SSE stream and vehicle data
    setTimeout(function() {
        startSSE();
        startEnvData();
    }, 3000);
});

function pixelPosition(value) {
	var maxHeight = 57; // tire / bar height in px // TBD: Depending on car image <= CSS
	return maxHeight - maxHeight * ( 0.5 - (( value - pressureSettings.normal ) / ( pressureSettings.range * 2 )));
}

function perc2color(value) {
    // calculate difference of sensor value to normal pressure
    var diff = Math.abs(pressureSettings.normal - value); // Calculate absolute difference
    // diff = diff * pressureSettings.multiplier; // Apply multiplier
    diff = (diff / pressureSettings.normal) * 100;
    diff = Math.min(diff * (100 / pressureSettings.treshold), 100); // Apply a multiplier depending on treshold
    // color calculation green to yellow to red
    var n, e;
    if (diff < 50) {
        e = 255;
        n = Math.round(5.1 * diff);
    } else {
        n = 255;
        e = Math.round(255 - 5.1 * (diff - 50)); // Adjust calculation for green component
    }
    return "#" + ("000000" + (65536 * n + 256 * e + 0).toString(16)).slice(-6);
}

function debugUpdate(msg) {
    var content = $("#debugContainer").html();
    content += "<span class=\"z\">" + debugLine + "</span> " + msg + "<br>";
    debugLine ++;
    $("#debugContainer").html(content);
}

utility.loadScript('apps/_tpms/js/tpmsUpdate.js')
