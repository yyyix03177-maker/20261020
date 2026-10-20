// 設定可替換的 GIF 路徑，請將檔案放在專案資料夾內或改成可用網址。
const GIF_PATH = "assets/p5-learning.gif"; // 這是上方動畫 GIF 的路徑變數。
const QUESTIONS = [ // 建立六個 p5.js 程式設計題目。
  { prompt: "在 p5.js 中，哪個函式通常只會在程式開始時執行一次？", options: ["draw()", "setup()", "loop()", "start()", "init()", "frameRate()"], answer: 1 }, // 第一道題的正確答案是 setup()。
  { prompt: "哪個 p5.js 函式會在畫面更新時持續重複執行？", options: ["draw()", "setup()", "preload()", "createCanvas()", "size()", "repeat()"], answer: 0 }, // 第二道題的正確答案是 draw()。
  { prompt: "要建立寬度 800、高度 600 的 p5.js 畫布，應使用哪一段程式？", options: ["canvas(800, 600)", "makeCanvas(800, 600)", "createCanvas(800, 600)", "newCanvas(800, 600)", "screen(800, 600)", "setCanvas(800, 600)"], answer: 2 }, // 第三道題的正確答案是 createCanvas(800, 600)。
  { prompt: "在 p5.js 中，哪個函式可以設定畫布背景顏色？", options: ["fillBackground()", "background()", "canvasColor()", "backColor()", "paint()", "colorBackground()"], answer: 1 }, // 第四道題的正確答案是 background()。
  { prompt: "若要在 p5.js 畫出圓形，最適合使用哪個函式？", options: ["circle()", "round()", "ellipse()", "oval()", "disk()", "drawCircle()"], answer: 2 }, // 第五道題的正確答案是 ellipse()。
  { prompt: "哪個事件函式適合處理使用者按下滑鼠的動作？", options: ["whenClick()", "mouseDown()", "onMouse()", "mousePressed()", "clickMouse()", "press()"], answer: 3 } // 第六道題的正確答案是 mousePressed()。
]; // 完成六題資料的建立。
let canvasElement; // 儲存 p5.js 畫布元素。
let gifElement; // 儲存由 p5.js 建立的 GIF DOM 元素。
let gifStatus = "loading"; // 記錄 GIF 目前是載入中、成功或失敗。
let layout = {}; // 儲存所有響應式版面座標。
let currentQuestion = 0; // 記錄目前正在作答的題目編號。
let selectedAnswers = []; // 儲存每一題拖曳完成的選項編號。
let submitted = false; // 記錄是否已經按下交卷看成績。
let score = 0; // 儲存答對題數。
let statusMessage = "請將下方選項拖曳到答案區。"; // 顯示目前操作提示。
let pointerDown = false; // 記錄滑鼠或觸控是否正在按住。
let dragging = false; // 記錄目前是否正在拖曳選項。
let draggingIndex = -1; // 記錄正在拖曳的選項編號。
let dragX = 0; // 記錄拖曳浮動選項的 X 座標。
let dragY = 0; // 記錄拖曳浮動選項的 Y 座標。
let confettiParticles = []; // 儲存彩帶粒子資料。

function setup() { // 執行 p5.js 初始設定。
  canvasElement = createCanvas(windowWidth, windowHeight); // 建立填滿瀏覽器視窗的響應式畫布。
  canvasElement.style("display", "block"); // 移除畫布下方可能產生的內建空白。
  document.body.style.margin = "0"; // 移除網頁預設外距。
  document.body.style.overflow = "hidden"; // 避免拖曳時網頁整體跟著捲動。
  document.body.style.background = "#F4F7FB"; // 設定網頁背景與畫布背景一致。
  textFont("sans-serif"); // 使用瀏覽器可用的無襯線字型。
  textAlign(LEFT, TOP); // 設定文字預設從左上角開始繪製。
  rectMode(CORNER); // 設定矩形使用左上角座標與寬高。
  selectedAnswers = Array(QUESTIONS.length).fill(-1); // 初始化每一題為尚未作答。
  createGifElement(); // 建立上方的動畫 GIF 元素。
  calculateLayout(); // 依目前視窗尺寸計算版面。
} // 結束 p5.js 初始設定。

