// simulation.js — полная логика виртуальной лаборатории

// ===== Вспомогательные функции для статистики (дублированы из main.js) =====
const STATS_KEY = 'karyotyping_lab_stats';

function getStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      return { totalRuns: 0, correctDx: 0 };
    }
    const parsed = JSON.parse(raw);
    return {
      totalRuns: parsed.totalRuns || 0,
      correctDx: parsed.correctDx || 0,
    };
  } catch {
    return { totalRuns: 0, correctDx: 0 };
  }
}

function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function incrementRun(isDiagnosisCorrect) {
  const stats = getStats();
  stats.totalRuns += 1;
  if (isDiagnosisCorrect) {
    stats.correctDx += 1;
  }
  saveStats(stats);
}

// ===== Данные по случаям (кариотипы) =====

const CASES = [
  { id: 'normal', type: 'normal', label: 'Нормальный кариотип' },
  { id: 'trisomy21', type: 'trisomy', label: 'Трисомия 21 (Дауна)' },
  { id: 'trisomy18', type: 'trisomy', label: 'Трисомия 18 (Эдвардса)' },
  { id: 'trisomy13', type: 'trisomy', label: 'Трисомия 13 (Патау)' },
];

function generateCase() {
  const randomIndex = Math.floor(Math.random() * CASES.length);
  const base = CASES[randomIndex];
  const isMale = Math.random() < 0.5;

  let formula, diagnosisName;

  switch (base.id) {
    case 'normal':
      formula = isMale ? '46,XY' : '46,XX';
      diagnosisName = 'Нормальный кариотип';
      break;
    case 'trisomy21':
      formula = isMale ? '47,XY,+21' : '47,XX,+21';
      diagnosisName = 'Трисомия 21 (синдром Дауна)';
      break;
    case 'trisomy18':
      formula = isMale ? '47,XY,+18' : '47,XX,+18';
      diagnosisName = 'Трисомия 18 (синдром Эдвардса)';
      break;
    case 'trisomy13':
      formula = isMale ? '47,XY,+13' : '47,XX,+13';
      diagnosisName = 'Трисомия 13 (синдром Патау)';
      break;
    default:
      formula = '46,XX';
      diagnosisName = 'Нормальный кариотип';
  }

  return {
    id: base.id,
    formula,
    diagnosisName,
    sex: isMale ? 'XY' : 'XX',
  };
}

// ===== Этапы симуляции =====

