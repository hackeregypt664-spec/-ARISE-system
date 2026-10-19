let quests = []; 
let currentIndex = 0; 
let timeLeft = 0; 
let timerInterval = null;
let level = localStorage.getItem('lvl')? parseInt(localStorage.getItem('lvl')) : 1;
let exp = localStorage.getItem('exp')? parseInt(localStorage.getItem('exp')) : 0;

window.onload = () => { updateUI(); typeWriter("ادخلي مهام اليوم، وسيقوم النظام بترتيبها.", "system-msg"); }

function typeWriter(text, elementId, speed=40){
    let i=0; document.getElementById(elementId).innerHTML="";
    function typing(){ if(i<text.length){ document.getElementById(elementId).innerHTML+=text.charAt(i); i++; setTimeout(typing, speed);} }
    typing();
}

function updateUI(){
    document.getElementById('level').innerText = `LVL ${level}`;
    document.getElementById('exp-fill').style.width = `${exp}%`;
    let ranks = ["E-RANK","D-RANK","C-RANK","B-RANK","A-RANK","S-RANK"];
    document.getElementById('rank').innerText = ranks[Math.floor(level/5)] || "S-RANK";
}

// === ده المخ الـ AI اللي هيحدد الوقت ===
function aiEstimateTime(subjectName){
    let name = subjectName.toLowerCase();
    
    // مواد صعبة جدا -> 60 دقيقة
    const hard = ["فيزياء", "كيمياء", "احياء", "رياضة", "ماث", "math", "physics", "chemistry"];
    // مواد متوسطة -> 45 دقيقة
    const medium = ["انجليزي", "تاريخ", "جغرافيا", "فلسفة", "علم نفس", "english"];
    // مواد سهلة -> 25 دقيقة
    const easy = ["عربي", "دين", "دراسات", "علوم"];

    if(hard.some(h => name.includes(h))) return {time: 60, level: "صعب 🔥", color: "#ff4444"};
    if(medium.some(m => name.includes(m))) return {time: 45, level: "متوسط 😐", color: "#ffaa00"};
    if(easy.some(e => name.includes(e))) return {time: 25, level: "سهل 😴", color: "#00ff88"};
    
    // لو مش عارفها -> متوسط
    return {time: 45, level: "متوسط 😐", color: "#ffaa00"};
}

function startSystem(){
    const input=document.getElementById('taskInput').value;
    if(!input.trim()) return;
    document.getElementById('arise-sound').play().catch(()=>{});

    // هنا الـ AI بيحلل كل مادة
    let rawTasks = input.split(',').map(t=>t.trim()).filter(t=>t);
    quests = rawTasks.map(name => {
        let ai = aiEstimateTime(name);
        return { name: name, time: ai.time, level: ai.level, color: ai.color };
    });

    // رتبهم: الصعب الأول (نظام Solo Leveling)
    quests.sort((a,b) => b.time - a.time);

    let total = quests.reduce((s,q)=>s+q.time, 0);
    typeWriter(`[SYSTEM] الـ AI حلل ${quests.length} مهمة. إجمالي ${total} دقيقة. هنبدأ بالأصعب!`, "system-msg");
    
    let list=document.getElementById('quest-list'); list.innerHTML='';
    quests.forEach((q,i)=>{
        list.innerHTML+=`<div class="quest" style="border-left: 4px solid ${q.color}">[Quest ${i+1}] ${q.name} - ${q.level} (${q.time}د)</div>`;
    });
    
    document.getElementById('input-area').classList.add('hidden');
    currentIndex=0; startQuest();
}

function startQuest(){
    if(currentIndex>=quests.length){
        exp+=25; if(exp>=100){level++; exp=0; typeWriter(`[SYSTEM] LEVEL UP! انتي الآن LVL ${level}`, "system-msg");}
        else{typeWriter(`[SYSTEM] كل المهام اكتملت! +25 EXP`, "system-msg");}
        localStorage.setItem('lvl', level); localStorage.setItem('exp', exp); updateUI();
        document.getElementById('timer-box').classList.add('hidden');
        document.getElementById('input-area').classList.remove('hidden');
        document.getElementById('quest-list').innerHTML='';
        return;
    }
    document.getElementById('timer-box').classList.remove('hidden');
    document.getElementById('current-task').innerText=`مهمة: ${quests[currentIndex].name} [${quests[currentIndex].level}]`;
    timeLeft = quests[currentIndex].time * 60; // الوقت بقى من الـ AI
    updateTimer(); clearInterval(timerInterval);
    timerInterval=setInterval(()=>{timeLeft--;updateTimer();if(timeLeft<=0){failQuest();}},1000);
}

function updateTimer(){ let m=Math.floor(timeLeft/60); let s=timeLeft%60; document.getElementById('timer').innerText=`${m}:${s<10?'0'+s:s}`; }
function completeQuest(){ clearInterval(timerInterval); exp+=10; if(exp>=100){level++; exp=0;} localStorage.setItem('lvl', level); localStorage.setItem('exp', exp); updateUI(); document.getElementById('alarm').play().catch(()=>{}); currentIndex++; startQuest(); }
function failQuest(){ clearInterval(timerInterval); document.getElementById('timer-box').classList.add('hidden'); document.getElementById('penalty-box').classList.remove('hidden'); }
function closePenalty(){ document.getElementById('penalty-box').classList.add('hidden'); startQuest(); }