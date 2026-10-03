"use strict";

const screens = Array.from(document.querySelectorAll(".lesson-screen"));
const stepButtons = Array.from(document.querySelectorAll("[data-go]"));
const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next");
const navStatus = document.querySelector("#nav-status");
const progressLabel = document.querySelector("#progress-label");
const progressBar = document.querySelector(".progress-track");
const progressFill = document.querySelector("#progress-fill");
const restartButton = document.querySelector("#restart-ova");
const completionPanel = document.querySelector("#completion");
const badgeName = document.querySelector("#badge-name");
const badgeRecipient = document.querySelector("#badge-recipient");
const levelsList = document.querySelector("#levels-list");
const initialLevelsMarkup = levelsList.innerHTML;
const completedSteps = new Set();
let currentStep = 0;

try {
  const stored = JSON.parse(localStorage.getItem("ova01-completed-steps") || "[]");
  stored.filter((step) => Number.isInteger(step) && step >= 0 && step < screens.length).forEach((step) => completedSteps.add(step));
} catch (_) {
  // Continue with an empty progress record when storage is unavailable.
}

function firstIncompleteStep() {
  const index = screens.findIndex((_, step) => !completedSteps.has(step));
  return index === -1 ? screens.length - 1 : index;
}

function persistProgress() {
  try {
    localStorage.setItem("ova01-completed-steps", JSON.stringify(Array.from(completedSteps).sort((a, b) => a - b)));
  } catch (_) {
    // Progress still works during the current session.
  }
}

function updateProgress() {
  const completed = completedSteps.size;
  const percentage = Math.round((completed / screens.length) * 100);
  progressLabel.textContent = `Avance validado: ${percentage} % · ${completed} de ${screens.length} etapas`;
  progressBar.setAttribute("aria-valuenow", String(percentage));
  progressFill.style.width = `${percentage}%`;
  completionPanel.hidden = completed !== screens.length;
}

