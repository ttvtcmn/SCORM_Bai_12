/**
 * Bộ mở rộng đầy đủ các dạng tương tác sư phạm K-12:
 * 2. Chọn nhiều đáp án đúng (Multi Choice)
 * 3. Đúng / Sai (True / False)
 * 4. Kéo thả vào vùng đích (Drag & Drop Target)
 * 5. Nối từ / Ghép cặp (Matching)
 * 6. Sắp xếp thứ tự (Ordering / Sequence)
 */

(function() {
    function initWidgets(IP) {
        if (!IP || !IP.prototype) return;

        // 1. CHỌN NHIỀU ĐÁP ÁN ĐÚNG (MULTI-CHOICE)
        IP.prototype.renderMultiChoice = function(container, data) {
            const options = data.options || ["Lực có đơn vị là N", "Khối lượng có đơn vị là kg", "Vận tốc là đại lượng vô hướng", "Gia tốc có đơn vị là m/s²"];
            const correctIndices = data.correct_indices || [0, 1, 3];
            const question = data.question || "Chọn TẤT CẢ các nhận định ĐÚNG sau đây:";

            let optionsHtml = '';
            options.forEach((opt, idx) => {
                optionsHtml += `
                    <label class="multi-opt-label" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: white; border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
                        <input type="checkbox" class="multi-chk" value="${idx}" style="width: 20px; height: 20px; accent-color: #6366f1;">
                        <span style="font-weight: 600; font-size: 1rem;">${opt}</span>
                    </label>
                `;
            });

            container.innerHTML = `
                <div style="background: #f8fafc; border: 2px solid #e0e7ff; border-radius: 18px; padding: 22px;">
                    <div style="font-size: 1.15rem; font-weight: 800; color: #1e1b4b; margin-bottom: 6px;">
                        ☑️ CHỌN NHIỀU ĐÁP ÁN ĐÚNG
                    </div>
                    <div style="color: #475569; font-size: 1rem; margin-bottom: 16px; font-weight: 700;">${question}</div>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                        ${optionsHtml}
                    </div>
                    <button class="btn-nav" onclick="(window.player || player).checkMultiChoice(${JSON.stringify(correctIndices)})">Nộp bài kiểm tra</button>
                    <div id="multi-feedback" style="margin-top: 12px; font-weight: 700;"></div>
                </div>
            `;
            this.renderMathInElement(container);
        };

        IP.prototype.checkMultiChoice = function(correctIndices) {
            const checkboxes = document.querySelectorAll('.multi-chk');
            const selected = [];
            checkboxes.forEach(c => {
                if (c.checked) selected.push(parseInt(c.value));
                c.disabled = true;
            });

            const isMatch = selected.length === correctIndices.length && selected.every(val => correctIndices.includes(val));
            const fb = document.getElementById('multi-feedback');

            if (isMatch) {
                fb.style.color = '#10b981';
                fb.innerHTML = '🎉 Chính xác tuyệt đối! Em đã chọn đầy đủ các đáp án đúng (+25 Điểm).';
                this.addScore(25);
            } else {
                fb.style.color = '#ef4444';
                fb.innerHTML = `❌ Chưa chính xác. Các đáp án đúng là: ${correctIndices.map(i => String.fromCharCode(65 + i)).join(', ')}.`;
            }
            this.renderMathInElement(fb);
        };

        // 2. ĐÚNG / SAI (TRUE / FALSE)
        IP.prototype.renderTrueFalse = function(container, data) {
            const items = data.items || [
                { statement: "Lực là nguyên nhân duy nhất duy trì chuyển động.", answer: false },
                { statement: "Khi hợp lực bằng 0, vật chuyển động thẳng đều hoặc đứng yên.", answer: true },
                { statement: "Quán tính của vật chỉ phụ thuộc vào khối lượng của nó.", answer: true }
            ];

            let rowsHtml = '';
            items.forEach((it, idx) => {
                rowsHtml += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: white; border: 1.5px solid #e2e8f0; border-radius: 12px; gap: 12px;">
                        <div style="flex: 1; font-weight: 600; font-size: 0.95rem;">${it.statement}</div>
                        <div style="display: flex; gap: 16px;">
                            <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 700; color: #059669;">
                                <input type="radio" name="tf_${idx}" value="true" style="accent-color: #10b981;"> Đúng
                            </label>
                            <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 700; color: #dc2626;">
                                <input type="radio" name="tf_${idx}" value="false" style="accent-color: #ef4444;"> Sai
                            </label>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = `
                <div style="background: #f8fafc; border: 2px solid #e0e7ff; border-radius: 18px; padding: 22px;">
                    <div style="font-size: 1.15rem; font-weight: 800; color: #1e1b4b; margin-bottom: 14px;">
                        ⚖️ THỬ THÁCH ĐÚNG / SAI (TRUE / FALSE)
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                        ${rowsHtml}
                    </div>
                    <button class="btn-nav" onclick="(window.player || player).checkTrueFalse(${JSON.stringify(items.map(i => i.answer))})">Kiểm tra kết quả</button>
                    <div id="tf-feedback" style="margin-top: 12px; font-weight: 700;"></div>
                </div>
            `;
            this.renderMathInElement(container);
        };

        IP.prototype.checkTrueFalse = function(correctAnswers) {
            let correctCount = 0;
            correctAnswers.forEach((ans, idx) => {
                const radios = document.querySelectorAll(`input[name="tf_${idx}"]`);
                radios.forEach(r => {
                    if (r.checked && (r.value === 'true') === ans) {
                        correctCount++;
                    }
                    r.disabled = true;
                });
            });

            const fb = document.getElementById('tf-feedback');
            const total = correctAnswers.length;
            if (correctCount === total) {
                fb.style.color = '#10b981';
                fb.innerHTML = `🎉 Tuyệt đối chính xác! Đúng ${correctCount}/${total} câu (+25 Điểm).`;
                this.addScore(25);
            } else {
                fb.style.color = '#f59e0b';
                fb.innerHTML = `Em đã trả lời đúng ${correctCount}/${total} nhận định. Hãy cố gắng hơn nhé!`;
                this.addScore(Math.round((correctCount / total) * 15));
            }
            this.renderMathInElement(fb);
        };

        // 3. SẮP XẾP THỨ TỰ (ORDERING / SEQUENCE)
        IP.prototype.renderOrdering = function(container, data) {
            const items = data.items || [
                "1. Chuẩn bị dụng cụ thí nghiệm xe lăn và máng nghiêng",
                "2. Đặt xe lăn ở đỉnh máng và thả cho chuyển động",
                "3. Đo thời gian và quãng đường chuyển động",
                "4. Tính toán gia tốc và rút ra định luật"
            ];

            // Trộn ngẫu nhiên
            const shuffled = [...items].map((text, origIdx) => ({ text, origIdx })).sort(() => Math.random() - 0.5);

            let listHtml = '';
            shuffled.forEach((it, idx) => {
                listHtml += `
                    <div class="order-item" data-orig-idx="${it.origIdx}" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: white; border: 2px solid #cbd5e1; border-radius: 12px; font-weight: 600;">
                        <span>${it.text}</span>
                        <div style="display: flex; gap: 6px;">
                            <button type="button" onclick="(window.player || player).moveOrderItem(${idx}, -1)" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer; background: #f1f5f9;">▲</button>
                            <button type="button" onclick="(window.player || player).moveOrderItem(${idx}, 1)" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer; background: #f1f5f9;">▼</button>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = `
                <div style="background: #f8fafc; border: 2px solid #e0e7ff; border-radius: 18px; padding: 22px;">
                    <div style="font-size: 1.15rem; font-weight: 800; color: #1e1b4b; margin-bottom: 8px;">
                        🔢 SẮP XẾP THEO ĐÚNG THỨ TỰ QUY TRÌNH
                    </div>
                    <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 16px;">
                        Dùng nút ▲ và ▼ để di chuyển các bước về đúng trình tự từ đầu đến cuối:
                    </p>
                    <div id="ordering-list" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                        ${listHtml}
                    </div>
                    <button class="btn-nav" onclick="(window.player || player).checkOrdering()">Xác nhận thứ tự</button>
                    <div id="order-feedback" style="margin-top: 12px; font-weight: 700;"></div>
                </div>
            `;
            this.currentOrderItems = shuffled;
            this.renderMathInElement(container);
        };

        IP.prototype.moveOrderItem = function(index, direction) {
            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= this.currentOrderItems.length) return;

            const temp = this.currentOrderItems[index];
            this.currentOrderItems[index] = this.currentOrderItems[newIndex];
            this.currentOrderItems[newIndex] = temp;

            // Re-render list
            const listContainer = document.getElementById('ordering-list');
            let listHtml = '';
            this.currentOrderItems.forEach((it, idx) => {
                listHtml += `
                    <div class="order-item" data-orig-idx="${it.origIdx}" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: white; border: 2px solid #cbd5e1; border-radius: 12px; font-weight: 600;">
                        <span>${it.text}</span>
                        <div style="display: flex; gap: 6px;">
                            <button type="button" onclick="(window.player || player).moveOrderItem(${idx}, -1)" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer; background: #f1f5f9;">▲</button>
                            <button type="button" onclick="(window.player || player).moveOrderItem(${idx}, 1)" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer; background: #f1f5f9;">▼</button>
                        </div>
                    </div>
                `;
            });
            listContainer.innerHTML = listHtml;
            this.renderMathInElement(listContainer);
        };

        IP.prototype.checkOrdering = function() {
            let isCorrect = true;
            this.currentOrderItems.forEach((it, idx) => {
                if (it.origIdx !== idx) isCorrect = false;
            });

            const fb = document.getElementById('order-feedback');
            if (isCorrect) {
                fb.style.color = '#10b981';
                fb.innerHTML = '🎉 Tuyệt vời! Em đã sắp xếp chính xác 100% thứ tự các bước (+25 Điểm).';
                this.addScore(25);
            } else {
                fb.style.color = '#ef4444';
                fb.innerHTML = '❌ Thứ tự chưa chính xác. Em hãy quan sát kỹ và thử sắp xếp lại nhé!';
            }
            this.renderMathInElement(fb);
        };

        // 4. KÉO THẢ VÀO VÙNG ĐÍCH (DRAG & DROP TARGET)
        IP.prototype.renderDragDrop = function(container, data) {
            const targets = data.targets || [
                { label: "Đơn vị của Lực", expected: "Niutơn (N)" },
                { label: "Đơn vị của Khối lượng", expected: "Kilôgam (kg)" }
            ];
            const draggableWords = data.words || targets.map(t => t.expected);
            this.currentDragWords = draggableWords;
            this.currentTargets = targets;

            let targetBoxes = '';
            targets.forEach((tg, idx) => {
                targetBoxes += `
                    <div style="padding: 14px; background: white; border: 2px dashed #818cf8; border-radius: 14px; min-height: 80px; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 0.85rem; font-weight: 700; color: #6366f1; margin-bottom: 6px;">🎯 ${tg.label}</div>
                        <div class="drop-zone" data-expected="${tg.expected}" id="dropzone_${idx}" 
                             onclick="(window.player || player).assignWordToZone(${idx})"
                             ondragover="event.preventDefault(); this.style.borderColor='#3b82f6'; this.style.background='#eff6ff';"
                             ondragleave="this.style.borderColor=this.dataset.currentWord ? '#3b82f6' : '#cbd5e1'; this.style.background=this.dataset.currentWord ? '#dbeafe' : '#f8fafc';"
                             ondrop="event.preventDefault(); (window.player || player).handleDropZone(${idx}, event);"
                             style="padding: 8px 12px; background: #f8fafc; border-radius: 8px; font-weight: 700; color: #1e1b4b; min-height: 36px; border: 1px solid #cbd5e1; cursor: pointer; transition: all 0.2s;">
                            [Bấm chọn từ bên dưới để thả vào đây]
                        </div>
                    </div>
                `;
            });

            let wordChips = '';
            draggableWords.forEach((w, wIdx) => {
                wordChips += `
                    <button type="button" class="word-chip" id="word_chip_${wIdx}" 
                            draggable="true"
                            ondragstart="event.dataTransfer.setData('text/plain', '${wIdx}'); (window.player || player).selectWordChip(${wIdx}, this);"
                            onclick="(window.player || player).selectWordChip(${wIdx}, this)"
                            style="padding: 8px 16px; background: #e0e7ff; color: #4338ca; border: 2px solid #c7d2fe; border-radius: 20px; font-weight: 700; cursor: pointer; transition: all 0.2s; user-select: none;">
                        ${w}
                    </button>
                `;
            });

            container.innerHTML = `
                <div style="background: #f8fafc; border: 2px solid #e0e7ff; border-radius: 18px; padding: 22px;">
                    <div style="font-size: 1.15rem; font-weight: 800; color: #1e1b4b; margin-bottom: 12px;">
                        🎯 KÉO THẢ VÀO VÙNG ĐÍCH TƯƠNG ỨNG
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px;">
                        ${targetBoxes}
                    </div>
                    <div style="font-size: 0.9rem; font-weight: 700; color: #475569; margin-bottom: 8px;">Ngân hàng từ khóa:</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px;">
                        ${wordChips}
                    </div>
                    <button class="btn-nav" onclick="(window.player || player).checkDragDrop()">Kiểm tra kết quả</button>
                    <div id="drag-feedback" style="margin-top: 12px; font-weight: 700;"></div>
                </div>
            `;
            this.selectedWord = null;
            this.renderMathInElement(container);
        };

        IP.prototype.selectWordChip = function(wIdx, el) {
            document.querySelectorAll('.word-chip').forEach(c => c.style.borderColor = '#c7d2fe');
            if (el) el.style.borderColor = '#4338ca';
            if (typeof wIdx === 'number' && this.currentDragWords) {
                this.selectedWord = this.currentDragWords[wIdx];
            } else {
                this.selectedWord = wIdx;
            }
        };

        IP.prototype.assignWordToZone = function(zoneIdx) {
            const zone = document.getElementById(`dropzone_${zoneIdx}`);
            if (!zone) return;

            if (!this.selectedWord) {
                // Nếu ô đã có từ khóa, bấm vào để gỡ ra giúp học sinh dễ dàng chọn lại
                if (zone.dataset.currentWord) {
                    zone.innerHTML = '[Bấm chọn từ bên dưới để thả vào đây]';
                    zone.dataset.currentWord = '';
                    zone.style.background = '#f8fafc';
                    zone.style.borderColor = '#cbd5e1';
                    return;
                }
                alert("Vui lòng nhấp chọn 1 từ khóa ở bên dưới trước!");
                return;
            }

            // Gán nội dung và render công thức toán học KaTeX lập tức
            zone.innerHTML = this.selectedWord;
            zone.dataset.currentWord = this.selectedWord;
            zone.style.background = '#dbeafe';
            zone.style.borderColor = '#3b82f6';
            this.renderMathInElement(zone);
        };

        IP.prototype.handleDropZone = function(zoneIdx, event) {
            const wIdxStr = event.dataTransfer ? event.dataTransfer.getData('text/plain') : '';
            if (wIdxStr !== '' && this.currentDragWords) {
                const wIdx = parseInt(wIdxStr, 10);
                if (!isNaN(wIdx) && this.currentDragWords[wIdx]) {
                    this.selectedWord = this.currentDragWords[wIdx];
                }
            }
            this.assignWordToZone(zoneIdx);
        };

        IP.prototype.checkDragDrop = function() {
            const zones = document.querySelectorAll('.drop-zone');
            let allCorrect = true;
            const normalize = s => (s || '').trim().replace(/\s+/g, ' ');

            zones.forEach(z => {
                const expected = normalize(z.dataset.expected);
                const current = normalize(z.dataset.currentWord);
                if (current && current === expected) {
                    z.style.background = '#d1fae5';
                    z.style.borderColor = '#10b981';
                    z.style.color = '#065f46';
                } else {
                    z.style.background = '#fee2e2';
                    z.style.borderColor = '#ef4444';
                    allCorrect = false;
                }
            });

            const fb = document.getElementById('drag-feedback');
            if (allCorrect) {
                fb.style.color = '#10b981';
                fb.innerHTML = '🎉 Rất xuất sắc! Em đã xếp đúng tất cả vị trí (+25 Điểm).';
                this.addScore(25);
            } else {
                fb.style.color = '#ef4444';
                fb.innerHTML = '❌ Có ô chứa từ chưa chính xác. Em hãy thử lại nhé!';
            }
            this.renderMathInElement(fb);
        };

        // 5. NỐI TỪ / GHÉP CẶP KHÁI NIỆM & ĐỊNH NGHĨA (MATCHING)
        IP.prototype.renderMatching = function(container, data) {
            const pairs = data.pairs || [
                { left: "Đại lượng Lực (F)", right: "Đơn vị Niutơn (N)" },
                { left: "Đại lượng Gia tốc (a)", right: "Đơn vị m/s²" },
                { left: "Đại lượng Khối lượng (m)", right: "Đơn vị Kilôgam (kg)" }
            ];

            // Trộn ngẫu nhiên cột phải
            const shuffledRight = pairs.map((p, idx) => ({ text: p.right, origIdx: idx })).sort(() => Math.random() - 0.5);

            let leftHtml = '';
            pairs.forEach((p, idx) => {
                leftHtml += `
                    <button type="button" class="match-left-btn" id="match_l_${idx}" onclick="(window.player || player).selectMatchLeft(${idx})"
                            style="width: 100%; text-align: left; padding: 12px 16px; background: white; border: 2px solid #cbd5e1; border-radius: 12px; font-weight: 700; color: #1e1b4b; cursor: pointer; transition: all 0.2s;">
                        🔵 ${p.left}
                    </button>
                `;
            });

            let rightHtml = '';
            shuffledRight.forEach((r, rIdx) => {
                rightHtml += `
                    <button type="button" class="match-right-btn" id="match_r_${rIdx}" data-orig-idx="${r.origIdx}" onclick="(window.player || player).selectMatchRight(${rIdx})"
                            style="width: 100%; text-align: left; padding: 12px 16px; background: white; border: 2px solid #cbd5e1; border-radius: 12px; font-weight: 700; color: #1e1b4b; cursor: pointer; transition: all 0.2s;">
                        🟢 ${r.text}
                    </button>
                `;
            });

            container.innerHTML = `
                <div style="background: #f8fafc; border: 2px solid #e0e7ff; border-radius: 18px; padding: 22px;">
                    <div style="font-size: 1.15rem; font-weight: 800; color: #1e1b4b; margin-bottom: 6px;">
                        🧩 NỐI CẶP KHÁI NIỆM TƯƠNG ỨNG
                    </div>
                    <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 16px;">
                        Nhấp chọn một mục ở Cột Trái, sau đó nhấp chọn mục tương ứng ở Cột Phải để ghép cặp:
                    </p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <div style="font-size: 0.82rem; font-weight: 800; color: #4338ca; text-transform: uppercase;">CỘT A (KHÁI NIỆM)</div>
                            ${leftHtml}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <div style="font-size: 0.82rem; font-weight: 800; color: #059669; text-transform: uppercase;">CỘT B (ĐỊNH NGHĨA / ĐƠN VỊ)</div>
                            ${rightHtml}
                        </div>
                    </div>
                    <div id="match-connections-list" style="margin-bottom: 14px; display: flex; flex-wrap: wrap; gap: 8px;"></div>
                    <button class="btn-nav" onclick="(window.player || player).checkMatching(${pairs.length})">Kiểm tra kết quả</button>
                    <div id="match-feedback" style="margin-top: 12px; font-weight: 700;"></div>
                </div>
            `;

            this.matchingState = {
                pairs: pairs,
                shuffledRight: shuffledRight,
                selectedLeft: null,
                userMatches: {} // leftIdx -> rightOrigIdx
            };
            this.renderMathInElement(container);
        };

        IP.prototype.selectMatchLeft = function(lIdx) {
            this.matchingState.selectedLeft = lIdx;
            document.querySelectorAll('.match-left-btn').forEach(b => b.style.borderColor = '#cbd5e1');
            const btn = document.getElementById(`match_l_${lIdx}`);
            if (btn) btn.style.borderColor = '#6366f1';
        };

        IP.prototype.selectMatchRight = function(rIdx) {
            if (this.matchingState.selectedLeft === null) {
                alert("Vui lòng nhấp chọn 1 mục ở Cột Trái trước!");
                return;
            }
            const lIdx = this.matchingState.selectedLeft;
            const rBtn = document.getElementById(`match_r_${rIdx}`);
            const rOrigIdx = parseInt(rBtn.dataset.origIdx);
            this.matchingState.userMatches[lIdx] = rOrigIdx;

            // Đánh dấu nối thành công
            const leftText = this.matchingState.pairs[lIdx].left;
            const rightText = this.matchingState.shuffledRight[rIdx].text;

            const list = document.getElementById('match-connections-list');
            let chip = document.getElementById(`match_chip_${lIdx}`);
            if (!chip) {
                chip = document.createElement('div');
                chip.id = `match_chip_${lIdx}`;
                chip.style.cssText = "padding: 6px 12px; background: #e0e7ff; color: #3730a3; border-radius: 8px; font-weight: 700; font-size: 0.82rem; border: 1px solid #c7d2fe;";
                list.appendChild(chip);
            }
            chip.innerHTML = `🔗 ${leftText} ⟷ ${rightText}`;
            this.renderMathInElement(chip);

            // Reset selection
            this.matchingState.selectedLeft = null;
            document.querySelectorAll('.match-left-btn').forEach(b => b.style.borderColor = '#cbd5e1');
        };

        IP.prototype.checkMatching = function(totalPairs) {
            const matches = this.matchingState.userMatches;
            let correctCount = 0;
            for (let l = 0; l < totalPairs; l++) {
                if (matches[l] !== undefined && matches[l] === l) {
                    correctCount++;
                }
            }

            const fb = document.getElementById('match-feedback');
            if (correctCount === totalPairs) {
                fb.style.color = '#10b981';
                fb.innerHTML = `🎉 Tuyệt đối chính xác! Em đã ghép đúng toàn bộ ${correctCount}/${totalPairs} cặp (+25 Điểm).`;
                this.addScore(25);
            } else {
                fb.style.color = '#ef4444';
                fb.innerHTML = `Em đã ghép đúng ${correctCount}/${totalPairs} cặp. Hãy xem lại và ghép lại những cặp chưa đúng nhé!`;
            }
            this.renderMathInElement(fb);
        };

        // HÀM HỖ TRỢ RENDER TOÁN HỌC KATEX
        IP.prototype.renderMathInElement = function(el) {
            const target = el || document.body;
            const doRender = () => {
                if (typeof window.renderMathInElement === 'function') {
                    try {
                        window.renderMathInElement(target, {
                            delimiters: [
                                {left: '$$', right: '$$', display: true},
                                {left: '$', right: '$', display: false},
                                {left: '\\(', right: '\\)', display: false},
                                {left: '\\[', right: '\\]', display: true}
                            ],
                            throwOnError: false
                        });
                    } catch (e) {
                        console.warn("KaTeX error:", e);
                    }
                }
            };

            if (typeof window.renderMathInElement === 'function') {
                doRender();
            } else {
                // Hỗ trợ khi thư viện KaTeX đang tải bất đồng bộ (defer)
                setTimeout(doRender, 150);
                setTimeout(doRender, 600);
            }
        };
    }

    if (typeof window !== 'undefined') {
        window.initInteractiveWidgets = initWidgets;
        if (typeof window.InteractivePlayer !== 'undefined') {
            initWidgets(window.InteractivePlayer);
        } else if (typeof InteractivePlayer !== 'undefined') {
            initWidgets(InteractivePlayer);
        }
    }
})();
