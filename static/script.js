function startQuest(){
    if(currentIndex>=quests.length){
        exp+=25; 
        if(exp>=100){level++; exp=0; typeWriter(`[SYSTEM] LEVEL UP! انتي الآن LVL ${level}`, "system-msg");}
        else{typeWriter(`[SYSTEM] كل المهام اكتملت! +25 EXP`, "system-msg");}
        localStorage.setItem('lvl', level); 
        localStorage.setItem('exp', exp); 
        updateUI();
        document.getElementById('timer-box').classList.add('hidden');
        document.getElementById('input-area').classList.remove('hidden');
        return;
    }
    document.getElementById('timer-box').classList.remove('hidden');
    document.getElementById('current-task').innerText='مهمة: '+quests[currentIndex];
    
    // هنا التعديل المهم
    let customCheck = document.getElementById('customTimeCheck');
    let customInput = document.getElementById('customTime');
    
    if(customCheck && customCheck.checked && customInput && customInput.value){
        timeLeft = parseInt(customInput.value) * 60; // ياخد الوقت اللي انت كاتبه
    } else {
        timeLeft = currentIndex===0 ? 25*60 : 45*60; // لو مش محدد، يشتغل زي الاول
    }
    
    updateTimer(); 
    clearInterval(timerInterval);
    timerInterval=setInterval(()=>{
        timeLeft--;
        updateTimer();
        if(timeLeft<=0){failQuest();}
    },1000);
}