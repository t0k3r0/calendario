import {
  listarTareasPendientes,
  listarTareasCompletadas,
  rankingCompletadas,
  crearTarea,
  completarTarea,
  eliminarTarea,
  actualizarMasInfo,
  reordenarTareas,
} from "./conexiones.js";
document.addEventListener("DOMContentLoaded", function () {
  const ventana_agregarTarea = document.getElementById("ventana-agregarTarea");
  const campoTextoTarea = document.getElementById("texto-tarea");
  const agregar_tarea_btn = document.getElementById("agregar-tarea");
  const guardar_tarea_btn = document.getElementById("guardar-tarea");
  const cancelar_tarea_btn = document.getElementById("cancelar-tarea");
  const listaOrdenable = document.getElementById("tareasPendientesSortable");
  const listaCompletadas = document.getElementById("tareasCompletadas");
  let tareasPendientes = [];
  let tareasCompletadas = [];
  const josebaIPs = [
    "192.168.1.110",
    "192.168.1.120",
    "192.168.1.130",
    "192.168.1.140",
    "192.168.1.150",
  ];
  const macarenaIPs = ["192.168.1.50", "192.168.1.60", "192.168.1.70", "192.168.1.80", "192.168.1.90"];
  agregar_tarea_btn.addEventListener("click", function () {
    ventana_agregarTarea.style.display = "block";
    campoTextoTarea.focus();
  });
  cancelar_tarea_btn.addEventListener("click", function () {
    ventana_agregarTarea.style.display = "none";
  });
  guardar_tarea_btn.addEventListener("click", async function () {
    const textoTarea = campoTextoTarea.value;
    if (!textoTarea) {
      mostrarNotificacion("El texto de la tarea no puede estar vacío", "red");
      return;
    } else if (textoTarea.length > 25) {
      mostrarNotificacion("El texto de la tarea no puede ser tan largo", "red");
      return;
    }
    const tarea = {
      texto: textoTarea,
      masInfo: "",
    };
    tareasPendientes.push(tarea);
    campoTextoTarea.value = "";
    ventana_agregarTarea.style.display = "none";
    await crearTarea(tarea);
    cargarTareasPendientes();
  });
  campoTextoTarea.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      guardar_tarea_btn.click();
    }
  });
  function actualizarTareasPendientes() {
    listaOrdenable.innerHTML = "";
    const tareasOrdenadas = [...tareasPendientes].sort(
      (a, b) => a.posicion - b.posicion
    );
    tareasOrdenadas.forEach(async (tarea) => {
      const li = crearTareaElemento(tarea);
      listaOrdenable.appendChild(li);
    });
    inicializarOrdenable();
  }
  function actualizarTareasCompletadas() {
    listaCompletadas.innerHTML = "";
    const tareasOrdenadas = tareasCompletadas.sort((a, b) => {
      const fechaA = new Date(a.fechaCompletada);
      const fechaB = new Date(b.fechaCompletada);
      return fechaB - fechaA;
    });
    const tareasMostradas = tareasOrdenadas.slice(0, 10);
    tareasMostradas.forEach(async (tarea) => {
      const li = crearCompletadaElemento(tarea);
      listaCompletadas.appendChild(li);
      await actualizarRankingCompletadas();
    });
  }
  async function actualizarRankingCompletadas() {
    try {
      const rankingData = await rankingCompletadas();
      const rankingDiv = document.getElementById("rankingCompletadas");
      if (rankingData.length === 0) {
        rankingDiv.innerHTML = "<p>No hay datos disponibles.</p>";
        return;
      }
      const maxCount = Math.max(...rankingData.map(({ count }) => count));

      rankingDiv.innerHTML = "<ul>";
      rankingData.forEach(({ ip, count }, index) => {
        console.log(ip)
        let usuario;
        let backgroundColor;
        if (josebaIPs.includes(ip)) {
          usuario = "Joseba";
          backgroundColor = "rgba(0, 0, 255, 0.1)";
        } else if (macarenaIPs.includes(ip)) {
          usuario = "Macarena";
          backgroundColor = "rgba(255, 192, 203, 0.8)";
        } else {
          usuario = "Otros usuarios";
          backgroundColor = "transparent";
        }
        const listItem = document.createElement("li");
        const rankTitle =
          index === 0
            ? "Ganador/a:"
            : index === 1
              ? "Perdedor/a:"
              : index === 2
                ? "Resto:"
                : `${index + 1}º Puesto`;
        listItem.innerHTML = `
          <div>${rankTitle}</div>
          <div>${usuario}, con ${count} tareas completadas</div>
          `;
        listItem.style.backgroundColor = backgroundColor;
        listItem.style.fontWeight =
          usuario === "Joseba" || usuario === "Macarena" ? "bold" : "normal";
        rankingDiv.querySelector("ul").appendChild(listItem);
      });
      rankingDiv.innerHTML +=
        '</ul><img src="tareas/img/peperana.gif" style="width: 64px; height: 64px;">';
    } catch (error) {
      console.error(
        "Error al obtener el ranking de tareas completadas:",
        error
      );
    }
  }
  function crearTareaElemento(tarea) {
    const li = document.createElement("li");
    li.classList.add("ui-state-default");
    li.textContent = tarea.texto;
    li.id = tarea.id;
    if (josebaIPs.includes(tarea.ipCreacion)) {
      // li.style.color = "rgba(0, 0, 255, 0.5)";
      li.style.color = "rgba(0, 0, 255, 1)";
    } else if (macarenaIPs.includes(tarea.ipCreacion)) {
      li.style.color = "rgba(255, 0, 255, 1)";
      // li.style.color = "pink";
    }
    // } else {
    // li.style.color = "black";
    // li.style.backgroundColor = "black";
    // }

    const moreInfoSpan = crearMasInfoSpan(tarea, li);
    const terminadaSpan = crearTerminadaSpan(tarea, li);
    const eliminadaSpan = crearEliminadaSpan(tarea, li);
    li.appendChild(moreInfoSpan);
    li.appendChild(terminadaSpan);
    li.appendChild(eliminadaSpan);
    return li;
  }
  function crearCompletadaElemento(tarea) {
    const li = document.createElement("li");
    li.id = tarea.id;
    const tareaTexto = document.createElement("span");
    tareaTexto.textContent = tarea.texto;
    li.appendChild(tareaTexto);
    const br = document.createElement("br");
    li.appendChild(br);
    var autor = "Otro usuario";
    if (josebaIPs.includes(tarea.ipCompletada)) {
      autor = "Joseba";
    } else if (macarenaIPs.includes(tarea.ipCompletada)) {
      autor = "Macarena";
    }

    const fechaCompletada = new Date(tarea.fechaCompletada);
    const tiempoTranscurrido = calcularTiempoTranscurrido(fechaCompletada);
    const infoAutorYTiempo = document.createElement("span");
    infoAutorYTiempo.textContent = `Completada por ${autor} hace ${tiempoTranscurrido}`;
    infoAutorYTiempo.style.fontSize = "0.8em";
    infoAutorYTiempo.style.color = "gray";
    li.appendChild(infoAutorYTiempo);
    if (autor === "Joseba") {
      li.style.backgroundColor = "rgba(173, 216, 230, 0.2)";
    } else if (autor == "Macarena") {
      li.style.backgroundColor = "rgba(255, 182, 193, 0.5)";
    }
    return li;
  }
  function calcularTiempoTranscurrido(fecha) {
    const ahora = new Date();
    // const desfaseHorario = ahora.getTimezoneOffset();
    // ahora.setMinutes(ahora.getMinutes() + desfaseHorario);
    const diferenciaMilisegundos = ahora - fecha;
    const segundos = Math.floor(diferenciaMilisegundos / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    if (dias > 0) {
      return `${dias} días`;
    } else if (horas > 0) {
      return `${horas} horas`;
    } else if (minutos > 0) {
      return `${minutos} minutos`;
    } else {
      return `${segundos} segundos`;
    }
  }
  function crearMasInfoSpan(tarea, li) {
    const moreInfoSpan = document.createElement("span");
    const moreInfoImg = document.createElement("img");
    moreInfoImg.src = "tareas/img/masInfo.png";
    moreInfoImg.alt = "Más info";
    moreInfoImg.style.cursor = "pointer";
    moreInfoSpan.appendChild(moreInfoImg);
    moreInfoSpan.classList.add("more-info-span");
    moreInfoSpan.id = "moreInfoSpan_" + tarea.id;
    const tooltip = document.createElement("span");
    tooltip.classList.add("tooltip-text");
    tooltip.textContent = "Más información";
    moreInfoSpan.appendChild(tooltip);
    moreInfoSpan.style.marginRight = "5px";
    moreInfoSpan.style.marginLeft = "5px";
    moreInfoSpan.addEventListener("click", () => {
      const idMasInfoDiv = "moreInfo_" + tarea.id;
      const idEditarCampoMasInfo = "editCampo_" + tarea.id;
      const idBotonGuardar = "saveButton_" + tarea.id;
      const idEditarMasInfoLink = "editMoreInfoLink_" + tarea.id;
      const masInfoDiv = document.getElementById(idMasInfoDiv);
      const editarMasInfoLink = document.getElementById(idEditarMasInfoLink);
      eliminarCampoEditable(li, idEditarCampoMasInfo, idBotonGuardar);
      if (li.contains(masInfoDiv)) {
        li.removeChild(masInfoDiv);
        if (li.contains(editarMasInfoLink)) {
          li.removeChild(editarMasInfoLink);
        }
      } else {
        const nuevaMasInfoDiv = crearMasInfoDiv(tarea, idMasInfoDiv);
        // const lineasTexto = nuevaMasInfoDiv.textContent.split("\n");
        // const lineaLarga = lineasTexto.some(
        //   (linea) => linea.trim().length > 25
        // );
        // if (lineaLarga) {
        //   const columnaIzquierda = document.querySelector(".columna-izquierda");
        //   if (columnaIzquierda) {
        //     columnaIzquierda.style.width = "100%";
        //     columnaIzquierda.style.maxWidth = "100%";
        //   }
        //   const columnaDerecha = document.querySelector(".columna-derecha");
        //   if (columnaDerecha) {
        //     columnaDerecha.style.width = "100%";
        //     columnaDerecha.style.maxWidth = "100%";
        //   }
        // }
        if (!li.contains(editarMasInfoLink)) {
          const nuevoEditarMasInfoLink = document.createElement("span");
          const editImg = document.createElement("img");
          editImg.src = "tareas/img/editar.png";
          editImg.alt = "Editar más info";
          editImg.style.cursor = "pointer";
          nuevoEditarMasInfoLink.appendChild(editImg);
          nuevoEditarMasInfoLink.classList.add("editar-mas-info-span");
          nuevoEditarMasInfoLink.id = idEditarMasInfoLink;
          const tooltip = document.createElement("span");
          tooltip.classList.add("tooltip-text");
          tooltip.textContent = "Editar más info";
          nuevoEditarMasInfoLink.appendChild(tooltip);
          nuevoEditarMasInfoLink.style.marginRight = "5px";
          nuevoEditarMasInfoLink.style.marginLeft = "5px";
          nuevoEditarMasInfoLink.addEventListener("click", () => {
            mostrarCampoEditable(
              tarea,
              li,
              idEditarCampoMasInfo,
              idBotonGuardar,
              nuevoEditarMasInfoLink
            );
            if (li.contains(nuevoEditarMasInfoLink)) {
              li.removeChild(nuevoEditarMasInfoLink);
            } else {
              li.appendChild(nuevoEditarMasInfoLink);
            }
          });
          li.appendChild(nuevoEditarMasInfoLink);
          li.appendChild(nuevaMasInfoDiv);
        }
      }
    });
    return moreInfoSpan;
  }
  function crearTerminadaSpan(tarea) {
    const terminadaSpan = document.createElement("span");
    terminadaSpan.classList.add("terminada-span");
    terminadaSpan.id = "terminadaSpan_" + tarea.id;
    const terminadaImg = document.createElement("img");
    terminadaImg.src = "tareas/img/terminar.png";
    terminadaImg.alt = "Terminar tarea";
    terminadaImg.style.cursor = "pointer";
    terminadaSpan.appendChild(terminadaImg);
    const tooltip = document.createElement("span");
    tooltip.classList.add("tooltip-text");
    tooltip.textContent = "Terminar tarea";
    terminadaSpan.appendChild(tooltip);
    terminadaSpan.style.marginRight = "5px";
    terminadaSpan.style.marginLeft = "5px";
    terminadaSpan.addEventListener("click", () => {
      mostrarModal(
        "¿Estás seguro de que deseas completar " + tarea.texto + "?",
        async () => {
          await completarTarea(tarea);
          cargarTareasPendientes();
          cargarTareasCompletadas();
        }
      );
    });
    return terminadaSpan;
  }
  function crearEliminadaSpan(tarea) {
    const eliminadaSpan = document.createElement("span");
    eliminadaSpan.classList.add("eliminada-span");
    eliminadaSpan.id = "eliminadaSpan_" + tarea.id;
    const eliminadaImg = document.createElement("img");
    eliminadaImg.src = "tareas/img/eliminar.png";
    eliminadaImg.alt = "Eliminar tarea";
    eliminadaImg.style.cursor = "pointer";
    eliminadaSpan.appendChild(eliminadaImg);
    const tooltip = document.createElement("span");
    tooltip.classList.add("tooltip-text");
    tooltip.textContent = "Eliminar tarea";
    eliminadaSpan.appendChild(tooltip);
    eliminadaSpan.style.marginRight = "5px";
    eliminadaSpan.style.marginLeft = "5px";
    eliminadaSpan.addEventListener("click", () => {
      mostrarModal(
        "¿Estás seguro de que deseas eliminar " + tarea.texto + "?",
        async () => {
          await eliminarTarea(tarea);
          cargarTareasPendientes();
          cargarTareasCompletadas();
        }
      );
    });
    return eliminadaSpan;
  }
  function crearMasInfoDiv(tarea, idMasInfoDiv) {
    const masInfoDiv = document.createElement("div");
    masInfoDiv.id = idMasInfoDiv;
    masInfoDiv.style.display = "block";
    masInfoDiv.style.whiteSpace = "pre-line";
    const htmlContent = tarea.masInfo.replace(/\n/g, "<br>");
    if (htmlContent == "") {
      masInfoDiv.innerHTML = "<br>";
    } else {
      masInfoDiv.innerHTML = htmlContent;
    }
    return masInfoDiv;
  }
  function mostrarCampoEditable(
    tarea,
    li,
    idEditarCampoMasInfo,
    idBotonGuardar,
    nuevoEditarMasInfoLink
  ) {
    const masInfoDiv = document.getElementById("moreInfo_" + tarea.id);
    if (masInfoDiv && li.contains(masInfoDiv)) {
      li.removeChild(masInfoDiv);
    }
    $("#tareasPendientesSortable").sortable("disable");
    const editarCampoMasInfo = document.createElement("textarea");
    editarCampoMasInfo.value = tarea.masInfo;
    editarCampoMasInfo.id = idEditarCampoMasInfo;
    editarCampoMasInfo.style.width = "100%";
    editarCampoMasInfo.style.display = "block";
    editarCampoMasInfo.rows = "10";
    li.appendChild(editarCampoMasInfo);
    const botonGuardar = crearBotonGuardar(
      tarea,
      li,
      editarCampoMasInfo,
      idBotonGuardar,
      nuevoEditarMasInfoLink
    );
    li.appendChild(botonGuardar);
  }
  function crearBotonGuardar(
    tarea,
    li,
    editarCampoMasInfo,
    idBotonGuardar,
    nuevoEditarMasInfoLink
  ) {
    const botonGuardar = document.createElement("button");
    botonGuardar.textContent = "Guardar";
    botonGuardar.id = idBotonGuardar;
    botonGuardar.style.display = "block";
    botonGuardar.addEventListener("click", async () => {
      tarea.masInfo = editarCampoMasInfo.value;
      const masInfoDivActualizado = document.createElement("div");
      masInfoDivActualizado.style.whiteSpace = "pre-line";
      const htmlContent = tarea.masInfo.replace(/\n/g, "<br>");
      masInfoDivActualizado.innerHTML = htmlContent;
      masInfoDivActualizado.id = "moreInfo_" + tarea.id;
      masInfoDivActualizado.style.display = "block";
      const existingMoreInfoDiv = document.getElementById(
        "moreInfo_" + tarea.id
      );
      if (existingMoreInfoDiv) {
        li.replaceChild(masInfoDivActualizado, existingMoreInfoDiv);
      } else {
        li.appendChild(masInfoDivActualizado);
        li.appendChild(nuevoEditarMasInfoLink);
      }
      eliminarCampoEditable(li, editarCampoMasInfo.id, botonGuardar.id);
      $("#tareasPendientesSortable").sortable("enable");
      actualizarMasInfo(tarea);
    });
    return botonGuardar;
  }
  function eliminarCampoEditable(li, idEditarCampoMasInfo, idBotonGuardar) {
    const editarCampoMasInfo = document.getElementById(idEditarCampoMasInfo);
    if (editarCampoMasInfo && li.contains(editarCampoMasInfo)) {
      li.removeChild(editarCampoMasInfo);
    }
    const botonGuardar = document.getElementById(idBotonGuardar);
    if (botonGuardar && li.contains(botonGuardar)) {
      li.removeChild(botonGuardar);
    }
  }
  function inicializarOrdenable() {
    $(function () {
      $("#tareasPendientesSortable").sortable({
        cancel: "textarea",
        update: function (event, ui) {
          const newOrder = $(this).sortable("toArray");
          const posAntigua = ui.item.data("posAntigua");
          const posNueva = ui.item.index();
          reordenarTareas(posAntigua, posNueva);
        },
        start: function (event, ui) {
          ui.item.data("posAntigua", ui.item.index());
        },
      });
    });
  }
  async function cargarTareasPendientes() {
    tareasPendientes = [];
    const tareas = await listarTareasPendientes();
    tareas.forEach((tarea) => {
      const tareaPendiente = {
        id: tarea.id,
        texto: tarea.texto,
        masInfo: tarea.mas_info,
        posicion: tarea.posicion,
        fechaCreacion: tarea.fecha_creacion,
        ipCreacion: tarea.ip_creacion,
      };
      tareasPendientes.push(tareaPendiente);
    });
    actualizarTareasPendientes();
  }
  async function cargarTareasCompletadas() {
    tareasCompletadas = [];
    const tareas = await listarTareasCompletadas();
    tareas.forEach((tarea) => {
      const tareaCompletada = {
        id: tarea.id,
        texto: tarea.texto,
        masInfo: tarea.mas_info,
        posicion: tarea.posicion,
        fechaCompletada: tarea.fecha_completada,
        ipCompletada: tarea.ip_completada,
      };
      tareasCompletadas.push(tareaCompletada);
    });
    actualizarTareasCompletadas();
  }
  cargarTareasPendientes();
  cargarTareasCompletadas();
});
export async function mostrarNotificacion(mensaje, color) {
  const notificacion = document.getElementById("notificacion");
  notificacion.textContent = mensaje;
  notificacion.style.display = "block";
  notificacion.style.backgroundColor = color;
  setTimeout(() => {
    notificacion.style.display = "none";
  }, 3000);
}
export async function mostrarModal(mensaje, confirmCallback) {
  const modal = document.getElementById("confirmModal");
  const closeBtn = document.querySelector(".modal .close");
  const confirmBtn = document.getElementById("confirmBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const mensajeParrafo = modal.querySelector("p");
  mensajeParrafo.textContent = mensaje;
  modal.style.display = "block";
  confirmBtn.onclick = () => {
    confirmCallback();
    modal.style.display = "none";
  };
  cancelBtn.onclick = () => {
    modal.style.display = "none";
  };
  closeBtn.onclick = () => {
    modal.style.display = "none";
  };
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}
