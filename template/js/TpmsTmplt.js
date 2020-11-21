/*
 * TPMS App v1
 * 2020 by Torben Tigges
 * only works with usbget:
 * https://github.com/TTigges/mzd-usb-sensors
 */

log.addSrcFile("TpmsTmplt.js", "tpms");

function TpmsTmplt(uiaId, parentDiv, templateID, controlProperties) {
    
    this.divElt = null;
    this.templateName = "TpmsTmplt";
    this.onScreenClass = "TpmsTmplt";

    log.debug("  templateID in TpmsTmplt constructor: " + templateID);

    //@formatter:off
    //set the template properties
    this.properties = {
        "statusBarVisible": true,
        "leftButtonVisible": false,
        "rightChromeVisible": false,
        "hasActivePanel": false,
        "isDialog": false
    };
    //@formatter:on

    
    this.longholdTimeout = null;
    // create the div for template
    this.divElt = document.createElement('div');
    this.divElt.id = templateID;
    this.divElt.className = "TemplateWithStatus TpmsTmplt";

    parentDiv.appendChild(this.divElt);

    this.divElt.innerHTML = '<!-- MZD TPMS App v1 -->' +
    '<div id="TpmsContainer">' +
    '  <div id="InfoLayer">' +
    //   Front Left
    '    <div id="Fl" class="tireContainer front left">' +
    '      <div id="FlTire" class="tire"></div>' +
    '      <div class="barGraph">' +
    '        <div id="FlBar" class="bar"></div>' +
    '        <div class="scale scalenorm"></div>' +
    '        <div class="scale scalewarn scalelow"></div>' +
    '        <div class="scale scalewarn scalehigh"></div>' +
    '      </div>' +
    '      <div class="pressure">' +
    '        <span id="FlPressure" class="pressureValue">-</span> ' +
    '        <span class="pressureUnit">bar</span>' +
    '      </div>' +
    '      <div class="temperature">' +
    '        <span id="FlTemperature" class="temperatureValue">-</span>' +
    '        <span class="temperatureUnit">°C</span>' +
    '      </div>' +
    '    </div>' +
    //   Front Right
    '    <div id="Fr" class="tireContainer front right">' +
    '      <div id="Frtire" class="tire"></div>' +
    '      <div class="barGraph">' +
    '        <div id="FrBar" class="bar"></div>' +
    '        <div class="scale scalenorm"></div>' +
    '        <div class="scale scalewarn scalelow"></div>' +
    '        <div class="scale scalewarn scalehigh"></div>' +
    '      </div>' +
    '      <div class="pressure">' +
    '        <span id="FrPressure" class="pressureValue">-</span> ' +
    '        <span class="pressureUnit">bar</span>' +
    '      </div>' +
    '      <div class="temperature">' +
    '        <span id="FrTemperature" class="temperatureValue">-</span>' +
    '        <span class="temperatureUnit">°C</span>' +
    '      </div>' +
    '    </div>' +
    //   Rear Left
    '    <div id="Rl" class="tireContainer rear left">' +
    '      <div id="Rltire" class="tire"></div>' +
    '      <div class="barGraph">' +
    '        <div id="RlBar" class="bar"></div>' +
    '        <div class="scale scalenorm"></div>' +
    '        <div class="scale scalewarn scalelow"></div>' +
    '        <div class="scale scalewarn scalehigh"></div>' +
    '      </div>' +
    '      <div class="pressure">' +
    '        <span id="RlPressure" class="pressureValue">-</span> ' +
    '        <span class="pressureUnit">bar</span>' +
    '      </div>' +
    '      <div class="temperature">' +
    '        <span id="RlTemperature" class="temperatureValue">-</span>' +
    '        <span class="temperatureUnit">°C</span>' +
    '      </div>' +
    '    </div>' +
    //   Rear Right
    '    <div id="Rr" class="tireContainer rear right">' +
    '      <div id="Rrtire" class="tire"></div>' +
    '      <div class="barGraph">' +
    '        <div id="RrBar" class="bar"></div>' +
    '        <div class="scale scalenorm"></div>' +
    '        <div class="scale scalewarn scalelow"></div>' +
    '        <div class="scale scalewarn scalehigh"></div>' +
    '      </div>' +
    '      <div class="pressure">' +
    '        <span id="RrPressure" class="pressureValue">-</span> ' +
    '        <span class="pressureUnit">bar</span>' +
    '      </div>' +
    '      <div class="temperature">' +
    '        <span id="RrTemperature" class="temperatureValue">-</span>' +
    '        <span class="temperatureUnit">°C</span>' +
    '      </div>' +
    '    </div>' +
    //   Outside Temperature
    '    <div id="outsideTemperature" class="sideItem sideItemOne sideItemLeft">' +
    '      <div class="sideItemTop">' +
    '        <span id="outSideTemperatureValue" class="sideItemValue">-</span>' +
    '        <span id="OutsideTemperatureUnit" class="sideItemUnit">°C</span>' +
    '      </div>' +
    '      <div class="sideItemBottom">' +
    '        <span id="outsideTemperatureLabel">Außentemperatur</span>' +
    '      </div>' +
    '    </div>' +
    //   Target Pressure
    '    <div id="targetPressure" class="sideItem sideItemOne sideItemRight">' +
    '      <div class="sideItemTop">' +
    '        <span id="targetPressureValue" class="sideItemValue">2,00</span>' +
    '        <span id="targetPressureUnit" class="sideItemUnit">bar</span>' +
    '      </div>' +
    '      <div class="sideItemBottom">' +
    '        <span id="targetPressureLabel">Solldruck</span>' +
    '      </div>' +
    '    </div>' +
    '    <div id="debug">' +
    '    </div>' + 
    //   Close Info Layer
    '  </div>' +
    // Setup Layer
    '  <div id="SetupLayer">' +
    // Close Setup Layer
    '  </div>' +
    '</div>' +
    '<script src="apps/_tpms/js/tpms.js" type="text/javascript"></script>';
    setTimeout(function() {
        updateTpmsApp();
    }, 1000);
}

/*
 * Handle Controller Events
 */

 /*
 * Called by the app during templateNoLongerDisplayed. Used to perform garbage collection procedures on the template and
 * its controls.
 */
TpmsTmplt.prototype.cleanUp = function() {
    swapOut = null;
    if (framework.getCurrentApp() !== "_tpms") {
      // ??? $('#SbSpeedo, #Sbfuel-bar-wrapper').fadeIn();
    }
  };

framework.registerTmpltLoaded("TpmsTmplt");