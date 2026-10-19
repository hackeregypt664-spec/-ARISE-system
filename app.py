from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

# --- الذكاء الاصطناعي بتاع تحديد الوقت ---
def ai_determine_time(subject, year):
    # وقت اساسي لكل مادة
    base_time = {
        "رياضة": 90, "رياضيات": 90, "رياضة بحتة": 90, "رياضة تطبيقية": 90,
        "فيزياء": 120, 
        "كيمياء": 100,
        "احياء": 80,
        "جيولوجيا": 60,
        "عربي": 60, 
        "انجليزي": 70,
        "تاريخ": 45, "جغرافيا": 45,
        "فلسفة": 40, "علم نفس": 40,
        "الماني/فرنساوي": 50
    }
    time = base_time.get(subject.strip(), 60)
    
    # لو 3 ثانوي يزود الوقت
    if year and "3 ثانوي" in str(year):
        time += 30
    
    return time

def get_final_time(subject, year, user_wants_custom, custom_time):
    if user_wants_custom and custom_time:
        try:
            return int(custom_time)
        except:
            pass
    return ai_determine_time(subject, year)

# --- الصفحات ---
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/time', methods=['POST'])
def calculate_time():
    data = request.json
    subjects = data.get('subjects', []) # جاي لستة مواد
    year = data.get('year', '')
    custom = data.get('custom_time')
    
    is_custom = True if custom and int(custom) > 0 else False
    
    result = []
    total = 0
    for sub in subjects:
        final = get_final_time(sub, year, is_custom, custom)
        result.append({"subject": sub, "time": final})
        total += final
    
    return jsonify({
        "quests": result,
        "total_time": total,
        "year": year
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)