#!/bin/bash

#
# usage:
#   set-configs.sh {your_env_file_path}
#

ENV_FILE="$1"

if [ ! -f "$ENV_FILE" ]; then
  echo "cannot find env file: $ENV_FILE"
  exit 1
fi

DART_DEFINES=""

while IFS='=' read -r key value; do
  echo "--dart-define=${key}=${value} "
done < "$ENV_FILE"

