let quests = []; 
let currentIndex = 0; 
let timeLeft = 0; 
let timerInterval = null;
let level = localStorage.getItem('lvl')? parseInt(localStorage.getItem('lvl')) : 1;
let exp = localStorage.getItem('exp')? parseInt(localStorage.getItem('exp')) : 0;

window.onload = () => { 
    updateUI(); 
    typeWriter("ادخلي مهام اليوم، وسيقوم النظام بترتيبها.", "system-msg"); 
}

function typeWriter(text, elementId, speed=40){
    let i=0; 
    document.getElementById(elementId).innerHTML="";
    function typing(){ 
        if(i<text.length){ 
            document.getElementById(elementId).innerHTML+=text.charAt(i); 
            i++; 
            setTimeout(typing, speed);
        } 
    }
    typing();
}

function updateUI(){
    document.getElementById('level').innerText = `LVL ${level}`;
    document.getElementById('exp-fill').style.width = `${exp}%`;
    let ranks = ["E-RANK","D-RANK","C-RANK","B-RANK","A-RANK","S-RANK"];
    document.getElementById('rank').innerText = ranks[Math.floor(level/5)] || "S-RANK";
}

function startSystem(){
    const input=document.getElementById('taskInput').value;
    if(!input.trim()) return;
    document.getElementById('arise-sound').play().catch(()=>{});
    quests=input.split(',').map(t=>t.trim()).filter(t=>t);
    typeWriter(`[SYSTEM] تم رصد ${quests.length} مهمة. ابدأي.`, "system-msg");
    let list=document.getElementById('quest-list'); 
    list.innerHTML='';
    quests.forEach((q,i)=>{
        list.innerHTML+=`<div class="quest">[Quest ${i+1}] ${q}</div>`;
    });
    document.getElementById('input-area').classList.add('hidden');
    currentIndex=0; 
    startQuest();
}

function startQuest(){
    if(currentIndex>=quests.length){
        exp+=25; 
        if(exp>=100){
            level++; exp=0; 
            typeWriter(`[SYSTEM] LEVEL UP! انتي الآن LVL ${level}`, "system-msg");
        } else {
            typeWriter(`[SYSTEM] كل المهام اكتملت! +25 EXP`, "system-msg");
        }
        localStorage.setItem('lvl', level); 
        localStorage.setItem('exp', exp); 
        updateUI();
        document.getElementById('timer-box').classList.add('hidden');
        document.getElementById('input-area').classList.remove('hidden');
        return;
    }
    
    document.getElementById('timer-box').classList.remove('hidden');
    document.getElementById('current-task').innerText='مهمة: '+quests[currentIndex];
    
    // التعديل هنا
    const customCheck = document.getElementById('customTimeCheck');
    const customInput = document.getElementById('customTime');
    let minutes = 25;

    if(customCheck && customCheck.checked && customInput && customInput.value > 0){
        minutes = parseInt(customInput.value);
    } else {
        minutes = currentIndex === 0 ? 25 : 45;
    }

    timeLeft = minutes * 60;
    
    updateTimer(); 
    clearInterval(timerInterval);
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
    exp+=10; 
    if(exp>=100){level++; exp=0;} 
    localStorage.setItem('lvl', level); 
    localStorage.setItem('exp', exp); 
    updateUI(); 
    document.getElementById('alarm').play().catch(()=>{}); 
    currentIndex++; 
    startQuest(); 
}

function failQuest(){ 
    clearInterval(timerInterval); 
    document.getElementById('timer-box').classList.add('hidden'); 
    document.getElementById('penalty-box').classList.remove('hidden'); 
}

function closePenalty(){ 
    document.getElementById('penalty-box').classList.add('hidden'); 
    startQuest(); 
}

function toggleTime(){
  let check = document.getElementById("customTimeCheck");
  let div = document.getElementById("customTimeDiv");
  if(check && div){
      div.style.display = check.checked ? "block" : "none";
  }
}
// مواد حسب السنة
const subjectsByYear = {
    "اولى ابتدائي": ["عربي", "انجليزي", "رياضة", "دين"],
    "تانية ابتدائي": ["عربي", "انجليزي", "رياضة", "دين"],
    "تالتة ابتدائي": ["عربي", "انجليزي", "رياضة", "دين"],
    "رابعة ابتدائي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين", "ICT"],
    "خامسة ابتدائي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين", "ICT"],
    "ساتة ابتدائي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين", "ICT"],
    "اولى اعدادي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين"],
    "تانية اعدادي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين"],
    "تالتة اعدادي": ["عربي", "انجليزي", "رياضة", "علوم", "دراسات", "دين"],
    "اولى ثانوي": ["عربي", "انجليزي", "رياضة", "فيزياء", "كيمياء", "احياء", "تاريخ", "جغرافيا", "فلسفة"],
    "تانية ثانوي": ["عربي", "انجليزي", "فيزياء", "كيمياء", "احياء", "رياضة", "تاريخ", "جغرافيا"],
    "تالتة ثانوي": ["عربي", "انجليزي", "فيزياء", "كيمياء", "احياء", "رياضة بحتة", "رياضة تطبيقية", "تاريخ", "جغرافيا", "فلسفة", "علم نفس"]
};

function updateSubjects(){
    const year = document.getElementById('year').value;
    const subjectSelect = document.getElementById('subject');
    
    subjectSelect.innerHTML = '<option value="">اختر المادة</option>';
    
    if(subjectsByYear[year]){
        subjectsByYear[year].forEach(sub => {
            let opt = document.createElement('option');
            opt.value = sub;
            opt.textContent = sub;
            subjectSelect.appendChild(opt);
        });
    }
}