const STEPS = [
  {
    id: 1,
    name: 'Получение клеточного материала',
    description:
      'Перенесите клеточный материал в пробирку для образца и промаркируйте её.',
    requiredActions: ['add_sample_to_sample_tube'],
    hint: 'Перетащите «Клеточный материал» на «Пробирку для образца».',
    errorExplanation:
      'Сначала нужно получить клеточный материал и поместить его в пробирку для образца.',
  },
  {
    id: 2,
    name: 'Культивирование клеток',
    description:
      'Добавьте питательную среду и митоген в пробирку с образцом, затем инкубируйте.',
    requiredActions: [
      'add_culture_medium_to_sample_tube',
      'add_mitogen_to_sample_tube',
      'use_incubator',
    ],
    hint: 'Добавьте в пробирку с образцом среду и митоген, затем нажмите на инкубатор.',
    errorExplanation:
      'Последовательность: среда → митоген → инкубатор. Без культивирования получить метафазу нельзя.',
  },
  {
    id: 3,
    name: 'Добавление колхицина',
    description:
      'Введите колхицин в культуру для остановки митоза в метафазе, затем снова инкубируйте.',
    requiredActions: ['add_colchicine_to_culture_tube', 'use_incubator'],
    hint: 'Перетащите «Колхицин» на пробирку с культурой и нажмите на инкубатор.',
    errorExplanation:
      'Колхицин добавляют к уже культивированным клеткам перед гипотонической обработкой.',
  },
  {
    id: 4,
    name: 'Гипотоническая обработка клеток',
    description:
      'Обработайте клетки гипотоническим раствором и центрифугируйте для осаждения клеток.',
    requiredActions: [
      'add_hypotonic_to_culture_tube',
      'use_incubation_for_hypotonic',
      'use_centrifuge',
    ],
    hint: 'Добавьте гипотонический раствор, «выдержите» его (нажмите ещё раз на культуру), затем используйте центрифугу.',
    errorExplanation:
      'Гипотоническая обработка проводится до фиксации, затем клетки осаждаются центрифугированием.',
  },
  {
    id: 5,
    name: 'Фиксация (метанол + уксусная кислота)',
    description:
      'Добавьте фиксатор в осаждённые клетки и перемешайте, чтобы зафиксировать хромосомы.',
    requiredActions: ['add_fixative_to_culture_tube', 'mix_fixative'],
    hint: 'Перетащите фиксатор на пробирку с клеточной массой и «перемешайте» (щёлкните по пробирке).',
    errorExplanation:
      'Фиксатор (метанол + уксус) добавляют после гипотонии и центрифугирования.',
  },
  {
    id: 6,
    name: 'Нанесение клеток на предметное стекло',
    description:
      'Нанесите фиксированную суспензию на предметное стекло и дайте высохнуть.',
    requiredActions: ['add_cells_to_slide_area', 'dry_slide'],
    hint: 'Перетащите «Предметное стекло» в зону стекла, затем капните клетки (щёлкните по пробирке).',
    errorExplanation:
      'Клеточная суспензия наносится на стекло после фиксации, затем высушивается.',
  },
  {
    id: 7,
    name: 'Окрашивание методом G-banding (Giemsa)',
    description:
      'Окрасьте препарат красителем Giemsa, промойте и высушите.',
    requiredActions: ['add_giemsa_to_stain_area', 'wash_slide', 'dry_slide_after_stain'],
    hint: 'Перетащите «Окраска Giemsa» на зону окраски, затем используйте буфер и дайте высохнуть.',
    errorExplanation:
      'G-banding требует окраски препарату Giemsa, последующей промывки и высушивания.',
  },
  {
    id: 8,
    name: 'Получение метафазной пластинки под микроскопом',
    description: 'Поместите препарат под микроскоп, сфокусируйтесь и получите изображение метафазы.',
    requiredActions: ['use_microscope'],
    hint: 'Нажмите на микроскоп, чтобы посмотреть препарат.',
    errorExplanation:
      'Без помещения препарата под микроскоп вы не увидите метафазные пластинки.',
  },
  {
    id: 9,
    name: 'Сбор хромосом в кариотип',
    description:
      'Соберите пары хромосом в условном поле кариотипа (упрощённый пазл).',
    requiredActions: ['open_karyotype_puzzle'],
    hint: 'В модальном окне перетащите условные хромосомы в ячейки кариотипа.',
    errorExplanation:
      'Кариотип формируют путём раскладки хромосом по парам в стандартном порядке.',
  },
  {
    id: 10,
    name: 'Постановка диагноза',
    description:
      'На основе кариотипа определите цитогенетическую формулу и выберите диагноз.',
    requiredActions: ['submit_diagnosis'],
    hint: 'Введите формулу (например, 47,XY,+21) и выберите диагноз из списка.',
    errorExplanation:
      'Диагноз формулируется на основе полученного кариотипа и выявленных числовых аномалий.',
  },
];

const TOTAL_STEPS = STEPS.length;

// ===== Глобальное состояние симуляции =====

const state = {
  currentCase: null,
  currentStepIndex: 0,
  performedActions: [],
  karyotypeBuilt: false,
};

// ===== Инициализация =====

document.addEventListener('DOMContentLoaded', () => {
  initSimulation();
});

function initSimulation() {
  state.currentCase = generateCase();
  state.currentStepIndex = 0;
  state.performedActions = [];
  state.karyotypeBuilt = false;

  setupStepUI();
  setupDragAndDrop();
  setupEquipmentHandlers();
  setupButtons();
  setupKaryotypeBuilder();
  logAction('Симуляция запущена. Случай: ' + state.currentCase.formula);
}

// ===== UI обновления =====

function setupStepUI() {
  const step = STEPS[state.currentStepIndex];
  const stepNumberEl = document.getElementById('step-number');
  const stepTotalEl = document.getElementById('step-total');
  const stepNameEl = document.getElementById('current-step-name');
  const stepDescEl = document.getElementById('current-step-description');
  const hintPanel = document.getElementById('hint-panel');
  const progressFill = document.getElementById('progress-bar-fill');

  if (stepNumberEl) stepNumberEl.textContent = step.id;
  if (stepTotalEl) stepTotalEl.textContent = TOTAL_STEPS;
  if (stepNameEl) stepNameEl.textContent = step.name;
  if (stepDescEl) stepDescEl.textContent = step.description;
  if (hintPanel) hintPanel.textContent = '';

  if (progressFill) {
    const percent = (step.id / TOTAL_STEPS) * 100;
    progressFill.style.width = `${percent}%`;
  }
}

