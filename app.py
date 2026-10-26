from flask import Flask, render_template, request, redirect, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import psycopg2
app = Flask(__name__)
app.secret_key = 'monarch_secret_key_123'
DATABASE_URL = os.environ.get('DATABASE_URL')

def get_conn():
    if not DATABASE_URL:
        raise Exception("DATABASE_URL مش موجود في Vercel!")
    return psycopg2.connect(DATABASE_URL)

def init_db():
    conn = get_conn()
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, password TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS logs (id SERIAL PRIMARY KEY, email TEXT, action TEXT, time TEXT, ip TEXT)")
    conn.commit()
    c.close(); conn.close()


try:
    if DATABASE_URL:
        init_db()
except Exception as e:
    print(f"DB INIT ERROR: {e}")

@app.route('/')
def home():
    if 'user' not in session: return redirect('/login')
    return render_template('index.html', user=session['user'])

@app.route('/register', methods=['GET','POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        pwd = generate_password_hash(request.form['password'])
        conn = get_conn(); c = conn.cursor()
        try:
            c.execute("INSERT INTO users (email,password) VALUES (%s,%s)", (email,pwd))
            conn.commit()
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            return "الايميل ده متسجل قبل كده!"
        finally:
            c.close(); conn.close()
        return redirect('/login')
    return render_template('register.html')

@app.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']; password = request.form['password']
        conn = get_conn(); c = conn.cursor()
        c.execute("SELECT password FROM users WHERE email=%s", (email,))
        row = c.fetchone()
        c.close(); conn.close()
        if row and check_password_hash(row[0], password):
            session['user']=email
            # log
            try:
                conn = get_conn(); c = conn.cursor()
                c.execute("INSERT INTO logs (email,action,time,ip) VALUES (%s,%s,%s,%s)",
                          (email, "دخل النظام ✅", datetime.now().strftime("%Y-%m-%d %H:%M:%S"), request.remote_addr))
                conn.commit(); c.close(); conn.close()
            except: pass
            return redirect('/')
        return "الايميل او الباسورد غلط"
    return render_template('login.html')

@app.route('/admin/logs')
def admin_logs():
    conn = get_conn(); c = conn.cursor()
    c.execute("SELECT email, action, time, ip FROM logs ORDER BY id DESC LIMIT 100")
    logs = c.fetchall()
    c.close(); conn.close()
    html = "<h1>LOGS</h1>"
    for l in logs: html+= f"<p>{l[2]} - {l[0]} - {l[1]} - {l[3]}</p>"
    return html