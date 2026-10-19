from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

def ai_determine_time(subject, year):
    base_time = {
        "رياضة": 60, "رياضيات": 60, "رياضة بحتة": 90, "تطبيقية": 90, "رياضة بحتة": 90,
        "فيزياء": 120, "كيمياء": 100, "احياء": 80, "علوم": 50,
        "جيولوجيا": 60, "عربي": 50, "انجليزي": 60,
        "تاريخ": 40, "جغرافيا": 40, "دراسات": 40,
        "فلسفة": 30, "علم نفس": 30, "دين": 20,
        "حاسب": 30, "مهارات": 30, "الماني/فرنساوي": 50
    }
    time = base_time.get(subject.strip(), 60)
    if year and "3 ثانوي" in str(year):
        time += 30
    return time

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/time', methods=['POST'])
def calculate_time():
    data = request.json
    subjects = data.get('subjects', [])
    year = data.get('year', '')
    custom = data.get('custom_time')
    is_custom = True if custom and str(custom).isdigit() and int(custom) > 0 else False
    result = []
    total = 0
    for sub in subjects:
        final = int(custom) if is_custom else ai_determine_time(sub, year)
        result.append({"subject": sub, "time": final})
        total += final
    return jsonify({"quests": result, "total_time": total, "year": year})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)