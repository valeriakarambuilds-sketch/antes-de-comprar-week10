"use strict";

const $ = (id) => document.getElementById(id);
const form = $("purchase-form");
let currentReview = null;

const money = (value) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  }).format(value);

function today() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

$("source-date").value = today();

function readMoney(id, optional = false) {
  const value = $(id).value.trim();

  if (value === "") {
    if (optional) return null;
    throw new Error("Completa los montos obligatorios.");
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0 || number > 1000000) {
    throw new Error("Usa montos entre 0 y 1,000,000 pesos.");
  }

  return Math.round(number * 100) / 100;
}

function readText(id, maximum, required = false) {
  const value = $(id).value.trim();

  if (required && !value) {
    throw new Error("Completa los campos obligatorios.");
  }

  if (value.length > maximum) {
    throw new Error("Uno de los textos supera el límite permitido.");
  }

  return value;
}

function clearDecision() {
  $("decision-status").textContent = "";

  document.querySelectorAll("[data-decision]").forEach((button) => {
    button.classList.remove("selected");
  });
}

function hideReview() {
  currentReview = null;
  $("review-result").hidden = true;
  $("empty-state").hidden = false;
  $("copy-status").textContent = "";
  clearDecision();
}

form.addEventListener("input", () => {
  if (!currentReview) return;

  hideReview();
  $("form-error").textContent =
    "Cambiaste los datos. Vuelve a revisar para actualizar el resultado.";
});

$("load-example").addEventListener("click", () => {
  hideReview();

  const example = {
    product: "Bolsa escolar · caso ficticio",
    budget: "350",
    "return-limit": "0",
    "intended-use": "Llevar una laptop y un libro todos los días",
    concern: "Que el lazo se rompa después de un mes de uso",
    price: "300",
    shipping: "40",
    delivery: "Entre 5 y 8 días después del pedido",
    policy:
      "Devoluciones gratis dentro de 30 días desde la entrega, sujeto a condiciones.",
    coverage: "unknown",
    "coverage-quote": "",
    "return-cost": "0",
    responsible: "",
    source: "Anuncio inventado para esta demostración",
    "source-date": today()
  };

  for (const [id, value] of Object.entries(example)) {
    $(id).value = value;
  }

  $("coverage-required").checked = true;
  $("fictional").checked = true;
  $("form-error").textContent = "";

  form.scrollIntoView({ behavior: "smooth", block: "start" });
  $("product").focus({ preventScroll: true });
});