function createGifElement() { // 建立並設定動畫 GIF 的 DOM 顯示元件。
  gifElement = createImg(GIF_PATH, "p5.js 教學動畫"); // 透過 p5.js 建立可播放動畫 GIF 的圖片元素。
  gifElement.style("object-fit", "contain"); // 讓 GIF 保持比例並完整放入顯示區。
  gifElement.style("border-radius", "16px"); // 為 GIF 加上圓角。
  gifElement.style("pointer-events", "none"); // 讓 GIF 不阻擋畫布上的滑鼠與觸控操作。
  gifElement.style("z-index", "2"); // 讓 GIF 顯示在畫布上方但不影響操作。
  gifElement.elt.onload = function() { gifStatus = "loaded"; }; // GIF 載入成功時切換為成功狀態。
  gifElement.elt.onerror = function() { gifStatus = "error"; gifElement.hide(); }; // GIF 載入失敗時隱藏圖片並改用畫布備援。
} // 結束 GIF 元素建立。

function draw() { // 每一幀重新繪製整個測驗畫面。
  background("#F4F7FB"); // 清除畫布並設定柔和的頁面背景色。
  calculateLayout(); // 每一幀更新版面，確保瀏覽器尺寸變化時仍然正確。
  updateGifElement(); // 將 GIF 元素同步到最新的響應式位置。
  drawHeader(); // 繪製頁面標題與目前進度。
  drawGifArea(); // 繪製 GIF 備援區與說明。
  if (submitted) { drawResultScreen(); } else { drawQuizScreen(); } // 依交卷狀態繪製作答頁或結果頁。
  if (submitted && score / QUESTIONS.length > 0.6) { drawConfetti(); } // 成績嚴格高於百分之六十時繪製彩帶。
} // 結束每一幀的繪製。

function calculateLayout() { // 根據視窗寬高計算所有元件的響應式位置。
  const margin = constrain(width * 0.025, 12, 28); // 依畫布寬度設定左右安全邊界。
  const gap = constrain(height * 0.012, 7, 14); // 依畫布高度設定元件間距。
  const headerHeight = constrain(height * 0.085, 52, 76); // 計算標題區高度。
  const gifHeight = constrain(height * 0.12, 62, 132); // 計算 GIF 區高度。
  const questionHeight = constrain(height * 0.16, 90, 158); // 計算題目區高度。
  const answerHeight = constrain(height * 0.09, 54, 82); // 計算答案放置區高度。
  const optionsHeight = constrain(height * 0.25, 130, 224); // 計算六個選項的區域高度。
  const controlsHeight = constrain(height * 0.055, 46, 58); // 計算按鈕區高度。
  const contentWidth = max(0, width - margin * 2); // 計算內容可使用的最大寬度。
  const gifWidth = min(contentWidth, 520); // 限制 GIF 最大寬度避免在大螢幕過度放大。
  const gifX = (width - gifWidth) / 2; // 計算 GIF 的置中 X 座標。
  const headerY = margin * 0.5; // 設定標題區的 Y 座標。
  const gifY = headerY + headerHeight; // 計算 GIF 區的 Y 座標。
  const questionY = gifY + gifHeight + gap; // 計算題目區的 Y 座標。
  const answerY = questionY + questionHeight + gap; // 計算答案區的 Y 座標。
  const optionsY = answerY + answerHeight + gap; // 計算選項區的 Y 座標。
  const controlsY = optionsY + optionsHeight + gap; // 計算控制按鈕區的 Y 座標。
  layout = { margin, gap, headerHeight, gifHeight, questionHeight, answerHeight, optionsHeight, controlsHeight, contentWidth, gifWidth, gifX, headerY, gifY, questionY, answerY, optionsY, controlsY }; // 將版面資料集中保存。
  if (gifElement) { gifElement.position(gifX, gifY); gifElement.size(gifWidth, gifHeight); } // 同步 GIF 的位置與尺寸。
} // 結束響應式版面計算。

function updateGifElement() { // 更新 GIF DOM 元件的顯示狀態。
  if (!gifElement) return; // 若 GIF 元件尚未建立則不繼續處理。
  if (gifStatus === "error") { gifElement.hide(); } else { gifElement.show(); } // 載入失敗隱藏圖片，其他狀態顯示圖片。
} // 結束 GIF 元件更新。

