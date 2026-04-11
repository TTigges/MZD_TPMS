/*
* Gauges App v1.0.0
* 2026 by Torben Tigges
* Template für digitale Rundinstrumente (Zusatzinstrumente)
*/

log.addSrcFile("GaugesTmplt.js", "gauges");

function GaugesTmplt(uiaId, parentDiv, templateID, controlProperties) {
    this.divElt = null;
    this.templateName = "GaugesTmplt";
    this.onScreenClass = "GaugesTmplt";
    this.gauges = [];
    this.displayGauges = [];
    this.animationFrameId = null;
    this.indicatorAnimations = {};

    log.debug("templateID in GaugesTmplt constructor: " + templateID);

    //@formatter:off
    this.properties = {
        "statusBarVisible": true,
        "leftButtonVisible": false,
        "rightChromeVisible": false,
        "hasActivePanel": false,
        "isDialog": false
    };
    //@formatter:on

    this.divElt = document.createElement("div");
    this.divElt.id = templateID;
    this.divElt.className = "TemplateWithStatus GaugesTmplt";
    parentDiv.appendChild(this.divElt);

    this.buildHTML();
}

GaugesTmplt.prototype.buildHTML = function () {
    this.divElt.innerHTML =
        '<!-- MZD Gauges App v1 -->' +
        '<div id="GaugesContainer">' +
        '  <div id="gauge1" class="instrument"></div>' +
        '  <div id="gauge2" class="instrument"></div>' +
        '  <div id="gauge3" class="instrument"></div>' +
        '  <div id="gauge4" class="instrument"></div>' +
        '  <div id="gauge5" class="instrument dual"></div>' +
        '</div>';
};

GaugesTmplt.prototype.handleMultiControllerEvent = function (eventId) {
    log.debug("handleMultiControllerEvent: " + eventId);

    switch (eventId) {
        case "selectStart":
            this.initializeGauges();
            break;
        case "cmuCCWheelUp":
        case "cmuCCWheelDown":
        case "cmuCCWheelLeft":
        case "cmuCCWheelRight":
            break;
    }
};

GaugesTmplt.prototype.initializeGauges = function () {
    log.debug("Initializing gauges...");

    if (typeof gaugesConfig === "undefined" || !gaugesConfig.gauges || gaugesConfig.gauges.length < 5) {
        log.debug("gaugesConfig missing or incomplete.");
        return;
    }

    this.gauges = gaugesConfig.gauges;
    this.displayGauges = this.buildDisplayGaugeConfig(this.gauges);
    this.createGauges();
};

GaugesTmplt.prototype.buildDisplayGaugeConfig = function (sourceGauges) {
    var result = [];

    if (sourceGauges[0]) {
        result.push({
            id: "gauge1",
            config: sourceGauges[0],
            indicators: [
                {
                    id: "indicator1",
                    className: "indicator indicator-primary",
                    valueClassName: "indicator-value indicator-value-primary",
                    sourceIndex: 0
                }
            ]
        });
    }

    if (sourceGauges[1]) {
        result.push({
            id: "gauge2",
            config: sourceGauges[1],
            indicators: [
                {
                    id: "indicator2",
                    className: "indicator indicator-primary",
                    valueClassName: "indicator-value indicator-value-primary",
                    sourceIndex: 1
                }
            ]
        });
    }

    if (sourceGauges[2]) {
        result.push({
            id: "gauge3",
            config: sourceGauges[2],
            indicators: [
                {
                    id: "indicator3",
                    className: "indicator indicator-primary",
                    valueClassName: "indicator-value indicator-value-primary",
                    sourceIndex: 2
                }
            ]
        });
    }

    if (sourceGauges[3]) {
        result.push({
            id: "gauge4",
            config: sourceGauges[3],
            indicators: [
                {
                    id: "indicator4",
                    className: "indicator indicator-primary",
                    valueClassName: "indicator-value indicator-value-primary",
                    sourceIndex: 3
                }
            ]
        });
    }

    if (sourceGauges[4]) {
        result.push({
            id: "gauge5",
            config: sourceGauges[4],
            secondaryConfig: sourceGauges[5] || null,
            tertiaryConfig: sourceGauges[6] || null,

            indicators: [
                {
                    id: "indicator5",
                    className: "indicator indicator-out indicator-air-outside",
                    valueClassName: "indicator-value indicator-value-primary indicator-value-outside",
                    sourceIndex: 4
                },
                {
                    id: "indicator6",
                    className: "indicator indicator-primary indicator-air-hot",
                    valueClassName: "indicator-value indicator-value-secondary indicator-value-hot",
                    sourceIndex: 5
                },
                {
                    id: "indicator7",
                    className: "indicator indicator-tertiary indicator-air-cold",
                    valueClassName: "indicator-value indicator-value-tertiary indicator-value-cold",
                    sourceIndex: 6
                }
            ]
        });
    }

    return result;
};

