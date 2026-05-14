function updateTpmsApp() {
    // Initialize targetPressureValue display (pressureSettings is guaranteed loaded here)
    if (typeof pressureSettings !== 'undefined') {
        $('#targetPressureValue').text(
            pressureSettings.normal.toFixed(2).replace('.', ',')
        );
    }
    /*
     * Multicontroller Actions
     */
    $(".cntrlBtn0").click(function() {
        ClickSelect();
        AddClickDebug("cntrlBtnSelect");
    });
    $(".cntrlBtn1").click(function() {
        if (configLayer && configItemEditing) { AdjustConfigItem(1); }
        AddClickDebug("cntrlBtnUp");
    });
    $(".cntrlBtn2").click(function() {
        if (configLayer && configItemEditing) { AdjustConfigItem(-1); }
        AddClickDebug("cntrlBtnDown");
    });
    $(".cntrlBtn3").click(function() {
        ClickNext();
        AddClickDebug("cntrlBtnRight");
    });
    $(".cntrlBtn4").click(function() {
        ClickPrev();
        AddClickDebug("cntrlBtnLeft");
    });
    $(".cntrlBtn5").click(function() {
        OpenMenu();
        AddClickDebug("cntrlBtnSelecth");
    });
    $(".cntrlBtn6").click(function() {
        ToggleDebug();
        AddClickDebug("cntrlBtnUph");
    });
    $(".cntrlBtn7").click(function() {
        $(".sideItemEngine").toggle();
        AddClickDebug("cntrlBtnDownh");
    });
    $(".cntrlBtn8").click(function() {
        ClickNext();
        AddClickDebug("cntrlBtnRighth");
    });
    $(".cntrlBtn9").click(function() {
        ClickPrev();
        AddClickDebug("cntrlBtnLefth");
    });
  
    /*
     * Multicontroller Functions
     */
    function OpenMenu() {
        if (menuLayer === false) {
            // add ".selectable" class to menu items #targetPressure #configBtn #setupBtn
            $("#targetPressure").addClass("selectable");
            $("#configBtn").addClass("selectable");
            $("#setupBtn").addClass("selectable");
            $("#closeMenuBtn").addClass("selectable");
            
            menuSelector = 0;
        $("#"+menu[menuSelector]).toggleClass("selected");
            menuLayer = true;
        }
    }
    function CloseMenu() {
        if (menuLayer) {
            $(".selectable").removeClass("selected");
            $("#targetPressure").removeClass("selectable");
            $("#configBtn").removeClass("selectable");
            $("#setupBtn").removeClass("selectable");
            $("#closeMenuBtn").removeClass("selectable");
            menuLayer = false;
            setupLayer = false;
            if (configLayer) {
                $("#TpmsContainer").removeClass("ConfigActive");
            }
            configLayer = false;
            menuSelector = false;
            // setupItemSelected?
            // availableIdsSelector?
        }
    }
    function ToggleMenu(sel) {
        AddDebug("ToggleMenu to " + menu[sel]);
        $(".selectable").removeClass("selected");
        $("#"+menu[sel]).toggleClass("selected");
        menuSelector = sel;
    }
    function OpenSetup() {
        if (menuLayer && !setupLayer) {
            if (CheckSensorData()){
                InitializeSetup();
            } else {
                ShowMessage(0);
            }
        }
    }
    function ClickSelect() {
        AddDebug("ClickSelect");
        if (message === true) {
            $("#MessageContainer").toggle();
            message = false;
            $("#MessageText").html("");
        }
        else if (menuLayer) {
            AddDebug("Menu Selector: " + menuSelector);
            AddDebug("Target Pressure Layer: " + targetPressureLayer);
            if (menuSelector === 0 && !setupLayer) {
                OpenSetup();
            }
            else if (menuSelector === 1 && !configLayer) {
                OpenConfig();
            }
            else if (menuSelector === 1 && configLayer) {
                if (configItemEditing) {
                    DeactivateConfigItem();
                } else if (configItemSelected === configItems.length - 1) {
                    CloseConfig();
                } else if (configItemSelected >= 3) {
                    ActivateConfigItem();
                } else {
                    ToggleConfigItem(configItemSelected, 1);
                }
            }
            else if (menuSelector === 2 && !targetPressureLayer) {
                InitializeTargetPressureSetup();
            }
            else if (menuSelector === 2 && targetPressureLayer) {
                CloseTargetPressureSetup();
            }
            else if (menuSelector === 3) {
                CloseMenu();
            }
            else if (menuSelector === 0 && setupLayer === 1) {
                $("#"+setupItems[setupItemSelected]).click();
            }
            else if (menuSelector === 0 && setupLayer === 2) {
                IdSelected();
            }
        }
    }
    function ClickPrev() {
        if (!message) {
            if (menuLayer && !setupLayer && !targetPressureLayer && !configLayer) {
                var sel = (menuSelector == menu.length-1) ? 0 : menuSelector+1;
                ToggleMenu(sel);
            }
            else if (menuLayer && !setupLayer && targetPressureLayer && !configLayer) {
                targetPressureValue += 0.1;
                $("#targetPressureValue").html((targetPressureValue.toFixed(2).toString().replace(".",",")));
            }
            else if (menuLayer && configLayer && configItemEditing) {
                AdjustConfigItem(-1);
            }
            else if (menuLayer && configLayer && !configItemEditing) {
                var sel = (configItemSelected === 0) ? (configItems.length-1) : configItemSelected-1;
                ToggleConfigSelected(sel);
            }
            else if (menuLayer && !targetPressureLayer && setupLayer === 1) {
                var sel = (setupItemSelected == 0) ? (setupItems.length-1) : setupItemSelected-1;
                ToggleSelected(sel);
            }
            else if (menuLayer && !targetPressureLayer && setupLayer == 2) {
                var sel = (availableIdsSelector == 0) ? (availableIds.length) : availableIdsSelector-1;
                ToggleIdSelected(sel);
            }
        }
    }
    function ClickNext() {
        if (!message) {
            if (menuLayer && !setupLayer && !targetPressureLayer && !configLayer) {
                var sel = (menuSelector == 0) ? (menu.length-1) : menuSelector-1;
                ToggleMenu(sel);
            }
            else if (menuLayer && !setupLayer && targetPressureLayer && !configLayer) {
                targetPressureValue -= 0.1;
                $("#targetPressureValue").html((targetPressureValue.toFixed(2).toString().replace(".",",")));
            }
            else if (menuLayer && configLayer && configItemEditing) {
                AdjustConfigItem(1);
            }
            else if (menuLayer && configLayer && !configItemEditing) {
                var sel = (configItemSelected === configItems.length-1) ? 0 : configItemSelected+1;
                ToggleConfigSelected(sel);
            }
            if (menuLayer && !targetPressureLayer && setupLayer === 1) {
                var sel = (setupItemSelected == setupItems.length-1) ? 0 : setupItemSelected+1;
                ToggleSelected(sel);
            }
            else if (menuLayer && !targetPressureLayer && setupLayer === 2) {
                var sel = (availableIdsSelector == availableIds.length) ? 0 : availableIdsSelector+1;
                ToggleIdSelected(sel);
            }
        }
    }
    /*
     * Direct Touch Actions Menu Layer
     */
    $("#targetPressure").click(function() {
        if (menuLayer && !targetPressureLayer) {
            ToggleMenu(2);
            InitializeTargetPressureSetup();
        }
        else if (menuLayer && targetPressureLayer) {
            CloseTargetPressureSetup();
        }
    });
    $("#configBtn").click(function() {
        if (!configLayer) {
            ToggleMenu(1);
            OpenConfig();
        }
    });
    $("#setupBtn").click(function() {
        if (!setupLayer) {
            ToggleMenu(0);
            OpenSetup();
        }
    });
    $("#closeMenuBtn").click(function() {
        if (!setupLayer && !targetPressureLayer) {
            ToggleMenu(3);
            CloseMenu();
        }
    });
    /*
     * Direct Touch Actions Setup Layer
     */
    $("#SetupIDBox1").click(function() {
        // Open Modal to select ID
        ToggleSelected(0);
        IdModalUp("fl");
    });
    $("#SetupIDBox2").click(function() {
        // Open Modal to select ID
        ToggleSelected(1);
        IdModalUp("fr");
    });
    $("#SetupIDBox3").click(function() {
        // Open Modal to select ID
        ToggleSelected(2);
        IdModalUp("rl");
    });
    $("#SetupIDBox4").click(function() {
        // Open Modal to select ID
        ToggleSelected(3);
        IdModalUp("rr");
    });
    /*
     * Direct Touch Actions Buttons
     */
    $("#SetupIDClear").click(function() {
        tempSaved.fl = "";
        tempSaved.fr = "";
        tempSaved.rl = "";
        tempSaved.rr = "";
        $("#SetupIDBox1").html("<span class=\"label\">" + sensorData[0].pos + "</span>");
        $("#SetupIDBox2").html("<span class=\"label\">" + sensorData[1].pos + "</span>");
        $("#SetupIDBox3").html("<span class=\"label\">" + sensorData[2].pos + "</span>");
        $("#SetupIDBox4").html("<span class=\"label\">" + sensorData[3].pos + "</span>");
    });
    $("#SetupIDReset").click(function() {
        tempSaved.fl = sensorData[0].id;
        tempSaved.fr = sensorData[1].id;
        tempSaved.rl = sensorData[2].id;
        tempSaved.rr = sensorData[3].id;
        $("#SetupIDBox1").html("<span class=\"label\">" + sensorData[0].pos + "</span><span class=\"id\">" + sensorData[0].id + "</span><span class=\"pres\">" + sensorData[0].pres + "</span><span class=\"temp\">" + sensorData[0].temp + "</span>");
        $("#SetupIDBox2").html("<span class=\"label\">" + sensorData[1].pos + "</span><span class=\"id\">" + sensorData[1].id + "</span><span class=\"pres\">" + sensorData[1].pres + "</span><span class=\"temp\">" + sensorData[1].temp + "</span>");
        $("#SetupIDBox3").html("<span class=\"label\">" + sensorData[2].pos + "</span><span class=\"id\">" + sensorData[2].id + "</span><span class=\"pres\">" + sensorData[2].pres + "</span><span class=\"temp\">" + sensorData[2].temp + "</span>");
        $("#SetupIDBox4").html("<span class=\"label\">" + sensorData[3].pos + "</span><span class=\"id\">" + sensorData[3].id + "</span><span class=\"pres\">" + sensorData[3].pres + "</span><span class=\"temp\">" + sensorData[3].temp + "</span>");
        ToggleSelected(5);
    });
    $("#SetupIDSwitch").click(function() {
        RotateTires();
        ToggleSelected(6);
    });
    $("#SetupIDSave").click(function() {
        if(tempSaved.fl === "" || tempSaved.fr === "" || tempSaved.rl === "" || tempSaved.rr === "") {
            ShowMessage(1);
        } else {
            AddDebug("clicked save");
            saveTireIDs = true;
            ShowMessage(2);
        }
        ToggleSelected(7);
    });
    $("#CloseSetup").click(function() {
        setupLayer = false;
        //$("#SetupLayer").toggle();
        $("#TpmsContainer").toggleClass("SetupActive");
        $("#"+setupItems[8]).toggleClass("active");
    });
    /*
     * Direct Touch Actions Config Layer
     */
    $("#ConfigTempUnit").click(function() {
        ToggleConfigSelected(0);
        ToggleConfigItem(0, 1);
    });
    $("#ConfigPressUnit").click(function() {
        ToggleConfigSelected(1);
        ToggleConfigItem(1, 1);
    });
    $("#ConfigDecUnit").click(function() {
        ToggleConfigSelected(2);
        ToggleConfigItem(2, 1);
    });
    $("#ConfigColorScale").click(function() {
        if (configItemSelected === 3 && configItemEditing) { DeactivateConfigItem(); }
        else { ToggleConfigSelected(3); ActivateConfigItem(); }
    });
    $("#ConfigBarScale").click(function() {
        if (configItemSelected === 4 && configItemEditing) { DeactivateConfigItem(); }
        else { ToggleConfigSelected(4); ActivateConfigItem(); }
    });
    $("#ConfigWarnDiff").click(function() {
        if (configItemSelected === 5 && configItemEditing) { DeactivateConfigItem(); }
        else { ToggleConfigSelected(5); ActivateConfigItem(); }
    });
    $("#ConfigStatusPreview").click(function() {
        if (configItemSelected === 6 && configItemEditing) { DeactivateConfigItem(); }
        else { ToggleConfigSelected(6); ActivateConfigItem(); }
    });
    $("#CloseConfig").click(function() {
        CloseConfig();
    });
    /*
     * Direct Touch Actions ID Modal Layer
     */
    $("#SetupModalIDBox").on("click", "li", function(event){
        ToggleIdSelected(parseInt(this.id.slice(-1)));
        IdSelected();
    });
    /*
     * Button Helper Functions
     */
    function CheckSensorData() {
        if (sensorData[0].id === "" ||
            sensorData[1].id === "" ||
            sensorData[2].id === "" ||
            sensorData[3].id === "" ) {
            return false;
        } else {
            return true;
        }
    }
    function InitializeSetup() {
        AddDebug("Open Setup");
        ToggleSelected(0);
        tempSaved.fl = sensorData[0].id;
        tempSaved.fr = sensorData[1].id;
        tempSaved.rl = sensorData[2].id;
        tempSaved.rr = sensorData[3].id;
        AddDebug("Temporary values: " + tempSaved.fl + ", " + tempSaved.fr + ", " + tempSaved.rl + ", " + tempSaved.rr);
        $("#SetupIDBox1").html("<span class=\"label\">" + sensorData[0].pos + "</span><span class=\"id\">" + sensorData[0].id + "</span><span class=\"pres\">" + sensorData[0].pres + "</span><span class=\"temp\">" + sensorData[0].temp + "</span>");
        $("#SetupIDBox2").html("<span class=\"label\">" + sensorData[1].pos + "</span><span class=\"id\">" + sensorData[1].id + "</span><span class=\"pres\">" + sensorData[1].pres + "</span><span class=\"temp\">" + sensorData[1].temp + "</span>");
        $("#SetupIDBox3").html("<span class=\"label\">" + sensorData[2].pos + "</span><span class=\"id\">" + sensorData[2].id + "</span><span class=\"pres\">" + sensorData[2].pres + "</span><span class=\"temp\">" + sensorData[2].temp + "</span>");
        $("#SetupIDBox4").html("<span class=\"label\">" + sensorData[3].pos + "</span><span class=\"id\">" + sensorData[3].id + "</span><span class=\"pres\">" + sensorData[3].pres + "</span><span class=\"temp\">" + sensorData[3].temp + "</span>");
        $("#TpmsContainer").toggleClass("SetupActive");
        setupLayer = 1;
    }
    function ToggleSelected(sel) {
        $(".selectable").removeClass("active");
        setupItemSelected = sel;
        $("#"+setupItems[setupItemSelected]).toggleClass("active");
    }
    //
    function IdModalUp(pos) {
        AddDebug("ID-Auswahl");
        var list = "<li id=\"li0\" class=\"idListElement\">None</li>";
        var counter  = 1;
        var active   = 1;
        availableIds = [];
        sensorData.forEach(function(set){
            AddDebug("Pos: " + counter + " - " + set.id);
            if (set.id === tempSaved[pos]) {
                //console.log("POS: " +  pos + " already selected");
                active = counter + 1;
                availableIds.push(set);
                list += "<li id=\"li" + counter + "\" class=\"idListElement\"><span class=\"id\">" + set.id + "</span><span class=\"pres\">" + set.pres + "</span><span class=\"temp\">" + set.temp + "</span></li>";
                counter++;
            } else if (set.id === tempSaved.fl || set.id === tempSaved.fr || set.id === tempSaved.rl || set.id === tempSaved.rr) {
                // no show
            } else {
                availableIds.push(set);
                list += "<li id=\"li" + counter + "\" class=\"idListElement\"><span class=\"id\">" + set.id + "</span><span class=\"pres\">" + set.pres + "</span><span class=\"temp\">" + set.temp + "</span></li>";
                counter++;
            }
        });
        setupLayer = 2;
        $("#SetupModalIDBox").html(list);
        $("#SetupModalIDBox li:nth-of-type(" + active + ")").toggleClass("active");
        availableIdsSelector = active-1;
        $("#SetupModal").toggle();
    }
    //
    function ToggleIdSelected(sel) {
        $("#SetupModalIDBox li:nth-of-type("+(availableIdsSelector+1)+")").toggleClass("active");
        availableIdsSelector = sel;
        $("#SetupModalIDBox li:nth-of-type("+(availableIdsSelector+1)+")").toggleClass("active");
    }
    //
    function IdSelected(){
        var res  = "";
        var ans  = "";
        if (availableIdsSelector === 0) {
            ans  = "<span class=\"label\">" + sensorData[setupItemSelected].pos + "</span>";
        }
        else {
            res  = availableIds[availableIdsSelector-1].id;
            ans  = "<span class=\"label\">" + sensorData[setupItemSelected].pos + "</span><span class=\"id\">" + availableIds[availableIdsSelector-1].id + "</span><span class=\"pres\">" + availableIds[availableIdsSelector-1].pres + "</span><span class=\"temp\">" + availableIds[availableIdsSelector-1].temp + "</span>";
        }
        tempSaved[sensorData[setupItemSelected].pos] = res;
        $("#SetupIDBox"+(setupItemSelected+1)).html(ans);
        setupLayer = 1;
        $("#SetupModal").toggle();
    }
    function RotateTires() {
        var temporaryRl, temporaryRr;
        if (tempSaved.fl && tempSaved.fr && tempSaved.rl && tempSaved.rr) {
            temporaryRl = tempSaved.fl;
            temporaryRr = tempSaved.fr;
            tempSaved.fl = tempSaved.rl;
            tempSaved.fr = tempSaved.rr;
            tempSaved.rl = temporaryRl;
            tempSaved.rr = temporaryRr;
            //
            temporaryRl = $("#SetupIDBox1").html();
            temporaryRr = $("#SetupIDBox2").html();
            $("#SetupIDBox1").html($("#SetupIDBox3").html());
            $("#SetupIDBox2").html($("#SetupIDBox4").html());
            $("#SetupIDBox3").html(temporaryRl);
            $("#SetupIDBox4").html(temporaryRr);
            $("#SetupIDBox1 .label").html("fl");
            $("#SetupIDBox2 .label").html("fr");
            $("#SetupIDBox3 .label").html("rl");
            $("#SetupIDBox4 .label").html("rr");

        } else {
            ShowMessage(1);
        }
    }
    function ShowMessage(n) {
        message = true;
        $("#MessageContainer").toggle();
        $("#MessageText").html(warnings[n]);
    }
    /*
    * Config Setup
    */
    function updatePreviewBars() {
        var D = pressureSettings.previewRange / 100;
        var percs    = [1-D, 1-D/2, 1.0, 1+D/2, 1+D];
        var barIds   = ["previewBar80", "previewBar90", "previewBar100", "previewBar110", "previewBar120"];
        var labelIds = ["previewLabel80", "previewLabel90", "previewLabel100", "previewLabel110", "previewLabel120"];
        var labelPercs = ["previewLabelPerc80", "previewLabelPerc90", "previewLabelPerc100", "previewLabelPerc110", "previewLabelPerc120"];
        for (var i = 0; i < percs.length; i++) {
            var val    = pressureSettings.normal * percs[i];
            var color  = perc2color(val);
            var height = pixelPosition(val);
            $("#" + barIds[i]).css({'background': color, 'height': height + 'px'});
            $("#" + labelIds[i]).text(val.toFixed(2).replace(".", ","));
            $("#" + labelPercs[i]).text((percs[i] * 100).toFixed(0) + "%");
        }
    }
    function AdjustConfigItem(dir) {
        if (configLayer) {
            ToggleConfigItem(configItemSelected, dir);
        }
    }
    function OpenConfig() {
        AddDebug("Open Config");
        configItemSelected = 0;
        InitConfigValues();
        $(".selectable").removeClass("selected");
        $("#"+configItems[configItemSelected]).addClass("selected");
        $("#TpmsContainer").toggleClass("ConfigActive");
        configLayer = true;
    }
    function CloseConfig() {
        AddDebug("Close Config");
        configLayer = false;
        configItemEditing = false;
        warnMin = pressureSettings.normal * (1 - pressureSettings.warnThreshold / 100);
        warnMax = pressureSettings.normal * (1 + pressureSettings.warnThreshold / 100);
        $(".selectable").removeClass("selected");
        $("#"+menu[menuSelector]).addClass("selected");
        $("#TpmsContainer").toggleClass("ConfigActive");
        try {
            localStorage.setItem("tpmsConfig", JSON.stringify({
                tempIsF: tempIsF,
                pressIsPsi: pressIsPsi,
                decIsComma: decIsComma
            }));
            localStorage.setItem("pressureSettings", JSON.stringify(pressureSettings));
        } catch(e) {
            AddDebug("Error saving config: " + e);
        }
    }
    function InitConfigValues() {
        $("#ConfigTempUnitValue").text(tempIsF ? "°F" : "°C");
        $("#ConfigPressUnitValue").text(pressIsPsi ? "psi" : "bar");
        $("#ConfigDecUnitValue").text(decIsComma ? "," : ".");
        $("#ConfigColorScaleValue").text(pressureSettings.colorScale);
        $("#ConfigWarnDiffValue").text(pressureSettings.warnThreshold);
        $("#ConfigBarScaleValue").text(pressureSettings.barScale);
        $("#configStatusPreviewValue").text(pressureSettings.previewRange);
        updatePreviewBars();
    }
    function ToggleConfigSelected(sel) {
        if (configItemEditing) {
            configItemEditing = false;
            $("#"+configItems[configItemSelected]+" .configItemValue").removeClass("active");
        }
        $(".selectable").removeClass("selected");
        configItemSelected = sel;
        $("#"+configItems[configItemSelected]).addClass("selected");
    }
    function ActivateConfigItem() {
        configItemEditing = true;
        $("#"+configItems[configItemSelected]+" .configItemValue").addClass("active");
    }
    function DeactivateConfigItem() {
        configItemEditing = false;
        $("#"+configItems[configItemSelected]+" .configItemValue").removeClass("active");
    }
    function ToggleConfigItem(sel, dir) {
        dir = dir || 1;
        if (configItems[sel] === "ConfigTempUnit") {
            tempIsF = !tempIsF;
            $("#ConfigTempUnitValue").text(tempIsF ? "°F" : "°C");
        } else if (configItems[sel] === "ConfigPressUnit") {
            pressIsPsi = !pressIsPsi;
            $("#ConfigPressUnitValue").text(pressIsPsi ? "psi" : "bar");
        } else if (configItems[sel] === "ConfigDecUnit") {
            decIsComma = !decIsComma;
            $("#ConfigDecUnitValue").text(decIsComma ? "," : ".");
        } else if (configItems[sel] === "ConfigColorScale") {
            pressureSettings.colorScale = Math.min(10, Math.max(1, pressureSettings.colorScale + dir * 1));
            $("#ConfigColorScaleValue").text(pressureSettings.colorScale);
            updatePreviewBars();
        } else if (configItems[sel] === "ConfigWarnDiff") {
            pressureSettings.warnThreshold = Math.min(100, Math.max(1, pressureSettings.warnThreshold + dir));
            $("#ConfigWarnDiffValue").text(pressureSettings.warnThreshold);
        } else if (configItems[sel] === "ConfigBarScale") {
            pressureSettings.barScale = Math.min(10,Math.max(1, pressureSettings.barScale + dir));
            $("#ConfigBarScaleValue").text(pressureSettings.barScale);
            updatePreviewBars();
        } else if (configItems[sel] === "ConfigStatusPreview") {
            pressureSettings.previewRange = Math.min(33, Math.max(2, pressureSettings.previewRange + dir));
            $("#configStatusPreviewValue").text(pressureSettings.previewRange);
            updatePreviewBars();
        }
    }
    /*
    * Target Pressure Setup
    */
    function InitializeTargetPressureSetup() {
        targetPressureLayer = true;
        // save string as float
        targetPressureValue = parseFloat($("#targetPressureValue").html().replace(",","."));
        $("#targetPressureValue").toggleClass("active");
    }
    function CloseTargetPressureSetup() {
        AddDebug("closed Target Pressure Setup");
        targetPressureLayer = false;
        $("#targetPressureValue").toggleClass("active");
        // save float as string with two decimal
        $("#targetPressureValue").html((targetPressureValue.toFixed(2).toString().replace(".",",")));
        pressureSettings.normal = targetPressureValue;
        try {
            localStorage.setItem("pressureSettings", JSON.stringify(pressureSettings));
        } catch(e) {
            //console.error("Error saving pressureSettings to localStorage:", e);
            AddDebug("Error saving pressureSettings to localStorage: " + e);
        }
    }

    /*
    * Debugging
    */
    function ToggleDebug() {
        $("#DebugLayer").toggle();
    }
    function AddClickDebug(clickVal) {
        var content = $("#debugContainer").html();
        content += "<span class=\"z\">" + debugLine + "</span> clicked " + clickVal + "<br>";
        debugLine ++;
        /*$("#debugContainer").html(content);*/
    }
    function AddDebug(msg) {
        var content = $("#debugContainer").html();
        content += "<span class=\"z\">" + debugLine + "</span> " + msg + "<br>";
        debugLine ++;
        $("#debugContainer").html(content);
    }
}