function drawHeader() { // 繪製頁面標題與進度資訊。
  fill("#183153"); // 設定主標題顏色。
  noStroke(); // 移除文字不需要的外框。
  textStyle(BOLD); // 設定主標題為粗體。
  textSize(constrain(width * 0.032, 19, 30)); // 依寬度設定標題字級。
  text("p5.js 拖曳程式設計測驗", layout.margin, layout.headerY + 4); // 顯示測驗標題。
  textStyle(NORMAL); // 還原一般文字樣式。
  fill("#52657A"); // 設定進度文字顏色。
  textSize(constrain(width * 0.018, 12, 16)); // 依寬度設定進度字級。
  const progressText = submitted ? "測驗結果" : "第 " + (currentQuestion + 1) + " 題／共 " + QUESTIONS.length + " 題"; // 組合目前進度文字。
  text(progressText, layout.margin, layout.headerY + layout.headerHeight * 0.52); // 顯示進度文字。
} // 結束標題繪製。

function drawGifArea() { // 繪製 GIF 載入失敗或載入中的畫布備援內容。
  noStroke(); // 移除備援區外框。
  fill("#DDEAF7"); // 設定備援區背景色。
  rect(layout.gifX, layout.gifY, layout.gifWidth, layout.gifHeight, 16); // 繪製 GIF 的背景容器。
  if (gifStatus === "loaded") { return; } // GIF 成功顯示時不覆蓋其內容。
  fill("#315B83"); // 設定備援文字顏色。
  textAlign(CENTER, CENTER); // 將備援文字置中。
  textSize(constrain(width * 0.02, 14, 19)); // 設定備援文字大小。
  const fallbackText = gifStatus === "error" ? "GIF 載入失敗，請檢查 GIF_PATH" : "GIF 載入中……"; // 依 GIF 狀態組合提示文字。
  text(fallbackText, width / 2, layout.gifY + layout.gifHeight / 2); // 顯示備援提示文字。
  textAlign(LEFT, TOP); // 還原一般文字對齊方式。
} // 結束 GIF 區繪製。

function drawQuizScreen() { // 繪製尚未交卷的作答畫面。
  drawQuestionCard(); // 繪製題目文字區。
  drawAnswerZone(); // 繪製拖曳答案區。
  drawOptionCards(); // 繪製六個文字拖曳選項。
  drawQuizControls(); // 繪製上一題、下一題與交卷按鈕。
  drawStatusMessage(); // 繪製操作提示文字。
  if (dragging) { drawDraggingCard(); } // 拖曳時在最上層繪製浮動選項。
} // 結束作答畫面繪製。

function drawQuestionCard() { // 繪製目前題目的卡片。
  drawPanel(layout.margin, layout.questionY, layout.contentWidth, layout.questionHeight, "#FFFFFF", "#D5E1EE"); // 繪製白色題目卡片。
  fill("#2D6A9F"); // 設定題號文字顏色。
  noStroke(); // 移除題號文字外框。
  textStyle(BOLD); // 設定題號為粗體。
  textSize(constrain(width * 0.019, 13, 17)); // 設定題號字級。
  text("題目 " + (currentQuestion + 1), layout.margin + 16, layout.questionY + 14); // 顯示目前題號。
  textStyle(NORMAL); // 還原一般文字樣式。
  fill("#1D2D3D"); // 設定題目文字顏色。
  textSize(constrain(width * 0.022, 15, 21)); // 設定題目文字大小。
  drawWrappedText(QUESTIONS[currentQuestion].prompt, layout.margin + 16, layout.questionY + 42, layout.contentWidth - 32, layout.questionHeight - 52, 1.25); // 繪製可換行的題目內容。
} // 結束題目卡片繪製。

function drawAnswerZone() { // 繪製拖曳答案的目標區。
  const answer = selectedAnswers[currentQuestion]; // 讀取目前題目已選答案。
  const isAnswered = answer >= 0; // 判斷目前題目是否已完成拖曳。
  drawPanel(layout.margin, layout.answerY, layout.contentWidth, layout.answerHeight, isAnswered ? "#E5F5EC" : "#FFF8E6", isAnswered ? "#79C99A" : "#E6C46B"); // 依作答狀態繪製答案區。
  fill(isAnswered ? "#237A49" : "#82651A"); // 設定答案區文字顏色。
  noStroke(); // 移除答案區文字外框。
  textStyle(BOLD); // 設定答案提示為粗體。
  textSize(constrain(width * 0.018, 13, 17)); // 設定答案提示字級。
  const zoneText = isAnswered ? "已選答案：" + QUESTIONS[currentQuestion].options[answer] : "答案區：請把一個選項拖曳到這裡"; // 組合答案區提示文字。
  text(zoneText, layout.margin + 16, layout.answerY + layout.answerHeight / 2 - 9); // 顯示答案區提示。
  textStyle(NORMAL); // 還原一般文字樣式。
} // 結束答案區繪製。