GaugesTmplt.prototype.createGauges = function () {
    var self = this;

    this.displayGauges.forEach(function (displayGauge, index) {
        var gaugeConfig = displayGauge.config;
        var gaugeEl = document.getElementById(displayGauge.id);

        if (!gaugeEl || !gaugeConfig) {
            return;
        }

        gaugeEl.innerHTML = "";

        var framerClass = "";
        if (gaugeConfig.scaleArea === 180) {
            framerClass = "onehundredeighty";
        } else if (gaugeConfig.scaleArea === 240) {
            framerClass = "twohundredfourty";
        } else if (gaugeConfig.scaleArea === 270) {
            framerClass = "twohundredseventy";
        }

        var framer = document.createElement("div");
        framer.className = "framer " + framerClass;

        var halfer = document.createElement("div");
        halfer.className = "halfer";

        var gaugeDialText = document.createElement("div");
        gaugeDialText.className = "gaugedialtext";
        gaugeDialText.id = "dial_" + displayGauge.id;

        var gaugeUnit = document.createElement("div");
        gaugeUnit.className = "label unit";
        gaugeUnit.innerHTML = gaugeConfig.unit;

        var gaugeName = document.createElement("div");
        gaugeName.className = "label name";
        gaugeName.innerHTML = gaugeConfig.name;

        gaugeEl.appendChild(framer);
        gaugeEl.appendChild(halfer);

        displayGauge.indicators.forEach(function (indicatorDef) {
            if (indicatorDef.sourceIndex >= self.gauges.length) {
                return;
            }

            var indicator = document.createElement("div");
            indicator.className = indicatorDef.className;
            indicator.id = indicatorDef.id;
            gaugeEl.appendChild(indicator);

            var indicatorValue = document.createElement("div");
            indicatorValue.className = indicatorDef.valueClassName;
            indicatorValue.id = indicatorDef.id + "_value";
            indicatorValue.innerHTML = "0";
            gaugeEl.appendChild(indicatorValue);
        });

        gaugeEl.appendChild(gaugeDialText);
        gaugeEl.appendChild(gaugeUnit);
        gaugeEl.appendChild(gaugeName);

        if (displayGauge.id === "gauge5" && displayGauge.secondaryConfig) {
            var secondaryName = document.createElement("div");
            secondaryName.className = "label name secondary";
            secondaryName.innerHTML = displayGauge.secondaryConfig.name;
            gaugeEl.appendChild(secondaryName);
        }

        self.createScale(gaugeConfig, gaugeDialText, displayGauge.id);
    });
};

GaugesTmplt.prototype.createScale = function (gaugeConfig, dialContainer, gaugeId) {
    var container = document.createElement("div");
    container.className = "container";

    gaugeConfig.scaleValues.forEach(function (value) {
        var label = document.createElement("div");
        label.className = "speedotext";
        label.innerHTML = value;
        container.appendChild(label);
    });

    gaugeConfig.scaleMajorTicks.forEach(function (tick, i) {
        var tickEl = document.createElement("div");
        tickEl.className = "majortick majortick" + i;
        tickEl.innerHTML = tick;
        container.appendChild(tickEl);
    });

    if (gaugeConfig.scaleMinorTicks && gaugeConfig.scaleMinorTicks > 0) {
        for (var i = 0; i < gaugeConfig.scaleMajorTicks.length - 1; i++) {
            for (var t = 0; t < gaugeConfig.scaleMinorTicks; t++) {
                var minorTick = document.createElement("div");
                minorTick.className = "minortick minortick" + i + t;
                container.appendChild(minorTick);
            }
        }
    }

    dialContainer.appendChild(container);
    this.createScaleRadial(gaugeConfig, container, gaugeId);
};

