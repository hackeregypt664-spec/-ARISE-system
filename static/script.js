// اظهار خانة تحديد الوقت
document.addEventListener('DOMContentLoaded', ()=>{
    const check = document.getElementById('customTimeCheck');
    const div = document.getElementById('customTimeDiv');
    if(check){
        check.addEventListener('change', ()=>{
            div.style.display = check.checked ? 'block' : 'none';
        });
    }
});
let quests = []; 
let currentIndex = 0; 
let timeLeft = 0; 
let timerInterval = null;
let level = localStorage.getItem('lvl')? parseInt(localStorage.getItem('lvl')) : 1;
let exp = localStorage.getItem('exp')? parseInt(localStorage.getItem('exp')) : 0;
let selectedYear = localStorage.getItem('selectedYear') || "";

window.onload = () => { 
    updateUI();
        document.getElementById('year-select-area')?.classList.add('hidden');
        document.getElementById('input-area')?.classList.remove('hidden');
        typeWriter("اختاري مرحلتك الدراسية الأول.", "system-msg"); 
    }

function typeWriter(text, elementId, speed=40){
    let i=0; 
    let el = document.getElementById(elementId);
    if(!el) return;
    el.innerHTML="";
    function typing(){ if(i<text.length){ el.innerHTML+=text.charAt(i); i++; setTimeout(typing, speed);} }
    typing();
}

function updateUI(){
    document.getElementById('level').innerText = `LVL ${level}`;
    document.getElementById('exp-fill').style.width = `${exp}%`;
    let ranks = ["E-RANK","D-RANK","C-RANK","B-RANK","A-RANK","S-RANK"];
    let rankEl = document.getElementById('rank');
    if(rankEl) rankEl.innerText = ranks[Math.floor(level/5)] || "S-RANK";
}

function startSystem(){
    const input=document.getElementById('taskInput').value;
    if(!input.trim()) return;
    document.getElementById('arise-sound')?.play().catch(()=>{});
    quests=input.split(',').map(t=>t.trim()).filter(t=>t);
    typeWriter(`[SYSTEM] تم رصد ${quests.length} مهمة. ابدأي.`, "system-msg");
    let list=document.getElementById('quest-list'); list.innerHTML='';
    quests.forEach((q,i)=>{ list.innerHTML+=`<div class="quest">[Quest ${i+1}] ${q}</div>`; });
    document.getElementById('input-area').classList.add('hidden');
    currentIndex=0; startQuest();
}

function startQuest(){
    if(currentIndex>=quests.length){
        exp+=25; if(exp>=100){ level++; exp=0; typeWriter(`[SYSTEM] LEVEL UP! LVL ${level}`, "system-msg");} 
        else { typeWriter(`[SYSTEM] كل المهام اكتملت! +25 EXP`, "system-msg"); }
        localStorage.setItem('lvl', level); localStorage.setItem('exp', exp); updateUI();
        document.getElementById('timer-box').classList.add('hidden');
        document.getElementById('input-area').classList.remove('hidden'); return;
    }
    document.getElementById('timer-box').classList.remove('hidden');
    document.getElementById('rest-box').classList.add('hidden');
    document.getElementById('current-task').innerText='مهمة: '+quests[currentIndex];
    
    // هنا بقى بياخد الوقت اللي انت محدده
    const customCheck = document.getElementById('customTimeCheck');
    const customInput = document.getElementById('customTime');
    let minutes = 25;
    if(customCheck && customCheck.checked && customInput && customInput.value > 0){
        minutes = parseInt(customInput.value);
    } else {
        minutes = currentIndex === 0 ? 25 : 45;
    }
    
    timeLeft = minutes * 60;
    totalQuestTime = timeLeft; // نحفظ الوقت الأصلي عشان نحسب الراحة
    updateTimer(); 
    clearInterval(timerInterval);
    timerInterval=setInterval(()=>{ timeLeft--; updateTimer(); if(timeLeft<=0){failQuest();} },1000);
}

function updateTimer(){ let m=Math.floor(timeLeft/60); let s=timeLeft%60; document.getElementById('timer').innerText=`${m}:${s<10?'0'+s:s}`; }
function completeQuest(){ clearInterval(timerInterval); exp+=10; if(exp>=100){level++; exp=0;} localStorage.setItem('lvl', level); localStorage.setItem('exp', exp); updateUI(); document.getElementById('alarm')?.play().catch(()=>{}); currentIndex++; startQuest(); }
function failQuest(){ clearInterval(timerInterval); document.getElementById('timer-box').classList.add('hidden'); document.getElementById('penalty-box').classList.remove('hidden'); }
function closePenalty(){ document.getElementById('penalty-box').classList.add('hidden'); startQuest(); }
function toggleTime(){ let check = document.getElementById("customTimeCheck"); let div = document.getElementById("customTimeDiv"); if(check && div){ div.style.display = check.checked ? "block" : "none"; } }

