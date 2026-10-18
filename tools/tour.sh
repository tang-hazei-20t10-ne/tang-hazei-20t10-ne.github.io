#!/bin/sh
# Screenshot tour: CH=chapter VIEWS="name x z targetX targetZ pitch;..." tools/tour.sh
cd "$(dirname "$0")/.."
ARGS=""
IFS=';'
for v in $VIEWS; do
  IFS=' '; set -- $v
  ARGS="$ARGS eval:(()=>{const%20w=__game.current;w.player.pos.set($2,0,$3);w.player.yaw=Math.atan2(-($4-($2)),-($5-($3)));w.player.pitch=$6;})() wait:${W:-1300} shot:$1"
  IFS=';'
done
IFS=' '
node tools/shots.mjs ${CH:-island} ${SIZE:-1280 720} 5000 $ARGS 2>&1 | grep -v "GPU\|ReadPixels"
