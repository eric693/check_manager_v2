// salary.js - 薪資管理前端邏輯（完整版 v2.0 - 含多語言支援）

// ==================== 檢查依賴 ====================
if (typeof callApifetch !== 'function') {
    console.error('❌ callApifetch 函數未定義，請確認 script.js 已正確載入');
}

// ==================== 初始化薪資頁面 ====================

/**
 * ✅ 初始化薪資頁面（完整版 - 含多語言）
 */
async function initSalaryTab() {
    try {
        console.log('🎯 開始初始化薪資頁面（完整版 v2.0）');
        
        // 步驟 1：驗證 Session
        console.log('📡 正在驗證 Session...');
        const session = await callApifetch("checkSession");
        
        if (!session.ok || !session.user) {
            console.error('❌ Session 驗證失敗:', session);
            showNotification(t('PLEASE_RELOGIN'), 'error');
            return;
        }
        
        console.log('✅ Session 驗證成功');
        console.log('👤 使用者:', session.user.name);
        console.log('🔐 權限:', session.user.dept);
        console.log('📌 員工ID:', session.user.userId);
        
        // 步驟 2：設定當前月份
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        console.log('📅 當前月份:', currentMonth);
        
        const employeeSalaryMonth = document.getElementById('employee-salary-month');
        if (employeeSalaryMonth) {
            employeeSalaryMonth.value = currentMonth;
        }
        
        // 步驟 3：載入薪資資料
        console.log('💰 開始載入薪資資料...');
        await loadCurrentEmployeeSalary();
        
        console.log('📋 開始載入薪資歷史...');
        await loadSalaryHistory();
        
        // 步驟 4：綁定事件（管理員才需要）
        if (session.user.dept === "管理員") {
            console.log('🔧 綁定管理員功能...');
            bindSalaryEvents();
        }
        
        console.log('✅ 薪資頁面初始化完成（完整版 v2.0）！');
        
    } catch (error) {
        console.error('❌ 初始化失敗:', error);
        console.error('錯誤堆疊:', error.stack);
        showNotification(t('ERROR_INIT_FAILED', { msg: error.message }), 'error');
    }
}

// ==================== 員工薪資功能 ====================

/**
 * ✅ 載入當前員工的薪資
 */
async function loadCurrentEmployeeSalary() {
    try {
        console.log(`💰 載入員工薪資`);
        
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const loadingEl = document.getElementById('current-salary-loading');
        const emptyEl = document.getElementById('current-salary-empty');
        const contentEl = document.getElementById('current-salary-content');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (emptyEl) emptyEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'none';
        
        const result = await callApifetch(`getMySalary&yearMonth=${currentMonth}`);
        
        console.log('📥 薪資資料回應:', result);
        
        if (loadingEl) loadingEl.style.display = 'none';
        
        if (result.ok && result.data) {
            console.log('✅ 成功載入薪資資料');
            displayEmployeeSalary(result.data);
            if (contentEl) contentEl.style.display = 'block';
        } else {
            console.log(`⚠️ 沒有 ${currentMonth} 的薪資記錄`);
            if (emptyEl) {
                showNoSalaryMessage(currentMonth);
                emptyEl.style.display = 'block';
            }
        }
        
    } catch (error) {
        console.error('❌ 載入失敗:', error);
        const loadingEl = document.getElementById('current-salary-loading');
        const emptyEl = document.getElementById('current-salary-empty');
        if (loadingEl) loadingEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'block';
    }
}

/**
 * ✅ 按月份查詢薪資
 */
