from flask import Flask, render_template, request, jsonify, redirect, session, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
app.secret_key = 'monarch_secret_key_123' # مهم جدا عشان تسجيل الدخول

# --- قاعدة بيانات مؤقتة للمستخدمين (بعدين نحولها SQLite) ---
users_db = {}

# --- الكود بتاعك القديم زي ما هو ---
def ai_determine_time(subject, year):
    base_time = {
    "رياضة": 60, "رياضيات": 60, "رياضة بحتة": 90, "تطبيقية": 90,
    "فيزياء": 120, "كيمياء": 100, "احياء": 80, "علوم": 50,
    "جيولوجيا": 60, "عربي": 50, "انجليزي": 60,
    "تاريخ": 40, "جغرافيا": 40, "دراسات": 40,
    "فلسفة": 30, "علم نفس": 30, "منطق": 30, "دين": 20,
    "حاسب": 30, "مهارات": 30, "الماني/فرنساوي": 40,
    "قرآن كريم": 90, "تجويد": 40, "أصول دين": 50,
    "فقه": 50, "تفسير": 45, "حديث": 45, "توحيد": 40,
    "نحو": 40, "صرف": 40, "بلاغة": 40, "نحو وصرف": 50, "ادب ونصوص": 40
    }
    time = base_time.get(subject.strip(), 60)
    if year and "3 ثانوي" in str(year):
        time += 30
    return time

# --- نظام تسجيل الدخول الجديد ---

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        if email in users_db and check_password_hash(users_db[email], password):
            session['user'] = email
            return redirect('/')
        else:
            return "الايميل او الباسورد غلط يا ملك!"
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        if email in users_db:
            return "الايميل ده متسجل قبل كده"
        users_db[email] = generate_password_hash(password)
        return redirect('/login')
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect('/login')

# --- حماية الصفحة الرئيسية ---
@app.route('/')
def home():
    if 'user' not in session:
        return redirect('/login')
    # لو مسجل دخول يدخل عادي
    return render_template('index.html', user=session['user'])

@app.route('/api/time', methods=['POST'])
def calculate_time():
    if 'user' not in session:
        return jsonify({"error": "لازم تسجل دخول"}), 401
        
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