GaugesTmplt.prototype.createScaleRadial = function (gaugeConfig, container, gaugeId) {
    var radius = gaugeConfig.scaleRadius;
    var width = gaugeConfig.scaleWidth;
    var height = gaugeConfig.scaleHeight;
    var angle = ((360 - gaugeConfig.scaleArea) / 2) + 90;
    var radian = angle * (Math.PI / 180);
    var v = gaugeConfig.scaleValues.length - 1;
    var step = gaugeConfig.scaleArea / v;
    var stepRadian = step * (Math.PI / 180);

    var labels = container.querySelectorAll(".speedotext");
    for (var i = 0; i < labels.length; i++) {
        var x = Math.round(width / 2 + (radius + 5) * Math.cos(radian));
        var y = Math.round(height / 2 + (radius + 5) * Math.sin(radian));
        labels[i].style.top = (y + 1) + "px";
        labels[i].style.left = (x - 15) + "px";
        radian += stepRadian;
    }

    radius = radius + 25;
    angle = ((360 - gaugeConfig.scaleArea) / 2) + 90;
    radian = angle * (Math.PI / 180);
    startRadian = radian;
    v = gaugeConfig.scaleMajorTicks.length - 1;
    step = gaugeConfig.scaleArea / v;
    stepRadian = step * (Math.PI / 180);

    var startAngle = -(180 - ((360 - gaugeConfig.scaleArea) / 2));
    var degrees = startAngle;
    var majorTicks = container.querySelectorAll(".majortick");
    var minorTickCounter = 0;

    // In der Hauptschleife:
    for (i = 0; i < majorTicks.length; i++) {
        var currentRadian = startRadian + (i * stepRadian);
        var nextRadian = startRadian + ((i + 1) * stepRadian);
        var currentDegrees = currentRadian * (180 / Math.PI);

        var tx = Math.round(width / 2 + radius * Math.cos(currentRadian));
        var ty = Math.round(height / 2 + radius * Math.sin(currentRadian));
        
        majorTicks[i].style.top = (ty + 6) + "px";
        majorTicks[i].style.left = (tx - 2) + "px";
        majorTicks[i].style.transform = "rotate(" + (currentDegrees + 90) + "deg)";

        if (gaugeConfig.scaleMinorTicks > 0 && i < gaugeConfig.scaleMajorTicks.length - 1) {
            var minorTicks = [];
            for (var t = 0; t < gaugeConfig.scaleMinorTicks; t++) {
                var mt = container.querySelector(".minortick" + minorTickCounter + t);
                if (mt) {
                    minorTicks.push(mt);
                }
            }
            // ← Übergib BEIDE Radiane!
            this.createMinorTicks(minorTicks, radius, currentRadian, nextRadian, width, height);
            minorTickCounter++;
        }
    }

    

    if (gaugeId === "gauge2") {
        var g2Labels = container.querySelectorAll(".speedotext");
        //if (g2Labels[0]) { g2Labels[0].style.display = "none"; }
        //if (g2Labels[5]) { g2Labels[5].style.display = "none"; }

        var g2m80 = container.querySelector(".minortick80");
        var g2M9 = container.querySelector(".majortick9");
        var g2m90 = container.querySelector(".minortick90");
        var g2M10 = container.querySelector(".majortick10");

        if (g2m80) { g2m80.style.opacity = "0"; }
        if (g2M9) { g2M9.style.opacity = "0"; }
        if (g2m90) { g2m90.style.opacity = "0"; }
        if (g2M10) { g2M10.style.opacity = "0"; }
    }

    if (gaugeId === "gauge4") {
        var g4Labels = container.querySelectorAll(".speedotext");
        if (g4Labels[5]) {
            g4Labels[5].style.left = "103px";
        }
    }
};

