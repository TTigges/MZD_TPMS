/*
 * TPMS App v0.2.0
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
    
    '  <div class="cntrlBtn cntrlBtn0 cntrlBtnSelect"></div>' +
    '  <div class="cntrlBtn cntrlBtn1 cntrlBtnUp"></div>' +
    '  <div class="cntrlBtn cntrlBtn2 cntrlBtnDown"></div>' +
    '  <div class="cntrlBtn cntrlBtn3 cntrlBtnRight"></div>' +
    '  <div class="cntrlBtn cntrlBtn4 cntrlBtnLeft"></div>' +
    '  <div class="cntrlBtn cntrlBtn5 cntrlBtnSelecth"></div>' +
    '  <div class="cntrlBtn cntrlBtn6 cntrlBtnUph"></div>' +
    '  <div class="cntrlBtn cntrlBtn7 cntrlBtnDownh"></div>' +
    '  <div class="cntrlBtn cntrlBtn8 cntrlBtnRighth"></div>' +
    '  <div class="cntrlBtn cntrlBtn9 cntrlBtnLefth"></div>' +

    '  <div id="InfoLayer">' +
    //   Front Left
    '    <div id="Fl" class="tireContainer front left">' +
    '      <div id="flTire" class="tire"></div>' +
    '      <div class="barGraph">' +
    '        <div id="flBar" class="bar"></div>' +
    '        <div id="flScaleNorm" class="scale scalenorm"></div>' +
    '        <div class="scale scalewarn scalelow"></div>' +
    '        <div class="scale scalewarn scalehigh"></div>' +
    '      </div>' +
    '      <div class="pressure">' +
    '        <span id="flPressure" class="pressureValue">-</span> ' +
    '        <span class="pressureUnit">bar</span>' +
    '      </div>' +
    '      <div class="temperature">' +
    '        <span id="flTemperature" class="temperatureValue">-</span>' +
    '        <span class="temperatureUnit">°C</span>' +
    '      </div>' +
    '    </div>' +
    //   Front Right
    '    <div id="Fr" class="tireContainer front right">' +
    '      <div id="frTire" class="tire"></div>' +
    '      <div class="barGraph">' +
    '        <div id="frBar" class="bar"></div>' +
    '        <div id="frScaleNorm" class="scale scalenorm"></div>' +
    '        <div class="scale scalewarn scalelow"></div>' +
    '        <div class="scale scalewarn scalehigh"></div>' +
    '      </div>' +
    '      <div class="pressure">' +
    '        <span id="frPressure" class="pressureValue">-</span> ' +
    '        <span class="pressureUnit">bar</span>' +
    '      </div>' +
    '      <div class="temperature">' +
    '        <span id="frTemperature" class="temperatureValue">-</span>' +
    '        <span class="temperatureUnit">°C</span>' +
    '      </div>' +
    '    </div>' +
    //   Rear Left
    '    <div id="Rl" class="tireContainer rear left">' +
    '      <div id="rlTire" class="tire"></div>' +
    '      <div class="barGraph">' +
    '        <div id="rlBar" class="bar"></div>' +
    '        <div id="rlScaleNorm" class="scale scalenorm"></div>' +
    '        <div class="scale scalewarn scalelow"></div>' +
    '        <div class="scale scalewarn scalehigh"></div>' +
    '      </div>' +
    '      <div class="pressure">' +
    '        <span id="rlPressure" class="pressureValue">-</span> ' +
    '        <span class="pressureUnit">bar</span>' +
    '      </div>' +
    '      <div class="temperature">' +
    '        <span id="rlTemperature" class="temperatureValue">-</span>' +
    '        <span class="temperatureUnit">°C</span>' +
    '      </div>' +
    '    </div>' +
    //   Rear Right
    '    <div id="Rr" class="tireContainer rear right">' +
    '      <div id="rrTire" class="tire"></div>' +
    '      <div class="barGraph">' +
    '        <div id="rrBar" class="bar"></div>' +
    '        <div id="rrScaleNorm" class="scale scalenorm"></div>' +
    '        <div class="scale scalewarn scalelow"></div>' +
    '        <div class="scale scalewarn scalehigh"></div>' +
    '      </div>' +
    '      <div class="pressure">' +
    '        <span id="rrPressure" class="pressureValue">-</span> ' +
    '        <span class="pressureUnit">bar</span>' +
    '      </div>' +
    '      <div class="temperature">' +
    '        <span id="rrTemperature" class="temperatureValue">-</span>' +
    '        <span class="temperatureUnit">°C</span>' +
    '      </div>' +
    '    </div>' +
    //   Side Items
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
    //   Engine Data
    '    <div id="coolantTemperature" class="sideItem sideItemEngine sideItemTwo sideItemLeft">' +
    '      <div class="sideItemTop">' +
    '        <span id="coolantTemperatureValue" class="sideItemValue">-</span>' +
    '        <span id="coolantTemperatureUnit" class="sideItemUnit">°C</span>' +
    '      </div>' +
    '      <div class="sideItemBottom">' +
    '        <span id="coolantTemperatureLabel">Kühlwasser</span>' +
    '      </div>' +
    '    </div>' +
    '    <div id="oilTemperature" class="sideItem sideItemEngine sideItemThree sideItemLeft">' +
    '      <div class="sideItemTop">' +
    '        <span id="oilTemperatureValue" class="sideItemValue">-</span>' +
    '        <span id="oilTemperatureUnit" class="sideItemUnit">°C</span>' +
    '      </div>' +
    '      <div class="sideItemBottom">' +
    '        <span id="oilTemperatureLabel">Öltemperatur</span>' +
    '      </div>' +
    '    </div>' +
    '    <div id="oilPressure" class="sideItem sideItemEngine sideItemFour sideItemLeft">' +
    '      <div class="sideItemTop">' +
    '        <span id="oilPressureValue" class="sideItemValue">-</span>' +
    '        <span id="oilPressureUnit" class="sideItemUnit">bar</span>' +
    '      </div>' +
    '      <div class="sideItemBottom">' +
    '        <span id="oilPressureLabel">Öldruck</span>' +
    '      </div>' +
    '    </div>' +
    //   Target Pressure
    '    <div id="targetPressure" class="sideItem sideItemOne sideItemRight">' +
    '      <div class="sideItemTop">' +
    '        <span id="targetPressureValue" class="sideItemValue"></span>' +
    '        <span id="targetPressureUnit" class="sideItemUnit">bar</span>' +
    '      </div>' +
    '      <div class="sideItemBottom">' +
    '        <span id="targetPressureLabel">Solldruck</span>' +
    '      </div>' +
    '    </div>' +
    '    <div id="configBtn" class="sideItem menuItem sideItemTwo sideItemRight">' +
    '      <div class="sideItemTop">' +
    '        <span id="configBtnLabel">Konfiguration</span>' +
    '      </div>' +
    '      <div class="sideItemBottom"><span>&nbsp;</span></div>' +
    '    </div>' +
    '    <div id="setupBtn" class="sideItem menuItem sideItemThree sideItemRight">' +
    '      <div class="sideItemTop">' +
    '        <span id="setupBtnLabel">Setup</span>' +
    '      </div>' +
    '      <div class="sideItemBottom"><span>&nbsp;</span></div>' +
    '    </div>' +
    '    <div id="closeMenuBtn" class="sideItem menuItem sideItemFour sideItemRight">' +
    '      <div class="sideItemTop">' +
    '        <span id="closeMenuBtnLabel">Schließen</span>' +
    '      </div>' +
    '      <div class="sideItemBottom"><span>&nbsp;</span></div>' +
    '    </div>' +
    '    <div id="debug">' +
    '    </div>' + 
    //   Close Side Items
    // Close Info Layer
    '  </div>' +
    // Setup Layer
    '  <div id="SetupLayer">' +
    '    <div id="SetupContainer">' +
    '      <div id="TireIdSetup">' +
    '        <div id="idContainer">' +
    '          <div id="SetupIDBox1" class="SetupIDBox selectable"></div>' +
    '          <div id="SetupIDBox2" class="SetupIDBox selectable"></div>' +
    '          <div id="SetupIDBox3" class="SetupIDBox selectable"></div>' +
    '          <div id="SetupIDBox4" class="SetupIDBox selectable"></div>' +
    '        </div>' +
    '        <div class="buttonContainer">' +
    '          <button class="selectable" id="SetupIDClear">Alle löschen</button>' +
    '          <button class="selectable" id="SetupIDReset">Zurücksetzen</button>' +
    '          <button class="selectable" id="SetupIDSwitch">Rotieren</button>' +
    '          <button class="selectable" id="SetupIDSave">Speichern</button>' +
    '          <button class="selectable" id="CloseSetup">Schließen</button>' +
    '        </div>' +
    '      </div>' +
    '    </div>' +
    '    <div id="SetupModal">' +
    '      <ul id="SetupModalIDBox">' +
    '      </ul>' +
    '    </div>' +
    // Close Setup Layer
    '  </div>' +
    // Config Layer
    '  <div id="ConfigLayer">' +
    '    <div id="ConfigContainer">' +

    '      <div id="ConfigUnitsBox">' +
    '        <div id="ConfigUnitsTitle">Einheiten:</div>' +
    '        <div id="ConfigTempUnit" class="configItem selectable">' +
    '          <span class="configItemLabel">Temperaturen in </span>' +
    '          <span class="configItemValue" id="ConfigTempUnitValue">°C</span>' +
    '        </div>' +
    '        <div id="ConfigPressUnit" class="configItem selectable">' +
    '          <span class="configItemLabel">Druck in </span>' +
    '          <span class="configItemValue" id="ConfigPressUnitValue">bar</span>' +
    '        </div>' +
    '        <div id="ConfigDecUnit" class="configItem selectable">' +
    '          <span class="configItemLabel">Dezimalzeichen:</span>' +
    '          <span class="configItemValue" id="ConfigDecUnitValue">,</span>' +
    '        </div>' +
    '      </div>' +

    '      <div id="ConfigCarBox">' +
    '        <div id="ConfigCarTitle">Fahrzeug:</div>' +
    '        <div id="ConfigCarSelect" class="configItem selectable">' +
    '          <span class="configItemLabel">Modellauswahl:</span>' +
    '          <span class="configItemValue" id="ConfigCarSelectValue">-</span>' +
    '        </div>' +
    '      </div>' +

    '      <div id="ConfigStatusBox">' +
    '        <div id="ConfigStatusTitle">Status-Anzeige:</div>' +
    '        <div id="ConfigColorScale" class="configItem selectable">' +
    '          <span class="configItemLabel">Farbintensität: </span>' +
    '          <span class="configItemValue" id="ConfigColorScaleValue">6</span>' +
    '        </div>' +
    '        <div id="ConfigBarScale" class="configItem selectable">' +
    '          <span class="configItemLabel">Bereichsgröße:</span>' +
    '          <span class="configItemValue" id="ConfigBarScaleValue">6</span>' +
    '        </div>' +
    '        <div id="ConfigWarnDiff" class="configItem selectable">' +
    '          <span class="configItemLabel">Warnung bei +/-: </span>' +
    '          <span class="configItemValue" id="ConfigWarnDiffValue">20</span>' +
    '          <span class="configItemUnit">%</span>' +
    '        </div>' +
    '      </div>' +
    
    '      <div id="ConfigStatusPreview" class="selectable">' +
    '        <div id="ConfigStatusPreviewTitle">' +
    '          <span>Vorschau:</span><br>' +
    '        </div>' +

    '        <div class="preview80 previewItem">' +
    '          <div class="previewLabel"><span id="previewLabel80">1.6</span></div>' +
    '          <div class="barGraph">' +
    '            <div id="previewBar80" class="bar"></div>' +
    '            <div id="ConfigStatusPreviewScaleNorm" class="scale scalenorm"></div>' +
    '            <div class="scale scalewarn scalelow"></div>' +
    '            <div class="scale scalewarn scalehigh"></div>' +
    '          </div>' +
    '          <div class="previewLabelPerc"><span id="previewLabelPerc80">80%</span></div>' +
    '        </div>' +
    '        <div class="preview90 previewItem">' +
    '          <div class="previewLabel"><span id="previewLabel90">1.8</span></div>' +
    '          <div class="barGraph">' +
    '            <div id="previewBar90" class="bar"></div>' +
    '            <div id="ConfigStatusPreviewScaleNorm" class="scale scalenorm"></div>' +
    '            <div class="scale scalewarn scalelow"></div>' +
    '            <div class="scale scalewarn scalehigh"></div>' +
    '          </div>' +
    '          <div class="previewLabelPerc"><span id="previewLabelPerc90">90%</span></div>' +
    '        </div>' +
    '        <div class="preview100 previewItem">' +
    '          <div class="previewLabel"><span id="previewLabel100">2.0</span></div>' +
    '          <div class="barGraph">' +
    '            <div id="previewBar100" class="bar"></div>' +
    '            <div id="ConfigStatusPreviewScaleNorm" class="scale scalenorm"></div>' +
    '            <div class="scale scalewarn scalelow"></div>' +
    '            <div class="scale scalewarn scalehigh"></div>' +
    '          </div>' +
    '          <div class="previewLabelPerc"><span id="previewLabelPerc100">100%</span></div>' +
    '        </div>' +
    '        <div class="preview110 previewItem">' +
    '          <div class="previewLabel"><span id="previewLabel110">2.2</span></div>' +
    '          <div class="barGraph">' +
    '            <div id="previewBar110" class="bar"></div>' +
    '            <div id="ConfigStatusPreviewScaleNorm" class="scale scalenorm"></div>' +
    '            <div class="scale scalewarn scalelow"></div>' +
    '            <div class="scale scalewarn scalehigh"></div>' +
    '          </div>' +
    '          <div class="previewLabelPerc"><span id="previewLabelPerc110">110%</span></div>' +
    '        </div>' +
    '        <div class="preview120 previewItem">' +
    '          <div class="previewLabel"><span id="previewLabel120">2.4</span></div>' +
    '          <div class="barGraph">' +
    '            <div id="previewBar120" class="bar"></div>' +
    '            <div id="ConfigStatusPreviewScaleNorm" class="scale scalenorm"></div>' +
    '            <div class="scale scalewarn scalelow"></div>' +
    '            <div class="scale scalewarn scalehigh"></div>' +
    '          </div>' +
    '          <div class="previewLabelPerc"><span id="previewLabelPerc120">120%</span></div>' +
    '        </div>' +
    
    '        <div id="ConfigStatusPreviewSubtitle" class="configStatusPreviewSubTitle selectable">' +
    '          <span>Bereich um Sollwert: </span>' +
    '          <span class="configStatusPreviewSubTitle configItemValue" id="configStatusPreviewValue">20</span>' +
    '          <span class="configStatusPreviewSubTitle">%</span>' +
    '        </div>' +

    '      </div>' +

    '      <button id="CloseConfig" class="selectable">Schließen</button>' +
    '    </div>' +
    '  </div>' +
    // Open Debug Layer
    '  <div id="DebugLayer">' +
    '    <div id="debugContainer"></div>' +
    // Close Debug Layer
    '  </div>' +
    '  <div id="MessageContainer">' +
    '    <p id="MessageText"></p>' +
    '  </div>' +
    '</div>' +
    '<script src="apps/_tpms/js/tpms.js" type="text/javascript"></script>';
    setTimeout(function() {
        if (typeof updateTpmsApp === 'function') {
            updateTpmsApp();
        }
    }, 1000);
}

// TpmsTmplt.prototype.handleControllerEvent = function(eventID) {
//     var content = $("#debugContainer").html();
//     content += "clicked " + eventID + "<br>";
//     $("#debugContainer").html(content);

//     var retValue = "ignored";
//     return retValue;
// };

/*
 *  singleClick - Set click actions for the multicontroller to be used with the longHold function
 *  @param clickTarget (jQuery Object) Tcan be a string, function, or jQuery Object
 *  string is converted to the jQuery Object to click
 */
