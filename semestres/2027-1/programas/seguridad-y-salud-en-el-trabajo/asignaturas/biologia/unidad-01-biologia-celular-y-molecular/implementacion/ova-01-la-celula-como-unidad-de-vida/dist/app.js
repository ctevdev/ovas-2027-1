"use strict";

const screens = Array.from(document.querySelectorAll(".lesson-screen"));
const stepButtons = Array.from(document.querySelectorAll("[data-go]"));
const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next");
const navStatus = document.querySelector("#nav-status");
const progressLabel = document.querySelector("#progress-label");
const progressBar = document.querySelector(".progress-track");
const progressFill = document.querySelector("#progress-fill");
const completedSteps = new Set();
let currentStep = 0;

function showStep(step, focus = true) {
  const bounded = Math.max(0, Math.min(step, screens.length - 1));
  currentStep = bounded;

  screens.forEach((screen, index) => {
    screen.hidden = index !== bounded;
  });

  stepButtons.forEach((button, index) => {
    button.classList.toggle("active", index === bounded);
    button.classList.toggle("visited", index < bounded || completedSteps.has(index));
    if (index === bounded) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });

  const humanStep = bounded + 1;
  const percentage = (humanStep / screens.length) * 100;
  progressLabel.textContent = `Etapa ${humanStep} de ${screens.length}`;
  navStatus.textContent = `${humanStep} / ${screens.length}`;
  progressBar.setAttribute("aria-valuenow", String(humanStep));
  progressFill.style.width = `${percentage}%`;
  previousButton.disabled = bounded === 0;
  nextButton.disabled = bounded === screens.length - 1;
  nextButton.textContent = bounded === screens.length - 2 ? "Ir a transferencia →" : "Siguiente →";

  window.scrollTo({ top: 0, behavior: "smooth" });
  const heading = screens[bounded].querySelector("h1, h2");
  if (heading) heading.tabIndex = -1;
  if (focus) heading?.focus({ preventScroll: true });
}

function showFeedback(id, type, title, message) {
  const box = document.getElementById(id);
  box.className = `feedback ${type}`;
  box.innerHTML = `<strong>${title}</strong><p>${message}</p>`;
  box.hidden = false;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function markComplete(step = currentStep) {
  completedSteps.add(step);
  stepButtons[step]?.classList.add("visited");
}

function selectedValue(form, name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value ?? "";
}

function evaluateSelects(form) {
  const fields = Array.from(form.querySelectorAll("select[data-expected]"));
  const unanswered = fields.some((field) => !field.value);
  const correct = fields.filter((field) => field.value === field.dataset.expected).length;
  fields.forEach((field) => {
    field.setAttribute("aria-invalid", field.value && field.value !== field.dataset.expected ? "true" : "false");
  });
  return { total: fields.length, correct, unanswered, allCorrect: correct === fields.length };
}

document.querySelectorAll(".hint-button").forEach((button) => {
  button.addEventListener("click", () => {
    const hint = document.getElementById(button.dataset.hint);
    hint.hidden = !hint.hidden;
    button.textContent = hint.hidden ? "Ver una pista" : "Ocultar pista";
  });
});

document.querySelector("#activation-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const answer = selectedValue(form, "activation");
  const reason = document.querySelector("#activation-reason").value.trim();
  if (!answer) {
    showFeedback("activation-feedback", "neutral", "Selecciona una respuesta", "Después podrás contrastar tu razonamiento con la evidencia del caso.");
    return;
  }
  if (answer === "false") {
    markComplete(3);
    showFeedback("activation-feedback", "success", "La afirmación es falsa", `${reason ? "Tu justificación queda registrada. " : ""}Comprender la organización celular es una base científica necesaria, pero determinar un riesgo biológico exige identificar agentes, exposición y condiciones mediante evidencia adicional.`);
  } else {
    showFeedback("activation-feedback", "error", "La base no equivale al diagnóstico", "Conocer la organización celular ayuda a comprender los agentes biológicos, pero no demuestra por sí solo que estén presentes ni que exista exposición o riesgo.");
  }
});

