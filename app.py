from flask import Flask, render_template, request, jsonify, redirect, session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import sqlite3
import os

app = Flask(__name__)
app.secret_key = 'monarch_secret_key_123'

# --- السطر السحري لـ Vercel ---
DB_PATH = '/tmp/database.db' if os.path.exists('/tmp') else 'database.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (email TEXT PRIMARY KEY, password TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS logs 
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  email TEXT, action TEXT, time TEXT, ip TEXT)''')
    conn.commit()
    conn.close()

init_db()

def log_action(email, action):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ip = request.remote_addr or "unknown"
        c.execute("INSERT INTO logs (email, action, time, ip) VALUES (?,?,?,?)",
                  (email, action, now, ip))
        conn.commit()
        conn.close()
    except:
        pass # لو فشل التسجيل ميوقعش الموقع

def ai_determine_time(subject, year):
    base_time = {"فيزياء": 120, "كيمياء": 100, "احياء": 80, "رياضة": 60, "عربي": 50, "تاريخ": 40}
    return base_time.get(subject.strip(), 60)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        conn = sqlite3.connect(DB_PATH)
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
        conn = sqlite3.connect(DB_PATH)
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
    if 'user' not in session:
        return redirect('/login')
    return render_template('index.html', user=session['user'])

@app.route('/admin/logs')
def admin_logs():
    if 'user' not in session:
        return redirect('/login')
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM logs ORDER BY id DESC LIMIT 100")
    logs = c.fetchall()
    conn.close()
    html = "<body style='background:#000;color:#0f0;font-family:monospace;padding:20px;'><h1>LOGS</h1><table border=1 style='width:100%'>"
    for log in logs:
        html += f"<tr><td>{log[3]}</td><td>{log[1]}</td><td>{log[2]}</td><td>{log[4]}</td></tr>"
    html += "</table></body>"
    return html

@app.route('/api/time', methods=['POST'])
def calculate_time():
    data = request.json
    subjects = data.get('subjects', [])
    year = data.get('year', '')
    result = []
    total = 0
    for sub in subjects:
        t = ai_determine_time(sub, year)
        result.append({"subject": sub, "time": t})
        total += t
    return jsonify({"quests": result, "total_time": total})