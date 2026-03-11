#!/bin/sh

while read action
do
    break
done

## Save Tire IDs
## ================================================================================================
if [[ ${action:0:11} = "saveTireIDs" ]]
then
  #ID=(${action//;/ })                # not working
  #IFS=";" read -a ID <<< "$action"   # not working
  #                              usbget -s TPMS -p "0=0f5476ea;1=0f547711;2=0f54771b;3=0f5476e8"
  #/tmp/mnt/data_persist/dev/bin/usbget -s TPMS -p "0=${ID[1]};1=${ID[2]};2=${ID[3]};3=${ID[4]}"
  #echo "saveTireIDs#success#0=${ID[1]};1=${ID[2]};2=${ID[3]};3=${ID[4]}"
  
  #expecting:  "saveTireIDs;0f5476ea;0f547711;0f54771b;0f5476e8"

  ID1=${action:12:8}
  ID2=${action:21:8}
  ID3=${action:30:8}
  ID4=${action:39:8}
  #echo ${ID1}
  #echo ${ID2}
  #echo ${ID3}
  #echo ${ID4}
  
  #/tmp/mnt/data_persist/dev/bin/usbget -s TPMS -p "0=${ID1};1=${ID2};2=${ID3};3=${ID4}"
  echo "saveTireIDs#success_save \"0=${ID1};1=${ID2};2=${ID3};3=${ID4}\""
fi

## TPMS Data
## ================================================================================================
if [ "${action}" == "tpmsData" ]
then
  while true
  do
    /tmp/mnt/data_persist/dev/bin/usbget -q TPMS
    # "FL: abc xx yy FR: abc xx yy RL: abc xx yy RR: abc xx yy"
    # FL
    TPMSFLID=`cat /tmp/mnt/data_persist/dev/bin/tpms.out | awk '{print $2}'`
    TPMSFLTEMP=`cat /tmp/mnt/data_persist/dev/bin/tpms.out | awk '{print $3}'`
    TPMSFLPRES=`cat /tmp/mnt/data_persist/dev/bin/tpms.out | awk '{print $4}'`
    # FR
    TPMSFRID=`cat /tmp/mnt/data_persist/dev/bin/tpms.out | awk '{print $6}'`
    TPMSFRTEMP=`cat /tmp/mnt/data_persist/dev/bin/tpms.out | awk '{print $7}'`
    TPMSFRPRES=`cat /tmp/mnt/data_persist/dev/bin/tpms.out | awk '{print $8}'`
    # RL
    TPMSRLID=`cat /tmp/mnt/data_persist/dev/bin/tpms.out | awk '{print $10}'`
    TPMSRLTEMP=`cat /tmp/mnt/data_persist/dev/bin/tpms.out | awk '{print $11}'`
    TPMSRLPRES=`cat /tmp/mnt/data_persist/dev/bin/tpms.out | awk '{print $12}'`
    # RR
    TPMSRRID=`cat /tmp/mnt/data_persist/dev/bin/tpms.out | awk '{print $14}'`
    TPMSRRTEMP=`cat /tmp/mnt/data_persist/dev/bin/tpms.out | awk '{print $15}'`
    TPMSRRPRES=`cat /tmp/mnt/data_persist/dev/bin/tpms.out | awk '{print $16}'`

    echo "tpmsData#${TPMSFLID}#${TPMSFLTEMP}#${TPMSFLPRES}#${TPMSFRID}#${TPMSFRTEMP}#${TPMSFRPRES}#${TPMSRLID}#${TPMSRLTEMP}#${TPMSRLPRES}#${TPMSRRID}#${TPMSRRTEMP}#${TPMSRRPRES}"

    sleep 5.0
  done
fi