document.querySelector("#perspectives-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const result = evaluateSelects(event.currentTarget);
  const reflection = document.querySelector("#perspective-limit").value.trim();
  if (result.unanswered) {
    showFeedback("perspectives-feedback", "neutral", "Completa las asociaciones", "Estructura, reacciones e información son las tres pistas principales.");
  } else if (result.allCorrect) {
    markComplete(4);
    showFeedback("perspectives-feedback", "success", "Las tres perspectivas se complementan", `${reflection ? "Tu explicación reconoce la necesidad de integrar perspectivas. " : ""}Observar estructuras, analizar reacciones y comprender el flujo de información responden preguntas distintas sobre una misma célula.`);
  } else {
    showFeedback("perspectives-feedback", "error", `${result.correct} de ${result.total} asociaciones correctas`, "Relaciona citología con estructura, bioquímica con reacciones y genética con información. Después explica por qué una sola perspectiva sería incompleta.");
  }
});

document.querySelector("#theory-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const answer = selectedValue(event.currentTarget, "theory");
  if (answer === "base") {
    markComplete(5);
    showFeedback("theory-feedback", "success", "Interpretación integrada", "Los tres principios permiten reconocer una base organizativa celular común en la diversidad de la vida.");
  } else if (answer) {
    showFeedback("theory-feedback", "error", "Los principios forman un marco", "La teoría celular no es una lista aislada y tampoco separa la célula de sus componentes moleculares. Úsala para interpretar cómo se organiza la vida.");
  } else {
    showFeedback("theory-feedback", "neutral", "Selecciona una conclusión", "Busca una afirmación que integre los tres principios.");
  }
});

document.querySelector("#levels-list").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-move]");
  if (!button) return;
  const item = button.closest("li");
  if (button.dataset.move === "up" && item.previousElementSibling) {
    item.parentElement.insertBefore(item, item.previousElementSibling);
  }
  if (button.dataset.move === "down" && item.nextElementSibling) {
    item.parentElement.insertBefore(item.nextElementSibling, item);
  }
  item.focus?.();
});

document.querySelector("#check-levels").addEventListener("click", () => {
  const order = Array.from(document.querySelectorAll("#levels-list li"), (item) => item.dataset.value);
  const expected = ["quimico", "molecular", "celular", "tejidos", "organos"];
  if (order.every((value, index) => value === expected[index])) {
    markComplete(6);
    showFeedback("levels-feedback", "success", "Orden correcto", "El nivel molecular se integra en el celular; las células pueden formar tejidos y contribuir a niveles superiores.");
  } else {
    const firstError = order.findIndex((value, index) => value !== expected[index]);
    showFeedback("levels-feedback", "error", "Aún hay una relación por revisar", `El primer nivel que no corresponde está en la posición ${firstError + 1}. Comienza por los componentes químicos y avanza hacia el sistema completo.`);
  }
});

document.querySelector("#evidence-matrix-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const result = evaluateSelects(event.currentTarget);
  if (result.unanswered) {
    showFeedback("evidence-matrix-feedback", "neutral", "Completa las tres decisiones", "Relaciona cada pregunta con el tipo de información que produce el método.");
  } else if (result.allCorrect) {
    markComplete(7);
    showFeedback("evidence-matrix-feedback", "success", "Métodos bien seleccionados", "El microscopio óptico permite observar formas celulares generales; el electrónico revela detalles finos; y las técnicas bioquímicas permiten analizar composición química.");
  } else {
    showFeedback("evidence-matrix-feedback", "error", `${result.correct} de ${result.total} métodos correctos`, "Distingue entre observar una forma general, visualizar detalles muy pequeños y determinar composición química.");
  }
});

