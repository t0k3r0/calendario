import { mostrarNotificacion } from "./tareas.js";
const endpoint = "http://192.168.1.140/tareas/operaciones.php";
async function parseJSONResponse(respuesta) {
  try {
    const text = await respuesta.text();
    return JSON.parse(text);
  } catch (e) {
    console.error("Error al analizar JSON:", e);
    return null;
  }
}
export async function listarTareasPendientes() {
  try {
    const respuesta = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accion: "listar_tareas_pendientes" }),
    });
    if (!respuesta.ok) {
      throw new Error("Error al listar las tareas pendientes.");
    }
    const tareas = await parseJSONResponse(respuesta);
    return tareas;
  } catch (error) {
    console.log("Error en conexiones.js listarTareasPendientes:", error);
    return;
  }
}
export async function listarTareasCompletadas() {
  try {
    const respuesta = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accion: "listar_tareas_completadas" }),
    });
    if (!respuesta.ok) {
      throw new Error("Error al listar las tareas completadas.");
    }
    const tareas = await parseJSONResponse(respuesta);
    return tareas;
  } catch (error) {
    console.log("Error en conexiones.js listarTareasCompletadas:", error);
    return;
  }
}
export async function crearTarea(tarea) {
  try {
    const respuesta = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accion: "crear_tarea", tarea }),
    });
    if (!respuesta.ok) {
      throw new Error("Error al crear la tarea.");
    } else {
      mostrarNotificacion("Tarea creada con éxito", "green");
    }
  } catch (error) {
    console.log("Error en conexiones.js crearTarea:", error);
    return;
  }
}
export async function completarTarea(tarea) {
  try {
    const respuesta = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accion: "completar_tarea", tarea }),
    });
    if (!respuesta.ok) {
      throw new Error("Error al completar la tarea.");
    } else {
      mostrarNotificacion("Tarea completada con éxito", "green");
    }
  } catch (error) {
    console.log("Error en conexiones.js completarTarea:", error);
    return;
  }
}
export async function rankingCompletadas() {
  try {
    const respuesta = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accion: "ranking_completadas" }),
    });
    if (!respuesta.ok) {
      throw new Error("Error al leer el número de tareas para el ranking.");
    }
    return await parseJSONResponse(respuesta); // Devolver los datos en formato JSON
  } catch (error) {
    console.log("Error en conexiones.js rankingCompletadas:", error);
    return []; // Retornar un array vacío en caso de error
  }
}
export async function eliminarTarea(tarea) {
  try {
    const respuesta = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accion: "eliminar_tarea", tarea }),
    });
    if (!respuesta.ok) {
      throw new Error("Error al eliminar la tarea.");
    } else {
      mostrarNotificacion("Tarea eliminada con éxito", "green");
    }
  } catch (error) {
    console.log("Error en conexiones.js eliminarTarea:", error);
    return;
  }
}
export async function actualizarMasInfo(tarea) {
  try {
    const respuesta = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accion: "actualizar_mas_info", tarea }),
    });
    if (!respuesta.ok) {
      throw new Error("Error al actualizar mas info de la tarea.");
    } else {
      mostrarNotificacion("Tarea actualizada con éxito", "green");
    }
  } catch (error) {
    console.log("Error en conexiones.js actualizarMasInfo:", error);
    return;
  }
}

export async function reordenarTareas(posAntigua, posNueva) {
  posAntigua++;
  posNueva++;
  try {
    const respuesta = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accion: "reordenar_tareas",
        posAntigua,
        posNueva,
      }),
    });
    if (!respuesta.ok) {
      throw new Error("Error al reordenar las tareas.");
    }
  } catch (error) {
    console.log("Error en conexiones.js reordenarTareas:", error);
    return;
  }
}