function addFinding(container, label, text) {
  const card = document.createElement("div");
  card.className = "finding";

  const heading = document.createElement("small");
  heading.textContent = label;

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  card.append(heading, paragraph);
  container.append(card);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  hideReview();
  $("form-error").textContent = "";

  try {
    const data = {
      product: readText("product", 100, true),
      budget: readMoney("budget"),
      returnLimit: readMoney("return-limit"),
      use: readText("intended-use", 500, true),
      concern: readText("concern", 250, true),
      price: readMoney("price"),
      shipping: readMoney("shipping", true),
      delivery: readText("delivery", 150),
      policy: readText("policy", 3000, true),
      coverage: $("coverage").value,
      quote: readText("coverage-quote", 800),
      returnCost: readMoney("return-cost", true),
      responsible: readText("responsible", 200),
      source: readText("source", 200, true),
      date: $("source-date").value,
      required: $("coverage-required").checked,
      fictional: $("fictional").checked
    };

    if (!["unknown", "yes", "no"].includes(data.coverage)) {
      throw new Error("Selecciona un estado válido de cobertura.");
    }

    if (data.coverage !== "unknown" && !data.quote) {
      throw new Error(
        "Pega la frase que incluye o excluye la falla, o selecciona “No está confirmado”."
      );
    }

    if (!data.date || !$("source-date").validity.valid) {
      throw new Error("Indica una fecha de consulta válida.");
    }

    const total =
      data.shipping === null
        ? null
        : Math.round((data.price + data.shipping) * 100) / 100;

    const knownCost = total === null ? data.price : total;
    const overBudget = knownCost > data.budget;
    const findings = [];
    const questions = [];

    function finding(label, text) {
      findings.push({ label, text });
    }

    if (overBudget) {
      finding(
        "CONFLICTO CON TU PRESUPUESTO",
        `${total === null ? "El precio sin envío" : "El total anunciado"} supera tu límite por ${money(knownCost - data.budget)}.`
      );
    } else if (total === null) {
      finding(
        "TOTAL SIN CONFIRMAR",
        "El precio cabe en tu presupuesto, pero falta el envío para conocer el total."
      );
    } else {
      finding(
        "CÁLCULO CON TUS DATOS",
        "El total anunciado cabe en tu presupuesto. Esto no confirma calidad ni protección."
      );
    }

    if (data.shipping === null) {
      questions.push(
        "¿Cuánto cuesta el envío y cuál es el total final en pesos?"
      );
    }

    if (data.coverage === "unknown") {
      finding(
        "COBERTURA SIN CONFIRMAR",
        `No confirmaste cobertura para esta falla: ${data.concern}. Un plazo de devolución no establece por sí solo que esté cubierta.`
      );

      questions.push(
        `Para este uso: “${data.use}”, ¿la protección cubre esta falla después de usar el producto: “${data.concern}”? ¿Durante cuánto tiempo y con qué condiciones?`
      );
    } else {
      finding(
        "INTERPRETACIÓN APORTADA POR TI · NO VERIFICADA",
        `${data.coverage === "yes" ? "Marcaste que la falla está incluida" : "Marcaste que la falla está excluida"}. Frase aportada: “${data.quote}”. No comprobamos su aplicación.`
      );

      if (data.coverage === "no") {
        questions.push(
          "¿Existe otra garantía o vía de reclamación que cubra la falla pese a esa exclusión?"
        );
      }
    }

    if (data.returnCost === null) {
      finding(
        "COSTO DE DEVOLUCIÓN SIN CONFIRMAR",
        "Falta conocer cuánto pagarías por devolver. No lo tratamos como gratis."
      );

      questions.push(
        "¿Quién paga el envío de devolución y cuánto costaría?"
      );
    } else {
      finding(
        "COSTO APORTADO POR TI",
        `Devolver costaría ${money(data.returnCost)}. ${
          data.returnCost > data.returnLimit
            ? `Supera tu límite de ${money(data.returnLimit)}.`
            : `Está dentro de tu límite de ${money(data.returnLimit)}.`
        } Ese costo no confirma que acepten el reclamo.`
      );
    }

    if (data.responsible) {
      finding(
        "CANAL APORTADO POR TI",
        `${data.responsible}. No verificamos que este canal responda.`
      );
    } else {
      finding(
        "RESPONSABLE SIN CONFIRMAR",
        "Falta identificar quién atendería el reclamo."
      );

      questions.push(
        "¿Quién atiende el reclamo, por qué canal y cuánto tarda en responder?"
      );
    }

    if (data.delivery) {
      finding(
        "ENTREGA ANUNCIADA",
        `${data.delivery}. Es una estimación aportada, no una garantía.`
      );
    } else {
      finding(
        "ENTREGA SIN CONFIRMAR",
        "No aportaste una estimación de entrega."
      );

      questions.push(
        "¿Cuál es la fecha o rango de entrega anunciado?"
      );
    }

    questions.push(
      "Si aceptan el reclamo, ¿qué importe reembolsan, qué gastos excluyen y cuánto tarda el reembolso?"
    );

    const needsClarification =
      overBudget ||
      total === null ||
      (data.required && data.coverage !== "yes") ||
      data.returnCost === null ||
      data.returnCost > data.returnLimit ||
      !data.responsible ||
      !data.delivery;

    $("case-label").textContent = data.fictional
      ? "CASO FICTICIO · DATOS INVENTADOS"
      : "DATOS APORTADOS POR TI";

    $("review-product").textContent = data.product;

    $("review-status").textContent = needsClarification
      ? "Hay límites o información por aclarar."
      : "No detectamos conflictos con los datos aportados. No es una garantía.";

    $("total-cost").textContent =
      total === null ? "Sin confirmar" : money(total);

    $("budget-display").textContent = money(data.budget);

    $("financial-exposure").textContent =
      total === null
        ? `Si no aceptan el reclamo, podrías no recuperar ${money(data.price)}, más el envío aún desconocido. No es una pérdida confirmada.`
        : `Si no aceptan el reclamo, podrías no recuperar ${money(total)}. Si lo aceptan, el reembolso dependerá de las condiciones; la devolución se muestra por separado. No es una pérdida confirmada.`;

    $("findings").replaceChildren();

    for (const item of findings) {
      addFinding($("findings"), item.label, item.text);
    }

    $("policy-display").textContent = data.policy;

    $("source-display").textContent =
      `Fuente: ${data.source} · Consultada: ${data.date} · Revisada: ${today()}`;

    $("questions").replaceChildren();

    for (const question of questions) {
      const item = document.createElement("li");
      item.textContent = question;
      $("questions").append(item);
    }

    currentReview = { questions };
    $("empty-state").hidden = true;
    $("review-result").hidden = false;
    $("review-title").focus();
  } catch (error) {
    $("form-error").textContent = error.message;
    $("form-error").scrollIntoView({ block: "center" });
  }
});

$("copy-questions").addEventListener("click", async () => {
  if (!currentReview) return;

  const text = currentReview.questions
    .map((question, index) => `${index + 1}. ${question}`)
    .join("\n");

  try {
    await navigator.clipboard.writeText(text);
    $("copy-status").textContent =
      "Preguntas copiadas. Tú decides dónde compartirlas.";
  } catch {
    $("copy-status").textContent =
      "No se pudo copiar automáticamente. Selecciona las preguntas y cópialas con ⌘ + C.";
  }
});

const decisions = {
  ask: "Decidiste pedir aclaraciones antes de pagar.",
  wait: "Decidiste esperar y no comprar por ahora.",
  continue:
    "Decidiste continuar por tu cuenta con la incertidumbre visible."
};

document.querySelectorAll("[data-decision]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!currentReview) return;

    clearDecision();
    button.classList.add("selected");

    $("decision-status").textContent =
      decisions[button.dataset.decision] +
      " No se envió ningún mensaje ni se realizó una compra.";
  });
});

$("reset-form").addEventListener("click", () => {
  form.reset();
  hideReview();
  $("source-date").value = today();
  $("form-error").textContent = "";
  $("product").focus();
});