document.querySelector("#case-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const result = evaluateSelects(event.currentTarget);
  if (result.unanswered) {
    showFeedback("case-feedback", "neutral", "Completa el tablero", "Distingue aquello que se ve, lo que se propone explicar, el dato faltante y lo que aún no puede concluirse.");
  } else if (result.allCorrect) {
    markComplete(8);
    showFeedback("case-feedback", "success", "Tablero de evidencia completo", "La humedad es observable; su posible relevancia es una hipótesis; identificar el material exige datos; confirmar bacterias sin esos datos excede la evidencia.");
  } else {
    showFeedback("case-feedback", "error", `${result.correct} de ${result.total} clasificaciones correctas`, "Una observación describe sin explicar. Una hipótesis propone una posibilidad. Una conclusión necesita datos que la sostengan.");
  }
});

document.querySelector("#report-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const answer = selectedValue(event.currentTarget, "report");
  if (answer === "b") {
    markComplete(9);
    showFeedback("report-feedback", "success", "Error metodológico identificado", "El microscopio óptico aporta información visual sobre formas y estructuras, pero no determina por sí solo la composición exacta de proteínas. Esa pregunta requiere técnicas bioquímicas.");
  } else if (answer === "a") {
    showFeedback("report-feedback", "error", "La observación no revela toda la composición", "Una imagen microscópica no ofrece automáticamente la identidad y cantidad exactas de las proteínas de una muestra.");
  } else if (answer === "c") {
    showFeedback("report-feedback", "error", "El tamaño no resuelve el problema", "Cambiar el tamaño de la muestra no transforma la microscopía óptica en un método para determinar composición proteica exacta.");
  } else if (answer === "d") {
    showFeedback("report-feedback", "error", "Sí existen métodos pertinentes", "Las técnicas bioquímicas permiten separar, identificar o cuantificar componentes como las proteínas, según la pregunta de estudio.");
  } else {
    showFeedback("report-feedback", "neutral", "Selecciona una explicación", "Compara la información que produce un microscopio óptico con la que se obtiene mediante un análisis bioquímico.");
  }
});

document.querySelector("#branch-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const result = evaluateSelects(event.currentTarget);
  if (result.unanswered) {
    showFeedback("branch-feedback", "neutral", "Toma las tres decisiones", "Cada decisión debe preparar la siguiente: hipótesis, evidencia y conclusión.");
  } else if (result.allCorrect) {
    markComplete(10);
    showFeedback("branch-feedback", "success", "Ruta científica coherente", "Formular una hipótesis orienta la búsqueda de evidencia. La identificación debe posponerse hasta contar con datos obtenidos mediante un método adecuado.");
  } else {
    showFeedback("branch-feedback", "error", `${result.correct} de ${result.total} decisiones coherentes`, "Concluir de inmediato produce un diagnóstico no sustentado; ignorar el hallazgo impide investigarlo; la apariencia por sí sola no identifica el material.");
  }
});

document.querySelector("#assessment-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const result = evaluateSelects(event.currentTarget);
  const transfer = document.querySelector("#transfer-answer").value.trim().toLowerCase();
  const transferScore = ["celul", "molecular", "organiz", "virus", "bacter", "agente", "evid", "ambiente", "riesgo"].filter((token) => transfer.includes(token)).length;
  const score = result.correct + (transferScore >= 3 ? 1 : 0);
  if (result.unanswered || !transfer) {
    showFeedback("assessment-feedback", "neutral", "Completa las cuatro evidencias", "Responde también la pregunta abierta conectando la organización biológica con el estudio posterior de agentes específicos.");
    return;
  }
  markComplete(11);
  if (score === 4) {
    showFeedback("assessment-feedback", "success", "Dominio alto · 4 de 4", "Reconoces la teoría celular, seleccionas un método pertinente, identificas el aporte de la genética y conectas esta base con el estudio de agentes biológicos.");
  } else if (score >= 2) {
    showFeedback("assessment-feedback", "neutral", `Dominio intermedio · ${score} de 4`, "Comprendes varias ideas centrales. Revisa los campos marcados y fortalece la relación entre organización celular, método y evidencia.");
  } else {
    showFeedback("assessment-feedback", "error", `Dominio inicial · ${score} de 4`, "Vuelve a las secciones de teoría celular, perspectivas y métodos antes de intentarlo de nuevo.");
  }
});