async function loadEmployeeSalaryByMonth() {
    const monthInput = document.getElementById('employee-salary-month');
    const yearMonth = monthInput ? monthInput.value : '';
    
    if (!yearMonth) {
        showNotification(t('SALARY_SELECT_MONTH'), 'error');
        return;
    }
    
    const loadingEl = document.getElementById('current-salary-loading');
    const emptyEl = document.getElementById('current-salary-empty');
    const contentEl = document.getElementById('current-salary-content');
    
    if (!loadingEl || !emptyEl || !contentEl) {
        console.warn('薪資顯示元素未找到');
        return;
    }
    
    try {
        console.log(`🔍 查詢 ${yearMonth} 薪資`);
        
        loadingEl.style.display = 'block';
        emptyEl.style.display = 'none';
        contentEl.style.display = 'none';
        
        const res = await callApifetch(`getMySalary&yearMonth=${yearMonth}`);
        
        console.log(`📥 查詢 ${yearMonth} 薪資回應:`, res);
        
        loadingEl.style.display = 'none';
        
        if (res.ok && res.data) {
            console.log(`✅ 找到 ${yearMonth} 的薪資記錄`);
            displayEmployeeSalary(res.data);
            contentEl.style.display = 'block';
        } else {
            console.log(`⚠️ 沒有 ${yearMonth} 的薪資記錄`);
            showNoSalaryMessage(yearMonth);
            emptyEl.style.display = 'block';
        }
        
    } catch (error) {
        console.error(`❌ 載入 ${yearMonth} 薪資失敗:`, error);
        loadingEl.style.display = 'none';
        emptyEl.style.display = 'block';
    }
}

/**
 * ✅ 顯示薪資明細（完整版 - 含多語言）
 */
function displayEmployeeSalary(data) {
    console.log('📊 顯示薪資明細（完整版）:', data);
    
    const safeSet = (id, value) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        } else {
            console.warn(`⚠️ 元素 #${id} 未找到`);
        }
    };
    
    // 應發總額與實發金額
    safeSet('gross-salary', formatCurrency(data['應發總額']));
    safeSet('net-salary', formatCurrency(data['實發金額']));
    
    // ⭐ 計算扣款總額（包含所有扣款）
    const deductions = 
        (parseFloat(data['勞保費']) || 0) + 
        (parseFloat(data['健保費']) || 0) + 
        (parseFloat(data['就業保險費']) || 0) + 
        (parseFloat(data['勞退自提']) || 0) + 
        (parseFloat(data['所得稅']) || 0) +
        (parseFloat(data['請假扣款']) || 0) +
        (parseFloat(data['福利金']) || 0) +
        (parseFloat(data['宿舍費用']) || 0) +
        (parseFloat(data['團保費用']) || 0) +
        (parseFloat(data['其他扣款']) || 0);
    
    safeSet('total-deductions', formatCurrency(deductions));
    
    // ⭐ 應發項目（含所有津貼）
    safeSet('detail-base-salary', formatCurrency(data['基本薪資']));
    safeSet('detail-position-allowance', formatCurrency(data['職務加給'] || 0));
    safeSet('detail-meal-allowance', formatCurrency(data['伙食費'] || 0));
    safeSet('detail-transport-allowance', formatCurrency(data['交通補助'] || 0));
    safeSet('detail-attendance-bonus', formatCurrency(data['全勤獎金'] || 0));
    safeSet('detail-performance-bonus', formatCurrency(data['績效獎金'] || 0));
    safeSet('detail-weekday-overtime', formatCurrency(data['平日加班費']));
    safeSet('detail-restday-overtime', formatCurrency(data['休息日加班費']));
    safeSet('detail-holiday-overtime', formatCurrency(data['國定假日加班費']));
    
    // ⭐ 扣款項目
    safeSet('detail-labor-fee', formatCurrency(data['勞保費']));
    safeSet('detail-health-fee', formatCurrency(data['健保費']));
    safeSet('detail-employment-fee', formatCurrency(data['就業保險費']));
    safeSet('detail-pension-self', formatCurrency(data['勞退自提']));
    safeSet('detail-income-tax', formatCurrency(data['所得稅']));
    safeSet('detail-leave-deduction', formatCurrency(data['請假扣款']));
    
    // ⭐ 其他扣款小計
    const otherDeductions = 
        (parseFloat(data['福利金']) || 0) +
        (parseFloat(data['宿舍費用']) || 0) +
        (parseFloat(data['團保費用']) || 0) +
        (parseFloat(data['其他扣款']) || 0);
    safeSet('detail-other-deductions', formatCurrency(otherDeductions));
    
    // 銀行資訊
    safeSet('detail-bank-name', getBankName(data['銀行代碼']));
    safeSet('detail-bank-account', data['銀行帳號'] || '--');
    
    console.log('✅ 薪資明細顯示完成（完整版）');
}