function showStep(step, focus = true) {
  const highestAvailable = firstIncompleteStep();
  const bounded = Math.max(0, Math.min(step, highestAvailable, screens.length - 1));
  currentStep = bounded;

  screens.forEach((screen, index) => {
    screen.hidden = index !== bounded;
  });

  stepButtons.forEach((button, index) => {
    button.classList.toggle("active", index === bounded);
    button.classList.toggle("completed", completedSteps.has(index));
    button.disabled = index > highestAvailable;
    button.setAttribute("aria-label", `${button.textContent.trim()}${completedSteps.has(index) ? ", completada" : index > highestAvailable ? ", bloqueada" : ", disponible"}`);
    if (index === bounded) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });

  const humanStep = bounded + 1;
  navStatus.textContent = `${humanStep} / ${screens.length}`;
  previousButton.disabled = bounded === 0;
  nextButton.disabled = bounded === screens.length - 1 || !completedSteps.has(bounded);
  nextButton.textContent = bounded === screens.length - 1 ? "Recorrido completado" : completedSteps.has(bounded) ? "Siguiente etapa →" : "Completa la etapa para continuar";
  updateProgress();

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
  persistProgress();
  showStep(currentStep, false);
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

document.querySelectorAll("[data-complete-step]").forEach((button) => {
  button.addEventListener("click", () => {
    const step = Number(button.dataset.completeStep);
    const check = button.closest(".stage-check").querySelector("select[data-reading-expected]");
    const feedbackId = `reading-feedback-${step}`;
    if (!check.value) {
      showFeedback(feedbackId, "neutral", "Selecciona una respuesta", "Lee nuevamente la idea central y elige la opción que corresponda.");
    } else if (check.value === check.dataset.readingExpected) {
      markComplete(step);
      button.textContent = "Etapa validada";
      showFeedback(feedbackId, "success", "Comprensión verificada", "La etapa quedó registrada en tu avance. Ya puedes continuar.");
    } else {
      showFeedback(feedbackId, "error", "Revisa la idea central", "Esta etapa distingue una base de comprensión científica de una conclusión o diagnóstico que requiere evidencia adicional.");
    }
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
  if (answer === "false" && reason.length >= 15) {
    markComplete(3);
    showFeedback("activation-feedback", "success", "La afirmación es falsa", `${reason ? "Tu justificación queda registrada. " : ""}Comprender la organización celular es una base científica necesaria, pero determinar un riesgo biológico exige identificar agentes, exposición y condiciones mediante evidencia adicional.`);
  } else if (answer === "false") {
    showFeedback("activation-feedback", "neutral", "Justifica tu decisión", "La selección es correcta. Para validar la etapa, explica en una frase por qué hacen falta datos adicionales sobre agentes, exposición o condiciones.");
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
  } else if (result.allCorrect && reflection.length >= 15) {
    markComplete(4);
    showFeedback("perspectives-feedback", "success", "Las tres perspectivas se complementan", `${reflection ? "Tu explicación reconoce la necesidad de integrar perspectivas. " : ""}Observar estructuras, analizar reacciones y comprender el flujo de información responden preguntas distintas sobre una misma célula.`);
  } else if (result.allCorrect) {
    showFeedback("perspectives-feedback", "neutral", "Completa la explicación", "Las asociaciones son correctas. Para validar la etapa, explica qué se perdería al estudiar la célula desde una sola perspectiva.");
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
  if (score === 4) {
    markComplete(11);
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
  const completeAnswers = Object.values(data).filter((value) => value.trim().length >= 20).length;
  if (completeAnswers < 3) {
    showFeedback("reflection-feedback", "neutral", "Profundiza un poco más", "Para validar la etapa, responde las tres preguntas con al menos una idea completa en cada campo.");
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
  } else {
    showFeedback("transfer-feedback", "error", "Haz más explícita la conexión", "Incluye la relación entre niveles celular y molecular, agentes como virus o bacterias, el ambiente laboral y la necesidad de métodos o evidencia para identificarlos.");
  }
});

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[character]);
}

badgeName.addEventListener("input", () => {
  badgeRecipient.textContent = badgeName.value.trim() || "Estudiante";
});

document.querySelector("#download-badge").addEventListener("click", () => {
  if (completedSteps.size !== screens.length) return;
  const recipient = escapeXml(badgeName.value.trim() || "Estudiante");
  const date = new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(new Date());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
    <rect width="1200" height="1200" rx="72" fill="#f7fbfc"/>
    <path d="M0 0h1200v250H0z" fill="#44388A"/>
    <circle cx="600" cy="480" r="240" fill="#7FDEE0" stroke="#44388A" stroke-width="28"/>
    <circle cx="600" cy="480" r="188" fill="#fff" stroke="#EA4B8B" stroke-width="18"/>
    <text x="600" y="410" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="54" font-weight="700" fill="#44388A">INSIGNIA</text>
    <text x="600" y="535" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="118" font-weight="800" fill="#44388A">100%</text>
    <text x="600" y="605" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="34" font-weight="700" fill="#44388A">OVA COMPLETADO</text>
    <text x="600" y="815" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="52" font-weight="800" fill="#26233F">La célula como unidad de vida</text>
    <text x="600" y="900" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="38" fill="#44388A">Otorgada a ${recipient}</text>
    <text x="600" y="965" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="28" fill="#5a5672">${escapeXml(date)}</text>
    <text x="600" y="1080" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="28" font-weight="700" fill="#44388A">Universidad de Cartagena · CTEV</text>
    <rect x="100" y="1110" width="1000" height="12" rx="6" fill="#EA4B8B"/>
  </svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "insignia-ova-01-celula-unidad-de-vida.svg";
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelectorAll("[data-complete-step]").forEach((button) => {
  button.dataset.defaultLabel = button.textContent;
  if (completedSteps.has(Number(button.dataset.completeStep))) button.textContent = "Etapa validada";
});

restartButton.addEventListener("click", () => {
  if (!window.confirm("¿Deseas borrar el avance y comenzar nuevamente desde la primera etapa?")) return;
  completedSteps.clear();
  document.querySelectorAll("form").forEach((form) => form.reset());
  document.querySelectorAll(".feedback").forEach((feedback) => {
    feedback.hidden = true;
    feedback.className = "feedback";
    feedback.replaceChildren();
  });
  document.querySelectorAll("[aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));
  document.querySelectorAll("[data-complete-step]").forEach((button) => {
    button.textContent = button.dataset.defaultLabel;
  });
  levelsList.innerHTML = initialLevelsMarkup;
  badgeName.value = "";
  badgeRecipient.textContent = "Estudiante";
  completionPanel.hidden = true;
  try {
    localStorage.removeItem("ova01-completed-steps");
    localStorage.removeItem("ova01-reflection");
  } catch (_) {
    // The reset remains effective during the current session.
  }
  showStep(0);
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
        return { section: currentStep + 1, title: screens[currentStep].querySelector("h1, h2")?.textContent ?? "", requestedSection: input.section, locked: currentStep + 1 !== input.section };
      }
    }, { signal: lifecycle.signal }),
    context.registerTool({
      name: "get_ova_progress",
      title: "Consultar progreso del OVA",
      description: "Devuelve la etapa visible y las etapas completadas durante la sesión.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute() {
        return { currentSection: currentStep + 1, totalSections: screens.length, completedSections: Array.from(completedSteps, (step) => step + 1), percentage: Math.round((completedSteps.size / screens.length) * 100), badgeUnlocked: completedSteps.size === screens.length };
      }
    }, { signal: lifecycle.signal })
  ];

  registrations.forEach((registration) => Promise.resolve(registration).catch(() => {}));
}

registerWebMcpTools();
showStep(0, false);
