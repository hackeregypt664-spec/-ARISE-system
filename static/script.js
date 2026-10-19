let quests = []; 
let currentIndex = 0; 
let timeLeft = 0; 
let timerInterval = null;
let level = localStorage.getItem('lvl')? parseInt(localStorage.getItem('lvl')) : 1;
let exp = localStorage.getItem('exp')? parseInt(localStorage.getItem('exp')) : 0;

window.onload = () => { updateUI(); }

function updateUI(){
    document.getElementById('level').innerText = `LVL ${level}`;
    document.getElementById('exp-fill').style.width = `${exp}%`;
    let ranks = ["E-RANK","D-RANK","C-RANK","B-RANK","A-RANK","S-RANK"];
    let rankEl = document.getElementById('rank');
    if(rankEl) rankEl.innerText = ranks[Math.floor(level/5)] || "S-RANK";
}

function aiDecideTime(fullText){
    let text = fullText.toLowerCase();
    let time = 45;
    let reason = "وقت متوسط افتراضي";

    let hoursMatch = text.match(/(\d+(\.\d+)?)\s*(ساعة|ساعات|h|hour)/);
    let minutesMatch = text.match(/(\d+)\s*(دقيقة|دقايق|د|m|min)/);
    
    if(text.includes("ساعتين") || text.includes("ساعتان")){
        time = 120; reason = "فهمت انها ساعتين";
    } else if(hoursMatch){
        let h = parseFloat(hoursMatch[1]);
        time = h * 60;
        reason = `فهمت ان عندك ${h} ساعة`;
        if(text.includes("محاضرة") || text.includes("محاضره")){
            time += 30;
            reason += " + 30د مذاكرة";
        }
    } else if(minutesMatch){
        time = parseInt(minutesMatch[1]);
        reason = `فهمت انها ${time} دقيقة`;
    } else if(text.includes("نص ساعة") || text.includes("نصف ساعة")){
        time = 30; reason = "فهمت انها نص ساعة";
    } else if(text.includes("مراجعة سريعة") || text.includes("سهل") || text.includes("خفيف")){
        time = 20; reason = "AI شايفها مراجعة سريعة";
    } else if(text.includes("صعب") || text.includes("مش فاهم") || text.includes("محتاج تركيز")){
        time = 90; reason = "AI شايفها صعبة";
    } else if(text.includes("حل") || text.includes("مسائل") || text.includes("واجب")){
        time = 60; reason = "AI شايفها حل واجب";
    } else if(text.includes("حفظ") || text.includes("تسميع")){
        time = 35; reason = "AI شايفها حفظ";
    }

    let cleanName = fullText.split(" ")[0];
    return { name: cleanName, time: Math.round(time), reason: reason, full: fullText };
}

function startSystem(){
    const input = document.getElementById('taskInput');
    if(!input || !input.value.trim()) return;
    try{ document.getElementById('arise-sound')?.play(); }catch(e){}

    let rawTasks = input.value.split(',').map(t=>t.trim()).filter(t=>t);
    quests = rawTasks.map(t => aiDecideTime(t));
    quests.sort((a,b) => b.time - a.time);

    let total = quests.reduce((s,q)=>s+q.time, 0);
    document.getElementById('system-msg').innerHTML = `[AI] حللت ${quests.length} مهمة - إجمالي ${Math.floor(total/60)}س ${total%60}د`;
    
    let list = document.getElementById('quest-list'); 
    list.innerHTML = '';
    quests.forEach((q,i)=>{
        list.innerHTML += `<div class="quest">
            <b>[Quest ${i+1}] ${q.name}</b> - ${q.time}د<br>
            <small>🤖 ${q.reason} | ${q.full}</small>
        </div>`;
    });
    
    document.getElementById('input-area').classList.add('hidden');
    currentIndex = 0; 
    startQuest();
}

function startQuest(){
    if(currentIndex >= quests.length){
        exp += 25; 
        if(exp >= 100){level++; exp = 0;}
        localStorage.setItem('lvl', level); 
        localStorage.setItem('exp', exp); 
        updateUI();
        document.getElementById('timer-box').classList.add('hidden');
        document.getElementById('input-area').classList.remove('hidden');
        document.getElementById('quest-list').innerHTML = '';
        document.getElementById('system-msg').innerText = `[AI] عاش! خلصت!`;
        return;
    }
    document.getElementById('timer-box').classList.remove('hidden');
    document.getElementById('current-task').innerText = `${quests[currentIndex].full} - ${quests[currentIndex].reason}`;
    timeLeft = quests[currentIndex].time * 60;
    updateTimer(); 
    clearInterval(timerInterval);
    timerInterval = setInterval(()=>{timeLeft--; updateTimer(); if(timeLeft<=0){failQuest();}},1000);
}

function updateTimer(){ 
    let m = Math.floor(timeLeft/60); 
    let s = timeLeft%60; 
    document.getElementById('timer').innerText = `${m}:${s<10?'0'+s:s}`; 
}

function completeQuest(){ 
    clearInterval(timerInterval); 
    exp+=10; if(exp>=100){level++; exp=0;}
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

function closePenalty(){ 
    document.getElementById('penalty-box').classList.add('hidden'); 
    startQuest(); 
}