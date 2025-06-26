#!/bin/bash

ENV_FILE="$1"

./scripts/set-configs.sh $1

flutter run $(./scripts/get-dart-defines.sh $1)