function drawOptionCards() { // 繪製目前題目的六個選項卡片。
  for (let optionIndex = 0; optionIndex < QUESTIONS[currentQuestion].options.length; optionIndex++) { // 逐一處理六個選項。
    if (optionIndex === draggingIndex) { continue; } // 拖曳中的選項改由浮動卡片繪製。
    const card = getOptionRect(optionIndex); // 取得選項卡片的響應式位置。
    const isSelected = selectedAnswers[currentQuestion] === optionIndex; // 判斷選項是否為目前答案。
    drawPanel(card.x, card.y, card.w, card.h, isSelected ? "#DCEBFF" : "#FFFFFF", isSelected ? "#4F8EDB" : "#D5E1EE"); // 繪製選項卡片。
    fill(isSelected ? "#1B5DA8" : "#26394D"); // 設定選項文字顏色。
    noStroke(); // 移除選項文字外框。
    textStyle(isSelected ? BOLD : NORMAL); // 已選選項使用粗體提示。
    textSize(constrain(width * 0.017, 12, 17)); // 設定選項文字大小。
    drawWrappedText(QUESTIONS[currentQuestion].options[optionIndex], card.x + 12, card.y + 8, card.w - 24, card.h - 16, 1.15); // 繪製可換行選項文字。
    textStyle(NORMAL); // 還原一般文字樣式。
  } // 結束六個選項的逐一繪製。
} // 結束選項卡片繪製。

function drawDraggingCard() { // 繪製正在被滑鼠或觸控拖曳的浮動卡片。
  if (draggingIndex < 0) return; // 若沒有有效拖曳選項則不繼續繪製。
  const source = getOptionRect(draggingIndex); // 取得原始選項卡片尺寸。
  const cardX = dragX - source.w / 2; // 計算浮動卡片左上角 X 座標。
  const cardY = dragY - source.h / 2; // 計算浮動卡片左上角 Y 座標。
  drawPanel(cardX, cardY, source.w, source.h, "#CFE3FF", "#2D73C5"); // 繪製半透明感的拖曳卡片。
  fill("#174E8C"); // 設定浮動文字顏色。
  noStroke(); // 移除浮動文字外框。
  textStyle(BOLD); // 設定浮動文字為粗體。
  textSize(constrain(width * 0.017, 12, 17)); // 設定浮動文字大小。
  drawWrappedText(QUESTIONS[currentQuestion].options[draggingIndex], cardX + 12, cardY + 8, source.w - 24, source.h - 16, 1.15); // 繪製浮動選項文字。
  textStyle(NORMAL); // 還原一般文字樣式。
} // 結束浮動卡片繪製。

function drawQuizControls() { // 繪製作答導覽與交卷按鈕。
  const buttonGap = layout.gap; // 讀取按鈕之間的間距。
  const buttonWidth = (layout.contentWidth - buttonGap * 2) / 3; // 將控制列平均分成三個按鈕。
  layout.previousButton = { x: layout.margin, y: layout.controlsY, w: buttonWidth, h: layout.controlsHeight }; // 記錄上一題按鈕範圍。
  layout.nextButton = { x: layout.margin + buttonWidth + buttonGap, y: layout.controlsY, w: buttonWidth, h: layout.controlsHeight }; // 記錄下一題按鈕範圍。
  layout.submitButton = { x: layout.margin + (buttonWidth + buttonGap) * 2, y: layout.controlsY, w: buttonWidth, h: layout.controlsHeight }; // 記錄交卷按鈕範圍。
  drawButton(layout.previousButton, "上一題", currentQuestion > 0, "#E8EEF5", "#33536F"); // 繪製上一題按鈕。
  drawButton(layout.nextButton, "下一題", currentQuestion < QUESTIONS.length - 1, "#E8EEF5", "#33536F"); // 繪製下一題按鈕。
  drawButton(layout.submitButton, "交卷看成績", true, "#2D6A9F", "#FFFFFF"); // 繪製交卷看成績按鈕。
} // 結束控制按鈕繪製。

function drawStatusMessage() { // 繪製底部的操作狀態訊息。
  fill("#52657A"); // 設定狀態文字顏色。
  noStroke(); // 移除狀態文字外框。
  textSize(constrain(width * 0.016, 11, 15)); // 設定狀態文字大小。
  text(statusMessage, layout.margin, min(height - 18, layout.controlsY + layout.controlsHeight + 18)); // 顯示目前操作訊息。
} // 結束狀態訊息繪製。

