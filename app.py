from flask import Flask, render_template
import os

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
    def ai_determine_time(subject, year):
    # جدول صعوبة بسيط مبدئياً
    base_time = {"رياضيات": 90, "فيزياء": 120, "تاريخ": 45, "عربي": 60}
    
    time = base_time.get(subject, 60) # لو مادة جديدة يديها 60
    
    # لو سنة كبيرة يزود الوقت
    if "3 ثانوي" in year or "جامعة" in year:
        time += 30
        
    return time
# لو المستخدم هو اللي حدد
def get_final_time(subject, year, user_wants_custom, custom_time):
    if user_wants_custom:
        return custom_time
    else:
        return ai_determine_time(subject, year)
    def ai_determine_time(subject, year):
    base_time = {"رياضيات": 90, "فيزياء": 120, "تاريخ": 45, "عربي": 60}
    time = base_time.get(subject, 60)
    if "3 ثانوي" in year or "جامعة" in year:
        time += 30
    return time

def get_final_time(subject, year, user_wants_custom, custom_time):
    if user_wants_custom:
        return custom_time
    else:
        return ai_determine_time(subject, year)