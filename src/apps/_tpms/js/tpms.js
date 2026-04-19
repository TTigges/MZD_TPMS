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
// Menu
var menuLayer = false; // false = no menu / true = menu
var menu = ["setupBtn", "configBtn", "targetPressure", "closeMenuBtn"];
var menuSelector;
// Setup Tire IDs
var setupLayer = false; // false = no setup menu / 1 = setup open / 2 = assign IDs
var setupItems = ["SetupIDBox1", "SetupIDBox2", "SetupIDBox3", "SetupIDBox4",
                  "SetupIDClear", "SetupIDReset", "SetupIDSwitch", "SetupIDSave",
                  "CloseSetup"];
var setupItemSelected;
var availableIds = [];
var availableIdsSelector;
var tempSaved = {fl: "", fr: "", rl: "", rr: ""};
var saveTireIDs = false;
var message  = false;
var warnings = [
    "Es liegen nicht alle vier Sensor-IDs vor.",
    "Es wurden noch nicht alle vier Sensor-IDs zugeordnet.",
    "Die Einstellungen wurden gespeichert.<br>Es kann einen Moment dauern, bis die Änderungen wirksam werden."
];
// Target Pressure
var targetPressureLayer = false;
var targetPressureValue;
//
var labelForId = "ID";
var labelPres  = "bar";
var labelTemp  = "°C";
// Configuration
var configLayer = false;
var configItems = ["ConfigTempUnit", "ConfigPressUnit", "ConfigDecUnit", "ConfigColorScale", "ConfigBarScale", "ConfigWarnDiff", "ConfigStatusPreview", "CloseConfig"];
var configItemSelected;
var configItemEditing = false;
var displayCarOptions = ["car1", "car2", "car3"];
var displayCarColorOptions = ["white", "black", "red", "blue"];
// get pressureSettings from localStorage or use defaults
var pressureSettings = {
    normal: 2.00,
    colorScale: 6,
    barScale: 6,
    warnThreshold: 20,
    previewRange: 20
};
try {
    var storedSettings = localStorage.getItem("pressureSettings");
    if (storedSettings) {
        var parsed = JSON.parse(storedSettings);
        if (parsed && typeof parsed.normal === 'number') { pressureSettings.normal = parsed.normal; }
        if (parsed && typeof parsed.colorScale === 'number') { pressureSettings.colorScale = parsed.colorScale; }
        if (parsed && typeof parsed.warnThreshold === 'number') { pressureSettings.warnThreshold = parsed.warnThreshold; }
        else if (parsed && typeof parsed.warnDiff === 'number') { pressureSettings.warnThreshold = Math.round(parsed.warnDiff * 100); }
        if (parsed && typeof parsed.barScale === 'number') { pressureSettings.barScale = parsed.barScale; }
        if (parsed && typeof parsed.previewRange === 'number') { pressureSettings.previewRange = parsed.previewRange; }
    }
} catch(e) {}
var warnMin = pressureSettings.normal * (1 - pressureSettings.warnThreshold / 100);
var warnMax = pressureSettings.normal * (1 + pressureSettings.warnThreshold / 100);

// TBD: Config-file necessary? localStorage seems sufficient for now, especially with pressureSettings object
var tempIsF = false; // false = °C, true = °F
var pressIsPsi = false; // false = bar, true = psi
var decIsComma = true; // false = decimal point, true = decimal comma
try {
    var storedConfig = localStorage.getItem("tpmsConfig");
    if (storedConfig) {
        var parsedConfig = JSON.parse(storedConfig);
        if (parsedConfig && typeof parsedConfig.tempIsF === 'boolean') { tempIsF = parsedConfig.tempIsF; }
        if (parsedConfig && typeof parsedConfig.pressIsPsi === 'boolean') { pressIsPsi = parsedConfig.pressIsPsi; }
        if (parsedConfig && typeof parsedConfig.decIsComma === 'boolean') { decIsComma = parsedConfig.decIsComma; }
    }
} catch(e) {}

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
            }
        } else {
            oilTemp = "-";
		}
        // Exponentional Moving Average for smoother display
        if (oilTemp !== "-" && oilTemp !== 0) {
            if (!updateOilTemp.prev) {
                updateOilTemp.prev = oilTemp;
            } else {
                oilTemp = 0.25 * oilTemp + 0.75 * updateOilTemp.prev;
                updateOilTemp.prev = oilTemp;
            }
        }

        $('#oilTemperatureValue').html(parseFloat(oilTemp.toFixed(0)).toString().replace(".",","));
    }
    // --------------------------------------------------------------------------
    // Update Oil Pressure
    // --------------------------------------------------------------------------
    function updateOilPres(value) {
		value = parseFloat(value).toFixed(2);
        // Exponentional Moving Average for smoother display
        if (value !== "-" && value !== 0) {
            if (!updateOilPres.prev) {
                updateOilPres.prev = value;
            } else {
                value = 0.4 * value + 0.6 * updateOilPres.prev;
                updateOilPres.prev = value;
            }
        }
		$('#oilPressureValue').html(parseFloat(value).toFixed(1).toString().replace(".",","));
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
  var maxHeight = 57;
  const scale = 2.0 - (pressureSettings.barScale - 1) * (1.9 / 9);
  return maxHeight - maxHeight * (
    0.5 - ((value - pressureSettings.normal) / (scale * 2))
  );
}

function perc2color(value) {
    // calculate difference of sensor value to normal pressure
    var diff = Math.abs(pressureSettings.normal - value); // Calculate absolute difference
    diff = (diff / pressureSettings.normal) * 100;
    const scale = 40 - (pressureSettings.colorScale - 1) * (25 / 7);
    diff = Math.min(diff * (100 / scale), 100);
    //diff = Math.min(diff * (100 / pressureSettings.colorScale), 100); // Apply a multiplier depending on colorScale
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
