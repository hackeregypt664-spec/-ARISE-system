let quests = []; 
let currentIndex = 0; 
let timeLeft = 0; 
let timerInterval = null;
let restInterval = null;
let level = localStorage.getItem('lvl')? parseInt(localStorage.getItem('lvl')) : 1;
let exp = localStorage.getItem('exp')? parseInt(localStorage.getItem('exp')) : 0;
let selectedYear = localStorage.getItem('selectedYear') || "";
let questTimes = [];

window.onload = () => { 
    updateUI(); 
    typeWriter("اختار مرحلتك الدراسية الأول.", "system-msg");
    const check = document.getElementById('customTimeCheck');
    const div = document.getElementById('customTimeDiv');
    if(check){
        check.addEventListener('change', ()=>{
            div.style.display = check.checked ? 'block' : 'none';
        });
    }
    if(selectedYear){
        showSubjects(selectedYear);
    }
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

async function startSystem(){
    const input=document.getElementById('taskInput').value;
    if(!input.trim()) return;
    
    document.getElementById('arise-sound')?.play().catch(()=>{});
    
    let subjects = input.split(',').map(t=>t.trim()).filter(t=>t);
    quests = subjects;

    const customCheck = document.getElementById('customTimeCheck');
    const customInput = document.getElementById('customTime');
    let customVal = null;
    if(customCheck && customCheck.checked){
        let v = parseInt(customInput.value);
        if(!isNaN(v) && v > 0 && v <= 300){
            customVal = v;
        } else {
            alert("حط وقت صحيح من 1 لـ 300 دقيقة");
            return;
        }
    }

    try {
        let res = await fetch('/api/time', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ subjects: subjects, year: selectedYear, custom_time: customVal })
        });
        let data = await res.json();
        questTimes = data.quests;
        typeWriter(`[SYSTEM] تم رصد ${quests.length} مهمة. اجمالي الوقت ${data.total_time} دقيقة.`, "system-msg");
    } catch(e){
        let fallbackTime = customVal || 45;
        questTimes = subjects.map(s => ({subject: s, time: fallbackTime}));
        typeWriter(`[SYSTEM] تم رصد ${quests.length} مهمة (offline - ${fallbackTime} دقيقة).`, "system-msg");
    }

    let list=document.getElementById('quest-list'); list.innerHTML='';
    questTimes.forEach((q,i)=>{ list.innerHTML+=`<div class="quest">[Quest ${i+1}] ${q.subject} - ${q.time} min</div>`; });
    
    document.getElementById('input-area').classList.add('hidden');
    document.getElementById('custom-area').classList.add('hidden');
    document.getElementById('year-select-area').classList.add('hidden');
    currentIndex=0; 
    startQuest();
}

function startQuest(){
    clearInterval(timerInterval);
    clearInterval(restInterval);
    if(currentIndex>=quests.length){
        exp+=25; if(exp>=100){ level++; exp=0; typeWriter(`[SYSTEM] LEVEL UP! LVL ${level}`, "system-msg");} 
        else { typeWriter(`[SYSTEM] كل المهام اكتملت! +25 EXP`, "system-msg"); }
        localStorage.setItem('lvl', level); localStorage.setItem('exp', exp); updateUI();
        document.getElementById('timer-box').classList.add('hidden');
        document.getElementById('rest-box').classList.add('hidden');
        document.getElementById('input-area').classList.remove('hidden'); 
        document.getElementById('custom-area').classList.remove('hidden');
        document.getElementById('year-select-area').classList.remove('hidden');
        return;
    }
    document.getElementById('timer-box').classList.remove('hidden');
    document.getElementById('rest-box').classList.add('hidden');
    document.getElementById('current-task').innerText='مهمة: '+ questTimes[currentIndex].subject;
    
    let minutes = questTimes[currentIndex].time;
    timeLeft = minutes * 60;
    updateTimer(); 
    timerInterval=setInterval(()=>{ 
        timeLeft--; 
        updateTimer(); 
        if(timeLeft<=0){failQuest();} 
    },1000);
}

function updateTimer(){ 
    let m=Math.floor(timeLeft/60); 
    let s=timeLeft%60; 
    document.getElementById('timer').innerText=`${m}:${s<10?'0'+s:s}`; 
}