TpmsTmplt.prototype.singleClick = function(clickTarget) {
  if (utility.toType(clickTarget) === "string") { clickTarget = $(clickTarget) }
  (typeof speedometerLonghold !== 'undefined' && speedometerLonghold) ? speedometerLonghold = false: (utility.toType(clickTarget) === "function") ? clickTarget() : clickTarget.click();
  clearTimeout(this.longholdTimeout);
  this.longholdTimeout = null;
}

/*
 *  longClick - Set an action for holding clicks with the multicontroller use with singleClick
 *  @param clickFunction can be a string, function, or jQuery Object
 *  string is converted to the jQuery Object to click
 */
TpmsTmplt.prototype.longClick = function(clickFunction) {
  if (utility.toType(clickFunction) === "string") { clickFunction = $(clickFunction) }
  this.longholdTimeout = setTimeout(function() {
    if (typeof speedometerLonghold !== 'undefined') { speedometerLonghold = true; }
    (utility.toType(clickFunction) === "function") ? clickFunction(): clickFunction.click();
  }, 1200);
}

/*
 * Handle Controller Events
 *
 * (internal - called by the framework)
 * @param   eventID (string) any of the “Internal event name” values in IHU_GUI_MulticontrollerSimulation.docx (e.g. 'cw', 'ccw', 'select')
 * Controller functions are defined in tpmsUpdate.js
 */
