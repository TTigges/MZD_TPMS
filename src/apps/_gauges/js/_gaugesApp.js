/*
Copyright 2026 Torben Tigges
__________________________________________________________________________
Filename: _gaugesApp.js
Description: Custom App for analog gauge instruments display
__________________________________________________________________________
*/

log.addSrcFile("_gaugesApp.js", "_gauges");

function _gaugesApp(uiaId) {
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
_gaugesApp.prototype.appInit = function() {
    log.debug("_gaugesApp appInit called...");
    
    //Context table
    //@formatter:off
    this._contextTable = {
        "Start": { // Gauges Start Context
            "sbName": "Zusatzinstrumente",
            "template": "GaugesTmplt",
            "templatePath": "apps/_gauges/template",
            "readyFunction": this._StartContextReady.bind(this)
        }
    };
    //@formatter:on
};

/**
* =========================
* Context Ready Functions
* =========================
*/
_gaugesApp.prototype._StartContextReady = function() {
    log.debug("_gaugesApp Start context ready.");
    framework.common.setSbDomainIcon("apps/_gauges/IcnSbnGauges.png");
    // Initialize gauges on template ready
    if (typeof initGauges === 'function') {
        initGauges();
    }
};

/**
* =========================
* Framework register
* Tell framework this .js file has finished loading
* =========================
*/
framework.registerAppLoaded("_gauges", null, false);