function drawResultScreen() { // 繪製交卷後的總成績與逐題結果。
  const resultY = layout.questionY; // 將結果內容從原本題目區開始繪製。
  const resultHeight = min(height - resultY - layout.margin, 430); // 限制結果卡片不超出畫布。
  drawPanel(layout.margin, resultY, layout.contentWidth, resultHeight, "#FFFFFF", "#D5E1EE"); // 繪製結果主卡片。
  fill("#183153"); // 設定結果標題顏色。
  noStroke(); // 移除結果標題外框。
  textStyle(BOLD); // 設定結果標題為粗體。
  textSize(constrain(width * 0.025, 18, 27)); // 設定結果標題字級。
  text("測驗完成！總成績 " + nf(score / QUESTIONS.length * 100, 0, 0) + "%", layout.margin + 16, resultY + 14); // 顯示總成績。
  textStyle(NORMAL); // 還原一般文字樣式。
  fill(score / QUESTIONS.length > 0.6 ? "#237A49" : "#9A5A18"); // 依成績設定鼓勵文字顏色。
  textSize(constrain(width * 0.017, 12, 16)); // 設定鼓勵文字大小。
  const encouragement = score / QUESTIONS.length > 0.6 ? "太棒了！成績高於 60%，彩帶已經出現！" : "再複習一次 p5.js 基礎觀念，你一定會進步！"; // 組合成績鼓勵文字。
  text(encouragement, layout.margin + 16, resultY + 49); // 顯示成績鼓勵文字。
  const listTop = resultY + 80; // 設定逐題結果清單起點。
  const rowGap = 6; // 設定逐題結果之間的間距。
  const rowHeight = min(48, max(34, (resultHeight - 96 - rowGap * (QUESTIONS.length - 1)) / QUESTIONS.length)); // 依畫面高度計算結果列高度。
  for (let questionIndex = 0; questionIndex < QUESTIONS.length; questionIndex++) { // 逐一繪製六題結果。
    const rowY = listTop + questionIndex * (rowHeight + rowGap); // 計算目前結果列的 Y 座標。
    const correct = selectedAnswers[questionIndex] === QUESTIONS[questionIndex].answer; // 判斷目前題目是否答對。
    drawPanel(layout.margin + 12, rowY, layout.contentWidth - 24, rowHeight, correct ? "#ECF8F0" : "#FFF0F0", correct ? "#A7DDB8" : "#E4B1B1"); // 依答題結果繪製結果列。
    fill(correct ? "#237A49" : "#A33D3D"); // 設定答對或答錯的文字顏色。
    noStroke(); // 移除結果文字外框。
    textStyle(BOLD); // 設定題號與結果為粗體。
    textSize(constrain(width * 0.015, 11, 15)); // 設定結果文字大小。
    text("第 " + (questionIndex + 1) + " 題  " + (correct ? "答對" : "答錯"), layout.margin + 24, rowY + rowHeight / 2 - 8); // 顯示題號與答題結果。
    textStyle(NORMAL); // 還原一般文字樣式。
    fill("#42566A"); // 設定答案說明文字顏色。
    const answerText = selectedAnswers[questionIndex] >= 0 ? QUESTIONS[questionIndex].options[selectedAnswers[questionIndex]] : "未作答"; // 取得使用者答案文字。
    const correctText = QUESTIONS[questionIndex].options[QUESTIONS[questionIndex].answer]; // 取得正確答案文字。
    text("你的答案：" + answerText + "｜正確答案：" + correctText, layout.margin + 124, rowY + rowHeight / 2 - 8); // 顯示使用者答案與正確答案。
  } // 結束六題結果的逐一繪製。
  const restartButton = { x: layout.margin, y: min(height - layout.margin - 52, resultY + resultHeight + layout.gap), w: layout.contentWidth, h: 48 }; // 計算重新測驗按鈕範圍。
  layout.restartButton = restartButton; // 保存重新測驗按鈕範圍以便處理點擊。
  drawButton(restartButton, "重新測驗", true, "#2D6A9F", "#FFFFFF"); // 繪製重新測驗按鈕。
} // 結束結果畫面繪製。