GaugesTmplt.prototype.createMinorTicks = function (minorTicks, radius, currentRadian, nextRadian, width, height) {
    var minorTicksSpan = nextRadian - currentRadian;

    for (var i = 0; i < minorTicks.length; i++) {
        var minorRadian = currentRadian + ((i + 1) / (minorTicks.length + 1)) * minorTicksSpan;
        var minorDegrees = minorRadian * (180 / Math.PI);

        var x = Math.round(width / 2 + radius * Math.cos(minorRadian));
        var y = Math.round(height / 2 + radius * Math.sin(minorRadian));

        minorTicks[i].style.left = (x - 1) + "px";   // Match major: -2
        minorTicks[i].style.top = (y + 8) + "px";    // Match major: +5
        minorTicks[i].style.transform = "rotate(" + (minorDegrees + 90) + "deg)";
    }
};

GaugesTmplt.prototype.resolveIndicatorTarget = function (gaugeIndex) {
    if (gaugeIndex < 0 || gaugeIndex >= this.gauges.length) {
        return null;
    }

    if (gaugeIndex <= 4) {
        return {
            gaugeId: "gauge" + (gaugeIndex + 1),
            indicatorId: "indicator" + (gaugeIndex + 1),
            valueId: "indicator" + (gaugeIndex + 1) + "_value",
            config: this.gauges[gaugeIndex]
        };
    }

    if (gaugeIndex === 5) {
        return {
            gaugeId: "gauge5",
            indicatorId: "indicator6",
            valueId: "indicator6_value",
            config: this.gauges[gaugeIndex]
        };
    }

    if (gaugeIndex === 6) {
        return {
            gaugeId: "gauge5",
            indicatorId: "indicator7",
            valueId: "indicator7_value",
            config: this.gauges[gaugeIndex]
        };
    }

    return null;
};

GaugesTmplt.prototype.updateIndicator = function (gaugeIndex, value) {
    var target = this.resolveIndicatorTarget(gaugeIndex);
    if (!target || !target.config) {
        return;
    }

    var gaugeEl = document.getElementById(target.gaugeId);
    if (!gaugeEl) {
        return;
    }

    var indicator = document.getElementById(target.indicatorId);
    var valueDisplay = document.getElementById(target.valueId);
    if (!indicator) {
        return;
    }

    var scale = target.config;
    var v = scale.scaleValues.length - 1;
    var step = scale.scaleArea / (scale.scaleValues[v] - scale.scaleValues[0]);

    value = (value === undefined || value === null) ? 0 : value;
    scale.__value = value;

    var dial = value;
    if (value < scale.scaleValues[0]) {
        dial = 0;
    }
    if (value >= scale.scaleValues[0]) {
        dial = value - scale.scaleValues[0];
    }
    if (value > scale.scaleValues[v]) {
        dial = (scale.scaleValues[v] - scale.scaleValues[0]);
    }

    var degrees = dial * step;
    var startAngle = 180 - ((360 - scale.scaleArea) / 2);
    degrees = -startAngle + degrees;

    var animationKey = target.indicatorId;
    if (this.indicatorAnimations[animationKey]) {
        this.indicatorAnimations[animationKey].stop();
    }

    this.indicatorAnimations[animationKey] = $({ deg: scale.__olddegrees || 0 }).stop().animate(
        { deg: degrees },
        {
            duration: 1000,
            step: function (d) {
                indicator.style.transform = "rotate(" + d + "deg)";
            }
        }
    );

    scale.__olddegrees = degrees;

    if (valueDisplay) {
        valueDisplay.innerHTML = Math.round(value * 10) / 10;
    }
};

GaugesTmplt.prototype.terminate = function () {
    var key;
    for (key in this.indicatorAnimations) {
        if (this.indicatorAnimations.hasOwnProperty(key) && this.indicatorAnimations[key]) {
            this.indicatorAnimations[key].stop();
        }
    }

    if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
    }
};

framework.registerTmpltLoaded("GaugesTmplt");