/**
 * ✅ 載入薪資歷史
 */
async function loadSalaryHistory() {
    const loadingEl = document.getElementById('salary-history-loading');
    const emptyEl = document.getElementById('salary-history-empty');
    const listEl = document.getElementById('salary-history-list');
    
    if (!loadingEl || !emptyEl || !listEl) {
        console.warn('薪資歷史元素未找到');
        return;
    }
    
    try {
        console.log('📋 載入薪資歷史');
        
        loadingEl.style.display = 'block';
        emptyEl.style.display = 'none';
        listEl.innerHTML = '';
        
        const res = await callApifetch('getMySalaryHistory&limit=12');
        
        console.log('📥 薪資歷史回應:', res);
        
        loadingEl.style.display = 'none';
        
        if (res.ok && res.data && res.data.length > 0) {
            console.log(`✅ 找到 ${res.data.length} 筆薪資歷史`);
            res.data.forEach(salary => {
                const item = createSalaryHistoryItem(salary);
                listEl.appendChild(item);
            });
        } else {
            console.log('⚠️ 沒有薪資歷史記錄');
            emptyEl.style.display = 'block';
        }
        
    } catch (error) {
        console.error('❌ 載入薪資歷史失敗:', error);
        loadingEl.style.display = 'none';
        emptyEl.style.display = 'block';
    }
}

/**
 * 建立薪資歷史項目
 */
function createSalaryHistoryItem(salary) {
    const div = document.createElement('div');
    div.className = 'feature-box flex justify-between items-center hover:bg-white/10 transition cursor-pointer';
    
    div.innerHTML = `
        <div>
            <div class="font-semibold text-lg">
                ${salary['年月'] || '--'}
            </div>
            <div class="text-sm text-gray-400 mt-1">
                ${salary['狀態'] || t('SALARY_STATUS_CALCULATED')}
            </div>
        </div>
        <div class="text-right">
            <div class="text-2xl font-bold text-purple-400">
                ${formatCurrency(salary['實發金額'])}
            </div>
            <div class="text-xs text-gray-400 mt-1">
                ${t('SALARY_GROSS')} ${formatCurrency(salary['應發總額'])}
            </div>
        </div>
    `;
    
    return div;
}

/**
 * 顯示無薪資訊息（多語言版本）
 */
function showNoSalaryMessage(month) {
    const emptyEl = document.getElementById('current-salary-empty');
    if (emptyEl) {
        emptyEl.innerHTML = `
            <div class="empty-state-icon">📄</div>
            <div class="empty-state-title">${t('SALARY_NO_RECORD_TITLE')}</div>
            <div class="empty-state-text">
                <p>${t('SALARY_NO_RECORD_TEXT', { month: month })}</p>
                <p style="margin-top: 0.5rem; font-size: 0.875rem;">
                    💡 ${t('SALARY_CONTACT_ADMIN')}
                </p>
            </div>
        `;
    }
}

// ==================== 管理員功能 ====================

/**
 * 綁定表單事件
 */
function bindSalaryEvents() {
    console.log('🔗 綁定薪資表單事件（完整版）');
    
    const configForm = document.getElementById('salary-config-form');
    if (configForm) {
        configForm.addEventListener('submit', handleSalaryConfigSubmit);
        console.log('✅ 薪資設定表單已綁定');
    }
    
    const calculateBtn = document.getElementById('calculate-salary-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', handleSalaryCalculation);
        console.log('✅ 薪資計算按鈕已綁定');
    }
}

/**
 * ✅ 處理薪資設定表單提交（完整版 - 含多語言）
 */