function drawConfetti() { // 更新並繪製高分彩帶效果。
  if (confettiParticles.length === 0) { createConfetti(); } // 第一次進入高分結果頁時建立彩帶粒子。
  noStroke(); // 彩帶不需要外框。
  for (const particle of confettiParticles) { // 逐一更新與繪製彩帶粒子。
    particle.y += particle.speed; // 讓彩帶向下移動。
    particle.x += sin(frameCount * 0.03 + particle.swing) * 0.8; // 讓彩帶產生左右擺動。
    particle.angle += particle.spin; // 更新彩帶旋轉角度。
    if (particle.y > height + 20) { particle.y = -20; particle.x = random(width); } // 彩帶離開底部後從頂端重新出現。
    push(); // 保存目前繪圖狀態。
    translate(particle.x, particle.y); // 移動到彩帶位置。
    rotate(particle.angle); // 旋轉彩帶。
    fill(particle.colorValue); // 套用彩帶顏色。
    rectMode(CENTER); // 將彩帶矩形以中心點繪製。
    rect(0, 0, particle.w, particle.h, 2); // 繪製一片彩帶。
    pop(); // 還原繪圖狀態。
  } // 結束彩帶粒子的逐一處理。
} // 結束彩帶繪製。

function createConfetti() { // 建立高分時使用的彩帶粒子。
  const colors = ["#F94144", "#F9C74F", "#43AA8B", "#577590", "#F3722C", "#9B5DE5"]; // 設定彩帶顏色集合。
  for (let index = 0; index < 100; index++) { // 建立一百片彩帶。
    confettiParticles.push({ x: random(width), y: random(-height, 0), w: random(5, 11), h: random(9, 20), speed: random(1.5, 4.5), swing: random(TWO_PI), angle: random(TWO_PI), spin: random(-0.08, 0.08), colorValue: random(colors) }); // 儲存每片彩帶的初始資料。
  } // 結束彩帶建立迴圈。
} // 結束彩帶粒子建立。

function drawPanel(x, y, panelWidth, panelHeight, fillColor, strokeColor) { // 繪製統一風格的圓角面板。
  push(); // 保存面板繪圖狀態。
  fill(fillColor); // 設定面板填色。
  stroke(strokeColor); // 設定面板外框色。
  strokeWeight(1); // 設定面板外框寬度。
  rect(x, y, panelWidth, panelHeight, 12); // 繪製圓角矩形面板。
  pop(); // 還原面板繪圖狀態。
} // 結束面板繪製。

function drawButton(button, label, enabled, fillColor, textColor) { // 繪製可啟用或停用的按鈕。
  const actualFill = enabled ? fillColor : "#D8E0E8"; // 依啟用狀態決定按鈕填色。
  const actualText = enabled ? textColor : "#8A98A6"; // 依啟用狀態決定按鈕文字色。
  drawPanel(button.x, button.y, button.w, button.h, actualFill, enabled ? fillColor : "#D8E0E8"); // 繪製按鈕外觀。
  fill(actualText); // 設定按鈕文字顏色。
  noStroke(); // 移除按鈕文字外框。
  textAlign(CENTER, CENTER); // 將按鈕文字置中。
  textStyle(BOLD); // 設定按鈕文字為粗體。
  textSize(constrain(width * 0.016, 12, 16)); // 設定按鈕文字大小。
  text(label, button.x + button.w / 2, button.y + button.h / 2); // 繪製按鈕文字。
  textStyle(NORMAL); // 還原一般文字樣式。
  textAlign(LEFT, TOP); // 還原一般文字對齊方式。
} // 結束按鈕繪製。

function getOptionRect(optionIndex) { // 取得六個選項中指定選項的響應式矩形。
  const columns = width >= 620 ? 3 : 2; // 寬螢幕使用三欄，小螢幕使用兩欄。
  const rows = Math.ceil(QUESTIONS[currentQuestion].options.length / columns); // 計算選項列數。
  const optionGap = layout.gap; // 讀取選項間距。
  const optionWidth = (layout.contentWidth - optionGap * (columns - 1)) / columns; // 計算每欄選項寬度。
  const optionHeight = (layout.optionsHeight - optionGap * (rows - 1)) / rows; // 計算每列選項高度。
  const column = optionIndex % columns; // 計算選項所在欄位。
  const row = floor(optionIndex / columns); // 計算選項所在列位。
  return { x: layout.margin + column * (optionWidth + optionGap), y: layout.optionsY + row * (optionHeight + optionGap), w: optionWidth, h: optionHeight }; // 回傳選項矩形資料。
} // 結束選項矩形計算。

