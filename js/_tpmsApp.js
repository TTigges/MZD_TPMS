/*
 Copyright 2020 Torben Tigges
 only works with usbget:
 https://github.com/TTigges/mzd-usb-sensors
 Build after the example "SpeedometerApp" by Herko ter Horst
 __________________________________________________________________________

 Filename: _tpmsApp.js
 Version: 0.5.1
 __________________________________________________________________________
 */

log.addSrcFile("_tpmsApp.js", "_tpms");

function _tpmsApp(uiaId) {
  log.debug("Constructor called.");

  // Base application functionality is provided in a common location via this call to baseApp.init().
  // See framework/js/BaseApp.js for details.
  baseApp.init(this, uiaId);
}


/*********************************
 * App Init is standard function *
 * called by framework           *
 *********************************/

/*
 * Called just after the app is instantiated by framework.
 * All variables local to this app should be declared in this function
 */
_tpmsApp.prototype.appInit = function() {
  log.debug("_tpmsApp appInit  called...");
  //Context table
  //@formatter:off
  this._contextTable = {
    "Start": { // TPMS Start
      "sbName": "TPMS",
      "template": "TpmsTmplt",
      "templatePath": "apps/_tpms/template",
      "readyFunction": this._StartContextReady.bind(this)
      //"noLongerDisplayedFunction" : this._noLongerDisplayed.bind(this),
    }
  }; // end of this.contextTable object
  //@formatter:on

  //@formatter:off
  this._messageTable = {
    // haven't yet been able to receive messages from MMUI
  };
  //@formatter:on
};

/**
 * =========================
 * CONTEXT CALLBACKS
 * =========================
 */
_tpmsApp.prototype._StartContextReady = function() {
  //framework.common.setSbDomainIcon("apps/_tpms/IcnSbnTpms.png");
};

/**
 * =========================
 * Framework register
 * Tell framework this .js file has finished loading
 * =========================
 */
framework.registerAppLoaded("_tpms", null, false);