TpmsTmplt.prototype.handleControllerEvent = function(eventID) {
  log.debug("handleController() called, eventID: " + eventID);

  var retValue = 'giveFocusLeft';

  // DIREKT AUF DIE AKTIONEN/FUNKTIONEN VERWEISEN STATT UNSICHTBARE DIVS?
  switch (eventID) {
    case "selectStart":
      this.longClick('.cntrlBtnSelecth');
      retValue = "consumed";
      break;
    case "select":
      this.singleClick('.cntrlBtnSelect');
      break;
    case "upStart":
      this.longClick('.cntrlBtnUph');
      retValue = "consumed";
      break;
    case "up":
      this.singleClick('.cntrlBtnUp');
      retValue = "consumed";
      break;
    case "downStart":
      this.longClick('.cntrlBtnDownh');
      retValue = "consumed";
      break;
    case "down":
      this.singleClick('.cntrlBtnDown');
      retValue = "consumed";
      break;
    case "leftStart":
      this.longClick('.cntrlBtnLefth');
      retValue = "consumed";
      break;
    case "left":
      this.singleClick('.cntrlBtnLeft');
      retValue = "consumed";
      break;
    case "rightStart":
      this.longClick('.cntrlBtnRighth');
      retValue = "consumed";
      break;
    case "right":
      this.singleClick('.cntrlBtnRight');
      retValue = "consumed";
      break;
    case "cw":
      this.singleClick('.cntrlBtnRight');
      retValue = "consumed";
      break;
    case "ccw":
      this.singleClick('.cntrlBtnLeft');
      retValue = "consumed";
      break;
    default:
      retValue = "ignored";
  }

  return retValue;
};

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