from flask import Flask, render_template, request, redirect, session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import psycopg2
from psycopg2 import errors

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "monarch-secret-123")
DATABASE_URL = os.environ.get("DATABASE_URL")
ADMIN_EMAIL = "yw241985@gmail.com"

def get_db_connection():
    if not DATABASE_URL: return None
    try:
        url = DATABASE_URL
        if "?sslmode" not in url:
            url += "?sslmode=require"
        return psycopg2.connect(url)
    except Exception as e:
        print(f"DB Error: {e}")
        return None

def get_real_ip():
    return request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0].strip()

def init_db():
    conn = get_db_connection()
    if not conn: return
    try:
        c = conn.cursor()
        c.execute("CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, password TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS logs (id SERIAL PRIMARY KEY, email TEXT, action TEXT, time TEXT, ip TEXT)")
        conn.commit()
        c.close()
    finally: conn.close()

if DATABASE_URL:
    try: init_db()
    except Exception as e: print(f"DB INIT ERROR: {e}")

@app.route('/')
def home():
    if 'user' not in session: return redirect('/login')
    return render_template('index.html', user=session['user'])

@app.route('/logout')
def logout():
    user = session.get('user', 'unknown')
    try:
        conn = get_db_connection()
        if conn:
            c = conn.cursor()
            c.execute("INSERT INTO logs (email,action,time,ip) VALUES (%s,%s,%s,%s)",
                      (user, "خرج من النظام 🚪", datetime.now().strftime("%Y-%m-%d %H:%M:%S"), get_real_ip()))
            conn.commit(); c.close(); conn.close()
    except: pass
    session.clear()
    return redirect('/login')

@app.route('/debug')
def debug():
    db = os.environ.get("DATABASE_URL")
    if not db: return "ENV VAR مش موجودة ❌"
    try:
        url = db + ("?sslmode=require" if "?sslmode" not in db else "")
        conn = psycopg2.connect(url); conn.close()
        return f"✅ الاتصال نجح! {db[:40]}..."
    except Exception as e: return f"❌ فشل: {str(e)}"

@app.route('/register', methods=['GET','POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        pwd = generate_password_hash(request.form['password'])
        conn = get_db_connection()
        if not conn: return "Database connection failed", 500
        c = None
        try:
            c = conn.cursor()
            c.execute("INSERT INTO users (email,password) VALUES (%s,%s)", (email,pwd))
            conn.commit()
        except errors.UniqueViolation:
            conn.rollback()
            return render_template('register.html', error="الايميل ده متسجل قبل كده!")
        finally:
            if c: c.close()
            conn.close()
        return redirect('/login')
    return render_template('register.html')

@app.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        conn = get_db_connection()
        if not conn: return "Database connection failed", 500
        c = conn.cursor()
        c.execute("SELECT password FROM users WHERE email=%s", (email,))
        row = c.fetchone()
        c.close()
        conn.close()
        if row and check_password_hash(row[0], password):
            session['user']=email
            try:
                conn = get_db_connection()
                if conn:
                    c = conn.cursor()
                    c.execute("INSERT INTO logs (email,action,time,ip) VALUES (%s,%s,%s,%s)",
                              (email, "دخل النظام ✅", datetime.now().strftime("%Y-%m-%d %H:%M:%S"), get_real_ip()))
                    conn.commit(); c.close(); conn.close()
            except: pass
            return redirect('/')
        return render_template('login.html', error="الايميل او الباسورد غلط")
    return render_template('login.html')

@app.route('/admin/logs')
def admin_logs():
    if 'user' not in session: return redirect('/login')
    if session['user'] != ADMIN_EMAIL:
        return "⛔ مش مسموح ليك تدخل هنا", 403
        
    conn = get_db_connection()
    if not conn: return "DB not connected", 500
    c = conn.cursor()
    c.execute("SELECT email, action, time, ip FROM logs ORDER BY id DESC LIMIT 100")
    logs = c.fetchall()
    c.close()
    conn.close()
    html = "<body style='background:#000;color:#00e5ff;font-family:monospace;padding:20px'><h1>MONARCH LOGS 👁️</h1><a href='/' style='color:#ff0040'>[BACK]</a><hr>"
    for l in logs: 
        html+= f"<p>{l[2]} - {l[0]} - {l[1]} - {l[3]}</p>"
    return html + "</body>"