async function handleSalaryConfigSubmit(e) {
    e.preventDefault();
    
    console.log('📝 開始提交薪資設定表單（完整版）');
    
    const safeGetValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };
    
    // 基本資訊
    const employeeId = safeGetValue('config-employee-id');
    const employeeName = safeGetValue('config-employee-name');
    const baseSalary = safeGetValue('config-base-salary');
    
    // ⭐ 固定津貼（6項）
    const positionAllowance = safeGetValue('config-position-allowance') || '0';
    const mealAllowance = safeGetValue('config-meal-allowance') || '0';
    const transportAllowance = safeGetValue('config-transport-allowance') || '0';
    const attendanceBonus = safeGetValue('config-attendance-bonus') || '0';
    const performanceBonus = safeGetValue('config-performance-bonus') || '0';
    const otherAllowances = safeGetValue('config-other-allowances') || '0';
    
    // 法定扣款
    const laborFee = safeGetValue('config-labor-fee') || '0';
    const healthFee = safeGetValue('config-health-fee') || '0';
    const employmentFee = safeGetValue('config-employment-fee') || '0';
    const pensionSelf = safeGetValue('config-pension-self') || '0';
    const incomeTax = safeGetValue('config-income-tax') || '0';
    const pensionSelfRate = safeGetValue('config-pension-rate') || '0';
    
    // ⭐ 其他扣款（4項）
    const welfareFee = safeGetValue('config-welfare-fee') || '0';
    const dormitoryFee = safeGetValue('config-dormitory-fee') || '0';
    const groupInsurance = safeGetValue('config-group-insurance') || '0';
    const otherDeductions = safeGetValue('config-other-deductions') || '0';
    
    // 其他資訊
    const idNumber = safeGetValue('config-id-number');
    const employeeType = safeGetValue('config-employee-type');
    const salaryType = safeGetValue('config-salary-type');
    const bankCode = safeGetValue('config-bank-code');
    const bankAccount = safeGetValue('config-bank-account');
    const hireDate = safeGetValue('config-hire-date');
    const paymentDay = safeGetValue('config-payment-day') || '5';
    const note = safeGetValue('config-note');
    
    if (!employeeId || !employeeName || !baseSalary || parseFloat(baseSalary) <= 0) {
        showNotification(t('SALARY_FILL_REQUIRED'), 'error');
        return;
    }
    
    try {
        showNotification(t('SALARY_SAVING'), 'info');
        
        const queryString = 
            `employeeId=${encodeURIComponent(employeeId)}` +
            `&employeeName=${encodeURIComponent(employeeName)}` +
            `&baseSalary=${encodeURIComponent(baseSalary)}` +
            // ⭐ 固定津貼
            `&positionAllowance=${encodeURIComponent(positionAllowance)}` +
            `&mealAllowance=${encodeURIComponent(mealAllowance)}` +
            `&transportAllowance=${encodeURIComponent(transportAllowance)}` +
            `&attendanceBonus=${encodeURIComponent(attendanceBonus)}` +
            `&performanceBonus=${encodeURIComponent(performanceBonus)}` +
            `&otherAllowances=${encodeURIComponent(otherAllowances)}` +
            // 法定扣款
            `&laborFee=${encodeURIComponent(laborFee)}` +
            `&healthFee=${encodeURIComponent(healthFee)}` +
            `&employmentFee=${encodeURIComponent(employmentFee)}` +
            `&pensionSelf=${encodeURIComponent(pensionSelf)}` +
            `&incomeTax=${encodeURIComponent(incomeTax)}` +
            `&pensionSelfRate=${encodeURIComponent(pensionSelfRate)}` +
            // ⭐ 其他扣款
            `&welfareFee=${encodeURIComponent(welfareFee)}` +
            `&dormitoryFee=${encodeURIComponent(dormitoryFee)}` +
            `&groupInsurance=${encodeURIComponent(groupInsurance)}` +
            `&otherDeductions=${encodeURIComponent(otherDeductions)}` +
            // 其他資訊
            `&idNumber=${encodeURIComponent(idNumber)}` +
            `&employeeType=${encodeURIComponent(employeeType)}` +
            `&salaryType=${encodeURIComponent(salaryType)}` +
            `&bankCode=${encodeURIComponent(bankCode)}` +
            `&bankAccount=${encodeURIComponent(bankAccount)}` +
            `&hireDate=${encodeURIComponent(hireDate)}` +
            `&paymentDay=${encodeURIComponent(paymentDay)}` +
            `&note=${encodeURIComponent(note)}`;
        
        const res = await callApifetch(`setEmployeeSalaryTW&${queryString}`);
        
        if (res.ok) {
            showNotification(t('SALARY_SAVE_SUCCESS'), 'success');
            e.target.reset();
            
            // 重置所有輸入欄位為 0
            const resetFields = [
                'config-position-allowance',
                'config-meal-allowance',
                'config-transport-allowance',
                'config-attendance-bonus',
                'config-performance-bonus',
                'config-other-allowances',
                'config-welfare-fee',
                'config-dormitory-fee',
                'config-group-insurance',
                'config-other-deductions',
                'config-labor-fee',
                'config-health-fee',
                'config-employment-fee',
                'config-pension-self',
                'config-income-tax',
                'config-pension-rate'
            ];
            
            resetFields.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '0';
            });
            
            // 重置試算預覽
            if (typeof setCalculatedValues === 'function') {
                setCalculatedValues(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            }
        } else {
            showNotification(t('SALARY_SAVE_FAILED', { msg: res.msg || res.message }), 'error');
        }
        
    } catch (error) {
        console.error('❌ 設定薪資失敗:', error);
        showNotification(t('SALARY_SAVE_FAILED', { msg: error.message }), 'error');
    }
}