function drawWrappedText(message, x, y, maxWidth, maxHeight, lineHeightScale) { // 繪製超出寬度時會自動換行的文字。
  const words = message.split(""); // 將中英文混合文字拆成可逐字測量的陣列。
  let currentLine = ""; // 儲存目前正在組合的文字列。
  let currentY = y; // 儲存目前文字列的 Y 座標。
  const lineHeight = textSize() * lineHeightScale; // 依目前字級計算行高。
  for (const character of words) { // 逐字組合文字。
    const trialLine = currentLine + character; // 試算加入下一個字元後的文字列。
    if (textWidth(trialLine) > maxWidth && currentLine.length > 0) { text(currentLine, x, currentY); currentLine = character; currentY += lineHeight; } else { currentLine = trialLine; } // 超出寬度時換行。
    if (currentY + lineHeight > y + maxHeight) { break; } // 超過卡片高度時停止繪製。
  } // 結束逐字換行處理。
  if (currentLine.length > 0 && currentY + lineHeight <= y + maxHeight) { text(currentLine, x, currentY); } // 繪製最後一列文字。
} // 結束換行文字繪製。

function getOptionAt(x, y) { // 找出指定座標下的選項編號。
  for (let optionIndex = 0; optionIndex < QUESTIONS[currentQuestion].options.length; optionIndex++) { // 逐一檢查六個選項。
    const card = getOptionRect(optionIndex); // 取得目前選項矩形。
    if (isInside(x, y, card)) { return optionIndex; } // 若座標落在選項內則回傳選項編號。
  } // 結束選項檢查。
  return -1; // 沒有落在任何選項時回傳無效編號。
} // 結束選項座標判斷。

function isInside(x, y, rectangle) { // 判斷座標是否位於指定矩形內。
  return x >= rectangle.x && x <= rectangle.x + rectangle.w && y >= rectangle.y && y <= rectangle.y + rectangle.h; // 回傳矩形範圍判斷結果。
} // 結束矩形範圍判斷。

function handlePointerPressed(x, y) { // 統一處理滑鼠與觸控開始事件。
  if (submitted) { // 若已經交卷則只處理重新測驗按鈕。
    if (layout.restartButton && isInside(x, y, layout.restartButton)) { resetQuiz(); } // 點擊重新測驗按鈕時重設測驗。
    return; // 交卷後不再啟動選項拖曳。
  } // 結束交卷後的點擊處理。
  if (layout.previousButton && isInside(x, y, layout.previousButton)) { changeQuestion(-1); return; } // 點擊上一題按鈕時切換上一題。
  if (layout.nextButton && isInside(x, y, layout.nextButton)) { changeQuestion(1); return; } // 點擊下一題按鈕時切換下一題。
  if (layout.submitButton && isInside(x, y, layout.submitButton)) { submitQuiz(); return; } // 點擊交卷按鈕時檢查並顯示成績。
  const optionIndex = getOptionAt(x, y); // 取得被按下的選項編號。
  if (optionIndex >= 0) { dragging = true; draggingIndex = optionIndex; dragX = x; dragY = y; } // 按住選項時啟動拖曳。
} // 結束統一指標按下處理。

function handlePointerMoved(x, y) { // 統一處理滑鼠與觸控移動事件。
  if (!dragging) return; // 沒有拖曳時不更新浮動卡片。
  dragX = x; // 更新浮動卡片 X 座標。
  dragY = y; // 更新浮動卡片 Y 座標。
} // 結束統一指標移動處理。

function handlePointerReleased(x, y) { // 統一處理滑鼠與觸控放開事件。
  if (!dragging) return; // 沒有拖曳時不需要處理放開事件。
  const droppedInAnswer = isInside(x, y, { x: layout.margin, y: layout.answerY, w: layout.contentWidth, h: layout.answerHeight }); // 判斷選項是否放在答案區。
  if (droppedInAnswer) { selectedAnswers[currentQuestion] = draggingIndex; statusMessage = "已放入答案區，可以繼續作答或修改答案。"; } else { statusMessage = "請把選項放到黃色答案區。"; } // 依放置位置更新答案或提示。
  dragging = false; // 結束拖曳狀態。
  draggingIndex = -1; // 清除正在拖曳的選項編號。
} // 結束統一指標放開處理。

