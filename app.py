from flask import Flask, render_template, request, jsonify, redirect, session, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import sqlite3
import os

app = Flask(__name__)
app.secret_key = 'monarch_secret_key_123'

# --- إنشاء قاعدة البيانات ---
def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (email TEXT PRIMARY KEY, password TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS logs 
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  email TEXT,
                  action TEXT,
                  time TEXT,
                  ip TEXT)''')
    conn.commit()
    conn.close()

init_db()

def log_action(email, action):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ip = request.remote_addr
    c.execute("INSERT INTO logs (email, action, time, ip) VALUES (?,?,?,?)",
              (email, action, now, ip))
    conn.commit()
    conn.close()

# ... دالة ai_determine_time بتاعتك زي ما هي ...
def ai_determine_time(subject, year):
    base_time = {"رياضة": 60, "رياضيات": 60, "رياضة بحتة": 90, "تطبيقية": 90,"فيزياء": 120, "كيمياء": 100, "احياء": 80, "علوم": 50,"جيولوجيا": 60, "عربي": 50, "انجليزي": 60,"تاريخ": 40, "جغرافيا": 40, "دراسات": 40,"فلسفة": 30, "علم نفس": 30, "منطق": 30, "دين": 20,"حاسب": 30, "مهارات": 30, "الماني/فرنساوي": 40,"قرآن كريم": 90, "تجويد": 40, "أصول دين": 50,"فقه": 50, "تفسير": 45, "حديث": 45, "توحيد": 40,"نحو": 40, "صرف": 40, "بلاغة": 40, "نحو وصرف": 50, "ادب ونصوص": 40}
    time = base_time.get(subject.strip(), 60)
    if year and "3 ثانوي" in str(year): time += 30
    return time

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute("SELECT password FROM users WHERE email=?", (email,))
        user = c.fetchone()
        conn.close()
        if user and check_password_hash(user[0], password):
            session['user'] = email
            log_action(email, "دخل النظام ✅")
            return redirect('/')
        else:
            return "الايميل او الباسورد غلط!"
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        try:
            c.execute("INSERT INTO users (email, password) VALUES (?,?)",
                      (email, generate_password_hash(password)))
            conn.commit()
            log_action(email, "سجل حساب جديد 🆕")
        except:
            conn.close()
            return "الايميل ده متسجل قبل كده"
        conn.close()
        return redirect('/login')
    return render_template('register.html')

@app.route('/logout')
def logout():
    if 'user' in session:
        log_action(session['user'], "خرج من النظام 🚪")
    session.pop('user', None)
    return redirect('/login')

@app.route('/')
def home():
    if 'user' not in session: return redirect('/login')
    return render_template('index.html', user=session['user'])

# --- صفحة المراقبة السرية للملك فقط ---
@app.route('/admin/logs')
def admin_logs():
    if 'user' not in session: return redirect('/login')
    # هنا تحط ايميلك انت بس عشان محدش غيرك يشوفها
    # if session['user'] != 'ايميلك_انت@gmail.com': return "مش مسموح"
    
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("SELECT * FROM logs ORDER BY id DESC")
    logs = c.fetchall()
    c.execute("SELECT COUNT(*) FROM users")
    total_users = c.fetchone()[0]
    conn.close()
    
    html = f"<body style='background:#000;color:#0f0;font-family:monospace;padding:20px;'><h1>👑 سجل Monarch - {total_users} مستخدم</h1><table border=1 style='width:100%;border-color:#0f0;'><tr><th>الوقت</th><th>اليوزر</th><th>الحركة</th><th>IP</th></tr>"
    for log in logs:
        html += f"<tr><td>{log[3]}</td><td>{log[1]}</td><td>{log[2]}</td><td>{log[4]}</td></tr>"
    html += "</table></body>"
    return html

@app.route('/api/time', methods=['POST'])
def calculate_time():
    if 'user' not in session: return jsonify({"error": "لازم تسجل دخول"}), 401
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
    log_action(session['user'], f"بدأ مذاكرة: {', '.join(subjects)}")
    return jsonify({"quests": result, "total_time": total, "year": year})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)