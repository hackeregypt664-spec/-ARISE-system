from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

# --- الذكاء الاصطناعي بتاع تحديد الوقت ---
def ai_determine_time(subject, year):
    base_time = {"رياضيات": 90, "فيزياء": 120, "تاريخ": 45, "عربي": 60, "كيمياء": 100}
    time = base_time.get(subject, 60)
    if "3 ثانوي" in str(year) or "جامعة" in str(year):
        time += 30
    return time

def get_final_time(subject, year, user_wants_custom, custom_time):
    if user_wants_custom:
        return custom_time
    else:
        return ai_determine_time(subject, year)

# --- الصفحات ---
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/time', methods=['POST'])
def calculate_time():
    data = request.json
    subject = data.get('subject')
    year = data.get('year')
    custom = data.get('custom_time')
    is_custom = True if custom else False
    final = get_final_time(subject, year, is_custom, custom)
    return jsonify({"final_time": final})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)