/**
 * ✅ 處理薪資計算（含多語言）
 */
async function handleSalaryCalculation() {
    const employeeIdEl = document.getElementById('calc-employee-id');
    const yearMonthEl = document.getElementById('calc-year-month');
    const resultEl = document.getElementById('salary-calculation-result');
    
    if (!employeeIdEl || !yearMonthEl || !resultEl) return;
    
    const employeeId = employeeIdEl.value.trim();
    const yearMonth = yearMonthEl.value;
    
    if (!employeeId || !yearMonth) {
        showNotification(t('SALARY_CALC_MISSING_PARAMS'), 'error');
        return;
    }
    
    try {
        showNotification(t('SALARY_CALCULATING'), 'info');
        
        const res = await callApifetch(`calculateMonthlySalary&employeeId=${encodeURIComponent(employeeId)}&yearMonth=${encodeURIComponent(yearMonth)}`);
        
        if (res.ok && res.data) {
            displaySalaryCalculation(res.data, resultEl);
            resultEl.style.display = 'block';
            showNotification(t('SALARY_CALC_SUCCESS'), 'success');
            
            if (confirm(t('SALARY_SAVE_CONFIRM'))) {
                await saveSalaryRecord(res.data);
            }
        } else {
            showNotification(t('SALARY_CALC_FAILED', { msg: res.msg }), 'error');
        }
        
    } catch (error) {
        console.error('❌ 計算薪資失敗:', error);
        showNotification(t('SALARY_CALC_FAILED', { msg: error.message }), 'error');
    }
}

/**
 * ✅ 顯示薪資計算結果（完整版 - 含多語言）
 */
