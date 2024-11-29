#!/bin/bash

# Activar teclado
id_teclado=$(xinput list | grep -i "teclado" | grep -o 'id=[0-9]\+' | grep -o '[0-9]\+')
xinput enable $id_teclado

# Activar ratón
id_raton=$(xinput list | grep -i "mouse" | grep -o 'id=[0-9]\+' | grep -o '[0-9]\+')
xinput enable $id_raton
