#!/bin/bash

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="/backups/backup_${DATE}.sql"

echo "Début du backup : $DATE"

mysqldump -h mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Dump OK : $BACKUP_FILE"
  rclone copy "$BACKUP_FILE" gdrive:backups/
  echo "Upload Google Drive OK"
  rm "$BACKUP_FILE"
else
  echo "ERREUR : mysqldump a échoué"
  exit 1
fi