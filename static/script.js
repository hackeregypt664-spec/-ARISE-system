let quests = []; // هيبقى array of objects {name, time}
let currentIndex = 0; 
let timeLeft = 0; 
let timerInterval = null;
let level = localStorage.getItem('lvl')? parseInt(localStorage.getItem('lvl')) : 1;
let exp = localStorage.getItem('exp')? parseInt(localStorage.getItem('exp')) : 0;
let smartQuests = [];

window.onload = () => { updateUI(); }

function updateUI(){
    document.getElementById('level').innerText = `LVL ${level}`;
    document.getElementById('exp-fill').style.width = `${exp}%`;
    let ranks = ["E-RANK","D-RANK","C-RANK","B-RANK","A-RANK","S-RANK"];
    document.getElementById('rank').innerText = ranks[Math.floor(level/5)] || "S-RANK";
}

// === النظام الذكي ===
const subjectsByYear = {
    "اولى ابتدائي": ["عربي","انجليزي","رياضة","دين"],
    "تانية ابتدائي": ["عربي","انجليزي","رياضة","دين"],
    "تالتة ابتدائي": ["عربي","انجليزي","رياضة","دين"],
    "رابعة ابتدائي": ["عربي","انجليزي","رياضة","علوم","دراسات","دين"],
    "خامسة ابتدائي": ["عربي","انجليزي","رياضة","علوم","دراسات","دين"],
    "ساتة ابتدائي": ["عربي","انجليزي","رياضة","علوم","دراسات","دين"],
    "اولى اعدادي": ["عربي","انجليزي","رياضة","علوم","دراسات","دين"],
    "تانية اعدادي": ["عربي","انجليزي","رياضة","علوم","دراسات","دين"],
    "تالتة اعدادي": ["عربي","انجليزي","رياضة","علوم","دراسات","دين"],
    "اولى ثانوي": ["عربي","انجليزي","رياضة","فيزياء","كيمياء","احياء","تاريخ","جغرافيا","فلسفة"],
    "تانية ثانوي": ["عربي","انجليزي","فيزياء","كيمياء","احياء","رياضة","تاريخ","جغرافيا"],
    "تالتة ثانوي": ["عربي","انجليزي","فيزياء","كيمياء","احياء","تاريخ","جغرافيا","فلسفة"]
};

function updateSubjects(){
    const year = document.getElementById('year').value;
    const subjectSelect = document.getElementById('subject');
    subjectSelect.innerHTML = '<option value="">اختر المادة</option>';
    if(subjectsByYear[year]){
        subjectsByYear[year].forEach(sub => {
            let opt = document.createElement('option');
            opt.value = sub; opt.textContent = sub;
            subjectSelect.appendChild(opt);
        });
    }
}

function addSmartQuest(){
    const sub = document.getElementById('subject').value;
    const diff = document.getElementById('difficulty').value;
    if(!sub) return alert("اختار المادة الأول!");
    
    let time = diff === 'easy' ? 25 : diff === 'medium' ? 45 : 60;
    let diffText = diff === 'easy' ? 'سهل' : diff === 'medium' ? 'متوسط' : 'صعب';
    
    smartQuests.push({name: sub, difficulty: diff, time: time, diffText: diffText});
    renderSmartList();
}

function renderSmartList(){
    const list = document.getElementById('smart-list');
    list.innerHTML = '';
    // ترتيب حسب الصعوبة: الصعب الأول
    let sorted = [...smartQuests].sort((a,b) => b.time - a.time);
    sorted.forEach((q,i) => {
        list.innerHTML += `<div style="background:rgba(255,255,255,0.1); padding:8px; margin:5px 0; border-radius:5px; display:flex; justify-content:space-between;">
            <span>${i+1}. ${q.name} - ${q.diffText} (${q.time}د)</span>
            <span onclick="removeQuest(${smartQuests.indexOf(q)})" style="cursor:pointer; color:red;">❌</span>
        </div>`;
    });
}

function removeQuest(index){ smartQuests.splice(index,1); renderSmartList(); }

function startSmartSystem(){
    if(smartQuests.length === 0) return alert("ضيف مادة واحدة على الأقل!");
    document.getElementById('arise-sound').play().catch(()=>{});
    // رتبهم: الصعب الأول
    quests = [...smartQuests].sort((a,b) => b.time - a.time);
    
    let totalTime = quests.reduce((sum,q)=> sum+q.time, 0);
    document.getElementById('system-msg').innerText = `[SYSTEM] تم إنشاء خطة ذكية: ${quests.length} مواد، إجمالي ${totalTime} دقيقة. نبدأ بالأصعب!`;
    
    let list=document.getElementById('quest-list'); list.innerHTML='';
    quests.forEach((q,i)=>{list.innerHTML+=`<div class="quest">[Quest ${i+1}] ${q.name} [${q.diffText}] - ${q.time}د</div>`;});
    
    document.getElementById('smart-setup').classList.add('hidden');
    currentIndex=0; startQuest();
}

function startQuest(){
    if(currentIndex>=quests.length){
        exp+=25; if(exp>=100){level++; exp=0;}
        localStorage.setItem('lvl', level); localStorage.setItem('exp', exp); updateUI();
        document.getElementById('timer-box').classList.add('hidden');
        document.getElementById('smart-setup').classList.remove('hidden');
        document.getElementById('system-msg').innerText = `[SYSTEM] عاش! خلصت كل الخطة! +25 EXP`;
        smartQuests = []; renderSmartList(); document.getElementById('quest-list').innerHTML='';
        return;
    }
    document.getElementById('timer-box').classList.remove('hidden');
    document.getElementById('current-task').innerText = `مهمة: ${quests[currentIndex].name} [${quests[currentIndex].diffText}]`;
    document.getElementById('time-info').innerText = `وقت المهمة: ${quests[currentIndex].time} دقيقة`;
    timeLeft = quests[currentIndex].time * 60;
    updateTimer(); clearInterval(timerInterval);
    timerInterval=setInterval(()=>{timeLeft--;updateTimer();if(timeLeft<=0){failQuest();}},1000);
}

function updateTimer(){ let m=Math.floor(timeLeft/60); let s=timeLeft%60; document.getElementById('timer').innerText=`${m}:${s<10?'0'+s:s}`; }
function completeQuest(){ clearInterval(timerInterval); exp+=10; if(exp>=100){level++; exp=0;} localStorage.setItem('lvl', level); localStorage.setItem('exp', exp); updateUI(); document.getElementById('alarm').play().catch(()=>{}); currentIndex++; startQuest(); }
function failQuest(){ clearInterval(timerInterval); document.getElementById('timer-box').classList.add('hidden'); document.getElementById('penalty-box').classList.remove('hidden'); }
function closePenalty(){ document.getElementById('penalty-box').classList.add('hidden'); startQuest(); }