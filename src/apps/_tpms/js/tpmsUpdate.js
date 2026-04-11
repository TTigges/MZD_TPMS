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
        AddClickDebug("cntrlBtnUp");
    });
    $(".cntrlBtn2").click(function() {
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
            else if (menuSelector === 1) {
                // Open Config
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
            if (menuLayer && !setupLayer && !targetPressureLayer) {
                var sel = (menuSelector == menu.length-1) ? 0 : menuSelector+1;
                ToggleMenu(sel);
            }
            else if (menuLayer && !setupLayer && targetPressureLayer) {
                targetPressureValue += 0.1;
                $("#targetPressureValue").html((targetPressureValue.toFixed(2).toString().replace(".",",")));
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
            if (menuLayer && !setupLayer && !targetPressureLayer) {
                var sel = (menuSelector == 0) ? (menu.length-1) : menuSelector-1;
                ToggleMenu(sel);
            }
            else if (menuLayer && !setupLayer && targetPressureLayer) {
                targetPressureValue -= 0.1;
                $("#targetPressureValue").html((targetPressureValue.toFixed(2).toString().replace(".",",")));
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
        ToggleMenu(1);
        // Open Config
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