function displaySalaryCalculation(data, container) {
    if (!container) return;
    
    // ⭐ 計算扣款總額（包含所有扣款）
    const totalDeductions = 
        (parseFloat(data.laborFee) || 0) + 
        (parseFloat(data.healthFee) || 0) + 
        (parseFloat(data.employmentFee) || 0) + 
        (parseFloat(data.pensionSelf) || 0) + 
        (parseFloat(data.incomeTax) || 0) + 
        (parseFloat(data.leaveDeduction) || 0) +
        (parseFloat(data.welfareFee) || 0) +
        (parseFloat(data.dormitoryFee) || 0) +
        (parseFloat(data.groupInsurance) || 0) +
        (parseFloat(data.otherDeductions) || 0);
    
    container.innerHTML = `
        <div class="calculation-card">
            <h3 class="text-xl font-bold mb-4">
                ${data.employeeName || '--'} - ${data.yearMonth || '--'} ${t('SALARY_CALC_RESULT_TITLE')}
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="info-card" style="background: rgba(34, 197, 94, 0.1);">
                    <div class="info-label">${t('SALARY_GROSS')}</div>
                    <div class="info-value" style="color: #22c55e;">${formatCurrency(data.grossSalary)}</div>
                </div>
                <div class="info-card" style="background: rgba(239, 68, 68, 0.1);">
                    <div class="info-label">${t('SALARY_DEDUCTIONS')}</div>
                    <div class="info-value" style="color: #ef4444;">${formatCurrency(totalDeductions)}</div>
                </div>
                <div class="info-card" style="background: rgba(168, 85, 247, 0.1);">
                    <div class="info-label">${t('SALARY_NET')}</div>
                    <div class="info-value" style="color: #a855f7;">${formatCurrency(data.netSalary)}</div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="calculation-detail">
                    <h4 class="font-semibold mb-3 text-green-400">${t('SALARY_EARNINGS')}</h4>
                    <div class="calculation-row">
                        <span>${t('SALARY_BASE')}</span>
                        <span class="font-mono">${formatCurrency(data.baseSalary)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_POSITION_ALLOWANCE')}</span>
                        <span class="font-mono">${formatCurrency(data.positionAllowance || 0)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_MEAL_ALLOWANCE')}</span>
                        <span class="font-mono">${formatCurrency(data.mealAllowance || 0)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_TRANSPORT_ALLOWANCE')}</span>
                        <span class="font-mono">${formatCurrency(data.transportAllowance || 0)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_ATTENDANCE_BONUS')}</span>
                        <span class="font-mono">${formatCurrency(data.attendanceBonus || 0)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_PERFORMANCE_BONUS')}</span>
                        <span class="font-mono">${formatCurrency(data.performanceBonus || 0)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_WEEKDAY_OT')}</span>
                        <span class="font-mono">${formatCurrency(data.weekdayOvertimePay)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_REST_OT')}</span>
                        <span class="font-mono">${formatCurrency(data.restdayOvertimePay)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_HOLIDAY_OT')}</span>
                        <span class="font-mono">${formatCurrency(data.holidayOvertimePay)}</span>
                    </div>
                    <div class="calculation-row total">
                        <span>${t('SALARY_GROSS')}</span>
                        <span>${formatCurrency(data.grossSalary)}</span>
                    </div>
                </div>
                
                <div class="calculation-detail">
                    <h4 class="font-semibold mb-3 text-red-400">${t('SALARY_DEDUCTIONS_DETAIL')}</h4>
                    <div class="calculation-row">
                        <span>${t('SALARY_LABOR_INS')}</span>
                        <span class="font-mono">${formatCurrency(data.laborFee)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_HEALTH_INS')}</span>
                        <span class="font-mono">${formatCurrency(data.healthFee)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_EMPLOYMENT_INS')}</span>
                        <span class="font-mono">${formatCurrency(data.employmentFee)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_PENSION')}</span>
                        <span class="font-mono">${formatCurrency(data.pensionSelf)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_TAX')}</span>
                        <span class="font-mono">${formatCurrency(data.incomeTax)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_LEAVE_DEDUCT')}</span>
                        <span class="font-mono">${formatCurrency(data.leaveDeduction || 0)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_WELFARE_FEE')}</span>
                        <span class="font-mono">${formatCurrency(data.welfareFee || 0)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_DORMITORY_FEE')}</span>
                        <span class="font-mono">${formatCurrency(data.dormitoryFee || 0)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_GROUP_INSURANCE')}</span>
                        <span class="font-mono">${formatCurrency(data.groupInsurance || 0)}</span>
                    </div>
                    <div class="calculation-row">
                        <span>${t('SALARY_OTHER_DEDUCTIONS')}</span>
                        <span class="font-mono">${formatCurrency(data.otherDeductions || 0)}</span>
                    </div>
                    <div class="calculation-row total">
                        <span>${t('SALARY_NET')}</span>
                        <span>${formatCurrency(data.netSalary)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * ✅ 儲存薪資記錄（含多語言）
 */
async function saveSalaryRecord(data) {
    try {
        showNotification(t('SALARY_RECORD_SAVING'), 'info');
        
        const queryString = 
            `employeeId=${encodeURIComponent(data.employeeId)}` +
            `&employeeName=${encodeURIComponent(data.employeeName)}` +
            `&yearMonth=${encodeURIComponent(data.yearMonth)}` +
            `&baseSalary=${encodeURIComponent(data.baseSalary)}` +
            `&positionAllowance=${encodeURIComponent(data.positionAllowance || 0)}` +
            `&mealAllowance=${encodeURIComponent(data.mealAllowance || 0)}` +
            `&transportAllowance=${encodeURIComponent(data.transportAllowance || 0)}` +
            `&attendanceBonus=${encodeURIComponent(data.attendanceBonus || 0)}` +
            `&performanceBonus=${encodeURIComponent(data.performanceBonus || 0)}` +
            `&weekdayOvertimePay=${encodeURIComponent(data.weekdayOvertimePay || 0)}` +
            `&restdayOvertimePay=${encodeURIComponent(data.restdayOvertimePay || 0)}` +
            `&holidayOvertimePay=${encodeURIComponent(data.holidayOvertimePay || 0)}` +
            `&laborFee=${encodeURIComponent(data.laborFee || 0)}` +
            `&healthFee=${encodeURIComponent(data.healthFee || 0)}` +
            `&employmentFee=${encodeURIComponent(data.employmentFee || 0)}` +
            `&pensionSelf=${encodeURIComponent(data.pensionSelf || 0)}` +
            `&incomeTax=${encodeURIComponent(data.incomeTax || 0)}` +
            `&leaveDeduction=${encodeURIComponent(data.leaveDeduction || 0)}` +
            `&welfareFee=${encodeURIComponent(data.welfareFee || 0)}` +
            `&dormitoryFee=${encodeURIComponent(data.dormitoryFee || 0)}` +
            `&groupInsurance=${encodeURIComponent(data.groupInsurance || 0)}` +
            `&otherDeductions=${encodeURIComponent(data.otherDeductions || 0)}` +
            `&grossSalary=${encodeURIComponent(data.grossSalary)}` +
            `&netSalary=${encodeURIComponent(data.netSalary)}` +
            `&bankCode=${encodeURIComponent(data.bankCode || '')}` +
            `&bankAccount=${encodeURIComponent(data.bankAccount || '')}`;
        
        const res = await callApifetch(`saveMonthlySalary&${queryString}`);
        
        if (res.ok) {
            showNotification(t('SALARY_RECORD_SAVE_SUCCESS'), 'success');
        } else {
            showNotification(t('SALARY_RECORD_SAVE_FAILED', { msg: res.msg }), 'error');
        }
        
    } catch (error) {
        console.error('❌ 儲存薪資單失敗:', error);
        showNotification(t('SALARY_RECORD_SAVE_FAILED', { msg: error.message }), 'error');
    }
}

/**
 * 載入所有員工薪資列表
 */
async function loadAllEmployeeSalaryFromList() {
    const yearMonthEl = document.getElementById('filter-year-month-list');
    const loadingEl = document.getElementById('all-salary-loading-list');
    const listEl = document.getElementById('all-salary-list-content');
    
    if (!yearMonthEl || !loadingEl || !listEl) return;
    
    const yearMonth = yearMonthEl.value;
    
    if (!yearMonth) {
        showNotification(t('SALARY_SELECT_MONTH'), 'error');
        return;
    }
    
    try {
        loadingEl.style.display = 'block';
        listEl.innerHTML = '';
        
        const res = await callApifetch(`getAllMonthlySalary&yearMonth=${encodeURIComponent(yearMonth)}`);
        
        loadingEl.style.display = 'none';
        
        if (res.ok && res.data && res.data.length > 0) {
            res.data.forEach(salary => {
                const item = createAllSalaryItem(salary);
                listEl.appendChild(item);
            });
        } else {
            listEl.innerHTML = `<p class="text-center text-gray-400 py-8">${t('SALARY_NO_HISTORY')}</p>`;
        }
        
    } catch (error) {
        console.error('❌ 載入薪資列表失敗:', error);
        loadingEl.style.display = 'none';
        listEl.innerHTML = `<p class="text-center text-red-400 py-8">${t('ERROR_LOAD_FAILED')}</p>`;
    }
}

/**
 * 建立所有員工薪資項目
 */
function createAllSalaryItem(salary) {
    const div = document.createElement('div');
    div.className = 'feature-box flex justify-between items-center hover:bg-white/10 transition cursor-pointer';
    
    div.innerHTML = `
        <div>
            <div class="font-semibold text-lg">
                ${salary['員工姓名'] || '--'} <span class="text-gray-400 text-sm">(${salary['員工ID'] || '--'})</span>
            </div>
            <div class="text-sm text-gray-400 mt-1">
                ${salary['年月'] || '--'} | ${salary['狀態'] || '--'}
            </div>
        </div>
        <div class="text-right">
            <div class="text-2xl font-bold text-green-400">
                ${formatCurrency(salary['實發金額'])}
            </div>
            <div class="text-xs text-gray-400 mt-1">
                ${getBankName(salary['銀行代碼'])} ${salary['銀行帳號'] || '--'}
            </div>
        </div>
    `;
    
    return div;
}

// ==================== 工具函數 ====================

/**
 * 格式化貨幣
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0';
    const num = parseFloat(amount);
    if (isNaN(num)) return '$0';
    return '$' + num.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * 取得銀行名稱
 */
function getBankName(code) {
    const banks = {
        // 公股銀行
        "004": "臺灣銀行",
        "005": "臺灣土地銀行",
        "006": "合作金庫商業銀行",
        "007": "第一商業銀行",
        "008": "華南商業銀行",
        "009": "彰化商業銀行",
        "011": "上海商業儲蓄銀行",
        "012": "台北富邦商業銀行",
        "013": "國泰世華商業銀行",
        "016": "高雄銀行",
        "017": "兆豐國際商業銀行",
        "050": "臺灣中小企業銀行",
        
        // 民營銀行
        "103": "臺灣新光商業銀行",
        "108": "陽信商業銀行",
        "118": "板信商業銀行",
        "147": "三信商業銀行",
        "803": "聯邦商業銀行",
        "805": "遠東國際商業銀行",
        "806": "元大商業銀行",
        "807": "永豐商業銀行",
        "808": "玉山商業銀行",
        "809": "凱基商業銀行",
        "810": "星展（台灣）商業銀行",
        "812": "台新國際商業銀行",
        "816": "安泰商業銀行",
        "822": "中國信託商業銀行",
        "826": "樂天國際商業銀行",
        
        // 外商銀行
        "052": "渣打國際商業銀行",
        "081": "匯豐（台灣）商業銀行",
        "101": "瑞興商業銀行",
        "102": "華泰商業銀行",
        "815": "日盛國際商業銀行",
        "824": "連線商業銀行",
        
        // 郵局
        "700": "中華郵政"
    };
    
    return banks[code] || t('SALARY_UNKNOWN_BANK');
}

console.log('✅ 薪資管理系統（完整版 v2.0 - 多語言）JS 已載入');
console.log('📋 包含：基本薪資 + 6項津貼 + 10項扣款 + 多語言支援');