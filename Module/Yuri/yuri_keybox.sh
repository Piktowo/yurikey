#!/system/bin/sh

# Define important paths and file names
TRICKY_DIR="/data/adb/tricky_store"
REMOTE_URL="https://raw.githubusercontent.com/Yurii0307/yurikey/main/key"
REMOTE_FILE="$TRICKY_DIR/key"
BREMOTE_FILE="$TRICKY_DIR/keybox"
TARGET_FILE="$TRICKY_DIR/keybox.xml"
BACKUP_FILE="$TRICKY_DIR/keybox.xml.bak"
DEPENDENCY_MODULE="/data/adb/modules/tricky_store"
DEPENDENCY_MODULE_UPDATE="/data/adb/modules_update/tricky_store"
BBIN="/data/adb/Yurikey/bin"
ORG_PATH="$PATH"

# Check if Tricky Store module is installed (required dependency)
if [ -d "$DEPENDENCY_MODULE_UPDATE" ] || [ -d "$DEPENDENCY_MODULE" ]; then
  ui_print "- Tricky Store installed"
else
  ui_print "- Error: Tricky Store module file not found!"
  ui_print "- Please install Tricky Store before using Yuri Keybox."
  return 0
fi

download() {
    PATH=/data/adb/magisk:/data/data/com.termux/files/usr/bin:$PATH
    if command -v curl >/dev/null 2>&1; then
        curl --connect-timeout 10 -Ls "$1"
    else
        busybox wget -T 10 --no-check-certificate -qO- "$1"
    fi
    PATH="$ORG_PATH"
}

# Function to download the remote keybox
get_keybox() {
    download "$REMOTE_URL" > "$REMOTE_FILE" || ui_print "Error: Keybox download failed, please download and add it manually!"

    if ! base64 -d "$REMOTE_FILE" > "$BREMOTE_FILE" 2>/dev/null; then
        ui_print "- Error: Base64 decode failed!"
        rm -f "$REMOTE_FILE"
        return 1
    fi

    rm -f "$REMOTE_FILE"
    return 0
}

# Function to update the keybox file
update_keybox() {
  ui_print "- Fetching remote keybox..."
  if ! get_keybox; then
    ui_print "- Failed to fetch keybox!"
    return
  fi
}

# Start main logic
mkdir -p "$TRICKY_DIR" # Make sure the directory exists
update_keybox          # Begin the update process

log_message "Finish"
