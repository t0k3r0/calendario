import { actualizarEventos, obtenerEventos } from "./eventos.js";
import { agregarPopupsACeldas } from "./popups.js";
const meses = [
  { nombre: "Enero", dias: 31 },
  { nombre: "Febrero", dias: 28 },
  { nombre: "Marzo", dias: 31 },
  { nombre: "Abril", dias: 30 },
  { nombre: "Mayo", dias: 31 },
  { nombre: "Junio", dias: 30 },
  { nombre: "Julio", dias: 31 },
  { nombre: "Agosto", dias: 31 },
  { nombre: "Septiembre", dias: 30 },
  { nombre: "Octubre", dias: 31 },
  { nombre: "Noviembre", dias: 30 },
  { nombre: "Diciembre", dias: 31 },
];
const hoy = new Date();
const yearActual = hoy.getFullYear();
const mesActual = hoy.getMonth();
const diaActual = hoy.getDate();
const mesesReordenados = [
  meses[(mesActual - 1 + 12) % 12],
  ...meses.slice(mesActual),
  ...meses.slice(0, mesActual - 1),
];
mesesReordenados.forEach((mes, index) => {
  const yearForMonth = index < mesActual ? yearActual + 1 : yearActual;
  if (
    mes.nombre === "Febrero" &&
    ((yearForMonth % 4 === 0 && yearForMonth % 100 !== 0) ||
      yearForMonth % 400 === 0)
  ) {
    mes.dias = 29;
  } else if (mes.nombre === "Febrero") {
    mes.dias = 28;
  }
});
const monthsRow = document.getElementById("filaMeses");
const daysBody = document.getElementById("cuerpoDias");
mesesReordenados.forEach((mes) => {
  const th = document.createElement("th");
  th.className = "mes-columna";
  th.innerText = mes.nombre;
  monthsRow.appendChild(th);
});
const filas = Math.max(...mesesReordenados.map((mes) => mes.dias));
for (let i = 0; i < filas; i++) {
  const tr = document.createElement("tr");
  mesesReordenados.forEach((mes, mesIndex) => {
    const td = document.createElement("td");
    if (i < mes.dias) {
      const dayNumber = i + 1;
      const realMesIndex = (mesActual - 1 + mesIndex) % 12;
      const yearForMonth =
        realMesIndex + 1 < mesActual ? yearActual + 1 : yearActual;
        // TODO LINEA DE ARRIBA
     const fecha = `${yearForMonth}-${(realMesIndex + 1).toString().padStart(2, "0")}-${dayNumber.toString().padStart(2, "0")}`;
        // console.log(fecha);
      const date = new Date(yearForMonth, realMesIndex, dayNumber);
      const dayOfWeek = date.getDay();
      const celdaContenido = document.createElement("div");
      celdaContenido.className = "celda-contenido";
      celdaContenido.id = `celdaContenido_${(realMesIndex + 1)
        .toString()
        .padStart(2, "0")}_${dayNumber.toString().padStart(2, "0")}`;
      const izqDiv = document.createElement("div");
      izqDiv.className = "izquierda";
      izqDiv.innerText = dayNumber;
      const dchaDiv = document.createElement("div");
      dchaDiv.className = "derecha";
      dchaDiv.innerText = "";
      celdaContenido.appendChild(izqDiv);
      celdaContenido.appendChild(dchaDiv);
      td.appendChild(celdaContenido);
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        celdaContenido.style.backgroundColor = "#8B0000";
      }
      if (realMesIndex === mesActual && dayNumber === diaActual) {
        celdaContenido.style.backgroundColor = "#FFD700";
        celdaContenido.style.fontWeight = "bold";
      }
      td.id = `dia-${(realMesIndex + 1).toString().padStart(2, "0")}-${dayNumber
        .toString()
        .padStart(2, "0")}`;
        // console.log(fecha);
      obtenerEventos(fecha, celdaContenido.id, (eventos) => {
        if (eventos.length > 0) {
          dchaDiv.innerHTML = "";
          eventos.forEach((evento) => {
            const eventInfo = document.createElement("div");
            eventInfo.style.whiteSpace = "nowrap";
            eventInfo.style.overflow = "hidden";
            eventInfo.style.textOverflow = "ellipsis";
            eventInfo.innerText = `${evento.hora.substring(0, 5)} - ${evento.titulo}`;
            dchaDiv.appendChild(eventInfo);
          });
            // Crear el tooltip para mostrar eventos al pasar el ratón
            const tooltip = document.createElement("div");
            tooltip.className = "tooltip";
            tooltip.style.display = "none";
            tooltip.style.position = "absolute";
            tooltip.style.backgroundColor = "#fff";
            tooltip.style.border = "1px solid #ddd";
            tooltip.style.padding = "5px";
            tooltip.style.boxShadow = "0px 0px 5px rgba(0, 0, 0, 0.1)";
            tooltip.style.zIndex = "10";
  
            // Añadir eventos al tooltip
            eventos.forEach((evento) => {
              const eventInfo = document.createElement("div");
              eventInfo.innerText = `${evento.hora.substring(0, 5)} - ${evento.titulo}`;
              tooltip.appendChild(eventInfo);
            });
  
            // Mostrar el tooltip al pasar el ratón
            celdaContenido.addEventListener("mouseover", (event) => {
              tooltip.style.display = "block";
              tooltip.style.left = `${event.pageX + 10}px`;
              tooltip.style.top = `${event.pageY + 10}px`;
            });
  
            // Ocultar el tooltip al salir del ratón
            celdaContenido.addEventListener("mouseout", () => {
              tooltip.style.display = "none";
            });
  
            document.body.appendChild(tooltip);
        
        }
      });
    } else {
      td.className = "empty-cell";
    }
    tr.appendChild(td);
  });
  daysBody.appendChild(tr);
}
agregarPopupsACeldas();
actualizarEventos();
