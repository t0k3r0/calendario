<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
$servername = "localhost";
$username = "root";
$password = "";
$dbnombre = "agenda";
$conn = new mysqli($servername, $username, $password, $dbnombre);
if ($conn->connect_error) {
    die("Conexion fallida: " . $conn->connect_error);
}
function lockFile($filePath)
{
    $fp = fopen($filePath, 'c');
    if (flock($fp, LOCK_EX)) {
        return $fp;
    } else {
        fclose($fp);
        return false;
    }
}
function unlockFile($fp)
{
    flock($fp, LOCK_UN);
    fclose($fp);
}
$logFile = 'tareas_operaciones.log';
function writeLog($message)
{
    global $logFile;
    $maxFileSize = 1048576 / 2; // 1 MB en bytes
    $dateTime = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'];
    $logEntry = "[$ip] [$dateTime] $message\n";

    // Leer el contenido actual del archivo, si existe
    if (file_exists($logFile)) {
        $currentSize = filesize($logFile);
        // Si el archivo existe y supera el tamaño máximo, recortarlo
        if ($currentSize > $maxFileSize) {
            // Redimensionar el archivo desde el principio
            $handle = fopen($logFile, 'r+');
            // Mover el puntero al final del archivo - tamaño máximo
            fseek($handle, $currentSize - $maxFileSize);
            // Leer el contenido desde el final hacia atrás
            $newContent = fread($handle, $maxFileSize);
            fclose($handle);

            // Guardar el nuevo contenido del archivo
            file_put_contents($logFile, $newContent);
        }
    }

    // Agregar la nueva entrada al final del archivo
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

header('Content-Type: application/json');
$requestBody = file_get_contents('php://input');
writeLog('Contenido recibido: ' . $requestBody);
$data = json_decode($requestBody, true);
if (!isset($data['accion'])) {
    writeLog("Acción no proporcionada");
    echo json_encode(['error' => 'Acción no proporcionada']);
    exit;
}
$accion = $data['accion'];
writeLog("$accion= " . $accion);
try {
    if ($accion == 'listar_tareas_pendientes')
        listarTareasPendientes();
    else if ($accion == 'listar_tareas_completadas')
        listarTareasCompletadas();
    else if ($accion == 'crear_tarea')
        crearTarea($data['tarea']);
    else if ($accion == 'completar_tarea')
        completarTarea($data['tarea']);
    else if ($accion == 'ranking_completadas')
        rankingCompletadas();
    else if ($accion == 'eliminar_tarea')
        eliminarTarea($data['tarea']);
    else if ($accion == 'actualizar_mas_info')
        actualizarMasInfo($data['tarea']);
    else if ($accion == 'reordenar_tareas')
        reordenarTareas($data['posAntigua'], $data['posNueva']);
} finally {
    actualizarPosiciones();
    $conn->close();
}
function listarTareasPendientes()
{
    global $conn;
    $stmt = $conn->prepare("SELECT * FROM tareas_pendientes");
    $stmt->execute();
    $result = $stmt->get_result();
    $tasks = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode($tasks);
}
function listarTareasCompletadas()
{
    global $conn;
    $stmt = $conn->prepare("SELECT * FROM tareas_completadas");
    $stmt->execute();
    $result = $stmt->get_result();
    $tasks = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode($tasks);
}
function crearTarea($tarea)
{
    global $conn;
    $result = $conn->query("SELECT MAX(posicion) as max_pos FROM tareas_pendientes");
    $row = $result->fetch_assoc();
    $nuevaPosicion = $row['max_pos'] + 1;
    $ipCreacion = $_SERVER['REMOTE_ADDR'];
    // $fechaCreacion = date('Y-m-d H:i:s');
    $stmt = $conn->prepare("INSERT INTO tareas_pendientes (texto, mas_info, posicion, ip_creacion, fecha_creacion) VALUES (?, ?, ?, ?, NOW())");
    $stmt->bind_param("ssis", $tarea['texto'], $tarea['masInfo'], $nuevaPosicion, $ipCreacion);
    if ($stmt->execute()) {
        $conn->commit();
        writeLog("Insertada en tareas_pendientes la tarea '" . $tarea['texto'] . "' por el usuario con IP " . $ipCreacion);
    } else {
        writeLog("Error al insertar la tarea: " . $stmt->error);
    }
    $stmt->close();
}

function rankingCompletadas()
{
    global $conn;
    $stmt = $conn->prepare("
        SELECT ip_completada AS ip, COUNT(*) AS count
        FROM tareas_completadas
        GROUP BY ip_completada
    ");
    if (!$stmt) {
        throw new Exception("Error en la preparación del statement de conteo: " . $conn->error);
    }
    if (!$stmt->execute()) {
        throw new Exception("Error al contar las tareas completadas por IP: " . $stmt->error);
    }
    $result = $stmt->get_result();
    $ranking = [];
    while ($row = $result->fetch_assoc()) {
        $ranking[] = $row;
    }
    $stmt->close();
    echo json_encode($ranking);
}
function completarTarea($tarea)
{
    global $conn;
    if (!isset($tarea['id'])) {
        writeLog("Error: ID de la tarea no proporcionado en completarTarea.");
        echo json_encode(['error' => 'ID de la tarea no proporcionado en completarTarea']);
        return;
    }
    if (!lockFile('tareas.lock')) {
        writeLog("No se pudo adquirir el bloqueo.");
        echo json_encode(['error' => 'No se pudo adquirir el bloqueo']);
        return;
    }
    try {
        $ipCompletada = $_SERVER['REMOTE_ADDR'];
        $idTarea = $tarea['id'];
        $conn->begin_transaction();

        $stmt = $conn->prepare("
            INSERT INTO tareas_completadas (id, texto, mas_info, fecha_completada, ip_completada)
            SELECT id, texto, mas_info, NOW(), ?
            FROM tareas_pendientes
            WHERE id = ?
        ");
        if (!$stmt) {
            throw new Exception("Error en la preparación del statement de inserción: " . $conn->error);
        }
        $stmt->bind_param("si", $ipCompletada, $idTarea);
        if (!$stmt->execute()) {
            throw new Exception("Error al insertar en tareas_completadas: " . $stmt->error);
        }
        $stmt->close();

        $stmt = $conn->prepare("DELETE FROM tareas_pendientes WHERE id = ?");
        if (!$stmt) {
            throw new Exception("Error en la preparación del statement de completar en completarTarea: " . $conn->error);
        }
        $stmt->bind_param("i", $idTarea);
        if (!$stmt->execute()) {
            throw new Exception("Error al eliminar de tareas_pendientes en completarTarea: " . $stmt->error);
        }
        $stmt->close();

        $stmt = $conn->prepare("UPDATE tareas_pendientes SET posicion = posicion - 1 WHERE posicion > ?");
        if (!$stmt) {
            throw new Exception("Error en la preparación del statement de actualización de posiciones: " . $conn->error);
        }
        $stmt->bind_param("i", $posicionTarea);
        if (!$stmt->execute()) {
            throw new Exception("Error al actualizar las posiciones: " . $stmt->error);
        }
        $stmt->close();

        $conn->commit();
        writeLog("Tarea con ID " . $idTarea . " movida a tareas_completadas por el usuario con IP " . $ipCompletada);
        echo json_encode(['success' => 'Tarea movida a eliminadas con éxito']);
    } catch (Exception $e) {
        $conn->rollback();
        writeLog("Error al eliminar la tarea: " . $e->getMessage());
        echo json_encode(['error' => $e->getMessage()]);
    }
    unlockFile(lockFile('tareas.lock'));
}

function eliminarTarea($tarea)
{
    global $conn;
    if (!isset($tarea['id'])) {
        writeLog("Error: ID de la tarea no proporcionado en eliminarTarea.");
        echo json_encode(['error' => 'ID de la tarea no proporcionado en eliminarTarea']);
        return;
    }
    if (!lockFile('tareas.lock')) {
        writeLog("No se pudo adquirir el bloqueo.");
        echo json_encode(['error' => 'No se pudo adquirir el bloqueo']);
        return;
    }
    try {
        // $fechaEliminada = date('Y-m-d H:i:s');
        $ipEliminada = $_SERVER['REMOTE_ADDR'];
        $idTarea = $tarea['id'];
        $conn->begin_transaction();
        $stmt = $conn->prepare("
            INSERT INTO tareas_eliminadas (id, texto, mas_info, fecha_eliminada, ip_eliminada)
            SELECT id, texto, mas_info, NOW(), ?
            FROM tareas_pendientes
            WHERE id = ?
        ");
        if (!$stmt) {
            throw new Exception("Error en la preparación del statement de inserción: " . $conn->error);
        }
        $stmt->bind_param("si", $ipEliminada, $idTarea);
        if (!$stmt->execute()) {
            throw new Exception("Error al insertar en tareas_eliminadas: " . $stmt->error);
        }
        $stmt->close();
        $stmt = $conn->prepare("DELETE FROM tareas_pendientes WHERE id = ?");
        if (!$stmt) {
            throw new Exception("Error en la preparación del statement de eliminación en eliminarTarea: " . $conn->error);
        }
        $stmt->bind_param("i", $idTarea);
        if (!$stmt->execute()) {
            throw new Exception("Error al eliminar de tareas_pendientes en eliminarTarea: " . $stmt->error);
        }
        $stmt->close();
        $stmt = $conn->prepare("UPDATE tareas_pendientes SET posicion = posicion - 1 WHERE posicion > ?");
        if (!$stmt) {
            throw new Exception("Error en la preparación del statement de actualización de posiciones: " . $conn->error);
        }
        $stmt->bind_param("i", $posicionTarea);
        if (!$stmt->execute()) {
            throw new Exception("Error al actualizar las posiciones: " . $stmt->error);
        }
        $stmt->close();
        $conn->commit();
        writeLog("Tarea con ID " . $idTarea . " movida a tareas_eliminadas por el usuario con IP " . $ipEliminada);
        echo json_encode(['success' => 'Tarea movida a eliminadas con éxito']);
    } catch (Exception $e) {
        $conn->rollback();
        writeLog("Error al eliminar la tarea: " . $e->getMessage());
        echo json_encode(['error' => $e->getMessage()]);
    }
    unlockFile(lockFile('tareas.lock'));
}
function actualizarMasInfo($tarea)
{
    global $conn;
    if (!isset($tarea['id']) || !isset($tarea['masInfo'])) {
        writeLog("Error: ID o masInfo de la tarea no proporcionado.");
        echo json_encode(['error' => 'ID o masInfo de la tarea no proporcionado']);
        return;
    }
    if (!lockFile('tareas.lock')) {
        writeLog("No se pudo adquirir el bloqueo.");
        echo json_encode(['error' => 'No se pudo adquirir el bloqueo']);
        return;
    }
    try {
        $masInfoTarea = $tarea['masInfo'];
        $idTarea = $tarea['id'];
        $stmt = $conn->prepare("UPDATE tareas_pendientes SET mas_info = ? WHERE id = ?");
        if (!$stmt) {
            writeLog("Error en la preparación del statement: " . $conn->error);
            echo json_encode(['error' => $conn->error]);
            return;
        }
        $stmt->bind_param("si", $masInfoTarea, $idTarea);
        if ($stmt->execute()) {
            writeLog("Tarea con ID " . $idTarea . " actualizada mas informacion con " . $masInfoTarea);
            echo json_encode(['success' => 'Tarea actualizada con éxito']);
        } else {
            writeLog("Error al actualizar mas informacion de la tarea: " . $stmt->error);
            echo json_encode(['error' => $stmt->error]);
        }
    } finally {
        if ($stmt)
            $stmt->close();
    }
    unlockFile(lockFile('tareas.lock'));
}
function reordenarTareas($posAntigua, $posNueva)
{
    global $conn;
    writeLog("posAntigua $posAntigua posNueva $posNueva");
    if (empty($posAntigua) || empty($posNueva)) {
        writeLog("Posiciones no proporcionadas en reordenarTareas");
        echo json_encode(['error' => 'Posiciones no proporcionadas']);
        return;
    }
    if (!lockFile('tareas.lock')) {
        writeLog("No se pudo adquirir el bloqueo.");
        echo json_encode(['error' => 'No se pudo adquirir el bloqueo']);
        return;
    }
    try {
        $conn->begin_transaction();
        $stmt = $conn->prepare("UPDATE tareas_pendientes SET posicion = -1 WHERE posicion = ?");
        $stmt->bind_param("i", $posAntigua);
        if (!$stmt->execute()) {
            writeLog("Error al ejecutar la primera consulta: " . $stmt->error);
            $conn->rollback();
            echo json_encode(['error' => 'Error al reordenar la tarea']);
            return;
        }
        if ($posAntigua < $posNueva) {
            $stmt = $conn->prepare("UPDATE tareas_pendientes SET posicion = posicion - 1 WHERE posicion > ? AND posicion <= ?");
            $stmt->bind_param("ii", $posAntigua, $posNueva);
        } else {
            $stmt = $conn->prepare("UPDATE tareas_pendientes SET posicion = posicion + 1 WHERE posicion >= ? AND posicion < ?");
            $stmt->bind_param("ii", $posNueva, $posAntigua);
        }
        if (!$stmt->execute()) {
            writeLog("Error al ejecutar la segunda consulta: " . $stmt->error);
            $conn->rollback();
            echo json_encode(['error' => 'Error al reordenar la tarea']);
            return;
        }
        $stmt = $conn->prepare("UPDATE tareas_pendientes SET posicion = ? WHERE posicion = -1");
        $stmt->bind_param("i", $posNueva);
        if ($stmt->execute()) {
            $conn->commit();
            writeLog("reordenarTareas ejecutado con éxito");
            echo json_encode(['success' => 'Tarea reordenada con éxito']);
        } else {
            $conn->rollback();
            writeLog("Error al ejecutar la tercera consulta: " . $stmt->error);
            echo json_encode(['error' => 'Error al reordenar la tarea']);
        }
    } finally {
        if ($stmt)
            $stmt->close();
    }
    unlockFile(lockFile('tareas.lock'));
}
function actualizarPosiciones()
{
    global $conn;
    if (!lockFile('tareas.lock')) {
        writeLog("No se pudo adquirir el bloqueo.");
        echo json_encode(['error' => 'No se pudo adquirir el bloqueo']);
        return;
    }
    // $lockFile = 'update_lock_file.lock';
    // $fp = fopen($lockFile, 'w');
    // if (!$fp) {
    //     writeLog("No se pudo abrir el archivo de bloqueo.");
    //     return false;
    // }
    // if (!flock($fp, LOCK_EX | LOCK_NB)) {
    //     writeLog("No se pudo adquirir el bloqueo del archivo.");
    //     fclose($fp);
    //     return false;
    // }
    try {
        $query = "
        SET @row_number = 0;
        UPDATE tareas_pendientes AS tp
        JOIN (
            SELECT
                id,
                @row_number := @row_number + 1 AS new_position
            FROM
                tareas_pendientes
            ORDER BY
                posicion
        ) AS temp
        ON tp.id = temp.id
        SET tp.posicion = temp.new_position;
    ";
        if (!$conn->multi_query($query)) {
            writeLog("Error al ejecutar la actualización de posiciones: " . $conn->error);
            return false;
        }
        while ($conn->more_results() && $conn->next_result()) {
            ;
        }
        writeLog("Posiciones actualizadas con éxito.");
        return true;
    } finally {
        unlockFile(lockFile('tareas.lock'));
        // flock($fp, LOCK_UN);
        // fclose($fp);
    }
}
