<?php
include 'conexion.php';

$logFile = 'calendario_operaciones.log';

function writeLog($message)
{
    global $logFile;
    $dateTime = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'];
    $maxFileSize = 1048576 / 2; // 0.5 MB
    $logEntry = "[$ip] [$dateTime] $message\n";

    if (file_exists($logFile)) {
        $currentSize = filesize($logFile);
        if ($currentSize > $maxFileSize) {
            $handle = fopen($logFile, 'r+');
            fseek($handle, $currentSize - $maxFileSize);
            $newContent = fread($handle, $maxFileSize);
            fclose($handle);
            file_put_contents($logFile, $newContent);
        }
    }
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

header('Content-Type: application/json');

$requestMethod = $_SERVER["REQUEST_METHOD"];

switch ($requestMethod) {
    case 'GET':
        if (isset($_GET['fecha'])) {
            $fecha = $conn->real_escape_string($_GET['fecha']);
            // Agregamos el campo id y ordenamos por la hora
            $sql = "SELECT id, titulo, hora, ip FROM eventos WHERE DATE(fecha) = '$fecha' ORDER BY hora ASC";
            // writeLog("Executing GET request: $sql");
        } else {
            $sql = "SELECT id, titulo, hora, ip FROM eventos ORDER BY hora ASC";
            // writeLog("Executing GET request: $sql");
        }
        $result = $conn->query($sql);
        $eventos = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $eventos[] = [
                    "id" => $row["id"],
                    "titulo" => htmlspecialchars($row["titulo"]),
                    "hora" => $row["hora"],
                    "ip" => $row["ip"]
                ];
            }
        }
        echo json_encode($eventos);
        break;


    case 'POST':
        $titulo = isset($_POST['titulo']) ? $conn->real_escape_string($_POST['titulo']) : '';
        $fecha = isset($_POST['fecha']) ? $conn->real_escape_string($_POST['fecha']) : '';
        $hora = isset($_POST['hora']) ? $conn->real_escape_string($_POST['hora']) : '';
        $ip = $_SERVER['REMOTE_ADDR'];

        if ($titulo && $fecha && $hora) {
            $sql = "INSERT INTO eventos (titulo, fecha, hora, ip) VALUES ('$titulo', '$fecha', '$hora', '$ip')";
            if ($conn->query($sql) === TRUE) {
                writeLog("Evento creado: Título: $titulo, Fecha: $fecha, Hora: $hora");
                echo json_encode(["message" => "Nuevo evento creado exitosamente"]);
            } else {
                writeLog("Error creando evento: " . $conn->error);
                echo json_encode(["message" => "Error: " . $conn->error]);
            }
        } else {
            echo json_encode(["message" => "Título, fecha o hora no proporcionados"]);
        }
        break;

    case 'PUT':
        parse_str(file_get_contents("php://input"), $putVars);
        if (isset($putVars['id']) && isset($putVars['nuevotitulo'])) {
            $id = intval($putVars['id']);
            $nuevotitulo = $conn->real_escape_string($putVars['nuevotitulo']);
            $sql = "UPDATE eventos SET titulo='$nuevotitulo' WHERE id=$id";
            if ($conn->query($sql) === TRUE) {
                writeLog("Evento actualizado: ID: $id, Nuevo título: $nuevotitulo");
                echo json_encode(["message" => "Evento actualizado exitosamente"]);
            } else {
                writeLog("Error actualizando evento: " . $conn->error);
                echo json_encode(["message" => "Error actualizando evento: " . $conn->error]);
            }
        } else {
            echo json_encode(["message" => "ID o nuevo título no proporcionados"]);
        }
        break;

    case 'DELETE':
        parse_str(file_get_contents("php://input"), $deleteVars);
        writeLog("Datos DELETE recibidos: " . print_r($deleteVars, true)); // Registro de depuración
        if (isset($deleteVars['id'])) {
            $id = intval($deleteVars['id']);
            $sql = "DELETE FROM eventos WHERE id=$id";
            if ($conn->query($sql) === TRUE) {
                writeLog("Evento eliminado: ID: $id");
                echo json_encode(["message" => "Evento eliminado exitosamente"]);
            } else {
                writeLog("Error eliminando evento: " . $conn->error);
                echo json_encode(["message" => "Error eliminando evento: " . $conn->error]);
            }
        } else {
            echo json_encode(["message" => "ID no proporcionado"]);
        }
        break;


    default:
        writeLog("Método no soportado");
        echo json_encode(["message" => "Método no soportado"]);
        break;
}

$conn->close();
