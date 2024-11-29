#!/bin/bash
# Script para hacer una copia de seguridad de la base de datos 'agenda' en MariaDB
# y asegurarse de que la carpeta de backups no tenga más de 10 copias

# Configuración
FECHA=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/var/www/html/tareas/backup"
BACKUP_FILE="$BACKUP_DIR/agenda_backup_$FECHA.sql"
MAX_SIZE=50000 # Tamaño máximo permitido de la carpeta en KB (50MB = 50000KB)
MAX_BACKUPS=10 # Número máximo de copias de seguridad

# Hacer la copia de seguridad de la base de datos 'agenda'
mysqldump -u root --password="" agenda > "$BACKUP_FILE"

# Verificar si el backup fue exitoso
if [ $? -eq 0 ]; then
    echo "Copia de seguridad realizada con éxito: $BACKUP_FILE"
else
    echo "Error al realizar la copia de seguridad" >&2
    exit 1
fi

# Función para obtener el tamaño total de la carpeta de backups en KB
get_dir_size() {
    du -sk "$BACKUP_DIR" | cut -f1
}

# Verificar si el tamaño de la carpeta excede el límite
while [ $(get_dir_size) -gt $MAX_SIZE ]; do
    # Eliminar el archivo más antiguo en el directorio de backups
    OLDEST_FILE=$(ls -t "$BACKUP_DIR" | tail -1)
    echo "Eliminando el archivo más antiguo: $OLDEST_FILE"
    rm "$BACKUP_DIR/$OLDEST_FILE"
done

# Verificar si el número de backups excede el límite de copias
BACKUP_COUNT=$(ls "$BACKUP_DIR" | wc -l)
while [ $BACKUP_COUNT -gt $MAX_BACKUPS ]; do
    # Eliminar el archivo más antiguo en el directorio de backups
    OLDEST_FILE=$(ls -t "$BACKUP_DIR" | tail -1)
    echo "Eliminando el archivo más antiguo por límite de copias: $OLDEST_FILE"
    rm "$BACKUP_DIR/$OLDEST_FILE"
    BACKUP_COUNT=$(ls "$BACKUP_DIR" | wc -l)
done

echo "Proceso completado."