function logAction(text) {
  const list = document.getElementById('action-log-list');
  if (!list) return;
  const li = document.createElement('li');
  const timestamp = new Date().toLocaleTimeString();
  li.textContent = `[${timestamp}] ${text}`;
  list.appendChild(li);
  list.scrollTop = list.scrollHeight;
}

// ===== Drag and Drop реагентов =====

function setupDragAndDrop() {
  const reagents = document.querySelectorAll('.reagent');
  const dropZones = document.querySelectorAll('.drop-zone');

  let draggedReagent = null;

  reagents.forEach(reagent => {
    reagent.addEventListener('dragstart', e => {
      draggedReagent = reagent;
      reagent.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    reagent.addEventListener('dragend', () => {
      draggedReagent = null;
      reagent.classList.remove('dragging');
    });
  });

  dropZones.forEach(zone => {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      if (!draggedReagent) return;
      zone.classList.add('highlight');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('highlight');
    });

    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('highlight');
      if (!draggedReagent) return;

      const reagentId = draggedReagent.dataset.reagentId;
      const targetId = zone.dataset.dropTarget;
      handleReagentDrop(reagentId, targetId);
    });
  });
}

function handleReagentDrop(reagentId, targetId) {
  const actionId = mapReagentToAction(reagentId, targetId);

  if (!actionId) {
    showError(
      'Неверное использование реагента.',
      'Данный реагент не применяется на этом этапе на указанной зоне.'
    );
    return;
  }

  handleAction(actionId, `Реагент «${reagentId}» на зону «${targetId}»`);
}

function mapReagentToAction(reagentId, targetId) {
  // Карта соответствий reagent + target → actionId
  switch (reagentId) {
    case 'sample_material':
      if (targetId === 'sample_tube') return 'add_sample_to_sample_tube';
      break;
    case 'culture_medium':
      if (targetId === 'sample_tube') return 'add_culture_medium_to_sample_tube';
      break;
    case 'mitogen':
      if (targetId === 'sample_tube') return 'add_mitogen_to_sample_tube';
      break;
    case 'colchicine':
      if (targetId === 'culture_tube') return 'add_colchicine_to_culture_tube';
      break;
    case 'hypotonic':
      if (targetId === 'culture_tube') return 'add_hypotonic_to_culture_tube';
      break;
    case 'fixative':
      if (targetId === 'culture_tube') return 'add_fixative_to_culture_tube';
      break;
    case 'giemsa':
      if (targetId === 'stain_area') return 'add_giemsa_to_stain_area';
      break;
    case 'wash_buffer':
      if (targetId === 'stain_area') return 'wash_slide';
      break;
    case 'slide':
      if (targetId === 'slide_area') return 'add_slide_to_slide_area';
      break;
  }
  // Дополнительные действия с уже имеющимся стеклом/суспензией
  if (targetId === 'slide_area' && reagentId === 'sample_material') {
    return 'add_cells_to_slide_area';
  }

  return null;
}

// ===== Оборудование и дополнительные клики =====

function setupEquipmentHandlers() {
  const equipments = document.querySelectorAll('.equipment');
  equipments.forEach(eq => {
    eq.addEventListener('click', () => {
      const actionId = eq.dataset.actionId;
      if (!actionId) return;

      handleAction(actionId, `Использование прибора: ${actionId}`);
    });
  });

  // Дополнительные клики по пробиркам / зонам для некоторых действий
  const cultureTube = document.getElementById('tube-culture');
  const slideArea = document.getElementById('slide-area');
  const stainArea = document.getElementById('stain-area');

  if (cultureTube) {
    cultureTube.addEventListener('click', () => {
      const step = STEPS[state.currentStepIndex];
      if (!step) return;

      if (step.id === 4) {
        handleAction(
          'use_incubation_for_hypotonic',
          'Выдержка клеток в гипотоническом растворе'
        );
      } else if (step.id === 5) {
        handleAction('mix_fixative', 'Перемешивание суспензии с фиксатором');
      } else if (step.id === 6) {
        handleAction('add_cells_to_slide_area', 'Нанесение клеток на стекло');
      }
    });
  }

  if (slideArea) {
    slideArea.addEventListener('click', () => {
      const step = STEPS[state.currentStepIndex];
      if (!step) return;

      if (step.id === 6) {
        handleAction('dry_slide', 'Высушивание препарата на стекле');
      }
    });
  }

  if (stainArea) {
    stainArea.addEventListener('click', () => {
      const step = STEPS[state.currentStepIndex];
      if (!step) return;

      if (step.id === 7) {
        handleAction('dry_slide_after_stain', 'Высушивание препарата после окраски');
      }
    });
  }
}