function changeQuestion(direction) { // 切換上一題或下一題。
  const targetQuestion = currentQuestion + direction; // 計算預計前往的題目編號。
  if (targetQuestion < 0 || targetQuestion >= QUESTIONS.length) { statusMessage = "已經到達測驗邊界。"; return; } // 超出題目範圍時顯示提示。
  if (direction > 0 && selectedAnswers[currentQuestion] < 0) { statusMessage = "請先把選項拖到答案區，再前往下一題。"; return; } // 前往下一題前要求目前題目已作答。
  currentQuestion = targetQuestion; // 更新目前題目編號。
  statusMessage = selectedAnswers[currentQuestion] >= 0 ? "這一題已有答案，也可以重新拖曳修改。" : "請將下方選項拖曳到答案區。"; // 更新切換後的操作提示。
} // 結束題目切換。

function submitQuiz() { // 處理交卷並計算總成績。
  const unanswered = selectedAnswers.filter(function(answer) { return answer < 0; }).length; // 計算尚未作答的題數。
  if (unanswered > 0) { statusMessage = "還有 " + unanswered + " 題未完成，請完成六題後再交卷。"; return; } // 未完成全部題目時不顯示成績。
  score = 0; // 重新計算答對題數。
  for (let questionIndex = 0; questionIndex < QUESTIONS.length; questionIndex++) { if (selectedAnswers[questionIndex] === QUESTIONS[questionIndex].answer) { score++; } } // 逐題比對答案並累計分數。
  submitted = true; // 只有成功交卷後才切換到成績畫面。
  confettiParticles = []; // 交卷時清空舊彩帶以便重新建立動畫。
} // 結束交卷處理。

function resetQuiz() { // 將測驗恢復到初始狀態。
  currentQuestion = 0; // 回到第一題。
  selectedAnswers = Array(QUESTIONS.length).fill(-1); // 清除所有已選答案。
  submitted = false; // 隱藏成績畫面。
  score = 0; // 清除舊分數。
  statusMessage = "請將下方選項拖曳到答案區。"; // 還原初始操作提示。
  confettiParticles = []; // 清除畫布上的彩帶。
} // 結束測驗重設。

function mousePressed() { // 處理滑鼠按下事件。
  if (pointerDown) return false; // 避免觸控事件與滑鼠事件重複觸發。
  pointerDown = true; // 記錄指標已按下。
  handlePointerPressed(mouseX, mouseY); // 將滑鼠座標交給統一處理函式。
  return false; // 阻止瀏覽器預設拖曳行為。
} // 結束滑鼠按下事件。

function mouseDragged() { // 處理滑鼠拖曳事件。
  if (!pointerDown) return false; // 沒有按住時不處理拖曳。
  handlePointerMoved(mouseX, mouseY); // 將滑鼠座標交給統一移動函式。
  return false; // 阻止瀏覽器預設拖曳行為。
} // 結束滑鼠拖曳事件。

function mouseReleased() { // 處理滑鼠放開事件。
  if (!pointerDown) return false; // 沒有按住時不處理放開。
  handlePointerReleased(mouseX, mouseY); // 將滑鼠座標交給統一放開函式。
  pointerDown = false; // 清除指標按住狀態。
  return false; // 阻止瀏覽器預設行為。
} // 結束滑鼠放開事件。

function touchStarted() { // 處理觸控開始事件。
  if (pointerDown) return false; // 避免觸控與模擬滑鼠事件重複觸發。
  pointerDown = true; // 記錄觸控已按下。
  handlePointerPressed(mouseX, mouseY); // 將觸控座標交給統一處理函式。
  return false; // 阻止觸控時網頁捲動。
} // 結束觸控開始事件。

function touchMoved() { // 處理觸控移動事件。
  if (!pointerDown) return false; // 沒有按住時不處理觸控移動。
  handlePointerMoved(mouseX, mouseY); // 將觸控座標交給統一移動函式。
  return false; // 阻止觸控拖曳造成網頁捲動。
} // 結束觸控移動事件。

function touchEnded() { // 處理觸控結束事件。
  if (!pointerDown) return false; // 沒有按住時不處理觸控結束。
  handlePointerReleased(mouseX, mouseY); // 將觸控座標交給統一放開函式。
  pointerDown = false; // 清除觸控按住狀態。
  return false; // 阻止觸控結束時的瀏覽器預設行為。
} // 結束觸控結束事件。

function windowResized() { // 處理瀏覽器視窗尺寸改變事件。
  resizeCanvas(windowWidth, windowHeight); // 將畫布調整為最新的瀏覽器視窗大小。
  calculateLayout(); // 重新計算所有元件的位置與尺寸。
} // 結束視窗尺寸改變事件。
