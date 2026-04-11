/*
* Gauges App v1.0.0
* 2026 by Torben Tigges
* Konfiguration für Zusatzinstrumente
*/

log.addSrcFile("gauges.js", "gauges");

var gaugesConfig = {
    gauges: [
        {
            id: "gauge1",
            name: "Öldruck",
            shortName: "oilPressure",
            unit: "bar",
            dataKey: "oilPressure",
            minValue: 0,
            maxValue: 10,
            scaleValues: [0, 2, 4, 6, 8, 10],
            scaleMajorTicks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            scaleMinorTicks: 1,
            scaleArea: 270,
            scaleRadius: 50,
            scaleWidth: 152,
            scaleHeight: 130,
            warningMin: 0.5,
            warningMax: null,
            indicatorType: "primary",
            displayGauge: "gauge1",
            visible: true,
            value: 0,
            oldValue: 0,
            oldDegrees: 0
        },
        {
            id: "gauge2",
            name: "Ladedruck",
            shortName: "boost",
            unit: "bar",
            dataKey: "boost",
            minValue: -1,
            maxValue: 2,
            scaleValues: [-1, -0.5, 0, 0.5, 1, 1.5],
            scaleMajorTicks: [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5],
            scaleMinorTicks: 1,
            scaleArea: 300,
            scaleRadius: 50,
            scaleWidth: 152,
            scaleHeight: 130,
            warningMin: null,
            warningMax: 1.5,
            indicatorType: "primary",
            displayGauge: "gauge2",
            visible: true,
            value: 0,
            oldValue: 0,
            oldDegrees: 0
        },
        {
            id: "gauge3",
            name: "Öltemperatur",
            shortName: "oilTemp",
            unit: "°C",
            dataKey: "oilTemperature",
            minValue: 50,
            maxValue: 170,
            scaleValues: [50, 70, 90, 110, 130, 150],
            scaleMajorTicks: [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150],
            scaleMinorTicks: 1,
            scaleArea: 270,
            scaleRadius: 50,
            scaleWidth: 152,
            scaleHeight: 130,
            warningMin: null,
            warningMax: 140,
            indicatorType: "primary",
            displayGauge: "gauge3",
            visible: true,
            value: 0,
            oldValue: 0,
            oldDegrees: 0
        },
        {
            id: "gauge4",
            name: "Kühlmittel",
            shortName: "coolantTemp",
            unit: "°C",
            dataKey: "coolantTemperature",
            minValue: 40,
            maxValue: 120,
            scaleValues: [40, 60, 80, 100, 110, 120],
            scaleMajorTicks: [40, 50, 60, 70, 80, 90, 100, 105, 110, 115, 120],
            scaleMinorTicks: 1,
            scaleArea: 270,
            scaleRadius: 50,
            scaleWidth: 152,
            scaleHeight: 130,
            warningMin: null,
            warningMax: 110,
            indicatorType: "primary",
            displayGauge: "gauge4",
            visible: true,
            value: 0,
            oldValue: 0,
            oldDegrees: 0
        },
        {
            id: "gauge5",
            name: "Außentemperatur",
            shortName: "outsideTemp",
            unit: "°C",
            dataKey: "outsideTemperature",
            minValue: -20,
            maxValue: 50,
            scaleValues: [-20, -10, 0, 10, 20, 30],
            scaleMajorTicks: [-20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30],
            scaleMinorTicks: 1,
            scaleArea: 270,
            scaleRadius: 50,
            scaleWidth: 152,
            scaleHeight: 130,
            warningMin: null,
            warningMax: null,
            indicatorType: "primary",
            displayGauge: "gauge5",
            visible: true,
            value: 0,
            oldValue: 0,
            oldDegrees: 0
        },
        {
            id: "gauge6",
            name: "Einlasstemperatur",
            shortName: "intakeTemp",
            unit: "°C",
            dataKey: "intakeTemperature",
            minValue: -20,
            maxValue: 50,
            scaleValues: [-20, -10, 0, 10, 20, 30],
            scaleMajorTicks: [-20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30],
            scaleMinorTicks: 1,
            scaleArea: 270,
            scaleRadius: 50,
            scaleWidth: 152,
            scaleHeight: 130,
            warningMin: null,
            warningMax: 50,
            indicatorType: "secondary",
            displayGauge: "gauge6",
            visible: true,
            value: 0,
            oldValue: 0,
            oldDegrees: 0
        },
        {
            id: "gauge7",
            name: "Einlasstemperatur",
            shortName: "intakeTemp",
            unit: "°C",
            dataKey: "intakeTemperature",
            minValue: -20,
            maxValue: 50,
            scaleValues: [-20, -10, 0, 10, 20, 30],
            scaleMajorTicks: [-20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30],
            scaleMinorTicks: 1,
            scaleArea: 240,
            scaleRadius: 50,
            scaleWidth: 152,
            scaleHeight: 130,
            warningMin: null,
            warningMax: 50,
            indicatorType: "secondary",
            displayGauge: "gauge7",
            visible: true,
            value: 0,
            oldValue: 0,
            oldDegrees: 0
        }
    ],

    getGauge: function(index) {
        if (index < 0 || index >= this.gauges.length) {
            return null;
        }
        return this.gauges[index];
    },

    getGaugeById: function(id) {
        var i;
        for (i = 0; i < this.gauges.length; i++) {
            if (this.gauges[i].id === id) {
                return this.gauges[i];
            }
        }
        return null;
    },

    getGaugeByDataKey: function(dataKey) {
        var i;
        for (i = 0; i < this.gauges.length; i++) {
            if (this.gauges[i].dataKey === dataKey) {
                return this.gauges[i];
            }
        }
        return null;
    },

    setValue: function(id, value) {
        var gauge = this.getGaugeById(id);
        if (!gauge) {
            return;
        }
        gauge.oldValue = gauge.value;
        gauge.value = value;
    }
};