// ===== Кнопки управления =====

function setupButtons() {
  const hintBtn = document.getElementById('hint-button');
  const repeatBtn = document.getElementById('repeat-step-button');
  const restartBtn = document.getElementById('restart-simulation');
  const errorCloseBtn = document.getElementById('error-close-button');

  if (hintBtn) {
    hintBtn.addEventListener('click', () => {
      const step = STEPS[state.currentStepIndex];
      if (!step) return;
      const hintPanel = document.getElementById('hint-panel');
      if (hintPanel) {
        hintPanel.textContent = step.hint;
      }
    });
  }

  if (repeatBtn) {
    repeatBtn.addEventListener('click', () => {
      state.performedActions = [];
      logAction('Этап перезапущен пользователем.');
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      logAction('Пользователь запросил полный перезапуск симуляции.');
      initSimulation();
    });
  }

  if (errorCloseBtn) {
    errorCloseBtn.addEventListener('click', () => {
      hideModal('error-modal');
    });
  }

  // Закрытие модалок по клику на крестик
  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', () => {
      const modal = el.closest('.modal');
      if (modal) modal.classList.add('hidden');
    });
  });

  // Модалка микроскопа → кариотип
  const proceedBtn = document.getElementById('proceed-to-karyotype');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => {
      hideModal('microscope-modal');
      showModal('karyotype-modal');
      handleAction('open_karyotype_puzzle', 'Открыто поле для сборки кариотипа');
    });
  }

  // Форма диагноза
  const diagnosisForm = document.getElementById('diagnosis-form');
  if (diagnosisForm) {
    diagnosisForm.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(diagnosisForm);
      const userFormula = formData.get('formula');
      const userDxId = formData.get('diagnosis');
      checkDiagnosis(userFormula, userDxId);
    });
  }
}

// ===== Логика шагов =====

function handleAction(actionId, logText) {
  const step = STEPS[state.currentStepIndex];
  if (!step) return;

  const expectedActions = step.requiredActions;
  const nextExpectedAction = expectedActions[state.performedActions.length];

  if (actionId !== nextExpectedAction) {
    showError(
      'Действие не соответствует правильной последовательности для текущего этапа.',
      step.errorExplanation + ` Ожидалось: ${nextExpectedAction}, получено: ${actionId}.`
    );
    return;
  }

  state.performedActions.push(actionId);
  if (logText) {
    logAction(logText);
  } else {
    logAction(`Действие: ${actionId}`);
  }

  if (state.performedActions.length === expectedActions.length) {
    goToNextStep();
  }
}

function goToNextStep() {
  if (state.currentStepIndex < STEPS.length - 1) {
    state.currentStepIndex++;
    state.performedActions = [];
    setupStepUI();

    const step = STEPS[state.currentStepIndex];
    logAction(`Переход к этапу: ${step.name}`);

    // Особое поведение для микроскопа — показать метафазу
    if (step.id === 8) {
      const formulaDisplay = document.getElementById('case-formula-display');
      if (formulaDisplay) {
        formulaDisplay.textContent = state.currentCase.formula;
      }
    }
  } else {
    // Финальный шаг технически обрабатывается через форму диагноза
    logAction('Все этапы протокола выполнены.');
  }
}

// ===== Модальные окна и ошибки =====

function showModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
}

function hideModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

function showError(message, explanation) {
  const msgEl = document.getElementById('error-message');
  const explEl = document.getElementById('error-explanation');
  if (msgEl) msgEl.textContent = message;
  if (explEl) explEl.textContent = explanation || '';
  showModal('error-modal');
  logAction('Ошибка: ' + message);
}

