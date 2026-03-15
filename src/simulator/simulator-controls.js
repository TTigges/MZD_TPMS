/**
 * simulator-controls.js
 * Keyboard and mouse-wheel bindings that replicate the CMU multicontroller.
 *
 * Keyboard (focus must NOT be in a slider/input):
 *   Enter short  (<1200 ms) → select     → .cntrlBtn0 → ClickSelect()
 *   Enter long   (≥1200 ms) → selectStart → .cntrlBtn5 → OpenSetup()
 *   Arrow Up                → up         → .cntrlBtn1
 *   Arrow Down              → down       → .cntrlBtn2
 *   Arrow Left              → left/ccw   → .cntrlBtn4 → ClickPrev()
 *   Arrow Right             → right/cw   → .cntrlBtn3 → ClickNext()
 *
 * Mouse wheel (hover over #screen):
 *   Scroll up   → cw  → .cntrlBtn3 → ClickNext()
 *   Scroll down → ccw → .cntrlBtn4 → ClickPrev()
 */
(function () {
    "use strict";

    var LONGHOLD_MS = 1200;
    var enterTimer  = null;
    var enterHeld   = false;

    document.addEventListener("keydown", function (e) {
        // Don't intercept when the user is moving a slider or typing in an input
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

        switch (e.key) {
            case "Enter":
                if (enterTimer !== null) return;   // already counting down
                enterHeld = false;
                enterTimer = setTimeout(function () {
                    enterHeld = true;
                    $(".cntrlBtn5").click();        // selecth → OpenSetup()
                }, LONGHOLD_MS);
                e.preventDefault();
                break;

            case "ArrowUp":
                $(".cntrlBtn1").click();
                e.preventDefault();
                break;

            case "ArrowDown":
                $(".cntrlBtn2").click();
                e.preventDefault();
                break;

            case "ArrowLeft":
                $(".cntrlBtn4").click();           // left / ccw → ClickPrev()
                e.preventDefault();
                break;

            case "ArrowRight":
                $(".cntrlBtn3").click();           // right / cw → ClickNext()
                e.preventDefault();
                break;
        }
    });

    document.addEventListener("keyup", function (e) {
        if (e.key !== "Enter") return;
        clearTimeout(enterTimer);
        enterTimer = null;
        if (!enterHeld) {
            $(".cntrlBtn0").click();               // select → ClickSelect()
        }
        enterHeld = false;
        e.preventDefault();
    });

    // Mouse wheel over the CMU screen area
    var screen = document.getElementById("screen");
    if (screen) {
        var wheelLocked = false;

        screen.addEventListener("wheel", function (e) {
            e.preventDefault();

            if (wheelLocked) return;   // weiterer Event im selben Scroll-Burst → ignorieren
            wheelLocked = true;

            if (e.deltaY < 0) {
                $(".cntrlBtn3").click();   // cw  → ClickNext()
            } else {
                $(".cntrlBtn4").click();   // ccw → ClickPrev()
            }

            setTimeout(function () {
                wheelLocked = false;
            }, 100);                       // 100 ms Sperre nach jedem akzeptierten Event

        }, { passive: false });
    }
}());
