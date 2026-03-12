/*
 * config.h
 * 
 * Some platform dependent defines to make Redbear Duo more Arduino like
 *
 */


/* Select ONLY ONE of... */

//#define REDBEAR_DUO
//#define ARDUINO_PRO
#define ARDUINO_NANO

/* END PLATFORM SELECTION */



#ifdef REDBEAR_DUO

#if defined(ARDUINO) 
  SYSTEM_MODE(SEMI_AUTOMATIC); 
#endif

#define LED_BUILTIN D7

#ifndef true
 #define true TRUE
 #define false FALSE
#endif

#endif

#ifdef ARDUINO_PRO
 #define ARDUINO_GENERIC
#endif

#ifdef ARDUINO_NANO
 #define ARDUINO_GENERIC
#endif


#ifdef ARDUINO_GENERIC

 #include "EEPROM.h"

 #define D0   0
 #define D1   1
 #define D2   2
 #define D3   3
 #define D4   4
 #define D5   5
 #define D6   6
 #define D7   7
 #define D8   8
 #define D9   9
 #define D10 10
 #define D11 11
 #define D12 12
 #define D13 13

#endif

/* Enable supported features per platform */

#ifdef ARDUINO_GENERIC

 #define CC1101_SUPPORT
 #define TPMS_433_SUPPORT
 #define OIL_SUPPORT

#endif

/* **************************************************************** */

/*
 * Configuration of all modules.
 * Make sure there is no duplication of ports !
 * 
 */
#ifdef CC1101_SUPPORT
  /*
   * Pin assignment
   */
 #define CC1101_CS       D10 // Chip Select pin
 #define CC1101_RXPin    D2  // GDO2
 #define CC1101_TXPin    D9  // wlowi: GDO0 is also TX pin
 #define CC1101_CDPin    D9  // wlowi: GDO0 carrier detect pin

#endif

#ifdef OIL_SUPPORT

 /* Analog input pins (A/D converter) */
 #define OIL_T_PIN       A2
 #define OIL_P_PIN       A0

#endif

/* Broadcast mode: per-sensor update intervals */
#define TPMS_DEFAULT_INTERVAL_MS  1000   /* 1 Hz  — tyre pressure changes slowly */
#define OIL_DEFAULT_INTERVAL_MS    250   /* 4 Hz  — responsive for driving */