// ===== Кариотип (упрощённый пазл) =====

function setupKaryotypeBuilder() {
  const pool = document.getElementById('chromosome-pool');
  const grid = document.getElementById('karyotype-grid');
  if (!pool || !grid) return;

  pool.innerHTML = '';
  grid.innerHTML = '';

  // Условно генерируем 23 "пары" → 46 "хромосом" (метки 1–23, X/Y)
  const chromosomes = [];
  for (let i = 1; i <= 22; i++) {
    chromosomes.push({ id: `c${i}a`, label: i });
    chromosomes.push({ id: `c${i}b`, label: i });
  }
  chromosomes.push({ id: 'cXa', label: 'X' });
  chromosomes.push({ id: 'cXb', label: 'X/Y' });

  chromosomes.forEach(ch => {
    const div = document.createElement('div');
    div.className = 'chromosome';
    div.textContent = ch.label;
    div.draggable = true;
    div.dataset.chromosomeId = ch.id;
    div.addEventListener('dragstart', e => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', ch.id);
    });
    pool.appendChild(div);
  });

  // Слоты для 23 пар (6 колонок)
  for (let i = 1; i <= 23; i++) {
    const slot = document.createElement('div');
    slot.className = 'karyotype-slot';
    slot.dataset.slotIndex = String(i);
    slot.textContent = `Пара ${i}`;
    setupKaryotypeSlot(slot);
    grid.appendChild(slot);
  }
}

function setupKaryotypeSlot(slot) {
  slot.addEventListener('dragover', e => {
    e.preventDefault();
    slot.classList.add('highlight');
  });

  slot.addEventListener('dragleave', () => {
    slot.classList.remove('highlight');
  });

  slot.addEventListener('drop', e => {
    e.preventDefault();
    slot.classList.remove('highlight');
    const chId = e.dataTransfer.getData('text/plain');
    if (!chId) return;

    const pool = document.getElementById('chromosome-pool');
    const chEl = pool.querySelector(`[data-chromosome-id="${chId}"]`);
    if (!chEl) return;

    chEl.draggable = false;
    chEl.style.cursor = 'default';
    slot.appendChild(chEl);

    // Простая эвристика: если достаточно ячеек заполнено, считаем, что кариотип "собран"
    const filledSlots = document.querySelectorAll('.karyotype-slot .chromosome').length;
    if (filledSlots >= 10 && !state.karyotypeBuilt) {
      state.karyotypeBuilt = true;
      logAction('Кариотип условно собран (упрощённый пазл).');
    }
  });
}

// ===== Проверка диагноза =====

function checkDiagnosis(userFormulaRaw, userDiagnosisId) {
  const feedbackEl = document.getElementById('diagnosis-feedback');
  if (!feedbackEl) return;

  const userFormula = (userFormulaRaw || '').trim();
  if (!userFormula || !userDiagnosisId) {
    feedbackEl.textContent = 'Пожалуйста, заполните формулу и выберите диагноз.';
    feedbackEl.className = 'diagnosis-feedback error';
    return;
  }

  const correctFormula = state.currentCase.formula;
  const correctId = state.currentCase.id;

  const formulaCorrect = userFormula === correctFormula;
  const diagnosisCorrect = userDiagnosisId === correctId;

  const isAllCorrect = formulaCorrect && diagnosisCorrect;

  incrementRun(isAllCorrect);
  handleAction('submit_diagnosis', 'Пользователь отправил диагноз.');

  if (isAllCorrect) {
    feedbackEl.textContent =
      'Верно! Формула: ' + correctFormula + '. Диагноз: ' + state.currentCase.diagnosisName + '.';
    feedbackEl.className = 'diagnosis-feedback success';
    logAction('Диагноз поставлен верно.');

    // Можно автоматически закрыить модалку или предложить перезапуск
  } else {
    feedbackEl.innerHTML =
      'Есть ошибки в формуле или диагнозе.<br>' +
      'Правильная формула: <strong>' +
      correctFormula +
      '</strong>, диагноз: <strong>' +
      state.currentCase.diagnosisName +
      '</strong>.';
    feedbackEl.className = 'diagnosis-feedback error';
    logAction('Диагноз неверен.');
  }
}