function completeQuest(){ 
    clearInterval(timerInterval);
    if(timeLeft > 10){
        let restMins = Math.floor(timeLeft / 60);
        typeWriter(`[SYSTEM] خلصت بدري! فاضل ${restMins} دقيقة راحة.`, "system-msg");
        document.getElementById('timer-box').classList.add('hidden');
        document.getElementById('rest-box').classList.remove('hidden');
        startRestTimer(timeLeft);
    } else {
        exp+=10; 
        if(exp>=100){level++; exp=0;} 
        localStorage.setItem('lvl', level); 
        localStorage.setItem('exp', exp); 
        updateUI(); 
        document.getElementById('alarm')?.play().catch(()=>{}); 
        currentIndex++; 
        startQuest();
    }
}

function startRestTimer(restTime){
    let restLeft = restTime;
    document.getElementById('rest-timer').innerText = `${Math.floor(restLeft/60)}:${restLeft%60<10?'0':''}${restLeft%60}`;
    clearInterval(restInterval);
    restInterval = setInterval(()=>{
        restLeft--;
        document.getElementById('rest-timer').innerText = `${Math.floor(restLeft/60)}:${restLeft%60<10?'0':''}${restLeft%60}`;
        if(restLeft <= 0){ clearInterval(restInterval); skipRest(); }
    },1000);
}

function skipRest(){
    clearInterval(restInterval);
    document.getElementById('rest-box').classList.add('hidden');
    exp+=15;
    if(exp>=100){level++; exp=0;} 
    localStorage.setItem('lvl', level); 
    localStorage.setItem('exp', exp); 
    updateUI();
    currentIndex++;
    startQuest();
}

function failQuest(){ 
    clearInterval(timerInterval); 
    document.getElementById('timer-box').classList.add('hidden'); 
    document.getElementById('penalty-box').classList.remove('hidden'); 
}
function closePenalty(){ document.getElementById('penalty-box').classList.add('hidden'); startQuest(); }

const subjectsByYear = {
    "1 ثانوي": ["عربي", "انجليزي", "رياضة", "فيزياء", "كيمياء", "احياء", "تاريخ", "جغرافيا", "فلسفة", "دين"],
    "2 ثانوي علمي": ["عربي", "انجليزي", "رياضة", "فيزياء", "كيمياء", "احياء", "الماني/فرنساوي"],
    "2 ثانوي ادبي": ["عربي", "انجليزي", "تاريخ", "جغرافيا", "علم نفس", "فلسفة", "الماني/فرنساوي"],
    "3 ثانوي علمي علوم": ["عربي", "انجليزي", "فيزياء", "كيمياء", "احياء", "جيولوجيا"],
    "3 ثانوي علمي رياضة": ["عربي", "انجليزي", "فيزياء", "كيمياء", "رياضة بحتة", "تطبيقية"],
    "3 ثانوي ادبي": ["عربي", "انجليزي", "تاريخ", "جغرافيا", "علم نفس", "فلسفة"],
    "1 اعدادي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين", "حاسب"],
    "2 اعدادي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين", "حاسب"],
    "3 اعدادي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين", "حاسب"],
    "1 ابتدائي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين"],
    "2 ابتدائي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين"],
    "3 ابتدائي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين"],
    "4 ابتدائي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين", "حاسب", "مهارات"],
    "5 ابتدائي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين", "حاسب", "مهارات"],
    "6 ابتدائي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين", "حاسب", "مهارات"],
    "1 ابتدائي ازهر": ["عربي", "انجليزي", "رياضة", "قرآن كريم", "دين"],
    "1 اعدادي ازهر": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "قرآن كريم", "تجويد", "أصول دين", "فقه", "نحو وصرف"],
    "3 اعدادي ازهر": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "قرآن كريم", "تجويد", "أصول دين", "فقه", "نحو وصرف"],
    "3 ثانوي ازهر علمي": ["عربي", "انجليزي", "فيزياء", "كيمياء", "احياء", "رياضة بحتة", "تطبيقية", "قرآن كريم", "تفسير", "حديث", "توحيد", "فقه"],
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