const subjectsByYear = {
    // ثانوي عام
    "1 ثانوي": ["عربي", "انجليزي", "رياضة", "فيزياء", "كيمياء", "احياء", "تاريخ", "جغرافيا", "فلسفة", "دين"],
    "2 ثانوي علمي": ["عربي", "انجليزي", "رياضة", "فيزياء", "كيمياء", "احياء", "الماني/فرنساوي"],
    "2 ثانوي ادبي": ["عربي", "انجليزي", "تاريخ", "جغرافيا", "علم نفس", "فلسفة", "الماني/فرنساوي"],
    "3 ثانوي علمي علوم": ["عربي", "انجليزي", "فيزياء", "كيمياء", "احياء", "جيولوجيا"],
    "3 ثانوي علمي رياضة": ["عربي", "انجليزي", "فيزياء", "كيمياء", "رياضة بحتة", "تطبيقية"],
    "3 ثانوي ادبي": ["عربي", "انجليزي", "تاريخ", "جغرافيا", "علم نفس", "فلسفة"],

    // اعدادي وابتدائي عام
    "1 اعدادي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين", "حاسب"],
    "2 اعدادي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين", "حاسب"],
    "3 اعدادي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين", "حاسب"],
    "1 ابتدائي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين"],
    "2 ابتدائي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين"],
    "3 ابتدائي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين"],
    "4 ابتدائي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين", "حاسب", "مهارات"],
    "5 ابتدائي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين", "حاسب", "مهارات"],
    "6 ابتدائي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين", "حاسب", "مهارات"],

    // === الأزهر ===
    "1 ابتدائي ازهر": ["عربي", "انجليزي", "رياضة", "قرآن كريم", "دين"],
    "2 ابتدائي ازهر": ["عربي", "انجليزي", "رياضة", "قرآن كريم", "دين"],
    "3 ابتدائي ازهر": ["عربي", "انجليزي", "رياضة", "قرآن كريم", "دين"],
    "4 ابتدائي ازهر": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "قرآن كريم", "دين"],
    "5 ابتدائي ازهر": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "قرآن كريم", "دين"],
    "6 ابتدائي ازهر": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "قرآن كريم", "دين"],

    "1 اعدادي ازهر": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "قرآن كريم", "تجويد", "أصول دين", "فقه", "نحو وصرف"],
    "2 اعدادي ازهر": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "قرآن كريم", "تجويد", "أصول دين", "فقه", "نحو وصرف"],
    "3 اعدادي ازهر": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "قرآن كريم", "تجويد", "أصول دين", "فقه", "نحو وصرف"],

    "1 ثانوي ازهر علمي": ["عربي", "انجليزي", "فيزياء", "كيمياء", "احياء", "رياضة", "قرآن كريم", "تفسير", "حديث", "توحيد", "فقه"],
    "2 ثانوي ازهر علمي": ["عربي", "انجليزي", "فيزياء", "كيمياء", "احياء", "رياضة", "قرآن كريم", "تفسير", "حديث", "توحيد", "فقه"],
    "3 ثانوي ازهر علمي": ["عربي", "انجليزي", "فيزياء", "كيمياء", "احياء", "رياضة بحتة", "تطبيقية", "قرآن كريم", "تفسير", "حديث", "توحيد", "فقه"],

    "1 ثانوي ازهر ادبي": ["عربي", "انجليزي", "تاريخ", "جغرافيا", "منطق", "قرآن كريم", "تفسير", "حديث", "توحيد", "فقه", "نحو", "صرف", "بلاغة"],
    "2 ثانوي ازهر ادبي": ["عربي", "انجليزي", "تاريخ", "جغرافيا", "منطق", "قرآن كريم", "تفسير", "حديث", "توحيد", "فقه", "نحو", "صرف", "بلاغة"],
    "3 ثانوي ازهر ادبي": ["عربي", "انجليزي", "تاريخ", "جغرافيا", "فلسفة", "منطق", "قرآن كريم", "تفسير", "حديث", "توحيد", "فقه", "نحو", "صرف", "بلاغة", "ادب ونصوص"]
};
function selectYear(year){
    selectedYear = year;
    localStorage.setItem('selectedYear', year);
    showSubjects(year);
}
function showSubjects(year){
    const container = document.getElementById('subjects-container');
    if(!container) return;
    container.innerHTML = `<h3>مواد ${year}:</h3>`;
    subjectsByYear[year].forEach(sub => {
        container.innerHTML += `<label class="subject-check"><input type="checkbox" value="${sub}" class="subjectBox"> ${sub}</label>`;
    });
    container.innerHTML += `<button onclick="confirmSubjects()">تأكيد المواد</button>`;
}
function confirmSubjects(){
    const checked = document.querySelectorAll('.subjectBox:checked');
    let selected = Array.from(checked).map(c => c.value);
    if(selected.length === 0){ alert("اختار مادة واحدة على الأقل"); return; }
    localStorage.setItem('mySubjects', JSON.stringify(selected));
    document.getElementById('year-select-area').classList.add('hidden');
    document.getElementById('input-area').classList.remove('hidden');
    document.getElementById('taskInput').value = selected.join(', ');
    typeWriter(`تمام! اخترت مواد ${selectedYear}.`, "system-msg");
}
function changeYear(){
    localStorage.removeItem('selectedYear');
    localStorage.removeItem('mySubjects');
    document.getElementById('year-select-area').classList.remove('hidden');
    document.getElementById('input-area').classList.add('hidden');
    document.getElementById('quest-list').innerHTML = '';
}