document.querySelector("#reflection-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const answered = Object.values(data).filter((value) => value.trim()).length;
  if (answered < 2) {
    showFeedback("reflection-feedback", "neutral", "Profundiza un poco más", "Responde al menos dos preguntas para hacer visible tu estrategia de razonamiento.");
    return;
  }
  try {
    localStorage.setItem("ova01-reflection", JSON.stringify(data));
  } catch (_) {
    // The reflection remains visible even if browser storage is unavailable.
  }
  markComplete(12);
  showFeedback("reflection-feedback", "success", "Reflexión registrada", "Has relacionado la célula como unidad de vida con las perspectivas científicas y la selección de métodos. Esta actividad no se califica.");
});

document.querySelector("#transfer-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const answer = data.transfer.trim();
  const concepts = ["celul", "molecular", "organiz", "virus", "bacter", "agente", "evid", "identific", "ambiente", "labor"].filter((token) => answer.toLowerCase().includes(token));
  if (answer.length < 40) {
    showFeedback("transfer-feedback", "neutral", "Amplía tu respuesta", "Explica cómo la organización celular y molecular orientará la identificación posterior de agentes biológicos y qué evidencia será necesaria.");
  } else if (concepts.length >= 4) {
    markComplete(13);
    showFeedback("transfer-feedback", "success", "Transferencia lograda", "Tu respuesta conecta la organización biológica con la futura identificación de virus y bacterias y reconoce que la aplicación laboral requiere evidencia específica.");
    document.querySelector("#completion").hidden = false;
  } else {
    showFeedback("transfer-feedback", "error", "Haz más explícita la conexión", "Incluye la relación entre niveles celular y molecular, agentes como virus o bacterias, el ambiente laboral y la necesidad de métodos o evidencia para identificarlos.");
  }
});

previousButton.addEventListener("click", () => showStep(currentStep - 1));
nextButton.addEventListener("click", () => showStep(currentStep + 1));
stepButtons.forEach((button) => button.addEventListener("click", () => showStep(Number(button.dataset.go))));

document.addEventListener("keydown", (event) => {
  if (event.altKey && event.key === "ArrowRight") showStep(currentStep + 1);
  if (event.altKey && event.key === "ArrowLeft") showStep(currentStep - 1);
});

try {
  const savedReflection = JSON.parse(localStorage.getItem("ova01-reflection") || "null");
  if (savedReflection) {
    Object.entries(savedReflection).forEach(([name, value]) => {
      const field = document.querySelector(`#reflection-form [name="${name}"]`);
      if (field) field.value = value;
    });
  }
} catch (_) {
  // Continue without local persistence.
}

function registerWebMcpTools() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();

  const registrations = [
    context.registerTool({
      name: "navigate_ova_section",
      title: "Ir a una etapa del OVA",
      description: "Muestra una etapa del OVA por su número entre 1 y 14.",
      inputSchema: {
        type: "object",
        properties: { section: { type: "integer", minimum: 1, maximum: 14 } },
        required: ["section"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!Number.isInteger(input?.section) || input.section < 1 || input.section > screens.length) {
          throw new Error("La etapa debe ser un número entero entre 1 y 14.");
        }
        showStep(input.section - 1, false);
        return { section: input.section, title: screens[input.section - 1].querySelector("h1, h2")?.textContent ?? "" };
      }
    }, { signal: lifecycle.signal }),
    context.registerTool({
      name: "get_ova_progress",
      title: "Consultar progreso del OVA",
      description: "Devuelve la etapa visible y las etapas completadas durante la sesión.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute() {
        return { currentSection: currentStep + 1, totalSections: screens.length, completedSections: Array.from(completedSteps, (step) => step + 1) };
      }
    }, { signal: lifecycle.signal })
  ];

  registrations.forEach((registration) => Promise.resolve(registration).catch(() => {}));
}

registerWebMcpTools();
showStep(0, false);
