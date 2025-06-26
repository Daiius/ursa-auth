#!/bin/bash

#
# usage:
#   set-configs.sh {your_env_file_path}
#

ENV_FILE="$1"
PLIST_FILE="ios/Runner/Info.plist"

IOS_PLIST_TEMPLATE="ios/Runner/Info.plist.template"
IOS_PLIST_OUT="ios/Runner/Info.plist"

# Linux/macOS で sed コマンドの引数が違う部分を吸収　
# BSD版にはないオプションを与えて判断する
sedi() {
  if sed --version >/dev/null 2>&1; then
    # Linux
    sed -i "$@"
  else
    # macOS (BSD)
    sed -i '' "$@"
  fi
}

# TODO android settings

cp "$IOS_PLIST_TEMPLATE" "$IOS_PLIST_OUT"

if [ ! -f "$ENV_FILE" ]; then
  echo "cannot find env file: $ENV_FILE"
  exit 1
fi

DART_DEFINES=""

while IFS='=' read -r key value; do
  echo "processing: ${key}..."
  sedi "s|{{${key}}}|${value}|g" "$IOS_PLIST_OUT"
done < "$ENV_FILE"

